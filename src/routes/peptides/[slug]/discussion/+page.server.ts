import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPeptideBySlug } from '$lib/data/peptides';
import { createSupabaseServerClient } from '$lib/supabase';

export const load: PageServerLoad = async ({ params, cookies, parent }) => {
	const peptide = getPeptideBySlug(params.slug);
	if (!peptide) {
		throw redirect(303, '/peptides');
	}

	const { user, profile } = await parent();

	const supabase = createSupabaseServerClient({
		getAll: () => cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { path: '/', ...options });
			});
		}
	});

	if (!supabase) {
		return {
			peptide,
			discussions: [],
			userUpvotes: [],
			user,
			profile
		};
	}

	// Fetch top-level discussions (parent_id is null)
	const { data: discussions, error: discussionsError } = await supabase
		.from('discussions')
		.select(
			`
			*,
			profiles:user_id (username)
		`
		)
		.eq('peptide_id', params.slug)
		.is('parent_id', null)
		.order('created_at', { ascending: false });

	if (discussionsError) {
		console.error('Error fetching discussions:', discussionsError);
	}

	// Get user's upvotes if logged in
	let userUpvotes: string[] = [];
	if (user) {
		const { data: upvotes } = await supabase
			.from('discussion_upvotes')
			.select('discussion_id')
			.eq('user_id', user.id);

		userUpvotes = upvotes?.map((u) => u.discussion_id) || [];
	}

	return {
		peptide,
		discussions: discussions || [],
		userUpvotes,
		user,
		profile
	};
};
