import { getAllPeptides, getAllPeptideSummaries } from '$lib/data/peptides';
import { getPopularComparisons } from '$lib/utils/comparison';

export const prerender = false;

export function load() {
	const allPeptides = getAllPeptides();
	const popularComparisons = getPopularComparisons(allPeptides);
	const summaries = getAllPeptideSummaries();

	return {
		popularComparisons,
		allPeptides: summaries
	};
}
