<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { Check, ChevronRight, Sparkles } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { PeptideSummary } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let selectedPeptides = $state<Set<string>>(new Set());
	let isSubmitting = $state(false);
	let error = $state('');

	// Category display names
	const categoryNames: Record<string, string> = {
		healing: 'Healing & Recovery',
		'weight-loss': 'Weight Management',
		cognitive: 'Cognitive Enhancement',
		longevity: 'Longevity & Anti-Aging',
		performance: 'Performance',
		sexual: 'Sexual Health',
		skin: 'Skin & Hair',
		sleep: 'Sleep & Recovery',
		other: 'Other'
	};

	function togglePeptide(id: string) {
		const newSet = new Set(selectedPeptides);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedPeptides = newSet;
	}

	function selectAll(category: string) {
		const peptides = data.categories[category] as PeptideSummary[];
		const newSet = new Set(selectedPeptides);
		for (const p of peptides) {
			newSet.add(p.id);
		}
		selectedPeptides = newSet;
	}

	function deselectAll(category: string) {
		const peptides = data.categories[category] as PeptideSummary[];
		const newSet = new Set(selectedPeptides);
		for (const p of peptides) {
			newSet.delete(p.id);
		}
		selectedPeptides = newSet;
	}

	async function handleSubmit() {
		isSubmitting = true;
		error = '';

		try {
			// Add selected peptides as favorites
			if (selectedPeptides.size > 0) {
				for (const peptideId of selectedPeptides) {
					await fetch('/api/favorites', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ peptideId })
					});
				}
			}

			// Mark onboarding as complete
			const response = await fetch('/api/onboarding/complete', {
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error('Failed to complete onboarding');
			}

			await invalidateAll();
			goto('/');
		} catch (err) {
			error = 'Something went wrong. Please try again.';
			console.error(err);
		} finally {
			isSubmitting = false;
		}
	}

	function skip() {
		handleSubmit();
	}
</script>

<svelte:head>
	<title>Welcome | Peptide Database</title>
</svelte:head>

<div class="min-h-screen bg-background px-4 py-12">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-10 text-center">
			<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
				<Sparkles class="h-8 w-8 text-accent" />
			</div>
			<h1 class="mb-2 text-3xl font-bold">Welcome to Peptide Database!</h1>
			<p class="text-lg text-muted-foreground">
				Select peptides you're interested in to personalize your experience
			</p>
		</div>

		{#if error}
			<div class="mb-6 rounded-lg bg-destructive/10 p-4 text-center text-destructive">
				{error}
			</div>
		{/if}

		<!-- Selection count -->
		<div class="mb-6 flex items-center justify-between rounded-lg bg-muted p-4">
			<span class="text-sm text-muted-foreground">
				{selectedPeptides.size} peptide{selectedPeptides.size !== 1 ? 's' : ''} selected
			</span>
			{#if selectedPeptides.size > 0}
				<button
					onclick={() => (selectedPeptides = new Set())}
					class="text-sm text-accent hover:underline"
				>
					Clear all
				</button>
			{/if}
		</div>

		<!-- Categories -->
		<div class="space-y-8">
			{#each Object.entries(data.categories) as [category, peptides]}
				{@const categoryPeptides = peptides as PeptideSummary[]}
				{@const allSelected = categoryPeptides.every((p) => selectedPeptides.has(p.id))}
				<div class="rounded-xl border border-border bg-card p-6">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold">
							{categoryNames[category] || category}
						</h2>
						<button
							onclick={() => (allSelected ? deselectAll(category) : selectAll(category))}
							class="text-sm text-accent hover:underline"
						>
							{allSelected ? 'Deselect all' : 'Select all'}
						</button>
					</div>

					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
						{#each categoryPeptides as peptide}
							<button
								onclick={() => togglePeptide(peptide.id)}
								class="peptide-card"
								class:selected={selectedPeptides.has(peptide.id)}
							>
								<span class="peptide-name">{peptide.name}</span>
								{#if selectedPeptides.has(peptide.id)}
									<Check class="h-4 w-4 text-accent" />
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Actions -->
		<div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
			<button
				onclick={skip}
				disabled={isSubmitting}
				class="px-6 py-3 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
			>
				Skip for now
			</button>
			<button
				onclick={handleSubmit}
				disabled={isSubmitting}
				class="flex items-center gap-2 rounded-lg bg-accent px-8 py-3 text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
			>
				{#if isSubmitting}
					Saving...
				{:else}
					Continue
					<ChevronRight class="h-4 w-4" />
				{/if}
			</button>
		</div>

		<p class="mt-4 text-center text-sm text-muted-foreground">
			You can always change your favorites later in your profile
		</p>
	</div>
</div>

<style>
	.peptide-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border: 2px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		text-align: left;
		transition: all 0.2s;
		cursor: pointer;
	}

	.peptide-card:hover {
		border-color: hsl(var(--accent) / 0.5);
	}

	.peptide-card.selected {
		border-color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.1);
	}

	.peptide-name {
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
