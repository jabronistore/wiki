import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import {
	getCompoundBySlug,
	getAllCompoundSlugs,
	getAllCompoundSummaries
} from '$lib/data/compounds';
import { getAllPeptideSummaries } from '$lib/data/peptides';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getAllCompoundSlugs().map((slug) => ({ slug }));
};

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;
	const compound = getCompoundBySlug(slug);

	if (!compound) {
		throw error(404, 'Compound not found');
	}

	return {
		peptide: compound,
		allPeptides: [...getAllPeptideSummaries(), ...getAllCompoundSummaries()]
	};
};
