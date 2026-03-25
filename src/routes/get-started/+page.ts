import { getAllPeptides } from '$lib/data/peptides';
import { GOALS, rankPeptidesForGoal } from '$lib/utils/best-for';

export const prerender = false;

export function load() {
	const allPeptides = getAllPeptides();

	// Pre-compute top 3 peptides for each goal
	const goalResults = GOALS.map((goal) => ({
		...goal,
		topPeptides: rankPeptidesForGoal(goal, allPeptides).slice(0, 3)
	}));

	return { goalResults };
}
