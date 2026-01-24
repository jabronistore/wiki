import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAllPeptideSummaries } from '$lib/data/peptides';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	// Redirect to login if supabase not available or not authenticated
	if (!supabase) {
		throw redirect(303, '/auth/login');
	}

	// Use getUser() instead of getSession() for secure server-side auth
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	// Redirect to login if not authenticated
	if (authError || !user) {
		throw redirect(303, '/auth/login');
	}

	// Check if user has already completed onboarding
	const { data: profile } = await supabase
		.from('profiles')
		.select('onboarding_completed')
		.eq('id', user.id)
		.single();

	if (profile?.onboarding_completed) {
		throw redirect(303, '/');
	}

	// Get all peptides grouped by category for selection
	const peptides = getAllPeptideSummaries();

	// Group by primary category
	const categories = new Map<string, typeof peptides>();
	for (const peptide of peptides) {
		const category = peptide.categories?.[0] || 'Other';
		if (!categories.has(category)) {
			categories.set(category, []);
		}
		categories.get(category)!.push(peptide);
	}

	return {
		peptides,
		categories: Object.fromEntries(categories)
	};
};
