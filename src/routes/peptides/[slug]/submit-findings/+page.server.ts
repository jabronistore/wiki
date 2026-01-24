import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPeptideBySlug } from '$lib/data/peptides';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user, profile } = await parent();

	// Require authentication
	if (!user) {
		throw redirect(303, `/auth/login?redirect=/peptides/${params.slug}/submit-findings`);
	}

	const peptide = getPeptideBySlug(params.slug);
	if (!peptide) {
		throw redirect(303, '/peptides');
	}

	return {
		peptide,
		user,
		profile
	};
};
