<script lang="ts">
	import { Search, Filter, FlaskConical, ArrowRight } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import SEO from 'sk-seo';
	import type { PeptideSummary } from '$lib/types';

	let { data }: { data: { compounds: PeptideSummary[] } } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let selectedStatus = $state('all');

	$effect(() => {
		selectedCategory = $page.url.searchParams.get('category') || 'all';
	});

	$effect(() => {
		selectedStatus = $page.url.searchParams.get('status') || 'all';
	});

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
		{ id: 'anabolic', name: 'Anabolics' },
		{ id: 'sarm', name: 'SARMs' },
		{ id: 'pct', name: 'Post-Cycle Therapy' },
		{ id: 'pde5', name: 'PDE5 Inhibitors' },
		{ id: 'hair-loss', name: 'Hair Loss' },
		{ id: 'sexual-health', name: 'Sexual Health' },
		{ id: 'metabolic', name: 'Metabolic' },
		{ id: 'other', name: 'Other' }
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

	const filteredCompounds = $derived.by(() => {
		let filtered = data.compounds || [];

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

	const categoryNames: Record<string, string> = {
		anabolic: 'Anabolic',
		sarm: 'SARM',
		pct: 'PCT',
		pde5: 'PDE5',
		'hair-loss': 'Hair Loss',
		'sexual-health': 'Sexual Health',
		metabolic: 'Metabolic',
		healing: 'Healing',
		'growth-hormone': 'GH',
		'weight-loss': 'Weight Loss',
		cognitive: 'Cognitive',
		longevity: 'Longevity',
		skin: 'Skin',
		immune: 'Immune',
		sleep: 'Sleep'
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

	const seoTitle = $derived(
		selectedCategory !== 'all'
			? `${categoryNames[selectedCategory] || selectedCategory} Compounds | Peptide Database`
			: 'Browse Compounds | Peptide Database'
	);

	const seoDescription = $derived(
		selectedCategory !== 'all'
			? `Explore ${categoryNames[selectedCategory]?.toLowerCase() || selectedCategory} compounds with detailed research information, dosing protocols, and scientific references.`
			: 'Browse our database of research compounds including anabolics, SARMs, PCT, and more with dosing protocols and scientific references.'
	);

	const canonical = $derived(
		selectedCategory !== 'all'
			? `https://peptide-db.com/compounds?category=${selectedCategory}`
			: 'https://peptide-db.com/compounds'
	);
</script>

<SEO
	title={seoTitle}
	description={seoDescription}
	siteName="Peptide Database"
	{canonical}
	twitter={true}
	openGraph={true}
/>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-12">
		<h1 class="mb-4 text-3xl font-bold md:text-4xl">Browse Compounds</h1>
		<p class="max-w-2xl text-muted-foreground">
			Explore our database of {data.compounds?.length || 0} research compounds with detailed information,
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
				placeholder="Search compounds..."
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
		Showing {filteredCompounds.length} compound{filteredCompounds.length !== 1 ? 's' : ''}
	</p>

	<!-- Compound Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredCompounds as compound, i}
			<a
				href="/compounds/{compound.id}"
				class="card-hover group relative rounded-2xl border border-border bg-card p-6"
				style="animation-delay: {Math.min(i * 0.05, 0.5)}s"
			>
				<div class="mb-3 flex items-start justify-between">
					<h3 class="text-lg font-semibold transition-colors group-hover:text-primary">
						{compound.name}
					</h3>
					<span
						class="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium badge-{compound.researchStatus}"
					>
						{getResearchStatusLabel(compound.researchStatus)}
					</span>
				</div>

				{#if compound.subtitle}
					<p class="mb-4 line-clamp-2 text-sm text-muted-foreground">
						{compound.subtitle}
					</p>
				{/if}

				<div class="flex items-center justify-between">
					<div class="flex flex-wrap gap-1">
						{#each compound.categories?.slice(0, 2) || [] as cat}
							<span
								class="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
							>
								{categoryNames[cat] || cat}
							</span>
						{/each}
						{#if (compound.categories?.length || 0) > 2}
							<span
								class="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
							>
								+{(compound.categories?.length || 0) - 2}
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
				<p class="text-muted-foreground">No compounds found matching your search criteria.</p>
			</div>
		{/each}
	</div>
</div>
