import type { Peptide, PeptideSummary } from '$lib/types';

export interface ComparisonPair {
	slugA: string;
	slugB: string;
	nameA: string;
	nameB: string;
	comparisonSlug: string;
	interactionStatus: string;
	sharedCategories: string[];
}

/**
 * Parse a comparison slug like "bpc-157-vs-tb-500" into two peptide IDs.
 * Uses indexOf('-vs-') to split — safe because no peptide ID contains "vs".
 */
export function parseComparisonSlug(slug: string): { slugA: string; slugB: string } | null {
	const idx = slug.indexOf('-vs-');
	if (idx === -1) return null;
	const slugA = slug.substring(0, idx);
	const slugB = slug.substring(idx + 4);
	if (!slugA || !slugB) return null;
	return { slugA, slugB };
}

/**
 * Build a canonical comparison slug. Always alphabetically sorted
 * so bpc-157-vs-tb-500 and tb-500-vs-bpc-157 resolve to the same URL.
 */
export function buildComparisonSlug(idA: string, idB: string): string {
	const sorted = [idA, idB].sort();
	return `${sorted[0]}-vs-${sorted[1]}`;
}

/**
 * Find the interaction entry between two peptides.
 * Interactions use display names (e.g., "TB-500"), not IDs.
 */
export function findMutualInteraction(
	peptideA: Peptide,
	peptideB: Peptide
): { status: string; notes: string } | null {
	// Check A's interactions for B
	const fromA = peptideA.interactions?.find(
		(i) => i.peptide.toLowerCase() === peptideB.name.toLowerCase()
	);
	if (fromA) return { status: fromA.status, notes: fromA.notes || '' };

	// Check B's interactions for A
	const fromB = peptideB.interactions?.find(
		(i) => i.peptide.toLowerCase() === peptideA.name.toLowerCase()
	);
	if (fromB) return { status: fromB.status, notes: fromB.notes || '' };

	return null;
}

/**
 * Find the peptide ID from a display name by matching against all peptides.
 */
export function findPeptideIdByName(name: string, allPeptides: PeptideSummary[]): string | null {
	const lower = name.toLowerCase();
	const match = allPeptides.find((p) => p.name.toLowerCase() === lower);
	return match?.id ?? null;
}

/**
 * Get popular comparison pairs from synergistic interactions.
 */
export function getPopularComparisons(allPeptides: Peptide[]): ComparisonPair[] {
	const seen = new Set<string>();
	const pairs: ComparisonPair[] = [];

	const summaries = allPeptides.map((p) => ({ id: p.id, name: p.name }));

	for (const peptide of allPeptides) {
		if (!peptide.interactions) continue;
		for (const interaction of peptide.interactions) {
			if (interaction.status !== 'synergistic' && interaction.status !== 'compatible') continue;

			const otherId = findPeptideIdByName(
				interaction.peptide,
				summaries as PeptideSummary[]
			);
			if (!otherId) continue;

			const slug = buildComparisonSlug(peptide.id, otherId);
			if (seen.has(slug)) continue;
			seen.add(slug);

			const other = allPeptides.find((p) => p.id === otherId);
			if (!other) continue;

			const sharedCats = (peptide.categories || []).filter((c) =>
				(other.categories || []).includes(c)
			);

			pairs.push({
				slugA: peptide.id < otherId ? peptide.id : otherId,
				slugB: peptide.id < otherId ? otherId : peptide.id,
				nameA: peptide.id < otherId ? peptide.name : other.name,
				nameB: peptide.id < otherId ? other.name : peptide.name,
				comparisonSlug: slug,
				interactionStatus: interaction.status,
				sharedCategories: sharedCats
			});
		}
	}

	// Sort: synergistic first, then by name
	pairs.sort((a, b) => {
		if (a.interactionStatus === 'synergistic' && b.interactionStatus !== 'synergistic') return -1;
		if (b.interactionStatus === 'synergistic' && a.interactionStatus !== 'synergistic') return 1;
		return a.nameA.localeCompare(b.nameA);
	});

	return pairs;
}
