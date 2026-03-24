import { getAllPeptideSummaries, getPeptideBySlug } from '$lib/data/peptides';

export const prerender = false;

export function load({ url }) {
	// Support pre-selected peptides via query params: ?peptides=bpc-157,tb-500,ghk-cu
	const peptideParam = url.searchParams.get('peptides') || '';
	const selectedIds = peptideParam ? peptideParam.split(',').filter(Boolean) : [];

	// Load full data for pre-selected peptides
	const selectedPeptides = selectedIds
		.map((id) => getPeptideBySlug(id))
		.filter((p) => p !== undefined);

	return {
		allPeptides: getAllPeptideSummaries(),
		initialPeptides: selectedPeptides,
		initialIds: selectedIds
	};
}
