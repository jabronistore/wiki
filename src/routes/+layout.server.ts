import type { LayoutServerLoad } from './$types';
import { getAllPeptideSummaries } from '$lib/data/peptides';

export const load: LayoutServerLoad = async () => {
	return {
		peptides: getAllPeptideSummaries()
	};
};
