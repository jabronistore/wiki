import { error } from '@sveltejs/kit';
import { getAllItems } from '$lib/data/unified';
import { GOALS, rankPeptidesForGoal } from '$lib/utils/best-for';

export const prerender = false;

export function load({ params }) {
	const goal = GOALS.find((g) => g.slug === params.goal);
	if (!goal) throw error(404, `Goal "${params.goal}" not found`);

	const allItems = getAllItems();
	const ranked = rankPeptidesForGoal(goal, allItems);

	return {
		goal,
		ranked,
		allGoals: GOALS
	};
}
