import type { PageServerLoad } from './$types';
import type { Guide } from '$lib/types';

export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/guides');
	const guides: Guide[] = await response.json();

	// Get unique categories with counts
	const categoryMap = new Map<string, number>();
	guides.forEach((guide) => {
		categoryMap.set(guide.category, (categoryMap.get(guide.category) || 0) + 1);
	});

	const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
		name,
		count
	}));

	return {
		guides,
		categories
	};
};
