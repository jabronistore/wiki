import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { getAllPeptides } from '$lib/data/peptides';
import { verifyRecaptcha } from '$lib/utils/recaptcha';
import type { RequestHandler } from './$types';

function getAI(): GoogleGenAI | null {
	const key = env.GEMINI_API_KEY;
	if (!key) return null;
	return new GoogleGenAI({ apiKey: key });
}

// Build the peptide knowledge context once at module load
function buildContext(): string {
	const peptides = getAllPeptides();
	const parts: string[] = [
		'You are a knowledgeable research assistant for Peptide Database (peptide-db.com). Answer questions using the peptide data provided below as your primary source. You can also use your general knowledge to supplement answers about reconstitution techniques, general biology, and practical questions — but always prioritise the specific data below when it exists.',
		'',
		'',
		'CRITICAL FORMATTING RULES (you MUST follow these):',
		'',
		'1. EVERY TIME you mention a peptide by name, format it as a markdown link using its ID from the data below.',
		'   Example: [Retatrutide](/peptides/retatrutide), [BPC-157](/peptides/bpc-157), [Semaglutide](/peptides/semaglutide)',
		'   NEVER write a peptide name as plain text. ALWAYS use [Name](/peptides/id) format.',
		'',
		'2. When relevant, link to tools:',
		'   - Reconstitution calculator: [calculator](/calculator)',
		'   - Interaction checker: [interaction checker](/tools/interactions)',
		'   - Compare peptides: [compare](/compare)',
		'   - Cost calculator: [cost calculator](/tools/cost)',
		'',
		'3. At the END of every answer, add this line:',
		'   FOLLOW_UP: question one? | question two? | question three?',
		'',
		'OTHER GUIDELINES:',
		'- Cite study authors and years when available in the data',
		'- Never give medical advice — use "research suggests", "in animal models", etc.',
		'- For reconstitution/dosing, give the specific steps and doses from the data',
		'- Keep answers concise (2-4 paragraphs, or lists for step-by-step)',
		'',
		'--- PEPTIDE DATABASE ---',
		''
	];

	for (const p of peptides) {
		const entry: string[] = [`## ${p.name} (/${p.id})`];
		if (p.subtitle) entry.push(p.subtitle);
		if (p.overview) entry.push(p.overview);
		if (p.mechanism) entry.push(`Mechanism: ${p.mechanism}`);
		if (p.molecular?.weight) entry.push(`Weight: ${p.molecular.weight}`);
		if (p.molecular?.halfLife) entry.push(`Half-life: ${p.molecular.halfLife}`);
		if (p.keyBenefits?.length) entry.push(`Benefits: ${p.keyBenefits.join(', ')}`);

		// Indications
		for (const cat of p.indications || []) {
			const items = cat.items?.map((i) => `${i.name} (${i.effectiveness || 'N/A'})`).join(', ');
			if (items) entry.push(`${cat.category}: ${items}`);
		}

		// Dosing and reconstitution for ALL delivery methods
		for (const method of p.deliveryMethods || []) {
			if (method.protocols?.length) {
				const protos = method.protocols
					.map((pr) => `${pr.goal}: ${pr.dose} ${pr.frequency} (${pr.route})`)
					.join('; ');
				entry.push(`${method.type} dosing: ${protos}`);
			}
			if (method.overview) {
				entry.push(`${method.type} notes: ${method.overview}`);
			}
			if (method.keyBenefits?.length) {
				entry.push(`${method.type} tips: ${method.keyBenefits.join('; ')}`);
			}
			if (method.reconstitution) {
				if (method.reconstitution.materials?.length) {
					entry.push(`Reconstitution materials: ${method.reconstitution.materials.join(', ')}`);
				}
				if (method.reconstitution.steps?.length) {
					entry.push(
						`Reconstitution steps: ${method.reconstitution.steps.map((s, i) => `${i + 1}. ${s}`).join(' ')}`
					);
				}
			}
		}

		// Quick stats
		if (p.quickStats) {
			entry.push(
				`Typical: ${p.quickStats.typicalDose}, ${p.quickStats.frequency}, ${p.quickStats.cycleDuration}, Storage: ${p.quickStats.storage}`
			);
		}

		// Blend composition
		if ((p as any).blendComposition) {
			const bc = (p as any).blendComposition;
			const comps = bc.components?.map((c: any) => `${c.name} ${c.amount}${bc.unit}`).join(', ');
			if (comps) entry.push(`Blend: ${bc.totalAmount}${bc.unit} total (${comps})`);
		}

		// Interactions
		if (p.interactions?.length) {
			const ix = p.interactions.map((i) => `${i.peptide} (${i.status})`).join(', ');
			entry.push(`Interactions: ${ix}`);
		}

		// Side effects
		if (p.sideEffects?.common?.length) {
			entry.push(`Side effects: ${p.sideEffects.common.join(', ')}`);
		}
		if (p.sideEffects?.contraindications?.length) {
			entry.push(`Contraindications: ${p.sideEffects.contraindications.join(', ')}`);
		}

		// References (top 3)
		if (p.references?.length) {
			const refs = p.references.slice(0, 3).map((r) => {
				const parts = [r.title];
				if (r.authors) parts.push(r.authors);
				if (r.year) parts.push(r.year);
				if (r.journal) parts.push(r.journal);
				return parts.join(' | ');
			});
			entry.push(`Key studies: ${refs.join('; ')}`);
		}

		parts.push(entry.join('\n'));
		parts.push('');
	}

	return parts.join('\n');
}

let cachedContext: string | null = null;

function getContext(): string {
	// Rebuild each time in dev, cache in prod
	if (!cachedContext) {
		cachedContext = buildContext();
	}
	return cachedContext;
}

// Rate limiting: configure in Cloudflare dashboard (WAF > Rate Limiting Rules)
// Rule: /api/ask, 20 requests/minute per IP, action: block with 429

export const POST: RequestHandler = async ({ request }) => {
	const ai = getAI();
	if (!ai) {
		return new Response(JSON.stringify({ error: 'AI chat not configured' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const body = await request.json();
	const question = body.question?.trim();
	const history: { role: string; content: string }[] = body.history || [];
	const recaptchaToken = body.recaptchaToken;

	if (!question || question.length > 500) {
		return new Response(JSON.stringify({ error: 'Invalid question' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Verify reCAPTCHA — strict in production, skipped on localhost
	const secretKey = env.SECRET_RECAPTCHA_SECRET_KEY;
	const isLocalhost =
		request.headers.get('host')?.includes('localhost') ||
		request.headers.get('host')?.includes('127.0.0.1');

	if (secretKey && recaptchaToken && !isLocalhost) {
		const result = await verifyRecaptcha(recaptchaToken, secretKey, 'ask_ai');
		if (!result.valid) {
			return new Response(
				JSON.stringify({ error: 'Verification failed. Please refresh and try again.' }),
				{
					status: 403,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}
	}

	try {
		const context = getContext();

		// Build multi-turn conversation for Gemini
		const contents: { role: string; parts: { text: string }[] }[] = [];

		// Add conversation history (limit to last 10 turns to control token usage)
		for (const msg of history.slice(-10)) {
			contents.push({
				role: msg.role === 'assistant' ? 'model' : 'user',
				parts: [{ text: msg.content }]
			});
		}

		// Add the current question
		contents.push({
			role: 'user',
			parts: [{ text: question }]
		});

		const stream = await ai.models.generateContentStream({
			model: 'gemini-2.5-flash-lite',
			contents: contents,
			config: {
				systemInstruction: context,
				temperature: 0.3
			}
		});

		// Return as a streaming response
		const encoder = new TextEncoder();
		const readable = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of stream) {
						const text = chunk.text;
						if (text) {
							controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
						}
					}
					controller.enqueue(encoder.encode('data: [DONE]\n\n'));
					controller.close();
				} catch (err) {
					controller.enqueue(
						encoder.encode(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`)
					);
					controller.close();
				}
			}
		});

		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
