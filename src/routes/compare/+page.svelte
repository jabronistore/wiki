<script lang="ts">
	import SEO from 'sk-seo';
	import { Home, ChevronRight, ArrowLeftRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { buildComparisonSlug, type ComparisonPair } from '$lib/utils/comparison';
	import type { PeptideSummary } from '$lib/types';

	let { data }: { data: { popularComparisons: ComparisonPair[]; allPeptides: PeptideSummary[] } } =
		$props();

	let peptideA = $state('');
	let peptideB = $state('');

	function goCompare() {
		if (peptideA && peptideB && peptideA !== peptideB) {
			goto(`/compare/${buildComparisonSlug(peptideA, peptideB)}`);
		}
	}

	const statusLabels: Record<string, string> = {
		synergistic: 'Synergistic',
		compatible: 'Compatible'
	};
</script>

<SEO
	title="Peptide Comparisons | Peptide Database"
	description="Compare any two peptides side by side. Dosing, safety, molecular data, and research evidence compared."
	keywords="peptide comparison, compare peptides, peptide vs peptide"
	siteName="Peptide Database"
	canonical="https://peptide-db.com/compare"
	twitter={true}
	openGraph={true}
/>

<div class="compare-index">
	<!-- Breadcrumb -->
	<nav aria-label="Breadcrumb" class="breadcrumb">
		<ol>
			<li>
				<a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a><ChevronRight
					class="sep h-3.5 w-3.5"
				/>
			</li>
			<li><span class="current">Compare</span></li>
		</ol>
	</nav>

	<header class="page-header">
		<h1>Peptide Comparisons</h1>
		<p class="subtitle">
			Side-by-side data for any two peptides. Dosing, safety, half-life, interactions.
		</p>
	</header>

	<!-- Build your own comparison -->
	<div class="custom-compare">
		<div class="custom-row">
			<select bind:value={peptideA} class="compare-select">
				<option value="">Select peptide...</option>
				{#each data.allPeptides as p}
					<option value={p.id} disabled={p.id === peptideB}>{p.name}</option>
				{/each}
			</select>
			<span class="vs-label">vs</span>
			<select bind:value={peptideB} class="compare-select">
				<option value="">Select peptide...</option>
				{#each data.allPeptides as p}
					<option value={p.id} disabled={p.id === peptideA}>{p.name}</option>
				{/each}
			</select>
			<button
				class="compare-btn"
				onclick={goCompare}
				disabled={!peptideA || !peptideB || peptideA === peptideB}
			>
				Compare
			</button>
		</div>
	</div>

	<!-- Popular comparisons -->
	{#if data.popularComparisons.length > 0}
		<section class="popular">
			<h2 class="popular-heading">Popular Comparisons</h2>
			<div class="pair-grid">
				{#each data.popularComparisons as pair}
					<a href="/compare/{pair.comparisonSlug}" class="pair-card">
						<div class="pair-names">
							<span class="pair-name">{pair.nameA}</span>
							<span class="pair-vs">vs</span>
							<span class="pair-name">{pair.nameB}</span>
						</div>
						<div class="pair-meta">
							<span class="pair-status pair-status-{pair.interactionStatus}"
								>{statusLabels[pair.interactionStatus] || pair.interactionStatus}</span
							>
							{#each pair.sharedCategories.slice(0, 2) as cat}
								<span class="pair-cat">{cat}</span>
							{/each}
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.compare-index {
		max-width: 56rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	/* Breadcrumb */
	.breadcrumb ol {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.breadcrumb li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.breadcrumb a {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
	}
	.breadcrumb a:hover {
		color: hsl(var(--foreground));
	}
	.breadcrumb .current {
		color: hsl(var(--foreground));
		font-weight: 500;
	}
	.breadcrumb :global(.sep) {
		color: hsl(var(--border));
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 400;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
	}

	/* Custom compare builder */
	.custom-compare {
		padding: 1.5rem;
		background: hsl(var(--muted) / 0.2);
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		margin-bottom: 2.5rem;
	}

	.custom-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.compare-select {
		flex: 1;
		min-width: 140px;
		padding: 0.75rem 0.875rem;
		font-size: 0.875rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
	}

	.compare-select:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.vs-label {
		font-size: 0.875rem;
		font-style: italic;
		color: hsl(var(--accent));
		flex-shrink: 0;
	}

	.compare-btn {
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
		background: hsl(var(--accent));
		border: none;
		border-radius: 0.625rem;
		cursor: pointer;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}

	.compare-btn:hover {
		opacity: 0.9;
	}
	.compare-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.custom-row {
			flex-direction: column;
		}
		.compare-select {
			width: 100%;
		}
		.vs-label {
			display: none;
		}
		.compare-btn {
			width: 100%;
		}
	}

	/* Popular comparisons */
	.popular {
		margin-top: 1rem;
	}

	.popular-heading {
		font-size: 1.125rem;
		font-weight: 400;
		margin-bottom: 1rem;
	}

	.pair-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 0.75rem;
	}

	.pair-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.15s;
		background: hsl(var(--background));
	}

	.pair-card:hover {
		border-color: hsl(var(--accent) / 0.5);
		background: hsl(var(--muted) / 0.3);
	}

	.pair-names {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.pair-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.pair-vs {
		font-size: 0.75rem;
		font-style: italic;
		color: hsl(var(--accent));
	}

	.pair-meta {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.pair-status,
	.pair-cat {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}

	.pair-status-synergistic {
		background: hsl(142 71% 45% / 0.12);
		color: hsl(142 71% 45%);
	}

	.pair-status-compatible {
		background: hsl(var(--accent) / 0.12);
		color: hsl(var(--accent));
	}

	.pair-cat {
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
	}
</style>
