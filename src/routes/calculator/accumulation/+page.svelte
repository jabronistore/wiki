<script lang="ts">
	import { AccumulationPlotter } from '$lib/components/calculator';
	import { currentCalculatorPeptide } from '$lib/stores/calculator';
	import { ChevronRight, Home, FlaskConical, BookOpen } from 'lucide-svelte';
	import SEO from 'sk-seo';

	// Get initial data from load function (for SSR)
	let { data } = $props();

	// Use store for reactive updates, fallback to SSR data
	const peptideName = $derived($currentCalculatorPeptide.name || data.peptideName);
	const peptideId = $derived($currentCalculatorPeptide.id || data.initialPeptideId);

	// Dynamic SEO based on peptide
	const title = $derived(
		peptideName
			? `${peptideName} Accumulation Calculator | Peptide Database`
			: 'Accumulation Plotter | Peptide Database'
	);

	const description = $derived(
		peptideName
			? `Calculate ${peptideName} accumulation over time. Visualize concentration curves based on dose, frequency, and half-life.`
			: 'Visualize peptide accumulation in your body over time. Model concentration curves based on dose, frequency, and duration.'
	);

	const keywords = $derived(
		peptideName
			? `${peptideName} accumulation, ${peptideName} half-life, ${peptideName} dosing calculator, peptide concentration`
			: 'peptide accumulation, half-life calculator, peptide concentration, pharmacokinetics'
	);

	const canonical = $derived(
		peptideId
			? `https://peptide-db.com/calculator/accumulation?peptide=${peptideId}`
			: 'https://peptide-db.com/calculator/accumulation'
	);

	const SITE_URL = 'https://peptide-db.com';

	// JSON-LD with BreadcrumbList + WebApplication
	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: title,
				description: description,
				url: canonical,
				applicationCategory: 'HealthApplication',
				operatingSystem: 'Any',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				publisher: {
					'@type': 'Organization',
					name: 'Peptide Database',
					url: SITE_URL
				}
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
					{ '@type': 'ListItem', position: 2, name: 'Calculator', item: `${SITE_URL}/calculator` },
					{
						'@type': 'ListItem',
						position: 3,
						name: 'Accumulation',
						item: `${SITE_URL}/calculator/accumulation`
					},
					...(peptideName
						? [{ '@type': 'ListItem', position: 4, name: peptideName, item: canonical }]
						: [])
				]
			}
		]
	});
</script>

<SEO
	{title}
	{description}
	{keywords}
	siteName="Peptide Database"
	{canonical}
	twitter={true}
	openGraph={true}
	schemaOrg={true}
	{jsonld}
/>

<!-- Breadcrumb -->
<nav aria-label="Breadcrumb" class="calc-breadcrumb">
	<ol>
		<li>
			<a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a>
			<ChevronRight class="sep h-3.5 w-3.5" />
		</li>
		<li>
			<a href="/calculator">Calculator</a>
			<ChevronRight class="sep h-3.5 w-3.5" />
		</li>
		<li>
			{#if peptideName}
				<a href="/calculator/accumulation">Accumulation</a>
				<ChevronRight class="sep h-3.5 w-3.5" />
			{:else}
				<span class="current">Accumulation</span>
			{/if}
		</li>
		{#if peptideName}
			<li><span class="current">{peptideName}</span></li>
		{/if}
	</ol>
</nav>

<!-- Calculator Header -->
<div class="calculator-header">
	<div class="header-content">
		{#if peptideName}
			<h1 class="calculator-title">{peptideName} Accumulation Plotter</h1>
			<p class="calculator-subtitle">Visualize {peptideName} concentration curves over time</p>
		{:else}
			<h1 class="calculator-title">Accumulation Plotter</h1>
			<p class="calculator-subtitle">
				Model peptide concentration curves based on dose, frequency, and duration
			</p>
		{/if}

		<!-- Cross-links (only when peptide selected) -->
		{#if peptideId}
			<div class="cross-links">
				<a href="/peptides/{peptideId}" class="cross-link">
					<FlaskConical class="h-3.5 w-3.5" />
					<span>{peptideName} profile</span>
				</a>
				<a href="/calculator?peptide={peptideId}" class="cross-link">
					<BookOpen class="h-3.5 w-3.5" />
					<span>Reconstitution calculator</span>
				</a>
			</div>
		{/if}
	</div>
</div>

<AccumulationPlotter initialPeptideId={data.initialPeptideId} />

<style>
	/* Breadcrumb */
	.calc-breadcrumb {
		margin-bottom: 1rem;
	}

	.calc-breadcrumb ol {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.calc-breadcrumb li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.calc-breadcrumb a {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		transition: color 0.15s;
	}

	.calc-breadcrumb a:hover {
		color: hsl(var(--foreground));
	}

	.calc-breadcrumb .current {
		color: hsl(var(--foreground));
		font-weight: 500;
	}

	.calc-breadcrumb :global(.sep) {
		color: hsl(var(--border));
	}

	/* Calculator Header */
	.calculator-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.header-content {
		flex: 1;
	}

	.calculator-title {
		font-size: 1.5rem;
		font-weight: 400;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.calculator-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0.25rem 0 0;
	}

	/* Cross-links */
	.cross-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.cross-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--accent) / 0.3);
		border-radius: 999px;
		transition: all 0.15s;
	}

	.cross-link:hover {
		background: hsl(var(--accent) / 0.08);
		border-color: hsl(var(--accent) / 0.5);
	}
</style>
