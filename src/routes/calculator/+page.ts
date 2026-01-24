import { getPeptideBySlug, getAllPeptides } from '$lib/data/peptides';

export const prerender = false;

export function load({ url }) {
	const peptideId = url.searchParams.get('peptide') ?? undefined;
	const peptide = peptideId ? getPeptideBySlug(peptideId) : undefined;

	// Get all peptides for the dropdown selector
	const allPeptides = getAllPeptides().map(p => ({
		id: p.id,
		name: p.name
	}));

	// Parse typical dose from peptide data (e.g., "250-500mcg" -> 250)
	let defaultDose = 250;
	let defaultUnit: 'mcg' | 'mg' = 'mcg';

	if (peptide?.quickStats?.typicalDose) {
		const doseStr = peptide.quickStats.typicalDose;
		const mgMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*mg/i);
		const mcgMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*mcg/i);

		if (mgMatch) {
			defaultDose = parseFloat(mgMatch[1]);
			defaultUnit = 'mg';
		} else if (mcgMatch) {
			defaultDose = parseFloat(mcgMatch[1]);
			defaultUnit = 'mcg';
		}
	}

	return {
		peptideId,
		peptideName: peptide?.name,
		defaultDose,
		defaultUnit,
		allPeptides
	};
}
