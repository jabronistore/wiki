import type { Peptide } from '$lib/types';

export interface GoalConfig {
	slug: string;
	title: string;
	description: string;
	/** Indication category names from peptide JSON that map to this goal */
	matchCategories: string[];
	/** Manually pinned peptide IDs in display order — these appear first, algorithm ranks the rest */
	pinnedOrder?: string[];
}

/** All supported "best for" goals with their matching indication categories */
export const GOALS: GoalConfig[] = [
	{
		slug: 'healing',
		title: 'Healing & Recovery',
		description:
			'Peptides studied for tissue repair, wound healing, tendon and ligament recovery, and post-surgical healing.',
		matchCategories: [
			'Wound Healing',
			'Tissue Repair',
			'Tissue Regeneration',
			'Tissue Healing',
			'Recovery',
			'Recovery & Wellness',
			'Post-Surgical Recovery',
			'Pain & Recovery',
			'Sports Medicine',
			'Athletic Recovery'
		],
		pinnedOrder: ['bpc-157', 'tb-500', 'thymosin-beta-4']
	},
	{
		slug: 'weight-loss',
		title: 'Weight Loss',
		description:
			'Peptides studied for appetite suppression, fat metabolism, and body weight reduction.',
		matchCategories: ['Weight Loss', 'Fat Loss', 'Appetite Control', 'Body Composition'],
		pinnedOrder: ['retatrutide', 'tirzepatide', 'semaglutide', 'cagrilintide', 'survodutide']
	},
	{
		slug: 'metabolic',
		title: 'Metabolic Health',
		description:
			'Peptides studied for metabolic function, insulin sensitivity, diabetes management, and energy metabolism.',
		matchCategories: [
			'Metabolic',
			'Metabolic Health',
			'Metabolic Support',
			'Metabolic Research',
			'Metabolic & Immune',
			'Metabolism',
			'Energy & Metabolism',
			'Type 2 Diabetes',
			'Diabetes'
		],
		pinnedOrder: ['semaglutide', 'tirzepatide', 'retatrutide', 'mots-c']
	},
	{
		slug: 'muscle-growth',
		title: 'Muscle Growth',
		description:
			'Peptides studied for lean mass development, muscle protein synthesis, and body composition.',
		matchCategories: [
			'Muscle Growth',
			'Muscle Repair',
			'Body Composition',
			'Performance',
			'Exercise Performance',
			'Performance (Banned in Sports)'
		],
		pinnedOrder: ['hgh', 'igf-1-lr3', 'mk-677', 'tesamorelin']
	},
	{
		slug: 'anti-aging',
		title: 'Anti-Aging & Longevity',
		description:
			'Peptides studied for cellular protection, telomere maintenance, skin rejuvenation, and age-related decline.',
		matchCategories: [
			'Anti-Aging',
			'Anti-Aging Protocol',
			'Anti-Aging Research',
			'Longevity',
			'Cellular Protection',
			'Quality of Life',
			'Antioxidant & Detox'
		],
		pinnedOrder: ['epitalon', 'ghk-cu', 'nad-plus', 'humanin']
	},
	{
		slug: 'cognitive',
		title: 'Cognitive Enhancement',
		description: 'Peptides studied for memory, focus, neuroprotection, and cognitive performance.',
		matchCategories: [
			'Cognitive',
			'Cognitive Enhancement',
			'Cognition',
			'Memory',
			'Neuroprotection',
			'Neuroprotective',
			'Neuroplasticity',
			'Neurogenesis',
			'Neurological',
			'Neurological Support',
			'Neural Health',
			'Neurodegenerative Disease'
		],
		pinnedOrder: ['semax', 'selank', 'dihexa', 'na-semax-amidate', 'cerebrolysin']
	},
	{
		slug: 'mood',
		title: 'Mood & Anxiety',
		description:
			'Peptides studied for anxiolytic effects, stress reduction, mood stabilisation, and mental wellbeing.',
		matchCategories: [
			'Mood',
			'Anxiety',
			'Anxiety & Mood',
			'Mood & Anxiety',
			'Mental Health',
			'Stress Resistance'
		],
		pinnedOrder: ['selank', 'na-selank-amidate', 'dsip']
	},
	{
		slug: 'sleep',
		title: 'Sleep',
		description: 'Peptides studied for sleep quality, sleep latency, and circadian rhythm support.',
		matchCategories: ['Sleep'],
		pinnedOrder: ['dsip']
	},
	{
		slug: 'immune',
		title: 'Immune Support',
		description:
			'Peptides studied for immune modulation, antimicrobial properties, and immune system regulation.',
		matchCategories: [
			'Immune Support',
			'Immune',
			'Immune Regulation',
			'Immunity',
			'Immune & Skin',
			'Immune System Research',
			'Respiratory Support'
		],
		pinnedOrder: ['thymosin-alpha-1', 'll-37', 'thymalin']
	},
	{
		slug: 'gut-health',
		title: 'Gut Health',
		description: 'Peptides studied for gastric protection, intestinal repair, and GI inflammation.',
		matchCategories: ['Gastrointestinal', 'GI Health', 'GI Protection', 'Gut Health'],
		pinnedOrder: ['bpc-157', 'kpv', 'll-37']
	},
	{
		slug: 'skin',
		title: 'Skin & Hair',
		description:
			'Peptides studied for collagen synthesis, wound healing, hair growth, and skin rejuvenation.',
		matchCategories: ['Skin Health', 'Skin Regeneration', 'Hair Growth', 'Anti-Wrinkle'],
		pinnedOrder: ['ghk-cu', 'ahk-cu', 'snap-8']
	},
	{
		slug: 'growth-hormone',
		title: 'Growth Hormone',
		description:
			'Peptides that stimulate natural growth hormone release through GHRH and ghrelin receptor pathways.',
		matchCategories: [
			'Growth Hormone',
			'Growth Hormone Enhancement',
			'Growth Hormone Deficiency',
			'Hormonal',
			'Hormone Optimization'
		],
		pinnedOrder: ['cjc-1295', 'ipamorelin', 'mk-677', 'sermorelin', 'tesamorelin', 'ghrp-2']
	},
	{
		slug: 'inflammation',
		title: 'Anti-Inflammatory',
		description:
			'Peptides studied for systemic inflammation reduction, autoimmune modulation, and NF-kB inhibition.',
		matchCategories: ['Anti-Inflammatory', 'Inflammation', 'Inflammatory & Autoimmune Research'],
		pinnedOrder: ['kpv', 'bpc-157', 'thymosin-alpha-1']
	},
	{
		slug: 'sexual-health',
		title: 'Sexual Health & Fertility',
		description:
			'Peptides studied for sexual function, libido, fertility, and reproductive health.',
		matchCategories: [
			'Sexual Health',
			'Sexual Function',
			'Male Reproductive Health',
			'Female Fertility',
			'Female Fertility (FDA-Approved)',
			'Male Fertility',
			'Fertility & Reproductive',
			'Reproductive',
			'Testosterone Support',
			'Male Hormone Support'
		],
		pinnedOrder: ['pt-141', 'kisspeptin', 'gonadorelin', 'hcg']
	},
	{
		slug: 'mitochondria',
		title: 'Mitochondrial Health',
		description:
			'Peptides studied for mitochondrial function, ATP production, cellular energy, and oxidative stress protection.',
		matchCategories: ['Mitochondrial', 'Energy & Metabolism', 'Exercise Performance'],
		pinnedOrder: ['ss-31', 'mots-c', 'nad-plus']
	},
	{
		slug: 'cardiovascular',
		title: 'Cardiovascular',
		description:
			'Peptides studied for heart health, blood pressure, lipid profiles, and vascular function.',
		matchCategories: [
			'Cardiovascular',
			'Cardiovascular Support',
			'Cardiovascular/Metabolic',
			'Cardioprotection',
			'Vascular Health',
			'Vascular Support'
		]
	},
	{
		slug: 'joint-health',
		title: 'Joint & Bone Health',
		description:
			'Peptides studied for joint repair, cartilage regeneration, bone density, and osteoarthritis.',
		matchCategories: [
			'Joint Health',
			'Bone Health',
			'Bone Health Research',
			'Osteoporosis (FDA-Approved)'
		],
		pinnedOrder: ['bpc-157', 'tb-500']
	},
	{
		slug: 'pct',
		title: 'Post-Cycle Therapy',
		description:
			'Compounds used for hormonal recovery after anabolic cycles, restoring natural testosterone production and fertility.',
		matchCategories: [
			'PCT',
			'Post-Cycle Therapy',
			'Hormone Recovery',
			'SERM',
			'Aromatase Inhibitor',
			'Testosterone Restoration'
		],
		pinnedOrder: ['enclomiphene', 'hcg', 'gonadorelin']
	},
	{
		slug: 'hair-loss',
		title: 'Hair Loss Prevention',
		description:
			'Compounds studied for hair retention, DHT blocking, follicle health, and androgenetic alopecia treatment.',
		matchCategories: [
			'Hair Loss',
			'Hair Loss Prevention',
			'Hair Growth',
			'DHT Blocker',
			'5-Alpha Reductase Inhibitor',
			'Androgenetic Alopecia'
		],
		pinnedOrder: ['finasteride', 'ghk-cu']
	},
	{
		slug: 'erectile-function',
		title: 'Erectile Function',
		description:
			'Compounds studied for erectile function, PDE5 inhibition, blood flow, and sexual performance.',
		matchCategories: [
			'Erectile Function',
			'Erectile Dysfunction',
			'PDE5 Inhibitor',
			'Sexual Function',
			'Vascular Sexual Health'
		],
		pinnedOrder: ['tadalafil', 'pt-141']
	},
	{
		slug: 'anabolic',
		title: 'Anabolic & Muscle Building',
		description:
			'Anabolic compounds and SARMs studied for lean mass, strength gains, and body composition improvement.',
		matchCategories: [
			'Anabolic',
			'SARM',
			'Muscle Growth',
			'Body Composition',
			'Performance',
			'Lean Mass',
			'Strength',
			'Hypertrophy'
		],
		pinnedOrder: ['testosterone']
	}
];

export interface RankedPeptide {
	id: string;
	name: string;
	subtitle: string;
	researchStatus: string;
	score: number;
	indications: { name: string; effectiveness: string; description: string }[];
	halfLife?: string;
	categories: string[];
}

const effectivenessScore: Record<string, number> = {
	'most-effective': 4,
	effective: 3,
	moderate: 2,
	emerging: 1
};

/** Bonus applied to the score based on research status — ensures well-studied peptides rank higher when effectiveness scores are similar */
const researchBonus: Record<string, number> = {
	'fda-approved': 5,
	'extensively-studied': 3,
	'well-studied': 2,
	'moderate-research': 1,
	emerging: 0,
	'limited-research': 0
};

/**
 * Rank peptides for a given goal based on their indication effectiveness ratings.
 */
export function rankPeptidesForGoal(goal: GoalConfig, allPeptides: Peptide[]): RankedPeptide[] {
	const results: RankedPeptide[] = [];
	const matchSet = new Set(goal.matchCategories.map((c) => c.toLowerCase()));

	for (const peptide of allPeptides) {
		// Skip blends/protocols
		if (peptide.id.includes('protocol') || peptide.id.includes('stack')) continue;

		const matchingIndications: RankedPeptide['indications'] = [];
		let totalScore = 0;

		for (const cat of peptide.indications || []) {
			if (!matchSet.has(cat.category.toLowerCase())) continue;
			for (const item of cat.items || []) {
				const eff = item.effectiveness || 'emerging';
				const score = effectivenessScore[eff] || 0;
				totalScore += score;
				matchingIndications.push({
					name: item.name,
					effectiveness: eff,
					description: item.description || ''
				});
			}
		}

		if (matchingIndications.length === 0) continue;

		// Add research status bonus
		totalScore += researchBonus[peptide.researchStatus] || 0;

		results.push({
			id: peptide.id,
			name: peptide.name,
			subtitle: peptide.subtitle || '',
			researchStatus: peptide.researchStatus,
			score: totalScore,
			indications: matchingIndications,
			halfLife: peptide.molecular?.halfLife,
			categories: peptide.categories || []
		});
	}

	// Sort: pinned peptides first (in order), then by most-effective count, then total score
	const pinnedSet = new Set(goal.pinnedOrder || []);
	const pinned: RankedPeptide[] = [];
	const rest: RankedPeptide[] = [];

	for (const r of results) {
		if (pinnedSet.has(r.id)) {
			pinned.push(r);
		} else {
			rest.push(r);
		}
	}

	// Sort pinned by their position in pinnedOrder
	const pinnedOrderMap = new Map((goal.pinnedOrder || []).map((id, i) => [id, i]));
	pinned.sort((a, b) => (pinnedOrderMap.get(a.id) ?? 999) - (pinnedOrderMap.get(b.id) ?? 999));

	// Sort rest by most-effective count, then total score
	rest.sort((a, b) => {
		const aME = a.indications.filter((i) => i.effectiveness === 'most-effective').length;
		const bME = b.indications.filter((i) => i.effectiveness === 'most-effective').length;
		if (bME !== aME) return bME - aME;
		return b.score - a.score;
	});

	return [...pinned, ...rest];
}
