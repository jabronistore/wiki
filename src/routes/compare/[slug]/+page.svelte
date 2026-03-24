<script lang="ts">
	import SEO from 'sk-seo';
	import { Home, ChevronRight, Scale, Clock, Beaker, FlaskConical, AlertTriangle, CheckCircle, BookOpen } from 'lucide-svelte';
	import type { Peptide } from '$lib/types';
	import { findMutualInteraction, buildComparisonSlug, findPeptideIdByName } from '$lib/utils/comparison';

	const SITE_URL = 'https://peptide-db.com';

	let { data }: { data: { peptideA: Peptide; peptideB: Peptide; allPeptides: { id: string; name: string }[] } } = $props();

	const a = $derived(data.peptideA);
	const b = $derived(data.peptideB);
	const interaction = $derived(findMutualInteraction(a, b));

	const slug = $derived(buildComparisonSlug(a.id, b.id));
	const canonicalUrl = $derived(`${SITE_URL}/compare/${slug}`);

	const title = $derived(`${a.name} vs ${b.name}: Complete Comparison | Peptide Database`);
	const description = $derived(
		`Compare ${a.name} and ${b.name} side by side. Dosing protocols, half-life, side effects, interactions, and research evidence compared.`
	);
	const keywords = $derived(
		`${a.name} vs ${b.name}, ${a.name} comparison, ${b.name} comparison, peptide comparison`
	);

	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Article',
				headline: `${a.name} vs ${b.name}: Complete Comparison`,
				description: description,
				dateModified: new Date().toISOString(),
				author: { '@type': 'Organization', name: 'Peptide Database' },
				publisher: { '@type': 'Organization', name: 'Peptide Database', url: SITE_URL },
				mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl }
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
					{ '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare` },
					{ '@type': 'ListItem', position: 3, name: `${a.name} vs ${b.name}`, item: canonicalUrl }
				]
			}
		]
	});

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

	const statusColors: Record<string, string> = {
		synergistic: '#059669',
		compatible: '#059669',
		monitor: '#D4A27F',
		avoid: '#BF4D43',
		'requires-timing': '#D4A27F'
	};

	// Get injectable protocols for each
	const protosA = $derived(a.deliveryMethods?.find((m) => m.type === 'injectable')?.protocols || []);
	const protosB = $derived(b.deliveryMethods?.find((m) => m.type === 'injectable')?.protocols || []);

	// Shared categories
	const sharedCats = $derived(
		(a.categories || []).filter((c) => (b.categories || []).includes(c))
	);

	// "Compare with others" links
	const otherComparisons = $derived.by(() => {
		const links: { name: string; slug: string }[] = [];
		const seen = new Set([a.id, b.id]);

		for (const peptide of [a, b]) {
			for (const ix of peptide.interactions || []) {
				if (ix.status !== 'synergistic' && ix.status !== 'compatible') continue;
				const otherId = findPeptideIdByName(ix.peptide, data.allPeptides as any);
				if (!otherId || seen.has(otherId)) continue;
				seen.add(otherId);
				links.push({ name: ix.peptide, slug: buildComparisonSlug(peptide.id, otherId) });
			}
		}
		return links.slice(0, 6);
	});
</script>

<SEO
	{title}
	{description}
	{keywords}
	siteName="Peptide Database"
	canonical={canonicalUrl}
	twitter={true}
	openGraph={true}
	schemaOrg={true}
	{jsonld}
/>

<div class="compare-page">
	<!-- Breadcrumb -->
	<nav aria-label="Breadcrumb" class="compare-breadcrumb">
		<ol>
			<li><a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a><ChevronRight class="h-3.5 w-3.5 sep" /></li>
			<li><a href="/compare">Compare</a><ChevronRight class="h-3.5 w-3.5 sep" /></li>
			<li><span class="current">{a.name} vs {b.name}</span></li>
		</ol>
	</nav>

	<!-- Hero -->
	<header class="compare-hero">
		<h1>
			<a href="/peptides/{a.id}" class="hero-name">{a.name}</a>
			<span class="hero-vs">vs</span>
			<a href="/peptides/{b.id}" class="hero-name">{b.name}</a>
		</h1>
		<div class="hero-badges">
			<span class="badge badge-{a.researchStatus}">{getResearchStatusLabel(a.researchStatus)}</span>
			<span class="badge-sep">vs</span>
			<span class="badge badge-{b.researchStatus}">{getResearchStatusLabel(b.researchStatus)}</span>
		</div>
		{#if interaction}
			<div class="hero-interaction" style="--ix-color: {statusColors[interaction.status] || '#91918D'}">
				<span class="hero-ix-status">{interaction.status.replace('-', ' ')}</span>
				{#if interaction.notes}
					<span class="hero-ix-notes">{interaction.notes}</span>
				{/if}
			</div>
		{/if}
	</header>

	<!-- Molecular Stats -->
	{#if a.molecular || b.molecular}
		<section class="compare-section">
			<h2 class="section-heading"><Scale class="section-icon" />Molecular Data</h2>
			<div class="stats-table">
				<div class="stats-row stats-header">
					<span class="stats-cell-label"></span>
					<span class="stats-cell-a">{a.name}</span>
					<span class="stats-cell-b">{b.name}</span>
				</div>
				{#if a.molecular?.weight || b.molecular?.weight}
					<div class="stats-row">
						<span class="stats-cell-label">Weight</span>
						<span class="stats-cell-a">{a.molecular?.weight || '—'}</span>
						<span class="stats-cell-b">{b.molecular?.weight || '—'}</span>
					</div>
				{/if}
				{#if a.molecular?.halfLife || b.molecular?.halfLife}
					<div class="stats-row">
						<span class="stats-cell-label">Half-life</span>
						<span class="stats-cell-a">{a.molecular?.halfLife || '—'}</span>
						<span class="stats-cell-b">{b.molecular?.halfLife || '—'}</span>
					</div>
				{/if}
				{#if a.molecular?.length || b.molecular?.length}
					<div class="stats-row">
						<span class="stats-cell-label">Chain</span>
						<span class="stats-cell-a">{a.molecular?.length || '—'}</span>
						<span class="stats-cell-b">{b.molecular?.length || '—'}</span>
					</div>
				{/if}
				{#if a.molecular?.type || b.molecular?.type}
					<div class="stats-row">
						<span class="stats-cell-label">Type</span>
						<span class="stats-cell-a">{a.molecular?.type || '—'}</span>
						<span class="stats-cell-b">{b.molecular?.type || '—'}</span>
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<!-- Key Benefits -->
	{#if (a.keyBenefits?.length || 0) > 0 || (b.keyBenefits?.length || 0) > 0}
		<section class="compare-section">
			<h2 class="section-heading"><CheckCircle class="section-icon" />Key Benefits</h2>
			<div class="two-col">
				<div class="col">
					<div class="col-label">{a.name}</div>
					{#each a.keyBenefits || [] as benefit, i}
						<div class="benefit-row">
							<span class="benefit-num">{String(i + 1).padStart(2, '0')}</span>
							<span>{benefit}</span>
						</div>
					{/each}
				</div>
				<div class="col">
					<div class="col-label">{b.name}</div>
					{#each b.keyBenefits || [] as benefit, i}
						<div class="benefit-row">
							<span class="benefit-num">{String(i + 1).padStart(2, '0')}</span>
							<span>{benefit}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Dosing Protocols -->
	{#if protosA.length > 0 || protosB.length > 0}
		<section class="compare-section">
			<h2 class="section-heading"><FlaskConical class="section-icon" />Dosing Protocols</h2>
			<div class="two-col">
				<div class="col">
					<div class="col-label">{a.name}</div>
					{#if a.quickStats}
						<div class="quick-dose">{a.quickStats.typicalDose} / {a.quickStats.frequency}</div>
					{/if}
					<div class="proto-list">
						{#each protosA as p}
							<div class="proto-row">
								<span class="proto-goal">{p.goal}</span>
								<span class="proto-dose">{p.dose}</span>
								<span class="proto-freq">{p.frequency}</span>
							</div>
						{/each}
					</div>
				</div>
				<div class="col">
					<div class="col-label">{b.name}</div>
					{#if b.quickStats}
						<div class="quick-dose">{b.quickStats.typicalDose} / {b.quickStats.frequency}</div>
					{/if}
					<div class="proto-list">
						{#each protosB as p}
							<div class="proto-row">
								<span class="proto-goal">{p.goal}</span>
								<span class="proto-dose">{p.dose}</span>
								<span class="proto-freq">{p.frequency}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- Side Effects -->
	{#if a.sideEffects || b.sideEffects}
		<section class="compare-section compare-section-warn">
			<h2 class="section-heading"><AlertTriangle class="section-icon icon-warn" />Side Effects</h2>
			<div class="two-col">
				<div class="col">
					<div class="col-label">{a.name}</div>
					{#each a.sideEffects?.common || [] as effect}
						<div class="se-item">{effect}</div>
					{/each}
				</div>
				<div class="col">
					<div class="col-label">{b.name}</div>
					{#each b.sideEffects?.common || [] as effect}
						<div class="se-item">{effect}</div>
					{/each}
				</div>
			</div>
			{#if (a.sideEffects?.contraindications?.length || 0) > 0 || (b.sideEffects?.contraindications?.length || 0) > 0}
				<div class="contra-section">
					<div class="contra-label">Contraindications</div>
					<div class="two-col">
						<div class="col">
							{#each a.sideEffects?.contraindications || [] as c}
								<div class="contra-item">{c}</div>
							{/each}
						</div>
						<div class="col">
							{#each b.sideEffects?.contraindications || [] as c}
								<div class="contra-item">{c}</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</section>
	{/if}

	<!-- Research Evidence -->
	<section class="compare-section">
		<h2 class="section-heading"><BookOpen class="section-icon" />Research Evidence</h2>
		<div class="stats-table">
			<div class="stats-row stats-header">
				<span class="stats-cell-label"></span>
				<span class="stats-cell-a">{a.name}</span>
				<span class="stats-cell-b">{b.name}</span>
			</div>
			<div class="stats-row">
				<span class="stats-cell-label">Status</span>
				<span class="stats-cell-a">{getResearchStatusLabel(a.researchStatus)}</span>
				<span class="stats-cell-b">{getResearchStatusLabel(b.researchStatus)}</span>
			</div>
			<div class="stats-row">
				<span class="stats-cell-label">References</span>
				<span class="stats-cell-a">{a.references?.length || 0} studies</span>
				<span class="stats-cell-b">{b.references?.length || 0} studies</span>
			</div>
			{#if a.latestResearch?.length || b.latestResearch?.length}
				<div class="stats-row">
					<span class="stats-cell-label">Latest</span>
					<span class="stats-cell-a">{a.latestResearch?.[0]?.date || '—'}</span>
					<span class="stats-cell-b">{b.latestResearch?.[0]?.date || '—'}</span>
				</div>
			{/if}
			<div class="stats-row">
				<span class="stats-cell-label">FDA Approved</span>
				<span class="stats-cell-a">{a.fdaApproved ? 'Yes' : 'No'}</span>
				<span class="stats-cell-b">{b.fdaApproved ? 'Yes' : 'No'}</span>
			</div>
		</div>
	</section>

	<!-- Cross-links -->
	<div class="compare-links">
		<div class="links-row">
			<a href="/peptides/{a.id}" class="link-pill">Full {a.name} profile</a>
			<a href="/peptides/{b.id}" class="link-pill">Full {b.name} profile</a>
			<a href="/calculator?peptide={a.id}" class="link-pill">{a.name} calculator</a>
			<a href="/calculator?peptide={b.id}" class="link-pill">{b.name} calculator</a>
		</div>
		{#if otherComparisons.length > 0}
			<div class="other-comparisons">
				<span class="other-label">More comparisons:</span>
				{#each otherComparisons as comp}
					<a href="/compare/{comp.slug}" class="link-pill link-pill-muted">{comp.name}</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Disclaimer -->
	<div class="compare-disclaimer">
		<AlertTriangle class="h-4 w-4 flex-shrink-0" />
		<p>This comparison is for educational and research purposes only. Consult a healthcare professional before use.</p>
	</div>
</div>

<style>
	.compare-page {
		max-width: 56rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	/* Breadcrumb */
	.compare-breadcrumb ol {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.compare-breadcrumb li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.compare-breadcrumb a {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		transition: color 0.15s;
	}

	.compare-breadcrumb a:hover { color: hsl(var(--foreground)); }
	.compare-breadcrumb .current { color: hsl(var(--foreground)); font-weight: 500; }
	.compare-breadcrumb :global(.sep) { color: hsl(var(--border)); }

	/* Hero */
	.compare-hero {
		margin-bottom: 2.5rem;
	}

	.compare-hero h1 {
		font-size: 2rem;
		font-weight: 400;
		line-height: 1.2;
		margin-bottom: 0.75rem;
	}

	@media (min-width: 640px) {
		.compare-hero h1 { font-size: 2.75rem; }
	}

	.hero-name {
		color: hsl(var(--foreground));
		text-decoration: none;
		transition: color 0.15s;
	}

	.hero-name:hover { color: hsl(var(--accent)); }

	.hero-vs {
		color: hsl(var(--accent));
		font-style: italic;
		margin: 0 0.25rem;
		font-size: 0.8em;
	}

	.hero-badges {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.badge {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--border));
	}

	.badge-sep {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
		font-style: italic;
	}

	.hero-interaction {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		background: color-mix(in srgb, var(--ix-color) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--ix-color) 25%, transparent);
		border-radius: 0.5rem;
		font-size: 0.8125rem;
	}

	.hero-ix-status {
		font-weight: 600;
		text-transform: capitalize;
		color: var(--ix-color);
	}

	.hero-ix-notes {
		color: hsl(var(--muted-foreground));
	}

	/* Sections */
	.compare-section {
		padding: 2rem 0;
	}

	.compare-section + .compare-section::before {
		content: '';
		display: block;
		height: 2px;
		background: hsl(var(--foreground) / 0.15);
		margin-bottom: 2rem;
	}

	.compare-section-warn {
		border-left: 3px solid hsl(var(--destructive));
		padding-left: 1.25rem;
		margin-left: -0.25rem;
	}

	.section-heading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.125rem;
		font-weight: 400;
		margin-bottom: 1.25rem;
	}

	:global(.section-icon) {
		width: 1.125rem;
		height: 1.125rem;
		color: hsl(var(--accent));
		flex-shrink: 0;
	}

	:global(.icon-warn) {
		color: hsl(var(--destructive));
	}

	/* Stats table (3-column) */
	.stats-table {
		display: flex;
		flex-direction: column;
	}

	.stats-row {
		display: grid;
		grid-template-columns: 7rem 1fr 1fr;
		gap: 1rem;
		padding: 0.625rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.3);
		align-items: baseline;
	}

	.stats-row:last-child { border-bottom: none; }

	.stats-header {
		border-bottom: 1px solid hsl(var(--border));
	}

	.stats-cell-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground));
	}

	.stats-cell-a,
	.stats-cell-b {
		font-size: 0.875rem;
		font-family: var(--font-mono);
		color: hsl(var(--foreground));
	}

	.stats-header .stats-cell-a,
	.stats-header .stats-cell-b {
		font-family: var(--font-sans);
		font-weight: 600;
		font-size: 0.8125rem;
		color: hsl(var(--accent));
	}

	/* Two-column layout */
	.two-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	@media (max-width: 640px) {
		.two-col { grid-template-columns: 1fr; gap: 1.5rem; }
		.stats-row { grid-template-columns: 5rem 1fr 1fr; gap: 0.5rem; }
	}

	.col-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--accent));
		padding-bottom: 0.5rem;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
		margin-bottom: 0.5rem;
	}

	/* Benefits */
	.benefit-row {
		display: flex;
		align-items: baseline;
		gap: 0.625rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.2);
		font-size: 0.8125rem;
		color: hsl(var(--foreground) / 0.8);
		line-height: 1.5;
	}

	.benefit-num {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: hsl(var(--accent));
		flex-shrink: 0;
	}

	/* Protocols */
	.quick-dose {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.75rem;
	}

	.proto-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.proto-row {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.2);
		font-size: 0.8125rem;
	}

	.proto-goal {
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.proto-dose {
		font-family: var(--font-mono);
		font-weight: 600;
		color: hsl(var(--accent));
	}

	.proto-freq {
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
	}

	/* Side effects */
	.se-item {
		padding: 0.375rem 0;
		font-size: 0.8125rem;
		color: hsl(var(--foreground) / 0.8);
		border-bottom: 1px solid hsl(var(--border) / 0.15);
	}

	.contra-section {
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border) / 0.3);
	}

	.contra-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--destructive));
		margin-bottom: 0.75rem;
	}

	.contra-item {
		padding: 0.375rem 0;
		font-size: 0.8125rem;
		color: hsl(var(--foreground) / 0.7);
	}

	/* Cross-links */
	.compare-links {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 2px solid hsl(var(--foreground) / 0.15);
	}

	.links-row, .other-comparisons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.other-comparisons {
		margin-top: 0.75rem;
	}

	.other-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.link-pill {
		display: inline-flex;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
		padding: 0.3rem 0.75rem;
		border: 1px solid hsl(var(--accent) / 0.3);
		border-radius: 999px;
		transition: all 0.15s;
	}

	.link-pill:hover {
		background: hsl(var(--accent) / 0.08);
		border-color: hsl(var(--accent) / 0.5);
	}

	.link-pill-muted {
		color: hsl(var(--muted-foreground));
		border-color: hsl(var(--border));
	}

	.link-pill-muted:hover {
		color: hsl(var(--accent));
		border-color: hsl(var(--accent) / 0.3);
		background: hsl(var(--accent) / 0.05);
	}

	/* Disclaimer */
	.compare-disclaimer {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: 2rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--muted) / 0.3);
		color: hsl(var(--muted-foreground));
		font-size: 0.8125rem;
	}
</style>
