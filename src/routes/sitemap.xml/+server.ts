import { getAllPeptides } from '$lib/data/peptides';
import { getPopularComparisons } from '$lib/utils/comparison';
import { GOALS } from '$lib/utils/best-for';
import type { Guide } from '$lib/types';

export const prerender = true;

const SITE_URL = 'https://peptide-db.com';

function getGuides(): Guide[] {
	const guides: Guide[] = [];
	const paths = import.meta.glob('/src/guides/*.md', { eager: true });

	for (const path in paths) {
		const file = paths[path];
		const slug = path.split('/').at(-1)?.replace('.md', '');

		if (file && typeof file === 'object' && 'metadata' in file && slug) {
			const metadata = file.metadata as Omit<Guide, 'slug'>;
			const guide = { ...metadata, slug } satisfies Guide;
			guides.push(guide);
		}
	}

	return guides;
}

interface SitemapUrl {
	loc: string;
	priority: string;
	changefreq: string;
	lastmod?: string;
}

export async function GET() {
	const peptides = getAllPeptides();
	const guides = getGuides();

	// Static pages
	const staticPages: SitemapUrl[] = [
		{ loc: '/', priority: '1.0', changefreq: 'weekly' },
		{ loc: '/peptides', priority: '0.9', changefreq: 'weekly' },
		{ loc: '/categories', priority: '0.8', changefreq: 'weekly' },
		{ loc: '/guides', priority: '0.8', changefreq: 'weekly' },
		{ loc: '/calculator', priority: '0.8', changefreq: 'monthly' },
		{ loc: '/calculator/blend', priority: '0.7', changefreq: 'monthly' },
		{ loc: '/calculator/accumulation', priority: '0.7', changefreq: 'monthly' },
		{ loc: '/compare', priority: '0.8', changefreq: 'weekly' },
		{ loc: '/tools/interactions', priority: '0.7', changefreq: 'monthly' },
		{ loc: '/tools/cost', priority: '0.7', changefreq: 'monthly' },
		{ loc: '/get-started', priority: '0.8', changefreq: 'monthly' },
		{ loc: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
		{ loc: '/privacy', priority: '0.3', changefreq: 'yearly' }
	];

	// Peptide pages
	const peptidePages: SitemapUrl[] = peptides.map((p) => ({
		loc: `/peptides/${p.id}`,
		priority: '0.7',
		changefreq: 'monthly'
	}));

	// Guide pages
	const guidePages: SitemapUrl[] = guides
		.filter((g) => g.published)
		.map((g) => ({
			loc: `/guides/${g.slug}`,
			priority: '0.7',
			changefreq: 'monthly',
			lastmod: g.lastUpdated || g.date
		}));

	// Accumulation calculator pages for peptides with half-life data
	const accumulationPages: SitemapUrl[] = peptides
		.filter((p) => p.molecular?.halfLifeSeconds)
		.map((p) => ({
			loc: `/calculator/accumulation?peptide=${p.id}`,
			priority: '0.6',
			changefreq: 'monthly'
		}));

	// Blend calculator pages
	const blendPages: SitemapUrl[] = [
		'klow', 'glow', 'cjc-ipa', 'wolverine', 'tri-heal-max', 'tesa-ipa', 'illumineuro'
	].map((b) => ({ loc: `/calculator/blend?b=${b}`, priority: '0.6', changefreq: 'monthly' }));

	// Comparison pages (popular synergistic/compatible pairs)
	const comparisonPages: SitemapUrl[] = getPopularComparisons(peptides).map((pair) => ({
		loc: `/compare/${pair.comparisonSlug}`,
		priority: '0.6',
		changefreq: 'monthly'
	}));

	// Cost calculator pages for all peptides
	const costPages: SitemapUrl[] = peptides.map((p) => ({
		loc: `/tools/cost?peptide=${p.id}`,
		priority: '0.5',
		changefreq: 'monthly'
	}));

	// Category filter pages
	const categoryPages: SitemapUrl[] = [
		'healing',
		'growth-hormone',
		'weight-loss',
		'cognitive',
		'longevity',
		'skin',
		'immune',
		'sleep',
		'metabolic',
		'sexual-health'
	].map((category) => ({
		loc: `/peptides?category=${category}`,
		priority: '0.7',
		changefreq: 'weekly'
	}));

	// Reconstitution calculator pages for all peptides
	const reconstitutionPages: SitemapUrl[] = peptides.map((p) => ({
		loc: `/calculator?peptide=${p.id}`,
		priority: '0.6',
		changefreq: 'monthly'
	}));

	const today = new Date().toISOString().split('T')[0];

	// Best-for pages
	const bestForPages: SitemapUrl[] = GOALS.map((g) => ({
		loc: `/peptides/best-for/${g.slug}`,
		priority: '0.7',
		changefreq: 'weekly'
	}));

	const urls = [
		...staticPages,
		...peptidePages,
		...guidePages,
		...accumulationPages,
		...blendPages,
		...categoryPages,
		...reconstitutionPages,
		...comparisonPages,
		...costPages,
		...bestForPages
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(url) => `  <url>
    <loc>${SITE_URL}${url.loc}</loc>
    <lastmod>${url.lastmod || today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}
