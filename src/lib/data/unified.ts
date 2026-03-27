import { getAllPeptides, getPeptideBySlug, getAllPeptideSummaries } from './peptides';
import { getAllCompounds, getCompoundBySlug, getAllCompoundSummaries } from './compounds';
import type { Peptide, PeptideSummary } from '$lib/types';

export function getAllItems(): Peptide[] {
	return [...getAllPeptides(), ...getAllCompounds()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getItemBySlug(slug: string): Peptide | undefined {
	return getPeptideBySlug(slug) ?? getCompoundBySlug(slug);
}

export function getAllItemSummaries(): PeptideSummary[] {
	return [...getAllPeptideSummaries(), ...getAllCompoundSummaries()].sort((a, b) =>
		a.name.localeCompare(b.name)
	);
}

export function getItemUrlPrefix(item: Peptide | PeptideSummary): string {
	const kind = item.compoundKind ?? 'peptide';
	return kind === 'peptide' ? '/peptides' : '/compounds';
}

export function getItemUrl(item: Peptide | PeptideSummary): string {
	return `${getItemUrlPrefix(item)}/${item.id}`;
}
