// src/routes/llms.txt/+server.ts
// Lightweight site index for AI agents (llmstxt.org spec)

import type { RequestHandler } from './$types';
import type { Guide } from '$lib/types';

// Load at build time — no fs needed, works on Cloudflare
const guidePaths = import.meta.glob('/src/guides/*.md', { eager: true });
const peptideFiles = import.meta.glob('/data/peptides/*.json', { eager: true }) as Record<
	string,
	{ default: { id?: string; name?: string; subtitle?: string } }
>;

function getPublishedGuides(): { slug: string; title: string; description: string }[] {
	const guides: { slug: string; title: string; description: string }[] = [];

	for (const path in guidePaths) {
		const file = guidePaths[path];
		const slug = path.split('/').at(-1)?.replace('.md', '');

		if (file && typeof file === 'object' && 'metadata' in file && slug) {
			const metadata = file.metadata as Guide;
			if (metadata.published) {
				guides.push({ slug, title: metadata.title, description: metadata.description });
			}
		}
	}

	return guides.sort((a, b) => a.title.localeCompare(b.title));
}

function getPeptideNames(): { id: string; name: string; subtitle: string }[] {
	const peptides: { id: string; name: string; subtitle: string }[] = [];

	for (const path in peptideFiles) {
		try {
			const data = peptideFiles[path].default || peptideFiles[path];
			const filename = path.split('/').at(-1)?.replace('.json', '') || '';
			const id = ((data as Record<string, unknown>).id as string) || filename;
			const name = ((data as Record<string, unknown>).name as string) || '';
			const subtitle = ((data as Record<string, unknown>).subtitle as string) || '';
			if (name) {
				peptides.push({ id, name, subtitle });
			}
		} catch {
			// skip malformed files
		}
	}

	return peptides.sort((a, b) => a.name.localeCompare(b.name));
}

export const GET: RequestHandler = async () => {
	const guides = getPublishedGuides();
	const peptides = getPeptideNames();

	const guideLinks = guides
		.map((g) => `- [${g.title}](https://peptide-db.com/guides/${g.slug}): ${g.description}`)
		.join('\n');

	const peptideLinks = peptides
		.map(
			(p) =>
				`- [${p.name}](https://peptide-db.com/peptides/${p.id})${p.subtitle ? `: ${p.subtitle}` : ''}`
		)
		.join('\n');

	const content = `# Peptide Database

> Peptide Database is a comprehensive, research-based reference for peptides used in scientific research. It provides molecular data, dosing protocols, interaction profiles, safety information, and interactive tools for over 90 peptides. All information is sourced from published research and clearly distinguishes between human clinical data, animal studies, and anecdotal reports.

## Tools

- [Reconstitution Calculator](https://peptide-db.com/calculator): Calculate peptide reconstitution volumes and syringe doses with visual guides
- [Accumulation Plotter](https://peptide-db.com/calculator/accumulation): Visualise peptide accumulation over time based on half-life and dosing frequency
- [Blend Calculator](https://peptide-db.com/calculator/blend): Calculate doses for multi-peptide blends

## Peptide Categories

- [All Peptides](https://peptide-db.com/peptides): Complete searchable database
- [Healing & Recovery](https://peptide-db.com/peptides?category=healing): BPC-157, TB-500, and tissue repair peptides
- [Growth Hormone](https://peptide-db.com/peptides?category=growth-hormone): GH secretagogues and releasing hormones
- [Weight Loss](https://peptide-db.com/peptides?category=weight-loss): GLP-1 agonists and metabolic peptides
- [Anti-Aging](https://peptide-db.com/peptides?category=anti-aging): Longevity and skin-rejuvenation peptides
- [Immune Support](https://peptide-db.com/peptides?category=immune): Thymic peptides and immune modulators
- [Cognitive](https://peptide-db.com/peptides?category=cognitive): Nootropic and neuroprotective peptides
- [Sexual Health](https://peptide-db.com/peptides?category=sexual-health): PT-141 and related peptides

## Guides

${guideLinks || '- No published guides yet'}

## Peptides

${peptideLinks}

## About

Peptide Database is an educational resource. It does not sell peptides, provide medical advice, or recommend specific protocols. All content is for informational and research purposes.

- [Homepage](https://peptide-db.com)
- [All Guides](https://peptide-db.com/guides)
- [Calculator](https://peptide-db.com/calculator)
`;

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
