import type { PageServerLoad } from './$types';
import { getAllPeptideSummaries } from '$lib/data/peptides';

export const load: PageServerLoad = async () => {
	return {
		peptides: getAllPeptideSummaries()
	};
};
