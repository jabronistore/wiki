import { getAllPeptideSummaries, getPeptideBySlug } from '$lib/data/peptides';

export const prerender = false;

export function load({ url }) {
	const peptideId = url.searchParams.get('peptide') || '';
	const peptide = peptideId ? getPeptideBySlug(peptideId) : undefined;

	// Parse default dose from peptide data
	let defaultDose = 250;
	let defaultUnit: 'mcg' | 'mg' = 'mcg';
	let defaultFreq = 1; // doses per day

	if (peptide?.quickStats?.typicalDose) {
		const doseStr = peptide.quickStats.typicalDose;
		const mgMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*mg/i);
		const mcgMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*mcg/i);
		if (mgMatch) { defaultDose = parseFloat(mgMatch[1]); defaultUnit = 'mg'; }
		else if (mcgMatch) { defaultDose = parseFloat(mcgMatch[1]); defaultUnit = 'mcg'; }
	}

	// Parse frequency
	if (peptide?.quickStats?.frequency) {
		const freq = peptide.quickStats.frequency.toLowerCase();
		if (freq.includes('twice daily') || freq.includes('2x daily')) defaultFreq = 2;
		else if (freq.includes('weekly') || freq.includes('once weekly')) defaultFreq = 1 / 7;
		else if (freq.includes('every other day')) defaultFreq = 0.5;
		else if (freq.includes('twice weekly')) defaultFreq = 2 / 7;
	}

	return {
		allPeptides: getAllPeptideSummaries(),
		peptideId,
		peptideName: peptide?.name || null,
		defaultDose,
		defaultUnit,
		defaultFreq,
		defaultVialSize: peptide?.quickStats?.typicalDose ? 10 : 10
	};
}
