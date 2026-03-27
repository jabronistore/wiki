import { getAllItemSummaries, getItemBySlug } from '$lib/data/unified';

export const prerender = false;

export function load({ url }) {
	// Support pre-selected peptides via query params: ?peptides=bpc-157,tb-500,ghk-cu
	const peptideParam = url.searchParams.get('peptides') || '';
	const selectedIds = peptideParam ? peptideParam.split(',').filter(Boolean) : [];

	// Load full data for pre-selected peptides
	const selectedPeptides = selectedIds
		.map((id) => getItemBySlug(id))
		.filter((p) => p !== undefined);

	return {
		allPeptides: getAllItemSummaries(),
		initialPeptides: selectedPeptides,
		initialIds: selectedIds
	};
}
