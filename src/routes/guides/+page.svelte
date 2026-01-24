<script lang="ts">
	import { Search, BookOpen, Filter } from 'lucide-svelte';
	import SEO from 'sk-seo';
	import GuideCard from '$lib/components/guides/GuideCard.svelte';
	import type { Guide, GuideCategory, GuideDifficulty } from '$lib/types';

	let { data }: { data: { guides: Guide[]; categories: { name: string; count: number }[] } } =
		$props();

	let searchQuery = $state('');
	let selectedCategory = $state<GuideCategory | 'all'>('all');
	let selectedDifficulty = $state<GuideDifficulty | 'all'>('all');

	const categoryLabels: Record<GuideCategory, string> = {
		basics: 'Basics',
		safety: 'Safety',
		protocols: 'Protocols',
		'research-methods': 'Research Methods',
		equipment: 'Equipment',
		troubleshooting: 'Troubleshooting'
	};

	const difficultyLabels: Record<GuideDifficulty, string> = {
		beginner: 'Beginner',
		intermediate: 'Intermediate',
		advanced: 'Advanced'
	};

	const filteredGuides = $derived(
		data.guides.filter((guide) => {
			const matchesSearch =
				searchQuery === '' ||
				guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				guide.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
			const matchesDifficulty =
				selectedDifficulty === 'all' || guide.difficulty === selectedDifficulty;

			return matchesSearch && matchesCategory && matchesDifficulty;
		})
	);

	function clearFilters() {
		searchQuery = '';
		selectedCategory = 'all';
		selectedDifficulty = 'all';
	}
</script>

<SEO
	title="Guides | Peptide Database"
	description="Research guides for peptide handling, storage, reconstitution, and protocols."
	keywords="peptide guides, reconstitution, peptide storage, research protocols, peptide handling"
	siteName="Peptide Database"
	canonical="https://peptide-db.com/guides"
	twitter={true}
	openGraph={true}
/>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<div class="guides-page">
		<!-- Header -->
		<header class="page-header">
			<div class="header-content">
				<div class="header-icon">
					<BookOpen class="h-6 w-6" />
				</div>
				<div>
					<h1>Research Guides</h1>
					<p>Comprehensive guides for peptide research, handling, and protocols</p>
				</div>
			</div>
		</header>

		<!-- Filters -->
		<div class="filters-bar">
			<div class="search-wrapper">
				<Search class="search-icon" />
				<input
					type="text"
					placeholder="Search guides..."
					bind:value={searchQuery}
					class="search-input"
				/>
			</div>

			<div class="filter-group">
				<label for="category-filter" class="sr-only">Category</label>
				<select id="category-filter" bind:value={selectedCategory} class="filter-select">
					<option value="all">All Categories</option>
					{#each Object.entries(categoryLabels) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<label for="difficulty-filter" class="sr-only">Difficulty</label>
				<select id="difficulty-filter" bind:value={selectedDifficulty} class="filter-select">
					<option value="all">All Levels</option>
					{#each Object.entries(difficultyLabels) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>

			{#if searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all'}
				<button class="clear-btn" onclick={clearFilters}>Clear</button>
			{/if}
		</div>

		<!-- Results count -->
		<div class="results-info">
			<span class="count">{filteredGuides.length}</span>
			<span class="label">guide{filteredGuides.length !== 1 ? 's' : ''}</span>
		</div>

		<!-- Guides Grid -->
		{#if filteredGuides.length > 0}
			<div class="guides-grid">
				{#each filteredGuides as guide (guide.slug)}
					<GuideCard {guide} />
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<BookOpen class="h-12 w-12 text-muted-foreground" />
				<h3>No guides found</h3>
				<p>Try adjusting your search or filters</p>
				<button class="clear-btn" onclick={clearFilters}>Clear filters</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.guides-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-icon {
		width: 3rem;
		height: 3rem;
		border-radius: 0.75rem;
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin-bottom: 0.25rem;
	}

	.page-header p {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
	}

	.filters-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.75rem;
	}

	.search-wrapper {
		position: relative;
		flex: 1;
		min-width: 200px;
	}

	.search-wrapper :global(.search-icon) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1rem;
		height: 1rem;
		color: hsl(var(--muted-foreground));
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.625rem 0.75rem 0.625rem 2.5rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
	}

	.search-input:focus {
		outline: none;
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 3px hsl(var(--accent) / 0.1);
	}

	.filter-select {
		padding: 0.625rem 2rem 0.625rem 0.75rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 0.5rem center;
		background-repeat: no-repeat;
		background-size: 1.25rem;
	}

	.filter-select:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.clear-btn {
		padding: 0.625rem 1rem;
		background: transparent;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.clear-btn:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.results-info {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	.results-info .count {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.results-info .label {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.guides-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.75rem;
	}

	.empty-state h3 {
		margin-top: 1rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.empty-state p {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.empty-state .clear-btn {
		margin-top: 1rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	@media (max-width: 640px) {
		.filters-bar {
			flex-direction: column;
		}

		.filter-select {
			width: 100%;
		}

		.guides-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
