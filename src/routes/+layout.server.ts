import type { LayoutServerLoad } from './$types';
import { getAllPeptideSummaries } from '$lib/data/peptides';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = locals;

	let profile = null;

	if (user && locals.supabase) {
		const { data: profileData } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();
		profile = profileData;
	}

	return {
		peptides: getAllPeptideSummaries(),
		session,
		user,
		profile
	};
};
