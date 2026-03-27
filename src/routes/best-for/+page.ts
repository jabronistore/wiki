import { getAllItems } from '$lib/data/unified';
import { GOALS, rankPeptidesForGoal } from '$lib/utils/best-for';

export const prerender = false;

export function load() {
	const allItems = getAllItems();

	const goals = GOALS.map((goal) => {
		const ranked = rankPeptidesForGoal(goal, allItems);
		return {
			...goal,
			topItems: ranked.slice(0, 3).map((p) => ({ id: p.id, name: p.name })),
			totalCount: ranked.length
		};
	});

	return { goals };
}
