import type { PageServerLoad } from './$types';
import { getAllCompoundSummaries } from '$lib/data/compounds';

export const load: PageServerLoad = async () => {
	return {
		compounds: getAllCompoundSummaries()
	};
};
