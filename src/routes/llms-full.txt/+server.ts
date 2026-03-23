// src/routes/llms-full.txt/+server.ts
// Complete content dump for AI ingestion pipelines

import type { RequestHandler } from './$types';
import type { Guide } from '$lib/types';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function getPublishedGuidesWithContent(): { slug: string; title: string; content: string }[] {
	const guidePaths = import.meta.glob('/src/guides/*.md', { eager: true, query: '?raw', import: 'default' });
	const metaPaths = import.meta.glob('/src/guides/*.md', { eager: true });
	const guides: { slug: string; title: string; content: string }[] = [];

	for (const path in metaPaths) {
		const file = metaPaths[path];
		const slug = path.split('/').at(-1)?.replace('.md', '');

		if (file && typeof file === 'object' && 'metadata' in file && slug) {
			const metadata = file.metadata as Guide;
			if (metadata.published) {
				// Get raw markdown content
				const raw = guidePaths[path] as string || '';
				guides.push({ slug, title: metadata.title, content: raw });
			}
		}
	}

	return guides.sort((a, b) => a.title.localeCompare(b.title));
}

function getPeptideData(): { id: string; name: string; overview: string; mechanism: string; keyBenefits: string[] }[] {
	try {
		const dataDir = join(process.cwd(), 'data', 'peptides');
		const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'));
		return files
			.map((f) => {
				try {
					const data = JSON.parse(readFileSync(join(dataDir, f), 'utf-8'));
					return {
						id: data.id || f.replace('.json', ''),
						name: data.name || '',
						overview: data.overview || '',
						mechanism: data.mechanism || '',
						keyBenefits: data.keyBenefits || []
					};
				} catch {
					return null;
				}
			})
			.filter((p): p is NonNullable<typeof p> => p !== null && !!p.name)
			.sort((a, b) => a.name.localeCompare(b.name));
	} catch {
		return [];
	}
}

export const GET: RequestHandler = async () => {
	const guides = getPublishedGuidesWithContent();
	const peptides = getPeptideData();

	const header = `# Peptide Database — Full Content Archive

> Peptide Database is a comprehensive, research-based reference for peptides used in scientific research. This file contains the complete text of all published guides and summaries of all peptide profiles. All information is sourced from published research.

- Website: https://peptide-db.com
- Calculator: https://peptide-db.com/calculator
- Guides: https://peptide-db.com/guides
- Lightweight index: https://peptide-db.com/llms.txt

Total guides: ${guides.length}
Total peptides: ${peptides.length}

---

`;

	const guidesSection = guides.length > 0
		? `## Guides\n\n${guides.map((g) => `### ${g.title}\n\nURL: https://peptide-db.com/guides/${g.slug}\n\n${g.content}`).join('\n\n---\n\n')}`
		: '## Guides\n\nNo published guides yet.';

	const peptidesSection = `## Peptide Profiles\n\n${peptides.map((p) => {
		let entry = `### ${p.name}\n\nURL: https://peptide-db.com/peptides/${p.id}\n\n`;
		if (p.overview) entry += `${p.overview}\n\n`;
		if (p.mechanism) entry += `**Mechanism:** ${p.mechanism}\n\n`;
		if (p.keyBenefits.length > 0) entry += `**Key Benefits:**\n${p.keyBenefits.map((b) => `- ${b}`).join('\n')}\n`;
		return entry;
	}).join('\n\n---\n\n')}`;

	const footer = `

---

# About Peptide Database

Peptide Database provides research-based information on over 90 peptides, including molecular data, dosing protocols, interaction profiles, and safety information. It features interactive tools including a reconstitution calculator with visual syringe guides, an accumulation plotter for pharmacokinetic modelling, and a blend calculator for multi-peptide preparations.

**Key features:**
- Comprehensive peptide profiles with molecular weights, sequences, half-lives, and bioavailability data
- Cross-referenced interaction profiles between peptides
- Evidence-graded indications distinguishing human clinical data from animal studies and anecdotal reports
- Interactive reconstitution calculator, accumulation plotter, and blend calculator
- In-depth guides with research citations

Peptide Database is an educational resource. It does not sell peptides or provide medical advice.
`;

	const content = header + guidesSection + '\n\n---\n\n' + peptidesSection + footer;

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'X-Markdown-Tokens': String(Math.ceil(content.length / 4)),
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
