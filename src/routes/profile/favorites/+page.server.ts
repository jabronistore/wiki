import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';

export const load: PageServerLoad = async ({ cookies, parent }) => {
	const { user, profile } = await parent();

	if (!user) {
		throw redirect(303, '/auth/login?redirect=/profile/favorites');
	}

	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { path: '/', ...options });
			});
		}
	});

	if (!supabase) {
		return { user, profile, favorites: [] };
	}

	// Fetch user's favorites
	const { data: favorites, error: favoritesError } = await supabase
		.from('user_favorite_peptides')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (favoritesError) {
		console.error('Error fetching favorites:', favoritesError);
	}

	return {
		user,
		profile,
		favorites: favorites || []
	};
};
