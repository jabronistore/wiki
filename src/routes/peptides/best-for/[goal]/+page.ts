import { error } from '@sveltejs/kit';
import { getAllPeptides } from '$lib/data/peptides';
import { GOALS, rankPeptidesForGoal } from '$lib/utils/best-for';

export const prerender = false;

export function load({ params }) {
	const goal = GOALS.find((g) => g.slug === params.goal);
	if (!goal) throw error(404, `Goal "${params.goal}" not found`);

	const allPeptides = getAllPeptides();
	const ranked = rankPeptidesForGoal(goal, allPeptides);

	return {
		goal,
		ranked,
		allGoals: GOALS
	};
}
