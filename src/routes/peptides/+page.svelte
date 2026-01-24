<script lang="ts">
	import { Search, Filter, FlaskConical, ArrowRight } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import SEO from 'sk-seo';
	import type { PeptideSummary } from '$lib/types';

	let { data }: { data: { peptides: PeptideSummary[] } } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let selectedStatus = $state('all');

	// Sync state with URL params
	$effect(() => {
		selectedCategory = $page.url.searchParams.get('category') || 'all';
	});

	$effect(() => {
		selectedStatus = $page.url.searchParams.get('status') || 'all';
	});

	// Update URL when filters change
	function updateUrl(params: { category?: string; status?: string }) {
		const url = new URL($page.url);

		if (params.category !== undefined) {
			if (params.category === 'all') {
				url.searchParams.delete('category');
			} else {
				url.searchParams.set('category', params.category);
			}
		}

		if (params.status !== undefined) {
			if (params.status === 'all') {
				url.searchParams.delete('status');
			} else {
				url.searchParams.set('status', params.status);
			}
		}

		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	function handleCategoryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedCategory = target.value;
		updateUrl({ category: target.value });
	}

	function handleStatusChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedStatus = target.value;
		updateUrl({ status: target.value });
	}

	const categories = [
		{ id: 'all', name: 'All Categories' },
		{ id: 'healing', name: 'Healing & Recovery' },
		{ id: 'growth-hormone', name: 'Growth Hormone' },
		{ id: 'weight-loss', name: 'Weight Loss' },
		{ id: 'cognitive', name: 'Cognitive' },
		{ id: 'longevity', name: 'Longevity' },
		{ id: 'skin', name: 'Skin & Hair' },
		{ id: 'immune', name: 'Immune' },
		{ id: 'sleep', name: 'Sleep' },
		{ id: 'metabolic', name: 'Metabolic' },
		{ id: 'sexual-health', name: 'Sexual Health' },
		{ id: 'protocol', name: 'Protocols' }
	];

	const researchStatuses = [
		{ id: 'all', name: 'All Research Levels' },
		{ id: 'fda-approved', name: 'FDA Approved' },
		{ id: 'extensively-studied', name: 'Extensively Studied' },
		{ id: 'well-studied', name: 'Well Studied' },
		{ id: 'moderate-research', name: 'Moderate Research' },
		{ id: 'emerging', name: 'Emerging' },
		{ id: 'limited-research', name: 'Limited Research' }
	];

	const filteredPeptides = $derived.by(() => {
		let filtered = data.peptides || [];

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.name.toLowerCase().includes(query) ||
					(p.subtitle && p.subtitle.toLowerCase().includes(query))
			);
		}

		if (selectedCategory !== 'all') {
			filtered = filtered.filter((p) => p.categories?.includes(selectedCategory as any));
		}

		if (selectedStatus !== 'all') {
			filtered = filtered.filter((p) => p.researchStatus === selectedStatus);
		}

		return filtered;
	});

	// Category display names for badges
	const categoryNames: Record<string, string> = {
		healing: 'Healing',
		'growth-hormone': 'GH',
		'weight-loss': 'Weight Loss',
		cognitive: 'Cognitive',
		longevity: 'Longevity',
		skin: 'Skin',
		immune: 'Immune',
		sleep: 'Sleep',
		metabolic: 'Metabolic',
		'sexual-health': 'Sexual Health',
		protocol: 'Protocol'
	};

	function getResearchStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			'extensively-studied': 'Extensively Studied',
			'well-studied': 'Well Studied',
			'moderate-research': 'Moderate Research',
			emerging: 'Emerging',
			'limited-research': 'Limited Research',
			'fda-approved': 'FDA Approved'
		};
		return labels[status] || status;
	}

	// Dynamic SEO based on category filter
	const categoryFullNames: Record<string, string> = {
		healing: 'Healing & Recovery',
		'growth-hormone': 'Growth Hormone',
		'weight-loss': 'Weight Loss',
		cognitive: 'Cognitive Enhancement',
		longevity: 'Longevity & Anti-Aging',
		skin: 'Skin & Hair',
		immune: 'Immune Support',
		sleep: 'Sleep',
		metabolic: 'Metabolic',
		'sexual-health': 'Sexual Health',
		protocol: 'Protocols'
	};

	const seoTitle = $derived(
		selectedCategory !== 'all'
			? `${categoryFullNames[selectedCategory] || selectedCategory} Peptides | Peptide Database`
			: 'Browse Peptides | Peptide Database'
	);

	const seoDescription = $derived(
		selectedCategory !== 'all'
			? `Explore ${categoryFullNames[selectedCategory]?.toLowerCase() || selectedCategory} peptides with detailed research information, dosing protocols, and scientific references.`
			: 'Browse our comprehensive database of peptides with detailed research information, dosing protocols, and scientific references.'
	);

	const seoKeywords = $derived(
		selectedCategory !== 'all'
			? `${categoryFullNames[selectedCategory]?.toLowerCase() || selectedCategory} peptides, ${selectedCategory} peptide research, peptide database`
			: 'peptides, peptide database, BPC-157, semaglutide, tirzepatide, peptide research'
	);

	const canonical = $derived(
		selectedCategory !== 'all'
			? `https://peptide-db.com/peptides?category=${selectedCategory}`
			: 'https://peptide-db.com/peptides'
	);
</script>

<SEO
	title={seoTitle}
	description={seoDescription}
	keywords={seoKeywords}
	siteName="Peptide Database"
	{canonical}
	twitter={true}
	openGraph={true}
/>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-12">
		<h1 class="mb-4 text-3xl font-bold md:text-4xl">Browse Peptides</h1>
		<p class="max-w-2xl text-muted-foreground">
			Explore our database of {data.peptides?.length || 0} peptides with detailed research information,
			dosing protocols, and scientific references.
		</p>
	</div>

	<!-- Filters -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
		<!-- Search -->
		<div class="relative flex-1 sm:min-w-[240px]">
			<Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
			<input
				type="text"
				placeholder="Search peptides..."
				bind:value={searchQuery}
				class="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>

		<!-- Filter dropdowns container -->
		<div class="flex flex-col gap-4 sm:flex-row">
			<!-- Category filter -->
			<div class="relative">
				<Filter class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
				<select
					value={selectedCategory}
					onchange={handleCategoryChange}
					class="w-full cursor-pointer appearance-none rounded-xl border border-border bg-card py-3 pl-12 pr-10 text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary sm:w-auto"
				>
					{#each categories as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
				<div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
					<svg
						class="h-4 w-4 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>

			<!-- Research status filter -->
			<div class="relative">
				<FlaskConical
					class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
				/>
				<select
					value={selectedStatus}
					onchange={handleStatusChange}
					class="w-full cursor-pointer appearance-none rounded-xl border border-border bg-card py-3 pl-12 pr-10 text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary sm:w-auto"
				>
					{#each researchStatuses as status}
						<option value={status.id}>{status.name}</option>
					{/each}
				</select>
				<div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
					<svg
						class="h-4 w-4 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Results count -->
	<p class="mb-6 text-sm text-muted-foreground">
		Showing {filteredPeptides.length} peptide{filteredPeptides.length !== 1 ? 's' : ''}
	</p>

	<!-- Peptide Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredPeptides as peptide, i}
			<a
				href="/peptides/{peptide.id}"
				class="card-hover group relative rounded-2xl border border-border bg-card p-6"
				style="animation-delay: {Math.min(i * 0.05, 0.5)}s"
			>
				<div class="mb-3 flex items-start justify-between">
					<h3 class="text-lg font-semibold transition-colors group-hover:text-primary">
						{peptide.name}
					</h3>
					<span
						class="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium badge-{peptide.researchStatus}"
					>
						{getResearchStatusLabel(peptide.researchStatus)}
					</span>
				</div>

				{#if peptide.subtitle}
					<p class="mb-4 line-clamp-2 text-sm text-muted-foreground">
						{peptide.subtitle}
					</p>
				{/if}

				<div class="flex items-center justify-between">
					<div class="flex flex-wrap gap-1">
						{#each peptide.categories?.slice(0, 2) || [] as cat}
							<span
								class="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
							>
								{categoryNames[cat] || cat}
							</span>
						{/each}
						{#if (peptide.categories?.length || 0) > 2}
							<span
								class="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
							>
								+{(peptide.categories?.length || 0) - 2}
							</span>
						{/if}
					</div>
					<div
						class="flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
					>
						<span>View details</span>
						<ArrowRight class="ml-1 h-4 w-4" />
					</div>
				</div>
			</a>
		{:else}
			<div class="col-span-full text-center py-12">
				<p class="text-muted-foreground">No peptides found matching your search criteria.</p>
			</div>
		{/each}
	</div>
</div>
