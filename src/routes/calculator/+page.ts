import { getPeptideBySlug, getAllPeptides } from '$lib/data/peptides';
import type { Guide } from '$lib/types';

export const prerender = false;

export function load({ url }) {
	const peptideId = url.searchParams.get('peptide') ?? undefined;
	const peptide = peptideId ? getPeptideBySlug(peptideId) : undefined;

	// Get all peptides for the dropdown selector
	const allPeptides = getAllPeptides().map((p) => ({
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

	// Find related guides for this peptide
	let relatedGuides: { title: string; slug: string }[] = [];
	if (peptideId) {
		const guidePaths = import.meta.glob('/src/guides/*.md', { eager: true });
		for (const path in guidePaths) {
			const file = guidePaths[path];
			if (file && typeof file === 'object' && 'metadata' in file) {
				const meta = file.metadata as Guide;
				if (meta.published && meta.relatedPeptides?.includes(peptideId)) {
					const slug = path.split('/').at(-1)?.replace('.md', '') || '';
					relatedGuides.push({ title: meta.title, slug });
				}
			}
		}
	}

	// Pass peptide context for cross-links and contextual reference section
	const peptideContext = peptide
		? {
				id: peptide.id,
				name: peptide.name,
				subtitle: peptide.subtitle,
				quickStats: peptide.quickStats,
				deliveryMethods: peptide.deliveryMethods,
				categories: peptide.categories,
				molecular: peptide.molecular
					? {
							halfLife: peptide.molecular.halfLife,
							halfLifeSeconds: peptide.molecular.halfLifeSeconds,
							weight: peptide.molecular.weight
						}
					: undefined
			}
		: undefined;

	return {
		peptideId,
		peptideName: peptide?.name,
		defaultDose,
		defaultUnit,
		allPeptides,
		peptideContext,
		relatedGuides
	};
}
