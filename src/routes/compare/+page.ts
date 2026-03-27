import { getAllItems, getAllItemSummaries } from '$lib/data/unified';
import { getPopularComparisons } from '$lib/utils/comparison';

export const prerender = false;

export function load() {
	const allItems = getAllItems();
	const popularComparisons = getPopularComparisons(allItems);
	const summaries = getAllItemSummaries();

	return {
		popularComparisons,
		allPeptides: summaries
	};
}
