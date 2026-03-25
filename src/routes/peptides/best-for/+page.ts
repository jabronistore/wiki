import { getAllPeptides } from '$lib/data/peptides';
import { GOALS, rankPeptidesForGoal } from '$lib/utils/best-for';

export const prerender = false;

export function load() {
	const allPeptides = getAllPeptides();

	const goals = GOALS.map((goal) => {
		const ranked = rankPeptidesForGoal(goal, allPeptides);
		return {
			...goal,
			topPeptides: ranked.slice(0, 3).map((p) => ({ id: p.id, name: p.name })),
			totalCount: ranked.length
		};
	});

	return { goals };
}
