import type { PageServerLoad } from './$types';
import { getPeptideStats } from '$lib/data/peptides';
import { getAllCompounds } from '$lib/data/compounds';

export const load: PageServerLoad = async () => {
	const peptideStats = getPeptideStats();
	const compounds = getAllCompounds();

	let compoundRefs = 0;
	const compoundCategories = new Set<string>();
	for (const c of compounds) {
		if (c.references) compoundRefs += c.references.length;
		if (c.categories) c.categories.forEach((cat) => compoundCategories.add(cat));
	}

	return {
		stats: {
			peptideCount: peptideStats.peptideCount,
			compoundCount: compounds.length,
			totalCount: peptideStats.peptideCount + compounds.length,
			categoryCount: peptideStats.categoryCount + compoundCategories.size,
			referenceCount: peptideStats.referenceCount + compoundRefs
		}
	};
};
