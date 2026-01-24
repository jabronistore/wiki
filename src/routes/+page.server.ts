import type { PageServerLoad } from './$types';
import { getPeptideStats } from '$lib/data/peptides';

export const load: PageServerLoad = async () => {
	return {
		stats: getPeptideStats()
	};
};
