import { writable } from 'svelte/store';

export interface SearchResult {
	title: string;
	url: string;
	content: string;
	section: string;
	type: 'page' | 'heading' | 'peptide' | 'category';
	relevance: number;
}

export const searchQuery = writable('');
export const searchResults = writable<SearchResult[]>([]);
export const isSearchOpen = writable(false);

// Cache for peptide data
let peptidesCache: SearchResult[] = [];
let cacheLoaded = false;

async function loadPeptidesData() {
	if (cacheLoaded) return;

	try {
		const response = await fetch('/api/peptides');
		if (response.ok) {
			const peptides = await response.json();
			peptidesCache = peptides.map((p: any) => ({
				title: p.name,
				url: `/peptides/${p.id}`,
				content: p.subtitle || p.overview || '',
				section: p.category,
				type: 'peptide' as const,
				relevance: 0
			}));
		}
		cacheLoaded = true;
	} catch (error) {
		console.error('Failed to load peptides for search:', error);
	}
}

// Static search index for main pages
const staticSearchIndex: SearchResult[] = [
	{
		title: 'Browse Peptides',
		url: '/peptides',
		content:
			'Browse our comprehensive database of peptides with detailed research information, dosing protocols, and scientific references.',
		section: 'Main',
		type: 'page',
		relevance: 0
	},
	{
		title: 'Categories',
		url: '/categories',
		content:
			'Explore peptides by category: healing, growth hormone, weight loss, cognitive, longevity, skin & hair, immune, sleep, metabolic, sexual health.',
		section: 'Main',
		type: 'page',
		relevance: 0
	},
	{
		title: 'Healing & Recovery',
		url: '/categories#healing',
		content: 'Peptides for tissue repair, wound healing, and recovery from injuries.',
		section: 'Categories',
		type: 'category',
		relevance: 0
	},
	{
		title: 'Growth Hormone',
		url: '/categories#growth-hormone',
		content: 'Growth hormone releasing peptides and secretagogues.',
		section: 'Categories',
		type: 'category',
		relevance: 0
	},
	{
		title: 'Weight Loss',
		url: '/categories#weight-loss',
		content: 'Peptides for metabolic support and weight management.',
		section: 'Categories',
		type: 'category',
		relevance: 0
	}
];

export async function performSearch(query: string): Promise<SearchResult[]> {
	if (!query.trim()) {
		return [];
	}

	// Ensure peptides are loaded
	await loadPeptidesData();

	const searchTerms = query
		.toLowerCase()
		.split(' ')
		.filter((term) => term.length > 1);

	// Combine static and dynamic indices
	const searchIndex = [...staticSearchIndex, ...peptidesCache];

	const results = searchIndex
		.map((item) => {
			let relevance = 0;
			const searchText = (item.title + ' ' + item.content + ' ' + item.section).toLowerCase();

			searchTerms.forEach((term) => {
				// Exact title match gets highest score
				if (item.title.toLowerCase() === term) {
					relevance += 50;
				} else if (item.title.toLowerCase().includes(term)) {
					relevance += 20;
				}

				// Content matches
				if (item.content.toLowerCase().includes(term)) {
					relevance += 5;
				}

				// Section matches
				if (item.section.toLowerCase().includes(term)) {
					relevance += 3;
				}
			});

			// Boost exact query matches
			if (searchText.includes(query.toLowerCase())) {
				relevance += 30;
			}

			// Type-based boosts
			switch (item.type) {
				case 'page':
					relevance += 5;
					break;
				case 'peptide':
					relevance += 10;
					break;
				case 'category':
					relevance += 3;
					break;
			}

			return { ...item, relevance };
		})
		.filter((item) => item.relevance > 0)
		.sort((a, b) => b.relevance - a.relevance)
		.slice(0, 15);

	return results;
}
