import { error } from '@sveltejs/kit';
import type { Guide } from '$lib/types';

export async function load({ params }) {
	try {
		const guide = await import(`../../../guides/${params.slug}.md`);

		const metadata = guide.metadata as Omit<Guide, 'slug'>;

		return {
			content: guide.default,
			meta: {
				...metadata,
				slug: params.slug
			}
		};
	} catch (e) {
		console.error(`Error loading guide: ${params.slug}`, e);
		throw error(404, `Could not find guide: ${params.slug}`);
	}
}
