<script lang="ts">
	import { BlendCalculator } from '$lib/components/calculator';
	import { currentBlend } from '$lib/stores/calculator';
	import { ChevronRight, Home, FlaskConical, BookOpen } from 'lucide-svelte';
	import SEO from 'sk-seo';

	// Get initial data from load function (for SSR)
	let { data } = $props();

	// Use store for reactive updates, fallback to SSR data
	const blendName = $derived($currentBlend.name || data.blendName);
	const blendId = $derived($currentBlend.id || data.initialBlendId);

	// Dynamic SEO based on blend
	const title = $derived(
		blendName
			? `${blendName} Blend Calculator | Peptide Database`
			: 'Blend Calculator | Peptide Database'
	);

	const description = $derived(
		blendName && blendName !== 'Custom'
			? `Calculate doses for ${blendName} peptide blend. Get precise dosing for each component in your blend.`
			: 'Calculate doses for peptide blends. Enter your blend composition and get precise dosing for each component.'
	);

	const keywords = $derived(
		blendName
			? `${blendName} blend calculator, ${blendName} peptide dosing, peptide blend calculator`
			: 'peptide blend calculator, peptide blend dosing, multi-peptide blend'
	);

	const canonical = $derived(
		blendId && blendId !== 'klow'
			? `https://peptide-db.com/calculator/blend?b=${blendId}`
			: 'https://peptide-db.com/calculator/blend'
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
					{ '@type': 'ListItem', position: 3, name: 'Blend', item: `${SITE_URL}/calculator/blend` },
					...(blendName ? [{ '@type': 'ListItem', position: 4, name: blendName, item: canonical }] : [])
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
			<ChevronRight class="h-3.5 w-3.5 sep" />
		</li>
		<li>
			<a href="/calculator">Calculator</a>
			<ChevronRight class="h-3.5 w-3.5 sep" />
		</li>
		<li>
			{#if blendName}
				<a href="/calculator/blend">Blend</a>
				<ChevronRight class="h-3.5 w-3.5 sep" />
			{:else}
				<span class="current">Blend</span>
			{/if}
		</li>
		{#if blendName}
			<li><span class="current">{blendName}</span></li>
		{/if}
	</ol>
</nav>

<!-- Calculator Header -->
<div class="calculator-header">
	<div class="header-content">
		{#if blendName}
			<h1 class="calculator-title">{blendName} Blend Calculator</h1>
			<p class="calculator-subtitle">Calculate precise doses for each component in {blendName}</p>
		{:else}
			<h1 class="calculator-title">Blend Calculator</h1>
			<p class="calculator-subtitle">Calculate doses for peptide blends with precise per-component dosing</p>
		{/if}

		<!-- Cross-links (only when blend selected) -->
		{#if blendId}
			<div class="cross-links">
				<a href="/peptides/{blendId}" class="cross-link">
					<FlaskConical class="h-3.5 w-3.5" />
					<span>{blendName} profile</span>
				</a>
				<a href="/calculator?peptide={blendId}" class="cross-link">
					<BookOpen class="h-3.5 w-3.5" />
					<span>Reconstitution calculator</span>
				</a>
			</div>
		{/if}
	</div>
</div>

<BlendCalculator />

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
