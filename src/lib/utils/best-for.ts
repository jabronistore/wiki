import type { Peptide } from '$lib/types';

export interface GoalConfig {
	slug: string;
	title: string;
	description: string;
	/** Indication category names from peptide JSON that map to this goal */
	matchCategories: string[];
}

/** All supported "best for" goals with their matching indication categories */
export const GOALS: GoalConfig[] = [
	{
		slug: 'healing',
		title: 'Healing & Recovery',
		description: 'Peptides studied for tissue repair, wound healing, tendon and ligament recovery, and post-surgical healing.',
		matchCategories: ['Wound Healing', 'Tissue Repair', 'Tissue Regeneration', 'Tissue Healing', 'Skin Regeneration', 'Recovery', 'Recovery & Wellness', 'Post-Surgical Recovery', 'Pain & Recovery', 'Sports Medicine', 'Athletic Recovery', 'Muscle Repair']
	},
	{
		slug: 'weight-loss',
		title: 'Weight Loss & Metabolic',
		description: 'Peptides studied for appetite suppression, fat metabolism, body weight reduction, and metabolic health.',
		matchCategories: ['Weight Loss', 'Fat Loss', 'Appetite Control', 'Body Composition', 'Metabolic', 'Metabolic Health', 'Metabolic Support', 'Metabolic Research', 'Metabolic & Immune', 'Metabolism', 'Energy & Metabolism', 'Type 2 Diabetes', 'Diabetes']
	},
	{
		slug: 'muscle-growth',
		title: 'Muscle Growth',
		description: 'Peptides studied for lean mass development, muscle protein synthesis, and body composition.',
		matchCategories: ['Muscle Growth', 'Muscle Repair', 'Body Composition', 'Performance', 'Exercise Performance', 'Performance (Banned in Sports)']
	},
	{
		slug: 'anti-aging',
		title: 'Anti-Aging & Longevity',
		description: 'Peptides studied for cellular protection, telomere maintenance, skin rejuvenation, and age-related decline.',
		matchCategories: ['Anti-Aging', 'Anti-Aging Protocol', 'Anti-Aging Research', 'Longevity', 'Cellular Protection', 'Quality of Life', 'Antioxidant & Detox', 'Mitochondrial']
	},
	{
		slug: 'cognitive',
		title: 'Cognitive Enhancement',
		description: 'Peptides studied for memory, focus, neuroprotection, and cognitive performance.',
		matchCategories: ['Cognitive', 'Cognitive Enhancement', 'Cognition', 'Memory', 'Neuroprotection', 'Neuroprotective', 'Neuroplasticity', 'Neurogenesis', 'Neurological', 'Neurological Support', 'Neural Health', 'Neurodegenerative Disease']
	},
	{
		slug: 'mood',
		title: 'Mood & Anxiety',
		description: 'Peptides studied for anxiolytic effects, stress reduction, mood stabilisation, and mental wellbeing.',
		matchCategories: ['Mood', 'Anxiety', 'Anxiety & Mood', 'Mood & Anxiety', 'Mental Health', 'Stress Resistance']
	},
	{
		slug: 'sleep',
		title: 'Sleep',
		description: 'Peptides studied for sleep quality, sleep latency, and circadian rhythm support.',
		matchCategories: ['Sleep']
	},
	{
		slug: 'immune',
		title: 'Immune Support',
		description: 'Peptides studied for immune modulation, antimicrobial properties, and immune system regulation.',
		matchCategories: ['Immune Support', 'Immune', 'Immune Regulation', 'Immunity', 'Immune & Skin', 'Immune System Research', 'Respiratory Support']
	},
	{
		slug: 'gut-health',
		title: 'Gut Health',
		description: 'Peptides studied for gastric protection, intestinal repair, and GI inflammation.',
		matchCategories: ['Gastrointestinal', 'GI Health', 'GI Protection', 'Gut Health']
	},
	{
		slug: 'skin',
		title: 'Skin & Hair',
		description: 'Peptides studied for collagen synthesis, wound healing, hair growth, and skin rejuvenation.',
		matchCategories: ['Skin Health', 'Skin Regeneration', 'Hair Growth', 'Anti-Wrinkle']
	},
	{
		slug: 'growth-hormone',
		title: 'Growth Hormone',
		description: 'Peptides that stimulate natural growth hormone release through GHRH and ghrelin receptor pathways.',
		matchCategories: ['Growth Hormone', 'Growth Hormone Enhancement', 'Growth Hormone Deficiency', 'Hormonal', 'Hormone Optimization']
	},
	{
		slug: 'inflammation',
		title: 'Anti-Inflammatory',
		description: 'Peptides studied for systemic inflammation reduction, autoimmune modulation, and NF-kB inhibition.',
		matchCategories: ['Anti-Inflammatory', 'Inflammation', 'Inflammatory & Autoimmune Research']
	},
	{
		slug: 'sexual-health',
		title: 'Sexual Health & Fertility',
		description: 'Peptides studied for sexual function, libido, fertility, and reproductive health.',
		matchCategories: ['Sexual Health', 'Sexual Function', 'Male Reproductive Health', 'Female Fertility', 'Female Fertility (FDA-Approved)', 'Male Fertility', 'Fertility & Reproductive', 'Reproductive', 'Testosterone Support', 'Male Hormone Support']
	},
	{
		slug: 'cardiovascular',
		title: 'Cardiovascular',
		description: 'Peptides studied for heart health, blood pressure, lipid profiles, and vascular function.',
		matchCategories: ['Cardiovascular', 'Cardiovascular Support', 'Cardiovascular/Metabolic', 'Cardioprotection', 'Vascular Health', 'Vascular Support']
	},
	{
		slug: 'joint-health',
		title: 'Joint & Bone Health',
		description: 'Peptides studied for joint repair, cartilage regeneration, bone density, and osteoarthritis.',
		matchCategories: ['Joint Health', 'Bone Health', 'Bone Health Research', 'Osteoporosis (FDA-Approved)']
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

	// Sort by score descending, then by number of indications
	results.sort((a, b) => b.score - a.score || b.indications.length - a.indications.length);

	return results;
}
