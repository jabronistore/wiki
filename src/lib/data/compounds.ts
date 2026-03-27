import type { Peptide, PeptideSummary } from '$lib/types';

const compoundModules = import.meta.glob<Peptide>('$data/compounds/*.json', {
	eager: true,
	import: 'default'
});

const compoundsMap = new Map<string, Peptide>();
const allCompounds: Peptide[] = [];

for (const [path, compound] of Object.entries(compoundModules)) {
	const slug = path.split('/').pop()?.replace('.json', '') ?? '';
	compoundsMap.set(slug, compound);
	allCompounds.push(compound);
}

allCompounds.sort((a, b) => a.name.localeCompare(b.name));

export function getAllCompounds(): Peptide[] {
	return allCompounds;
}

export function getAllCompoundSlugs(): string[] {
	return Array.from(compoundsMap.keys());
}

export function getCompoundBySlug(slug: string): Peptide | undefined {
	return compoundsMap.get(slug);
}

export function getAllCompoundSummaries(): PeptideSummary[] {
	return allCompounds.map((p) => {
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
