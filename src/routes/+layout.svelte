<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto, beforeNavigate, afterNavigate, onNavigate } from '$app/navigation';
	import {
		Moon,
		Sun,
		Menu,
		X,
		Search,
		FlaskConical,
		ArrowRight,
		Calculator,
		Github,
		ChevronDown,
		ArrowLeftRight,
		Zap,
		DollarSign
	} from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import type { PeptideSummary } from '$lib/types';
	import type { Profile } from '$lib/types/community';
	import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
	import Seo from 'sk-seo';
	import UserMenu from '$lib/components/community/UserMenu.svelte';

	let {
		children,
		data
	}: {
		children: Snippet;
		data: {
			peptides?: PeptideSummary[];
			compounds?: PeptideSummary[];
			user?: User | null;
			profile?: Profile | null;
			session?: Session | null;
			supabase?: SupabaseClient | null;
		};
	} = $props();

	// Use client-side session user, falling back to server-side user
	let currentUser = $derived(data.session?.user ?? data.user ?? null);
	let currentProfile = $state<Profile | null>(data.profile ?? null);

	// Fetch profile client-side if we have session user but no profile (happens on prerendered pages)
	$effect(() => {
		if (currentUser && !currentProfile && data.supabase) {
			data.supabase
				.from('profiles')
				.select('*')
				.eq('id', currentUser.id)
				.single()
				.then(({ data: profileData }) => {
					if (profileData) {
						currentProfile = profileData as Profile;
					}
				});
		}
	});

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
	let toolsOpen = $state(false);
	let browseOpen = $state(false);
	let searchOpen = $state(false);
	let searchQuery = $state('');
	let searchInputRef = $state<HTMLInputElement | null>(null);

	// Search results: peptides + guides + tools
	interface SearchResult {
		id: string;
		name: string;
		subtitle?: string;
		type: 'peptide' | 'compound' | 'guide' | 'tool';
		href: string;
	}

	const tools: SearchResult[] = [
		{
			id: 'calc',
			name: 'Reconstitution Calculator',
			subtitle: 'Dose volumes and syringe guide',
			type: 'tool',
			href: '/calculator'
		},
		{
			id: 'blend',
			name: 'Blend Calculator',
			subtitle: 'Multi-peptide blend dosing',
			type: 'tool',
			href: '/calculator/blend'
		},
		{
			id: 'accum',
			name: 'Accumulation Plotter',
			subtitle: 'PK curves over time',
			type: 'tool',
			href: '/calculator/accumulation'
		},
		{
			id: 'cost',
			name: 'Cost Calculator',
			subtitle: 'Price per dose and cycle',
			type: 'tool',
			href: '/tools/cost'
		},
		{
			id: 'compare',
			name: 'Compare Peptides',
			subtitle: 'Side-by-side data',
			type: 'tool',
			href: '/compare'
		},
		{
			id: 'interactions',
			name: 'Interaction Checker',
			subtitle: 'Stack compatibility',
			type: 'tool',
			href: '/tools/interactions'
		},
		{
			id: 'bestfor',
			name: 'Best Compounds For...',
			subtitle: 'Rankings by goal',
			type: 'tool',
			href: '/best-for'
		}
	];

	const searchResults = $derived(() => {
		if (!searchQuery) return [];
		const query = searchQuery.toLowerCase();
		const results: SearchResult[] = [];

		// Search peptides (name, subtitle, categories, indications, mechanism, aliases)
		if (data.peptides) {
			for (const p of data.peptides) {
				if (
					p.name.toLowerCase().includes(query) ||
					(p.subtitle && p.subtitle.toLowerCase().includes(query)) ||
					(p.categories && p.categories.some((c) => c.toLowerCase().includes(query))) ||
					(p.searchText && p.searchText.includes(query))
				) {
					results.push({
						id: p.id,
						name: p.name,
						subtitle: p.subtitle,
						type: 'peptide',
						href: `/peptides/${p.id}`
					});
				}
				if (results.length >= 12) break;
			}
		}

		// Search compounds
		if (data.compounds) {
			for (const c of data.compounds) {
				if (
					c.name.toLowerCase().includes(query) ||
					(c.subtitle && c.subtitle.toLowerCase().includes(query)) ||
					(c.categories && c.categories.some((cat: string) => cat.toLowerCase().includes(query))) ||
					(c.searchText && c.searchText.includes(query))
				) {
					results.push({
						id: c.id,
						name: c.name,
						subtitle: c.subtitle,
						type: 'compound',
						href: `/compounds/${c.id}`
					});
				}
				if (results.length >= 15) break;
			}
		}

		// Search tools
		for (const t of tools) {
			if (
				t.name.toLowerCase().includes(query) ||
				(t.subtitle && t.subtitle.toLowerCase().includes(query))
			) {
				results.push(t);
			}
		}

		return results.slice(0, 10);
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

	function selectResult(href: string) {
		closeSearch();
		goto(href);
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
						{#if searchQuery && searchResults().length === 0}
							<div class="search-empty">
								<div class="search-empty-icon">
									<Search class="h-6 w-6" />
								</div>
								<p class="search-empty-title">No results found</p>
								<p class="search-empty-hint">
									Try searching for a peptide name, condition, or tool
								</p>
							</div>
						{:else if searchResults().length > 0}
							<div class="search-results-header">
								<span class="search-results-count"
									>{searchResults().length} result{searchResults().length !== 1 ? 's' : ''}</span
								>
							</div>
							<ul class="search-results-list">
								{#each searchResults() as result, i}
									<li style="--delay: {i * 30}ms">
										<a href={result.href} onclick={closeSearch} class="search-result-item">
											<div class="search-result-content">
												<span class="search-result-name">{result.name}</span>
												{#if result.subtitle}
													<span class="search-result-subtitle">{result.subtitle}</span>
												{/if}
											</div>
											<span class="search-result-type">{result.type}</span>
										</a>
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
	<header class="nav-header sticky top-0 z-50">
		<nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<!-- Logo -->
				<a href="/" class="group flex items-center gap-2.5">
					<img
						src="/pep-logo.webp"
						alt="Peptide Database"
						class="h-9 w-9 rounded-xl transition-transform group-hover:scale-105"
					/>
					<div class="flex flex-col">
						<span class="nav-wordmark">Peptide DB</span>
						<span class="nav-tagline hidden sm:block">Research Wiki</span>
					</div>
				</a>

				<!-- Desktop Navigation -->
				<div class="hidden items-center md:flex">
					<div class="nav-links">
						<a href="/" class="nav-link">Home</a>
						<div class="nav-sep"></div>
						<div class="relative">
							<button
								onclick={() => (browseOpen = !browseOpen)}
								onblur={() => setTimeout(() => (browseOpen = false), 150)}
								class="nav-link nav-link-btn"
							>
								Browse
								<ChevronDown class="nav-chevron {browseOpen ? 'nav-chevron-open' : ''}" />
							</button>
							{#if browseOpen}
								<div class="nav-dropdown">
									<a
										href="/peptides"
										class="nav-dropdown-item"
										onclick={() => (browseOpen = false)}
									>
										<span class="nav-dropdown-name">Peptides</span>
										<span class="nav-dropdown-desc">Research peptides database</span>
									</a>
									<a
										href="/compounds"
										class="nav-dropdown-item"
										onclick={() => (browseOpen = false)}
									>
										<span class="nav-dropdown-name">Compounds</span>
										<span class="nav-dropdown-desc">Anabolics, SARMs, PCT & more</span>
									</a>
									<div class="nav-dropdown-rule"></div>
									<a
										href="/categories"
										class="nav-dropdown-item"
										onclick={() => (browseOpen = false)}
									>
										<span class="nav-dropdown-name">All Categories</span>
									</a>
								</div>
							{/if}
						</div>
						<a href="/best-for" class="nav-link">Best For</a>
						<a href="/guides" class="nav-link">Guides</a>
						<div class="nav-sep"></div>
						<div class="relative">
							<button
								onclick={() => (toolsOpen = !toolsOpen)}
								onblur={() => setTimeout(() => (toolsOpen = false), 150)}
								class="nav-link nav-link-btn"
							>
								Tools
								<ChevronDown class="nav-chevron {toolsOpen ? 'nav-chevron-open' : ''}" />
							</button>
							{#if toolsOpen}
								<div class="nav-dropdown nav-dropdown-wide">
									<div class="nav-dropdown-group">
										<span class="nav-dropdown-label">Calculators</span>
										<a
											href="/calculator"
											class="nav-dropdown-tool"
											onclick={() => (toolsOpen = false)}
										>
											<Calculator class="h-4 w-4" />
											<div>
												<span class="nav-tool-name">Reconstitution</span><span class="nav-tool-desc"
													>Dose volumes and syringe guide</span
												>
											</div>
										</a>
										<a
											href="/calculator/blend"
											class="nav-dropdown-tool"
											onclick={() => (toolsOpen = false)}
										>
											<FlaskConical class="h-4 w-4" />
											<div>
												<span class="nav-tool-name">Blend Calculator</span><span
													class="nav-tool-desc">Multi-peptide blend dosing</span
												>
											</div>
										</a>
										<a
											href="/calculator/accumulation"
											class="nav-dropdown-tool"
											onclick={() => (toolsOpen = false)}
										>
											<ArrowRight class="h-4 w-4" />
											<div>
												<span class="nav-tool-name">Accumulation Plotter</span><span
													class="nav-tool-desc">PK curves over time</span
												>
											</div>
										</a>
										<a
											href="/tools/cost"
											class="nav-dropdown-tool"
											onclick={() => (toolsOpen = false)}
										>
											<DollarSign class="h-4 w-4" />
											<div>
												<span class="nav-tool-name">Cost Calculator</span><span
													class="nav-tool-desc">Price per dose and cycle</span
												>
											</div>
										</a>
									</div>
									<div class="nav-dropdown-group">
										<span class="nav-dropdown-label">Research</span>
										<a
											href="/compare"
											class="nav-dropdown-tool"
											onclick={() => (toolsOpen = false)}
										>
											<ArrowLeftRight class="h-4 w-4" />
											<div>
												<span class="nav-tool-name">Compare Peptides</span><span
													class="nav-tool-desc">Side-by-side data</span
												>
											</div>
										</a>
										<a
											href="/tools/interactions"
											class="nav-dropdown-tool"
											onclick={() => (toolsOpen = false)}
										>
											<Zap class="h-4 w-4" />
											<div>
												<span class="nav-tool-name">Interaction Checker</span><span
													class="nav-tool-desc">Stack compatibility</span
												>
											</div>
										</a>
									</div>
									<div class="nav-dropdown-group">
										<span class="nav-dropdown-label">Discover</span>
										<a
											href="/best-for"
											class="nav-dropdown-tool"
											onclick={() => (toolsOpen = false)}
										>
											<FlaskConical class="h-4 w-4" />
											<div>
												<span class="nav-tool-name">Best Compounds For...</span><span
													class="nav-tool-desc">Rankings by goal</span
												>
											</div>
										</a>
										<a
											href="/tools/ask"
											class="nav-dropdown-tool"
											onclick={() => (toolsOpen = false)}
										>
											<Search class="h-4 w-4" />
											<div>
												<span class="nav-tool-name">Ask AI</span><span class="nav-tool-desc"
													>Chat with our peptide database</span
												>
											</div>
										</a>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right side actions -->
				<div class="flex items-center gap-1">
					<!-- Search button -->
					<button onclick={openSearch} class="nav-search-trigger" aria-label="Search">
						<Search class="h-4 w-4" />
						<span class="nav-search-text">Search</span>
						<kbd class="nav-kbd nav-search-kbd">⌘K</kbd>
					</button>

					<!-- GitHub -->
					<a
						href="https://github.com/jabronistore/wiki"
						target="_blank"
						rel="noopener noreferrer"
						class="nav-action-icon hidden md:flex"
						aria-label="View on GitHub"
					>
						<Github class="h-4 w-4" />
					</a>

					<!-- Theme toggle -->
					<button onclick={toggleTheme} class="nav-action-icon" aria-label="Toggle theme">
						{#if darkMode}
							<Sun class="h-5 w-5" />
						{:else}
							<Moon class="h-5 w-5" />
						{/if}
					</button>

					<!-- User menu -->
					<div class="hidden md:block">
						<UserMenu user={currentUser} profile={currentProfile} />
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
							Peptides
						</a>
						<a
							href="/compounds"
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							Compounds
						</a>
						<a
							href="/best-for"
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							Best For
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
						<div class="mobile-tools-label">Tools</div>
						<a href="/calculator" onclick={() => (mobileMenuOpen = false)} class="mobile-tool-link">
							<Calculator class="h-4 w-4" /> Reconstitution Calculator
						</a>
						<a
							href="/calculator/blend"
							onclick={() => (mobileMenuOpen = false)}
							class="mobile-tool-link"
						>
							<FlaskConical class="h-4 w-4" /> Blend Calculator
						</a>
						<a
							href="/calculator/accumulation"
							onclick={() => (mobileMenuOpen = false)}
							class="mobile-tool-link"
						>
							<ArrowRight class="h-4 w-4" /> Accumulation Plotter
						</a>
						<a href="/tools/cost" onclick={() => (mobileMenuOpen = false)} class="mobile-tool-link">
							<DollarSign class="h-4 w-4" /> Cost Calculator
						</a>
						<a href="/compare" onclick={() => (mobileMenuOpen = false)} class="mobile-tool-link">
							<ArrowLeftRight class="h-4 w-4" /> Compare Peptides
						</a>
						<a
							href="/tools/interactions"
							onclick={() => (mobileMenuOpen = false)}
							class="mobile-tool-link"
						>
							<Zap class="h-4 w-4" /> Interaction Checker
						</a>
						<a href="/best-for" onclick={() => (mobileMenuOpen = false)} class="mobile-tool-link">
							<FlaskConical class="h-4 w-4" /> Best Compounds For...
						</a>
						<a href="/tools/ask" onclick={() => (mobileMenuOpen = false)} class="mobile-tool-link">
							<Search class="h-4 w-4" /> Ask AI
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
							<a href="/compounds" class="transition-colors hover:text-foreground"
								>Browse Compounds</a
							>
						</li>
						<li>
							<a href="/best-for" class="transition-colors hover:text-foreground">Best For...</a>
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
						<li>
							<a href="/compare" class="transition-colors hover:text-foreground">Compare</a>
						</li>
						<li>
							<a href="/tools/interactions" class="transition-colors hover:text-foreground"
								>Interactions</a
							>
						</li>
						<li>
							<a href="/tools/cost" class="transition-colors hover:text-foreground"
								>Cost Calculator</a
							>
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

<style>
	/* ============================================
	   NAVIGATION — editorial masthead
	   ============================================ */

	.nav-header {
		background: hsl(var(--background) / 0.92);
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid hsl(var(--border) / 0.6);
	}

	.nav-wordmark {
		font-family: var(--font-serif);
		font-size: 1.0625rem;
		font-weight: 400;
		letter-spacing: -0.01em;
		color: hsl(var(--foreground));
		line-height: 1.2;
	}

	.nav-tagline {
		font-family: var(--font-sans);
		font-size: 0.5625rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: hsl(var(--muted-foreground));
	}

	/* Nav link row */
	.nav-links {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.nav-link {
		font-family: var(--font-sans);
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		padding: 0.375rem 0.75rem;
		transition: color 0.15s;
		white-space: nowrap;
	}

	.nav-link:hover {
		color: hsl(var(--foreground));
	}

	.nav-link-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
	}

	:global(.nav-chevron) {
		width: 0.625rem;
		height: 0.625rem;
		opacity: 0.5;
		transition:
			transform 0.2s,
			opacity 0.2s;
	}

	:global(.nav-chevron-open) {
		transform: rotate(180deg);
		opacity: 0.8;
	}

	/* Separator dot between nav groups */
	.nav-sep {
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: hsl(var(--muted-foreground) / 0.4);
		margin: 0 0.25rem;
		flex-shrink: 0;
	}

	/* Shared dropdown base */
	.nav-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		width: 13rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-top: 2px solid hsl(var(--accent));
		box-shadow:
			0 4px 24px hsl(var(--foreground) / 0.06),
			0 1px 4px hsl(var(--foreground) / 0.04);
		padding: 0.375rem;
		z-index: 50;
	}

	.nav-dropdown-wide {
		width: 15rem;
		right: 0;
		left: auto;
		transform: none;
	}

	/* Browse dropdown items */
	.nav-dropdown-item {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		padding: 0.5rem 0.625rem;
		text-decoration: none;
		color: inherit;
		transition: background 0.1s;
	}

	.nav-dropdown-item:hover {
		background: hsl(var(--muted) / 0.6);
	}

	.nav-dropdown-name {
		font-family: var(--font-sans);
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.nav-dropdown-desc {
		font-family: var(--font-sans);
		font-size: 0.625rem;
		color: hsl(var(--muted-foreground));
		letter-spacing: 0.01em;
	}

	.nav-dropdown-rule {
		height: 1px;
		background: hsl(var(--border) / 0.5);
		margin: 0.25rem 0.625rem;
	}

	/* Tools dropdown groups */
	.nav-dropdown-group {
		padding: 0.25rem 0;
	}

	.nav-dropdown-group + .nav-dropdown-group {
		border-top: 1px solid hsl(var(--border) / 0.4);
		margin-top: 0.25rem;
		padding-top: 0.375rem;
	}

	.nav-dropdown-label {
		display: block;
		font-size: 0.5625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: hsl(var(--accent));
		padding: 0.25rem 0.625rem;
	}

	/* Tool items with icon */
	.nav-dropdown-tool {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		text-decoration: none;
		color: hsl(var(--foreground));
		transition: background 0.1s;
	}

	.nav-dropdown-tool:hover {
		background: hsl(var(--muted) / 0.5);
	}

	.nav-dropdown-tool :global(svg) {
		margin-top: 0.1875rem;
		color: hsl(var(--accent));
		flex-shrink: 0;
		width: 0.875rem;
		height: 0.875rem;
	}

	:global(.nav-tool-name) {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
	}

	:global(.nav-tool-desc) {
		display: block;
		font-size: 0.625rem;
		color: hsl(var(--muted-foreground));
	}

	/* Search trigger — icon-only on mobile, bordered pill on desktop */
	.nav-search-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		color: hsl(var(--muted-foreground));
		transition: color 0.15s;
		border: none;
		background: none;
		cursor: pointer;
		font-family: var(--font-sans);
	}

	.nav-search-trigger:hover {
		color: hsl(var(--foreground));
	}

	.nav-search-text,
	.nav-search-kbd {
		display: none;
	}

	@media (min-width: 768px) {
		.nav-search-trigger {
			width: auto;
			height: auto;
			gap: 0.375rem;
			padding: 0.3125rem 0.625rem;
			border: 1px solid hsl(var(--border) / 0.6);
			border-radius: 0.375rem;
			font-size: 0.75rem;
		}

		.nav-search-text,
		.nav-search-kbd {
			display: inline-flex;
		}
	}

	.nav-kbd {
		font-size: 0.5625rem;
		font-family: var(--font-mono);
		border: 1px solid hsl(var(--border));
		border-radius: 0.1875rem;
		padding: 0.0625rem 0.3125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1;
	}

	.nav-action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		color: hsl(var(--muted-foreground));
		transition: color 0.15s;
	}

	.nav-action-icon:hover {
		color: hsl(var(--foreground));
	}

	/* Mobile tools */
	.mobile-tools-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground));
		padding: 0.75rem 1rem 0.25rem;
		margin-top: 0.25rem;
		border-top: 1px solid hsl(var(--border) / 0.5);
	}

	.mobile-tool-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		border-radius: 0.5rem;
		transition: all 0.1s;
	}

	.mobile-tool-link:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.mobile-tool-link :global(svg) {
		color: hsl(var(--accent));
	}

	/* Search result type badge */
	:global(.search-result-type) {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground) / 0.5);
		flex-shrink: 0;
	}
</style>
