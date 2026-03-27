import { error, redirect } from '@sveltejs/kit';
import { getItemBySlug, getAllItemSummaries } from '$lib/data/unified';
import { parseComparisonSlug, buildComparisonSlug } from '$lib/utils/comparison';

export const prerender = false;

export function load({ params }) {
	const parsed = parseComparisonSlug(params.slug);
	if (!parsed) throw error(404, 'Invalid comparison URL');

	const { slugA, slugB } = parsed;

	// Redirect to canonical (alphabetically sorted) URL
	const canonical = buildComparisonSlug(slugA, slugB);
	if (params.slug !== canonical) {
		throw redirect(301, `/compare/${canonical}`);
	}

	const peptideA = getItemBySlug(slugA);
	const peptideB = getItemBySlug(slugB);

	if (!peptideA) throw error(404, `Compound "${slugA}" not found`);
	if (!peptideB) throw error(404, `Compound "${slugB}" not found`);

	return {
		peptideA,
		peptideB,
		allPeptides: getAllItemSummaries()
	};
}
