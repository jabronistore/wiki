import type { Peptide, PeptideSummary } from '$lib/types';

// Import all peptide JSON files at build time using Vite's import.meta.glob
// The { eager: true } option loads them immediately instead of lazy loading
const peptideModules = import.meta.glob<Peptide>('$data/peptides/*.json', {
	eager: true,
	import: 'default'
});

// Build the peptides map once at module load time
const peptidesMap = new Map<string, Peptide>();
const allPeptides: Peptide[] = [];

for (const [path, peptide] of Object.entries(peptideModules)) {
	// Extract slug from path like "../../data/peptides/bpc-157.json" -> "bpc-157"
	const slug = path.split('/').pop()?.replace('.json', '') ?? '';
	peptidesMap.set(slug, peptide);
	allPeptides.push(peptide);
}

// Sort alphabetically by name
allPeptides.sort((a, b) => a.name.localeCompare(b.name));

/**
 * Get all peptides as full Peptide objects
 */
export function getAllPeptides(): Peptide[] {
	return allPeptides;
}

/**
 * Get all peptide slugs (for prerender entries)
 */
export function getAllPeptideSlugs(): string[] {
	return Array.from(peptidesMap.keys());
}

/**
 * Get a single peptide by slug
 */
export function getPeptideBySlug(slug: string): Peptide | undefined {
	return peptidesMap.get(slug);
}

/**
 * Get all peptides as summaries (for listings and navigation)
 */
export function getAllPeptideSummaries(): PeptideSummary[] {
	return allPeptides.map((p) => {
		// Build searchable text from indications, aliases, mechanism
		const parts: string[] = [];
		if (p.aliases) parts.push(...(Array.isArray(p.aliases) ? p.aliases : [p.aliases]));
		if (p.mechanism) parts.push(p.mechanism);
		for (const cat of p.indications || []) {
			parts.push(cat.category);
			for (const item of cat.items || []) {
				parts.push(item.name);
			}
		}
		return {
			id: p.id,
			name: p.name,
			subtitle: p.subtitle || '',
			compoundKind: p.compoundKind,
			categories: p.categories || [],
			researchStatus: p.researchStatus,
			searchText: parts.join(' ').toLowerCase()
		};
	});
}

/**
 * Get aggregate stats about peptides
 */
export function getPeptideStats(): {
	peptideCount: number;
	categoryCount: number;
	referenceCount: number;
} {
	const categories = new Set<string>();
	let totalReferences = 0;

	for (const peptide of allPeptides) {
		if (peptide.categories) {
			peptide.categories.forEach((cat) => categories.add(cat));
		}
		if (peptide.references) {
			totalReferences += peptide.references.length;
		}
	}

	return {
		peptideCount: allPeptides.length,
		categoryCount: categories.size,
		referenceCount: totalReferences
	};
}
