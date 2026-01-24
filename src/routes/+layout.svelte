<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto, beforeNavigate, afterNavigate, onNavigate } from '$app/navigation';
	import { Moon, Sun, Menu, X, Search, FlaskConical, ArrowRight, Calculator, Github } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import type { PeptideSummary } from '$lib/types';
	import type { Profile } from '$lib/types/community';
	import type { User } from '@supabase/supabase-js';
	import Seo from 'sk-seo';
	import UserMenu from '$lib/components/community/UserMenu.svelte';

	let { children, data }: { children: Snippet; data: { peptides?: PeptideSummary[]; user?: User | null; profile?: Profile | null } } = $props();

	// Scroll position restoration using sessionStorage for persistence
	const SCROLL_KEY = 'peptide-scroll-positions';

	function getScrollPositions(): Record<string, number> {
		try {
			return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}');
		} catch {
			return {};
		}
	}

	function saveScrollPosition(key: string, position: number) {
		const positions = getScrollPositions();
		positions[key] = position;
		sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions));
	}

	function getScrollPosition(key: string): number | undefined {
		return getScrollPositions()[key];
	}

	beforeNavigate(({ from, willUnload }) => {
		if (willUnload) return;
		if (from?.url) {
			const key = from.url.pathname + from.url.search;
			// Save current scroll position
			const scrollY = window.scrollY;
			if (scrollY > 0) {
				saveScrollPosition(key, scrollY);
			}
		}
	});

	// Track if this is a back/forward navigation
	let isPopstateNavigation = false;

	afterNavigate(({ to, type, from }) => {
		if (!to?.url) return;

		const key = to.url.pathname + to.url.search;
		const savedPosition = getScrollPosition(key);

		// Restore scroll on back/forward navigation (popstate)
		// Also restore when navigating back to a list page from a detail page
		const isBackNavigation = type === 'popstate';
		const isReturningToList =
			to.url.pathname === '/peptides' && from?.url?.pathname.startsWith('/peptides/');

		if ((isBackNavigation || isReturningToList) && savedPosition && savedPosition > 0) {
			// Disable smooth scroll temporarily
			const html = document.documentElement;
			const originalScrollBehavior = html.style.scrollBehavior;
			html.style.scrollBehavior = 'auto';

			// Restore immediately since we skip view transitions on back nav
			window.scrollTo(0, savedPosition);

			requestAnimationFrame(() => {
				html.style.scrollBehavior = originalScrollBehavior;
			});
		}

		isPopstateNavigation = false;
	});

	// View Transitions API for smooth page transitions
	onNavigate((navigation) => {
		// Skip if View Transitions not supported
		if (!document.startViewTransition) return;

		// Check if this is a back/forward navigation - skip transition for instant scroll restore
		isPopstateNavigation = navigation.type === 'popstate';
		if (isPopstateNavigation) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// Site-wide SEO defaults
	const siteName = 'Peptide Database';
	const siteUrl = 'https://peptide-db.com';
	const defaultDescription =
		'Comprehensive peptide research database with dosing protocols, molecular information, and scientific references. Educational resource for peptide research.';
	const defaultKeywords =
		'peptides, peptide research, BPC-157, semaglutide, tirzepatide, peptide dosing, reconstitution, bioregulators';

	let darkMode = $state(false);
	let mobileMenuOpen = $state(false);
	let searchOpen = $state(false);
	let searchQuery = $state('');
	let searchInputRef = $state<HTMLInputElement | null>(null);

	const filteredPeptides = $derived(() => {
		if (!searchQuery || !data.peptides) return [];
		const query = searchQuery.toLowerCase();
		return data.peptides
			.filter(
				(p) =>
					p.name.toLowerCase().includes(query) ||
					(p.subtitle && p.subtitle.toLowerCase().includes(query)) ||
					(p.categories && p.categories.some((c) => c.toLowerCase().includes(query)))
			)
			.slice(0, 8);
	});

	onMount(() => {
		// Check for saved preference or system preference
		const saved = localStorage.getItem('theme');
		if (saved) {
			darkMode = saved === 'dark';
		} else {
			darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		updateTheme();

		// Handle keyboard shortcut for search
		const handleKeydown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				openSearch();
			}
			if (e.key === 'Escape' && searchOpen) {
				closeSearch();
			}
		};
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	function updateTheme() {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	}

	function toggleTheme() {
		darkMode = !darkMode;
		updateTheme();
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function openSearch() {
		searchOpen = true;
		searchQuery = '';
		setTimeout(() => searchInputRef?.focus(), 50);
	}

	function closeSearch() {
		searchOpen = false;
		searchQuery = '';
	}

	function selectPeptide(id: string) {
		closeSearch();
		goto(`/peptides/${id}`);
	}
</script>

<Seo
	description={defaultDescription}
	keywords={defaultKeywords}
	{siteName}
	canonical={siteUrl}
	author="Peptide Database"
	openGraph={true}
	twitter={true}
/>

<svelte:head>
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Search Modal -->
	{#if searchOpen}
		<div class="search-modal fixed inset-0 z-[100]">
			<!-- Backdrop -->
			<button class="search-backdrop" onclick={closeSearch} aria-label="Close search"></button>

			<!-- Modal -->
			<div class="search-container">
				<div class="search-panel">
					<!-- Search input -->
					<div class="search-input-wrapper">
						<div class="search-icon">
							<Search class="h-5 w-5" />
						</div>
						<input
							bind:this={searchInputRef}
							bind:value={searchQuery}
							type="text"
							placeholder="Search peptides..."
							class="search-input"
						/>
						<kbd class="search-kbd">ESC</kbd>
					</div>

					<!-- Results -->
					<div class="search-results">
						{#if searchQuery && filteredPeptides().length === 0}
							<div class="search-empty">
								<div class="search-empty-icon">
									<Search class="h-6 w-6" />
								</div>
								<p class="search-empty-title">No peptides found</p>
								<p class="search-empty-hint">Try a different search term</p>
							</div>
						{:else if filteredPeptides().length > 0}
							<div class="search-results-header">
								<span class="search-results-count"
									>{filteredPeptides().length} result{filteredPeptides().length !== 1
										? 's'
										: ''}</span
								>
							</div>
							<ul class="search-results-list">
								{#each filteredPeptides() as peptide, i}
									<li style="--delay: {i * 30}ms">
										<button onclick={() => selectPeptide(peptide.id)} class="search-result-item">
											<div class="search-result-content">
												<span class="search-result-name">{peptide.name}</span>
												{#if peptide.subtitle}
													<span class="search-result-subtitle">{peptide.subtitle}</span>
												{/if}
											</div>
											<ArrowRight class="search-result-arrow" />
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<div class="search-placeholder">
								<p class="search-placeholder-text">Search the peptide database</p>
								<div class="search-suggestions">
									<span class="search-suggestion-label">Popular:</span>
									<button onclick={() => (searchQuery = 'BPC-157')} class="search-suggestion"
										>BPC-157</button
									>
									<button onclick={() => (searchQuery = 'Semaglutide')} class="search-suggestion"
										>Semaglutide</button
									>
									<button onclick={() => (searchQuery = 'TB-500')} class="search-suggestion"
										>TB-500</button
									>
								</div>
							</div>
						{/if}
					</div>

					<!-- Footer -->
					<div class="search-footer">
						<div class="search-footer-hint">
							<kbd>↑</kbd><kbd>↓</kbd> to navigate
						</div>
						<div class="search-footer-hint">
							<kbd>↵</kbd> to select
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Navigation -->
	<header class="glass-strong sticky top-0 z-50">
		<nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<!-- Logo -->
				<a href="/" class="group flex items-center gap-3">
					<img
						src="/pep-logo.webp"
						alt="Peptide Database"
						class="h-10 w-10 rounded-xl transition-transform group-hover:scale-105"
					/>
					<div class="flex flex-col">
						<span class="text-lg font-bold tracking-tight">Peptide Database</span>
						<span class="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:block"
							>Open Source Research Wiki</span
						>
					</div>
				</a>

				<!-- Desktop Navigation -->
				<div class="hidden items-center gap-1 md:flex">
					<a
						href="/"
						class="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Home
					</a>
					<a
						href="/peptides"
						class="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Browse Peptides
					</a>
					<a
						href="/categories"
						class="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Categories
					</a>
					<a
						href="/guides"
						class="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Guides
					</a>
					<a
						href="/calculator"
						class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<Calculator class="h-4 w-4" />
						Calculators
					</a>
				</div>

				<!-- Right side actions -->
				<div class="flex items-center gap-2">
					<!-- Search button -->
					<button
						onclick={openSearch}
						class="flex h-9 items-center gap-2 rounded-lg px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Search"
					>
						<Search class="h-5 w-5" />
						<span class="hidden text-sm sm:inline">Search</span>
						<kbd
							class="hidden items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex"
						>
							⌘K
						</kbd>
					</button>

					<!-- GitHub -->
					<a
						href="https://github.com/jabronistore/wiki"
						target="_blank"
						rel="noopener noreferrer"
						class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="View on GitHub"
					>
						<Github class="h-5 w-5" />
					</a>

					<!-- Theme toggle -->
					<button
						onclick={toggleTheme}
						class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Toggle theme"
					>
						{#if darkMode}
							<Sun class="h-5 w-5" />
						{:else}
							<Moon class="h-5 w-5" />
						{/if}
					</button>

					<!-- User menu -->
					<div class="hidden md:block">
						<UserMenu user={data.user ?? null} profile={data.profile ?? null} />
					</div>

					<!-- Mobile menu button -->
					<button
						onclick={toggleMobileMenu}
						class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
						aria-label="Toggle menu"
					>
						{#if mobileMenuOpen}
							<X class="h-5 w-5" />
						{:else}
							<Menu class="h-5 w-5" />
						{/if}
					</button>
				</div>
			</div>

			<!-- Mobile menu -->
			{#if mobileMenuOpen}
				<div class="animate-fade-in border-t border-border py-4 md:hidden">
					<div class="flex flex-col gap-1">
						<a
							href="/"
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							Home
						</a>
						<a
							href="/peptides"
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							Browse Peptides
						</a>
						<a
							href="/categories"
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							Categories
						</a>
						<a
							href="/guides"
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							Guides
						</a>
						<a
							href="/calculator"
							onclick={() => (mobileMenuOpen = false)}
							class="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<Calculator class="h-4 w-4" />
							Calculators
						</a>
					</div>
				</div>
			{/if}
		</nav>
	</header>

	<!-- Main content -->
	<main>
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="mt-20 border-t border-border bg-muted/30">
		<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div class="grid grid-cols-2 gap-8 md:grid-cols-5">
				<div class="col-span-1 md:col-span-2">
					<div class="mb-4 flex items-center gap-3">
						<img src="/pep-logo.webp" alt="Peptide Database" class="h-10 w-10 rounded-xl" />
						<span class="text-lg font-bold">Peptide Database</span>
					</div>
					<p class="max-w-md text-sm text-muted-foreground">
						A comprehensive research database for peptides, therapies, and protocols. Information
						provided for educational purposes only.
					</p>
				</div>
				<div>
					<h4 class="mb-4 font-semibold">Quick Links</h4>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li>
							<a href="/peptides" class="transition-colors hover:text-foreground">Browse Peptides</a
							>
						</li>
						<li>
							<a href="/categories" class="transition-colors hover:text-foreground">Categories</a>
						</li>
						<li>
							<a href="/guides" class="transition-colors hover:text-foreground">Guides</a>
						</li>
						<li>
							<a href="/calculator" class="transition-colors hover:text-foreground">Calculators</a>
						</li>
					</ul>
				</div>
				<div>
					<h4 class="mb-4 font-semibold">Legal</h4>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li>
							<a href="/disclaimer" class="transition-colors hover:text-foreground">Disclaimer</a>
						</li>
						<li>
							<a href="/privacy" class="transition-colors hover:text-foreground">Privacy Policy</a>
						</li>
					</ul>
				</div>
				<div>
					<h4 class="mb-4 font-semibold">Open Source</h4>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li>
							<a
								href="https://github.com/jabronistore/wiki"
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
							>
								<Github class="h-4 w-4" />
								GitHub
							</a>
						</li>
						<li>
							<a
								href="https://github.com/jabronistore/wiki/blob/main/LICENSE"
								target="_blank"
								rel="noopener noreferrer"
								class="transition-colors hover:text-foreground"
							>
								MIT License
							</a>
						</li>
						<li>
							<a
								href="https://github.com/jabronistore/wiki/issues"
								target="_blank"
								rel="noopener noreferrer"
								class="transition-colors hover:text-foreground"
							>
								Report an Issue
							</a>
						</li>
					</ul>
				</div>
			</div>
			<div class="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
				<p>
					&copy; {new Date().getFullYear()} Peptide Database. For educational and research purposes only.
				</p>
			</div>
		</div>
	</footer>
</div>
