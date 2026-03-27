<script lang="ts">
	import { page } from '$app/stores';
	import { FlaskConical, ChevronRight } from 'lucide-svelte';
	import type { PeptideSummary } from '$lib/types';

	import { getItemUrlPrefix } from '$lib/data/unified';

	interface Props {
		peptides: PeptideSummary[];
		currentPeptideId: string;
		currentCategory: string;
		urlPrefix?: string;
	}

	let { peptides, currentPeptideId, currentCategory, urlPrefix }: Props = $props();

	// Group peptides by category (peptides can appear in multiple categories)
	const peptidesByCategory = $derived.by(() => {
		const grouped: Record<string, PeptideSummary[]> = {};
		peptides.forEach((p) => {
			// A peptide can belong to multiple categories
			const cats = p.categories || [];
			cats.forEach((cat) => {
				if (!grouped[cat]) {
					grouped[cat] = [];
				}
				grouped[cat].push(p);
			});
		});
		// Sort each category alphabetically
		Object.keys(grouped).forEach((cat) => {
			grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
		});
		return grouped;
	});

	// Category display names
	const categoryNames: Record<string, string> = {
		healing: 'Healing & Recovery',
		'growth-hormone': 'Growth Hormone',
		'weight-loss': 'Weight Loss',
		cognitive: 'Cognitive',
		longevity: 'Longevity',
		skin: 'Skin & Hair',
		immune: 'Immune',
		sleep: 'Sleep',
		metabolic: 'Metabolic',
		'sexual-health': 'Sexual Health',
		protocol: 'Protocols',
		pct: 'PCT & Ancillaries',
		'hair-loss': 'Hair Loss',
		anabolic: 'Anabolics',
		pde5: 'PDE5 Inhibitors',
		sarm: 'SARMs'
	};

	// Track expanded categories
	let expandedCategories = $state<Record<string, boolean>>({
		[currentCategory]: true
	});

	function toggleCategory(category: string) {
		expandedCategories[category] = !expandedCategories[category];
	}

	function isActive(peptideId: string): boolean {
		return peptideId === currentPeptideId;
	}

	// Define a consistent category order
	const categoryOrder = [
		'anabolic',
		'sarm',
		'weight-loss',
		'growth-hormone',
		'healing',
		'hair-loss',
		'pde5',
		'pct',
		'cognitive',
		'longevity',
		'skin',
		'immune',
		'metabolic',
		'sexual-health',
		'sleep',
		'protocol'
	];

	// Get categories in a consistent order
	const orderedCategories = $derived.by(() => {
		const categories = Object.keys(peptidesByCategory);
		return categories.sort((a, b) => {
			const indexA = categoryOrder.indexOf(a);
			const indexB = categoryOrder.indexOf(b);
			// If both are in the order list, sort by that order
			if (indexA !== -1 && indexB !== -1) return indexA - indexB;
			// If only one is in the list, prioritize it
			if (indexA !== -1) return -1;
			if (indexB !== -1) return 1;
			// Otherwise sort alphabetically
			return (categoryNames[a] || a).localeCompare(categoryNames[b] || b);
		});
	});
</script>

<nav class="h-full overflow-y-auto py-4 pr-4">
	<div class="mb-4 flex items-center gap-2 px-3">
		<FlaskConical class="h-4 w-4 text-muted-foreground" />
		<span class="text-sm font-semibold text-muted-foreground">Peptides</span>
	</div>

	<div class="space-y-1">
		{#each orderedCategories as category}
			{@const categoryPeptides = peptidesByCategory[category]}
			{@const isExpanded = expandedCategories[category]}
			{@const hasActivePeptide = categoryPeptides.some((p) => p.id === currentPeptideId)}

			<div>
				<!-- Category header -->
				<button
					onclick={() => toggleCategory(category)}
					class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors {hasActivePeptide
						? 'bg-primary/5 text-primary'
						: 'text-foreground hover:bg-muted'}"
				>
					<span>{categoryNames[category] || category}</span>
					<div class="flex items-center gap-2">
						<span class="text-xs text-muted-foreground">{categoryPeptides.length}</span>
						<ChevronRight
							class="h-4 w-4 text-muted-foreground transition-transform {isExpanded
								? 'rotate-90'
								: ''}"
						/>
					</div>
				</button>

				<!-- Category peptides -->
				{#if isExpanded}
					<div class="ml-3 mt-1 space-y-0.5 border-l border-border pl-3">
						{#each categoryPeptides as peptide}
							<a
								href="{urlPrefix ?? getItemUrlPrefix(peptide)}/{peptide.id}"
								class="block rounded-lg px-3 py-1.5 text-sm transition-all {isActive(peptide.id)
									? 'bg-primary/10 font-medium text-primary'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
							>
								{peptide.name}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</nav>
