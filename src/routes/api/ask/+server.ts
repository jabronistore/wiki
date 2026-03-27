import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { getAllItems } from '$lib/data/unified';
import { getItemUrlPrefix } from '$lib/data/unified';
import { verifyRecaptcha } from '$lib/utils/recaptcha';
import type { RequestHandler } from './$types';

function getAI(): GoogleGenAI | null {
	const key = env.GEMINI_API_KEY;
	if (!key) return null;
	return new GoogleGenAI({ apiKey: key });
}

// Build the peptide knowledge context once at module load
function buildContext(): string {
	const items = getAllItems();
	const parts: string[] = [
		'You are a knowledgeable, opinionated research assistant for Peptide Database (peptide-db.com). You speak like someone who actually knows this space — practical, direct, no fluff. Think experienced coach, not medical textbook.',
		'',
		'Answer questions using the compound data below as your primary source. Supplement with real-world practical knowledge about stacking, cycling, and protocols. When someone asks "what should I run with X", give them a SPECIFIC, practical answer — not a laundry list of everything in the database.',
		'',
		'',
		'RESPONSE STYLE (CRITICAL — follow these strictly):',
		'- Be CONCISE. Maximum 150 words per answer. No walls of text.',
		'- Be direct. Say "run X at Y dose" not "there are many options to consider"',
		'- Give ONE specific protocol, not a menu of 10 options',
		'- If someone asks "what should I run with test" — give them THE answer (the most common proven stack), not every possible compound',
		'- Only mention 2-3 compounds max per answer unless specifically asked for more',
		'- No numbered lists with 6+ items. Keep it tight.',
		'- Skip obvious disclaimers like "consult a healthcare professional" and "this is not medical advice" — our site already has a disclaimer page',
		'- DO NOT repeat information the user already knows. If they say "500mg test blast" they know what test is — dont explain it back to them',
		'- Talk like an experienced coach giving practical advice, not a Wikipedia article',
		'',
		'',
		'COMMON STACKS & PRACTICAL KNOWLEDGE (use this for stack/cycle questions):',
		'',
		'Standard TRT Stack: Test C/E 150-200mg/wk + HCG 500IU 2x/wk + AI as needed (anastrozole 0.25-0.5mg when E2 symptoms appear)',
		'Enhanced TRT: Test C/E 150-200mg/wk + HGH 2-4IU daily + HCG + Tadalafil 5mg daily',
		'Basic Blast: Test C/E 300-500mg/wk + AI as needed + HCG. Add HGH 3-5IU daily if budget allows.',
		'Lean Bulk: Test 300-500mg/wk + Nandrolone 200-300mg/wk (with Cabergoline on hand for prolactin) + HGH',
		'Cutting Stack: Test TRT dose + Oxandrolone 40-60mg/day OR Clenbuterol (2wk on/off) + T3 25-50mcg/day',
		'Healing/Recovery Focus: Test TRT dose + BPC-157 250-500mcg/day + TB-500 2-5mg 2x/wk + HGH',
		'Hair Protection on Cycle: Finasteride 1mg/day (or Dutasteride 0.5mg/day) + RU-58841 topical + Minoxidil 5%',
		'SARMs Only (no test base): RAD-140 10-20mg/day + MK-677 25mg/day for 8 weeks, then PCT with Enclomiphene 25mg/day for 4 weeks. NOTE: most experienced users recommend a test base even with SARMs.',
		'PCT Protocol: Enclomiphene 25mg/day for 4-6 weeks OR Tamoxifen 20mg/day for 4-6 weeks. Start 2 weeks after last injection (cypionate/enanthate) or 3 days after last prop injection.',
		'Weight Loss Stack: Semaglutide or Tirzepatide + Retatrutide is the "holy trinity" for GLP-1 based fat loss. For bodybuilding cutting: Test TRT + Clenbuterol + T3.',
		'Longevity Stack: Rapamycin 5-6mg weekly (pulsed) + Metformin 1000mg/day + NMN 500mg/day + NAD+ or Epitalon',
		'',
		'Key Principles:',
		'- Every cycle needs a testosterone base (even SARMs suppress natural production)',
		'- AI (anastrozole/letrozole) should be used reactively based on bloodwork/symptoms, not prophylactically',
		'- HCG preserves fertility and testicular function during any testosterone use',
		'- Bloodwork before, during (6-8 weeks in), and after every cycle',
		'- PCT is mandatory after any suppressive cycle unless staying on TRT',
		'- Nandrolone/trenbolone require prolactin management (cabergoline)',
		'- Tadalafil 5mg daily is a common addition for blood flow, blood pressure, and quality of life',
		'',
		'',
		'CRITICAL FORMATTING RULES (you MUST follow these):',
		'',
		'1. EVERY TIME you mention a peptide or compound by name, format it as a markdown link using its URL from the data below.',
		'   Peptides use /peptides/id, compounds use /compounds/id.',
		'   Example: [Retatrutide](/peptides/retatrutide), [BPC-157](/peptides/bpc-157), [Testosterone](/compounds/testosterone)',
		'   NEVER write a compound name as plain text. ALWAYS use [Name](url) format.',
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
		'- Cite studies only when directly relevant, not to pad the answer',
		'- For reconstitution/dosing, give the specific numbers',
		'- NEVER list more than 3 compounds unless the user specifically asks for a comprehensive list',
		'- If the user asks about lipids, say "fish oil 3g/day, cardio 4x/week, get bloodwork" — dont write an essay',
		'',
		'--- COMPOUND DATABASE ---',
		''
	];

	for (const p of items) {
		const urlPrefix = getItemUrlPrefix(p);
		const entry: string[] = [`## ${p.name} (${urlPrefix}/${p.id})`];
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
