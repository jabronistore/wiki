// src/lib/stores/headerStore.ts
import { derived, writable } from 'svelte/store';
import { page } from '$app/stores';

// Store to manage the scrolled state
export const isScrolled = writable<boolean>(false);

// Define page-specific background colors for Peptide Database
const pageBackgrounds: { [key: string]: string } = {
	'/': 'bg-background',
	'/peptides': 'bg-background',
	'/categories': 'bg-background',
	'/disclaimer': 'bg-background',
	'/privacy': 'bg-background'
};

export const headerBgColor = derived([page, isScrolled], ([$page, $isScrolled]) => {
	if ($isScrolled) {
		return 'bg-background';
	}
	const path = $page.url.pathname;

	// Check for peptide detail pages
	if (path.startsWith('/peptides/')) {
		return 'bg-background';
	}

	return pageBackgrounds[path] || 'bg-background';
});
