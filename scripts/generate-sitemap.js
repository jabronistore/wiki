#!/usr/bin/env node

/**
 * Sitemap Generator for Peptide Database
 * Generates sitemap.xml from static routes and peptide JSON files
 */

import { readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const SITE_URL = 'https://peptide-db.com';

// Static routes with their priorities and change frequencies
const staticRoutes = [
	{ path: '/', priority: 1.0, changefreq: 'weekly' },
	{ path: '/peptides', priority: 0.9, changefreq: 'weekly' },
	{ path: '/categories', priority: 0.8, changefreq: 'weekly' },
	{ path: '/guides', priority: 0.8, changefreq: 'weekly' },
	{ path: '/calculator', priority: 0.8, changefreq: 'monthly' },
	{ path: '/calculator/blend', priority: 0.7, changefreq: 'monthly' },
	{ path: '/calculator/accumulation', priority: 0.7, changefreq: 'monthly' },
	{ path: '/disclaimer', priority: 0.3, changefreq: 'yearly' },
	{ path: '/privacy', priority: 0.3, changefreq: 'yearly' }
];

function getPeptideSlugs() {
	const peptidesDir = join(rootDir, 'data', 'peptides');
	const files = readdirSync(peptidesDir);
	return files.filter((file) => file.endsWith('.json')).map((file) => file.replace('.json', ''));
}

function getGuideSlugs() {
	const guidesDir = join(rootDir, 'src', 'guides');
	try {
		const files = readdirSync(guidesDir);
		return files.filter((file) => file.endsWith('.md')).map((file) => file.replace('.md', ''));
	} catch {
		return [];
	}
}

function generateSitemap() {
	const today = new Date().toISOString().split('T')[0];
	const peptideSlugs = getPeptideSlugs();
	const guideSlugs = getGuideSlugs();

	let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

	// Add static routes
	for (const route of staticRoutes) {
		xml += `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
	}

	// Add peptide pages
	for (const slug of peptideSlugs) {
		xml += `  <url>
    <loc>${SITE_URL}/peptides/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
	}

	// Add guide pages
	for (const slug of guideSlugs) {
		xml += `  <url>
    <loc>${SITE_URL}/guides/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
	}

	xml += '</urlset>\n';

	return xml;
}

function main() {
	const sitemap = generateSitemap();
	const outputPath = join(rootDir, 'static', 'sitemap.xml');

	writeFileSync(outputPath, sitemap);

	const peptideCount = getPeptideSlugs().length;
	const guideCount = getGuideSlugs().length;
	const totalUrls = staticRoutes.length + peptideCount + guideCount;

	console.log(`Sitemap generated successfully!`);
	console.log(`  - Static routes: ${staticRoutes.length}`);
	console.log(`  - Peptide pages: ${peptideCount}`);
	console.log(`  - Guide pages: ${guideCount}`);
	console.log(`  - Total URLs: ${totalUrls}`);
	console.log(`  - Output: ${outputPath}`);
}

main();
