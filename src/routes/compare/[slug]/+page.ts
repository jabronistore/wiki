import { error, redirect } from '@sveltejs/kit';
import { getPeptideBySlug, getAllPeptideSummaries } from '$lib/data/peptides';
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

	const peptideA = getPeptideBySlug(slugA);
	const peptideB = getPeptideBySlug(slugB);

	if (!peptideA) throw error(404, `Peptide "${slugA}" not found`);
	if (!peptideB) throw error(404, `Peptide "${slugB}" not found`);

	return {
		peptideA,
		peptideB,
		allPeptides: getAllPeptideSummaries()
	};
}
