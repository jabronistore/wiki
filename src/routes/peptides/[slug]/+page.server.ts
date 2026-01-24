import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import { getPeptideBySlug, getAllPeptideSlugs, getAllPeptideSummaries } from '$lib/data/peptides';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getAllPeptideSlugs().map((slug) => ({ slug }));
};

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	const peptide = getPeptideBySlug(slug);

	if (!peptide) {
		throw error(404, 'Peptide not found');
	}

	return {
		peptide,
		allPeptides: getAllPeptideSummaries()
	};
};
