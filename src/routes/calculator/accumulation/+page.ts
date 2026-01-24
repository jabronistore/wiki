import { getPeptideBySlug } from '$lib/data/peptides';

// Can't prerender because we use URL searchParams for initial peptide
export const prerender = false;

export function load({ url }) {
	// Support both URL formats:
	// - Simple: ?peptide=bpc-157
	// - Complex: ?c=bpc-157:100:mcg:daily:7 (first segment is peptide ID)
	let peptideId = url.searchParams.get('peptide') ?? undefined;

	// Parse complex format if simple format not found
	if (!peptideId) {
		const compoundsParam = url.searchParams.get('c');
		if (compoundsParam) {
			// Format: id:dose:unit:freq:interval|id2:... (can have multiple compounds)
			const firstCompound = compoundsParam.split('|')[0];
			peptideId = firstCompound?.split(':')[0] || undefined;
		}
	}

	const peptide = peptideId ? getPeptideBySlug(peptideId) : undefined;

	return {
		initialPeptideId: peptideId,
		peptideName: peptide?.name
	};
}
