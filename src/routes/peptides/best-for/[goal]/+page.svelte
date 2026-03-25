<script lang="ts">
	import SEO from 'sk-seo';
	import { Home, ChevronRight, FlaskConical, ArrowRight } from 'lucide-svelte';
	import type { GoalConfig, RankedPeptide } from '$lib/utils/best-for';

	const SITE_URL = 'https://peptide-db.com';

	let { data }: { data: { goal: GoalConfig; ranked: RankedPeptide[]; allGoals: GoalConfig[] } } = $props();

	const goal = $derived(data.goal);
	const ranked = $derived(data.ranked);

	const canonicalUrl = $derived(`${SITE_URL}/peptides/best-for/${goal.slug}`);
	const title = $derived(`Best Peptides for ${goal.title} (2026) | Peptide Database`);
	const description = $derived(
		`${ranked.length} peptides ranked for ${goal.title.toLowerCase()}. ${goal.description} Evidence-based ranking from research data.`
	);

	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Article',
				headline: `Best Peptides for ${goal.title}`,
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
					{ '@type': 'ListItem', position: 2, name: 'Peptides', item: `${SITE_URL}/peptides` },
					{ '@type': 'ListItem', position: 3, name: `Best for ${goal.title}`, item: canonicalUrl }
				]
			}
		]
	});

	function getResearchLabel(status: string): string {
		const map: Record<string, string> = {
			'extensively-studied': 'Extensively Studied',
			'well-studied': 'Well Studied',
			'moderate-research': 'Moderate Research',
			emerging: 'Emerging',
			'limited-research': 'Limited',
			'fda-approved': 'FDA Approved'
		};
		return map[status] || status;
	}

	const effColors: Record<string, string> = {
		'most-effective': '#059669',
		effective: '#CC785C',
		moderate: '#D4A27F',
		emerging: '#91918D'
	};
</script>

<SEO
	{title}
	{description}
	keywords="best peptides for {goal.title.toLowerCase()}, {goal.title.toLowerCase()} peptides, peptide ranking"
	siteName="Peptide Database"
	canonical={canonicalUrl}
	twitter={true}
	openGraph={true}
	schemaOrg={true}
	{jsonld}
/>

<div class="bf-page">
	<!-- Breadcrumb -->
	<nav aria-label="Breadcrumb" class="bf-breadcrumb">
		<ol>
			<li><a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a><ChevronRight class="h-3.5 w-3.5 sep" /></li>
			<li><a href="/peptides">Peptides</a><ChevronRight class="h-3.5 w-3.5 sep" /></li>
			<li><span class="current">Best for {goal.title}</span></li>
		</ol>
	</nav>

	<header class="bf-header">
		<h1>Best Peptides for {goal.title}</h1>
		<p class="bf-desc">{goal.description}</p>
		<p class="bf-count">{ranked.length} peptides ranked by research effectiveness</p>
	</header>

	<!-- Ranking list -->
	<div class="bf-list">
		{#each ranked as peptide, i}
			<a href="/peptides/{peptide.id}" class="bf-card">
				<div class="bf-rank">{String(i + 1).padStart(2, '0')}</div>
				<div class="bf-card-body">
					<div class="bf-card-header">
						<h2 class="bf-name">{peptide.name}</h2>
						<span class="bf-status">{getResearchLabel(peptide.researchStatus)}</span>
					</div>
					{#if peptide.subtitle}
						<p class="bf-subtitle">{peptide.subtitle}</p>
					{/if}
					<div class="bf-indications">
						{#each peptide.indications as ind}
							<div class="bf-ind">
								<span class="bf-ind-dot" style="background: {effColors[ind.effectiveness] || '#91918D'}"></span>
								<span class="bf-ind-name">{ind.name}</span>
								<span class="bf-ind-eff" style="color: {effColors[ind.effectiveness] || '#91918D'}">{ind.effectiveness.replace('-', ' ')}</span>
							</div>
						{/each}
					</div>
					{#if peptide.halfLife}
						<span class="bf-hl">Half-life: {peptide.halfLife}</span>
					{/if}
				</div>
				<ArrowRight class="bf-arrow" />
			</a>
		{/each}
	</div>

	<!-- Other goals -->
	<div class="bf-other">
		<h3 class="bf-other-heading">Browse by Goal</h3>
		<div class="bf-goal-grid">
			{#each data.allGoals as g}
				<a
					href="/peptides/best-for/{g.slug}"
					class="bf-goal-link"
					class:bf-goal-active={g.slug === goal.slug}
				>{g.title}</a>
			{/each}
		</div>
	</div>
</div>

<style>
	.bf-page {
		max-width: 48rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	/* Breadcrumb */
	.bf-breadcrumb ol { display: flex; align-items: center; gap: 0.375rem; list-style: none; padding: 0; margin: 0 0 1.5rem; font-size: 0.8125rem; color: hsl(var(--muted-foreground)); }
	.bf-breadcrumb li { display: flex; align-items: center; gap: 0.375rem; }
	.bf-breadcrumb a { display: flex; align-items: center; gap: 0.25rem; color: hsl(var(--muted-foreground)); text-decoration: none; }
	.bf-breadcrumb a:hover { color: hsl(var(--foreground)); }
	.bf-breadcrumb .current { color: hsl(var(--foreground)); font-weight: 500; }
	.bf-breadcrumb :global(.sep) { color: hsl(var(--border)); }

	.bf-header { margin-bottom: 2rem; }
	.bf-header h1 { font-size: 2rem; font-weight: 400; margin-bottom: 0.5rem; }
	.bf-desc { font-size: 0.9375rem; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; }
	.bf-count { font-size: 0.8125rem; font-weight: 600; color: hsl(var(--accent)); }

	/* Ranking cards */
	.bf-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.bf-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.3);
		text-decoration: none;
		color: inherit;
		transition: background 0.1s;
	}

	.bf-card:hover {
		background: hsl(var(--muted) / 0.2);
		margin: 0 -1rem;
		padding-left: 1rem;
		padding-right: 1rem;
		border-radius: 0.5rem;
	}

	.bf-card:last-child { border-bottom: none; }

	.bf-rank {
		font-family: var(--font-mono);
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--accent));
		min-width: 2rem;
		padding-top: 0.125rem;
	}

	.bf-card-body {
		flex: 1;
		min-width: 0;
	}

	.bf-card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.25rem;
	}

	.bf-name {
		font-size: 1rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: hsl(var(--foreground));
	}

	.bf-status {
		font-size: 0.5625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground));
		padding: 0.125rem 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.25rem;
	}

	.bf-subtitle {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.5rem;
	}

	.bf-indications {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.bf-ind {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}

	.bf-ind-dot {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.bf-ind-name {
		color: hsl(var(--foreground) / 0.8);
	}

	.bf-ind-eff {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.bf-hl {
		display: inline-block;
		margin-top: 0.375rem;
		font-size: 0.6875rem;
		font-family: var(--font-mono);
		color: hsl(var(--muted-foreground));
	}

	:global(.bf-arrow) {
		width: 1rem;
		height: 1rem;
		color: hsl(var(--border));
		flex-shrink: 0;
		margin-top: 0.25rem;
		transition: color 0.1s;
	}

	.bf-card:hover :global(.bf-arrow) {
		color: hsl(var(--accent));
	}

	/* Other goals */
	.bf-other {
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 2px solid hsl(var(--foreground) / 0.15);
	}

	.bf-other-heading {
		font-size: 1rem;
		font-weight: 400;
		margin-bottom: 1rem;
		font-family: var(--font-serif);
	}

	.bf-goal-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.bf-goal-link {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		transition: all 0.15s;
	}

	.bf-goal-link:hover {
		border-color: hsl(var(--accent) / 0.5);
		color: hsl(var(--accent));
	}

	.bf-goal-active {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
		color: white;
	}

	.bf-goal-active:hover {
		background: hsl(var(--accent));
		color: white;
	}

	@media (max-width: 640px) {
		.bf-header h1 { font-size: 1.5rem; }
		.bf-rank { font-size: 1rem; min-width: 1.5rem; }
	}
</style>
