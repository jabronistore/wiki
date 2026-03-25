<script lang="ts">
	import SEO from 'sk-seo';
	import { Home, ChevronRight, ArrowRight } from 'lucide-svelte';

	let { data } = $props();
</script>

<SEO
	title="Best Peptides By Goal | Peptide Database"
	description="Find the best peptides for your research goal. Evidence-based rankings for healing, weight loss, cognitive enhancement, anti-aging, immune support, and more."
	keywords="best peptides, peptide rankings, best peptides for healing, best peptides for weight loss, peptide comparison"
	siteName="Peptide Database"
	canonical="https://peptide-db.com/peptides/best-for"
	twitter={true}
	openGraph={true}
/>

<div class="bf-index">
	<nav aria-label="Breadcrumb" class="breadcrumb">
		<ol>
			<li>
				<a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a><ChevronRight
					class="sep h-3.5 w-3.5"
				/>
			</li>
			<li><a href="/peptides">Peptides</a><ChevronRight class="sep h-3.5 w-3.5" /></li>
			<li><span class="current">Best For</span></li>
		</ol>
	</nav>

	<header class="page-header">
		<h1>Best Peptides by Goal</h1>
		<p class="subtitle">
			Evidence-based rankings across {data.goals.length} research categories. Peptides ranked by effectiveness
			data and editorial review.
		</p>
	</header>

	<div class="goal-grid">
		{#each data.goals as goal}
			<a href="/peptides/best-for/{goal.slug}" class="goal-card">
				<h2 class="goal-title">{goal.title}</h2>
				<p class="goal-desc">{goal.description}</p>
				<div class="goal-top">
					{#each goal.topPeptides as p, i}
						<span class="goal-peptide">
							<span class="goal-rank">{i + 1}.</span>
							{p.name}
						</span>
					{/each}
				</div>
				<div class="goal-footer">
					<span class="goal-count">{goal.totalCount} peptides</span>
					<ArrowRight class="goal-arrow" />
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.bf-index {
		max-width: 56rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

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

	.goal-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 0.75rem;
	}

	.goal-card {
		display: flex;
		flex-direction: column;
		padding: 1.25rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.15s;
		background: hsl(var(--background));
	}

	.goal-card:hover {
		border-color: hsl(var(--accent) / 0.5);
		background: hsl(var(--muted) / 0.2);
	}

	.goal-title {
		font-size: 1rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: hsl(var(--foreground));
		margin-bottom: 0.375rem;
	}

	.goal-desc {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
		margin-bottom: 0.75rem;
		flex: 1;
	}

	.goal-top {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		margin-bottom: 0.75rem;
	}

	.goal-peptide {
		font-size: 0.8125rem;
		color: hsl(var(--foreground) / 0.8);
	}

	.goal-rank {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: hsl(var(--accent));
		margin-right: 0.25rem;
	}

	.goal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.625rem;
		border-top: 1px solid hsl(var(--border) / 0.3);
	}

	.goal-count {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
	}

	:global(.goal-arrow) {
		width: 0.875rem;
		height: 0.875rem;
		color: hsl(var(--border));
		transition: color 0.1s;
	}

	.goal-card:hover :global(.goal-arrow) {
		color: hsl(var(--accent));
	}
</style>
