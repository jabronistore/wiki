import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Check for saved theme preference or default to system preference
function getInitialTheme(): 'light' | 'dark' {
	if (!browser) return 'light';

	const savedTheme = localStorage.getItem('theme');
	if (savedTheme) return savedTheme as 'light' | 'dark';

	// Check system preference
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialTheme = getInitialTheme();

export const theme = writable<'light' | 'dark'>(initialTheme as 'light' | 'dark');

export function toggleTheme() {
	theme.update((currentTheme) => {
		const newTheme = currentTheme === 'light' ? 'dark' : 'light';

		if (browser) {
			localStorage.setItem('theme', newTheme);
			// Apply theme class to document
			document.documentElement.classList.remove('light', 'dark');
			document.documentElement.classList.add(newTheme);
		}

		return newTheme;
	});
}

// Initialize theme on page load
if (browser) {
	theme.subscribe((value) => {
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add(value);
	});
}
