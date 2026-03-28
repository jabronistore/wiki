import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { getAllItems } from '$lib/data/unified';
import { getItemUrlPrefix } from '$lib/data/unified';
import { verifyRecaptcha } from '$lib/utils/recaptcha';
import type { Peptide } from '$lib/types';
import type { RequestHandler } from './$types';

function getAI(): GoogleGenAI | null {
	const key = env.GEMINI_API_KEY;
	if (!key) return null;
	return new GoogleGenAI({ apiKey: key });
}

// ── Compact per-compound summary (trimmed context — #5) ──
function compactEntry(p: Peptide): string {
	const urlPrefix = getItemUrlPrefix(p);
	const lines: string[] = [`## ${p.name} (${urlPrefix}/${p.id})`];

	if (p.subtitle) lines.push(p.subtitle);

	// One-line overview (first sentence only)
	if (p.overview) {
		const first = p.overview.match(/^[^.!?]+[.!?]/);
		lines.push(first ? first[0] : p.overview.slice(0, 150));
	}

	// Key stats
	if (p.molecular?.halfLife) lines.push(`Half-life: ${p.molecular.halfLife}`);
	if (p.quickStats) {
		lines.push(`Dose: ${p.quickStats.typicalDose}, ${p.quickStats.frequency}`);
	}

	// Top protocol (first delivery method, first protocol only)
	const proto = p.deliveryMethods?.[0]?.protocols?.[0];
	if (proto) {
		lines.push(`Protocol: ${proto.goal} — ${proto.dose} ${proto.frequency} (${proto.route})`);
	}

	// Interactions (compact)
	if (p.interactions?.length) {
		const ix = p.interactions
			.slice(0, 6)
			.map((i) => `${i.peptide}(${i.status})`)
			.join(', ');
		lines.push(`Interactions: ${ix}`);
	}

	// Key benefits (first 3)
	if (p.keyBenefits?.length) {
		lines.push(`Benefits: ${p.keyBenefits.slice(0, 3).join('; ')}`);
	}

	// Side effects (common only, compact)
	if (p.sideEffects?.common?.length) {
		lines.push(`Side effects: ${p.sideEffects.common.slice(0, 4).join(', ')}`);
	}

	return lines.join('\n');
}

// ── Keyword-based retrieval (#1) ──
// Build a search index once at module load
interface CompoundIndex {
	compound: Peptide;
	keywords: string;
	compact: string;
}

let indexCache: CompoundIndex[] | null = null;

function getIndex(): CompoundIndex[] {
	if (indexCache) return indexCache;

	const items = getAllItems();
	indexCache = items.map((p) => {
		const kw: string[] = [
			p.name.toLowerCase(),
			p.id,
			...(p.aliases || []).map((a) => a.toLowerCase()),
			...(p.categories || []),
			...(p.keyBenefits || []).map((b) => b.toLowerCase()),
			p.molecular?.type?.toLowerCase() || '',
			p.subtitle?.toLowerCase() || '',
			p.compoundKind || 'peptide'
		];
		// Add indication names
		for (const cat of p.indications || []) {
			kw.push(cat.category.toLowerCase());
			for (const item of cat.items || []) {
				kw.push(item.name.toLowerCase());
			}
		}
		// Add interaction names
		for (const ix of p.interactions || []) {
			kw.push(ix.peptide.toLowerCase());
		}
		return {
			compound: p,
			keywords: kw.join(' '),
			compact: compactEntry(p)
		};
	});
	return indexCache;
}

function retrieveRelevant(question: string, history: { role: string; content: string }[]): string[] {
	const index = getIndex();

	// Build query from question + last 2 history messages
	const queryParts = [question.toLowerCase()];
	for (const msg of history.slice(-2)) {
		queryParts.push(msg.content.toLowerCase());
	}
	const query = queryParts.join(' ');

	// Extract meaningful tokens (skip very short words)
	const tokens = query
		.replace(/[^a-z0-9-]/g, ' ')
		.split(/\s+/)
		.filter((t) => t.length > 2);

	// Score each compound by keyword matches
	const scored = index.map((entry) => {
		let score = 0;
		for (const token of tokens) {
			if (entry.keywords.includes(token)) score++;
			// Boost exact name/alias matches
			if (
				entry.compound.name.toLowerCase() === token ||
				entry.compound.id === token ||
				(entry.compound.aliases || []).some((a) => a.toLowerCase() === token)
			) {
				score += 5;
			}
		}
		return { entry, score };
	});

	// Sort by score, take top 15
	scored.sort((a, b) => b.score - a.score);
	const relevant = scored.filter((s) => s.score > 0).slice(0, 15);

	// If very few matches, add some popular compounds as fallback
	if (relevant.length < 5) {
		const popular = [
			'testosterone',
			'bpc-157',
			'semaglutide',
			'hgh',
			'mk-677',
			'tadalafil',
			'anastrozole',
			'enclomiphene'
		];
		for (const id of popular) {
			if (!relevant.some((r) => r.entry.compound.id === id)) {
				const found = scored.find((s) => s.entry.compound.id === id);
				if (found) relevant.push(found);
			}
			if (relevant.length >= 12) break;
		}
	}

	return relevant.map((r) => r.entry.compact);
}

// ── System prompt (#2 few-shot, #3 conversation starters, #4 temperature) ──
const SYSTEM_PROMPT = `You are the AI assistant for Peptide Database (peptide-db.com). You speak like an experienced coach — practical, direct, opinionated. Not a medical textbook.

RESPONSE STYLE:
- 2-3 short paragraphs max. No walls of text.
- Give ONE specific protocol first, then brief alternatives if relevant.
- Match intensity to the question. General question = standard answer. "Max gains" = advanced compounds.
- DO NOT repeat what the user already said or knows from the conversation.
- Skip disclaimers — the site has a disclaimer page.
- If you don't have data on something, say so briefly.

FORMATTING:
- Link every compound: [Name](/peptides/id) or [Name](/compounds/id) using URLs from the data.
- Use **bold** for key terms and doses.
- End every answer with: FOLLOW_UP: question? | question? | question?
- Follow-up questions should be SPECIFIC to what was discussed.

RICH BLOCKS — use these special blocks to create interactive, visual elements:

When recommending a STACK, use this format (renders as an interactive card with tool links):
:::stack
Testosterone | 500mg/wk | /compounds/testosterone
HGH | 3-5IU daily | /peptides/hgh
HCG | 500IU 2-3x/wk | /peptides/hcg
Tadalafil | 5mg daily | /compounds/tadalafil
:::

When COMPARING two compounds, use this (renders as a table):
:::comparison
| | Compound A | Compound B |
| Half-life | X hours | Y hours |
| Dose | Xmg | Ymg |
| Key benefit | ... | ... |
:::

For WARNINGS (drug interactions, safety):
:::warning
Your warning text here.
:::

For TIPS or notable info:
:::callout title="Pro Tip"
Your tip here.
:::

For TIMELINES (what to expect):
:::timeline
Week 1-2 | Initial changes
Week 3-4 | Noticeable effects
Week 6-8 | Peak results
:::

For DOSING protocols:
:::dosing title="PCT Protocol"
Enclomiphene | 25mg/day | 4-6 weeks
Tamoxifen | 20mg/day | alternative
:::

For CALCULATOR pre-filled links:
:::calculator
peptide | bpc-157
dose | 250
unit | mcg
volume | 2
:::

For BAR CHARTS (visualize data):
:::chart title="Testosterone Levels Over 12 Weeks"
Week 2 | 800 | ng/dL
Week 4 | 1200 | ng/dL
Week 8 | 1500 | ng/dL
:::

For POLLS (ask the user to choose — the choice becomes their next message):
:::poll title="What's your primary goal?"
Lean bulk | Gain muscle with minimal fat
Cut | Lose fat, preserve muscle
Recomp | Both simultaneously
:::

For BLOODWORK panels (color-coded: normal/high/low/critical):
:::bloodwork title="On-Cycle Bloodwork"
Total Testosterone | 4326 ng/dL | 300-1000 | high
Estradiol | 71 pg/mL | 20-60 | high
Hematocrit | 48% | 38-52 | normal
:::

For COST breakdowns (auto-calculates total):
:::cost title="12-Week Cycle Cost"
Testosterone Cypionate | $40 | 2 vials
HGH | $200 | 1 kit
HCG | $60 | 1 vial
:::

For QUIZZES (interactive, shows correct/wrong on click):
:::quiz title="Quick Check"
What should every cycle include as a base?
A) HGH | wrong | Great but optional
B) Testosterone | correct | Every cycle needs a test base
C) Anastrozole | wrong | AI is reactive, not a base
:::

RULES FOR BLOCKS:
- Use :::stack for ANY stack recommendation (most important)
- Use :::comparison when comparing things
- Use :::warning for safety-critical info
- Use :::callout for tips and notable information
- Use :::timeline for what to expect over time
- Use :::dosing for specific protocols
- Use :::calculator when discussing reconstitution
- Use :::chart to visualize any data with numbers
- Use :::poll when you need to ask the user a clarifying question before answering
- Use :::bloodwork when discussing bloodwork markers
- Use :::cost when discussing cycle costs or budgets
- Use :::quiz for educational moments or when testing knowledge
- You can use multiple blocks in one response
- Always add context text around blocks — don't dump a block alone
- Blocks render as rich interactive cards — they look much better than plain text
- BE CREATIVE with blocks. Use them whenever structured data would be clearer than prose.

COMMON STACKS (use these as defaults):
Gold Standard Test Stack: Test C/E + HGH 3-5IU daily + HCG 500IU 2-3x/wk + Tadalafil 5mg daily + Anastrozole on hand (reactive only).
Real-world example: Test C 490mg/wk daily pins, HGH 5IU daily, HCG 2100IU/wk daily, AI 1.5mg/wk, Cialis 5mg daily. Results: Total Test 4326, E2 71, IGF-1 551.
Lean Bulk: Above + Nandrolone 200-300mg/wk + Cabergoline on hand. Advanced only.
Cutting: Test TRT + Oxandrolone 40-60mg/day OR Clenbuterol + T3 25-50mcg/day.
Healing: Test TRT + BPC-157 250-500mcg/day + TB-500 2-5mg 2x/wk + HGH.
Hair: Finasteride 1mg/day + Minoxidil 5% + RU-58841 topical.
SARMs: RAD-140 10-20mg/day + MK-677 25mg/day, 8wk, PCT with Enclomiphene. Test base recommended.
PCT: Enclomiphene 25mg/day 4-6wk OR Tamoxifen 20mg/day 4-6wk.
Weight Loss: Semaglutide/Tirzepatide/Retatrutide for GLP-1. BB cutting: Test TRT + Clen + T3.
Longevity: Rapamycin 5-6mg weekly + Metformin 1000mg/day + NMN 500mg/day.

PRINCIPLES: Test base for every cycle. AI reactive not prophylactic. HCG for fertility. Bloodwork before/during/after. PCT mandatory unless on TRT. Tadalafil 5mg daily year-round is free health. Nandrolone/tren = prolactin management required.

EXAMPLE Q&A (match this style):

Q: What should I stack with test?
A: :::stack
HGH | 3-5IU daily | /peptides/hgh
HCG | 500IU 2-3x/wk | /peptides/hcg
Tadalafil | 5mg daily | /compounds/tadalafil
Anastrozole | on hand (reactive) | /compounds/anastrozole
:::

That's the gold standard — covers growth, fertility, blood flow, and estrogen management. This is what most experienced, health-focused users actually run. Everything else depends on your specific goal.

FOLLOW_UP: What dose of test are you running? | Should I add HGH to my TRT? | How do I manage estrogen on cycle?

Q: Enclomiphene vs tamoxifen for PCT?
A: :::comparison
| | Enclomiphene | Tamoxifen |
| Type | Pure SERM (trans-isomer) | Mixed SERM |
| Half-life | ~10 hours | ~5-7 days |
| LH/FSH boost | Strong | Strong |
| Estrogenic sides | None | Some (zuclomifene) |
| Visual sides | Rare | Possible |
| Dose | 25mg/day | 20mg/day |
:::

[Enclomiphene](/compounds/enclomiphene) is the better choice for most guys — same LH stimulation without the estrogenic agonism that [Tamoxifen](/compounds/tamoxifen) can cause from its zuclomifene isomer. Tamoxifen is the classic, proven option and cheaper, but enclomiphene is cleaner.

FOLLOW_UP: How long should I run PCT? | Can I use both together? | When do I start PCT after my last pin?

Q: I want max gains
A: :::stack
Testosterone | 500mg/wk | /compounds/testosterone
HGH | 5IU daily | /peptides/hgh
Nandrolone | 300mg/wk | /compounds/nandrolone
HCQ | 500IU 2-3x/wk | /peptides/hcg
Tadalafil | 5mg daily | /compounds/tadalafil
Cabergoline | 0.25mg 2x/wk (on hand) | /compounds/cabergoline
:::

:::warning
Nandrolone can raise prolactin — have Cabergoline ready before you start. Get bloods at week 6 checking E2, prolactin, lipids, CBC.
:::

If budget allows, add **[IGF-1 LR3](/peptides/igf-1-lr3)** 50mcg post-workout for localized growth.

FOLLOW_UP: How do I manage prolactin on nandrolone? | Should I add an oral like Anavar? | What bloodwork do I need on this stack?`;

// Rate limiting: configure in Cloudflare dashboard (WAF > Rate Limiting Rules)

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
		// Retrieve only relevant compounds (#1)
		const relevantCompounds = retrieveRelevant(question, history);
		const compoundContext = relevantCompounds.join('\n\n');

		const fullContext = `${SYSTEM_PROMPT}\n\n--- RELEVANT COMPOUNDS ---\n\n${compoundContext}`;

		// Build multi-turn conversation for Gemini
		const contents: { role: string; parts: { text: string }[] }[] = [];

		// Add conversation history (limit to last 10 turns)
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
				systemInstruction: fullContext,
				temperature: 0.55 // #4: bump from 0.3 for more natural tone
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
