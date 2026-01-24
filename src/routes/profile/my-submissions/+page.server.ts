import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSupabaseServerClient } from '$lib/supabase';

export const load: PageServerLoad = async ({ cookies, parent }) => {
	const { user, profile } = await parent();

	if (!user) {
		throw redirect(303, '/auth/login?redirect=/profile/my-submissions');
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
		return { user, profile, findings: [] };
	}

	// Fetch user's findings
	const { data: findings, error: findingsError } = await supabase
		.from('findings')
		.select(
			`
			*,
			finding_results (*)
		`
		)
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (findingsError) {
		console.error('Error fetching findings:', findingsError);
	}

	return {
		user,
		profile,
		findings: findings || []
	};
};
