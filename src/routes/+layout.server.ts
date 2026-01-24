import type { LayoutServerLoad } from './$types';
import { getAllPeptideSummaries } from '$lib/data/peptides';
import { createSupabaseServerClient } from '$lib/supabase';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { path: '/', ...options });
			});
		}
	});

	let user = null;
	let profile = null;

	if (supabase) {
		const { data: { user: authUser } } = await supabase.auth.getUser();
		user = authUser;

		if (user) {
			const { data: profileData } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single();
			profile = profileData;
		}
	}

	return {
		peptides: getAllPeptideSummaries(),
		user,
		profile
	};
};
