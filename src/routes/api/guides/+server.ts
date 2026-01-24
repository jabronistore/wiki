import { json } from '@sveltejs/kit';
import type { Guide } from '$lib/types';

async function getGuides(): Promise<Guide[]> {
	let guides: Guide[] = [];

	const paths = import.meta.glob('/src/guides/*.md', { eager: true });

	for (const path in paths) {
		const file = paths[path];
		const slug = path.split('/').at(-1)?.replace('.md', '');

		if (file && typeof file === 'object' && 'metadata' in file && slug) {
			const metadata = file.metadata as Omit<Guide, 'slug'>;
			const guide = { ...metadata, slug } satisfies Guide;
			if (guide.published) {
				guides.push(guide);
			}
		}
	}

	// Sort by date, newest first
	guides = guides.sort(
		(first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()
	);

	return guides;
}

export async function GET() {
	const guides = await getGuides();
	return json(guides);
}
