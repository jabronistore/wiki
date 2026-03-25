<script lang="ts">
	import SEO from 'sk-seo';
	import { Home, ChevronRight, ArrowRight } from 'lucide-svelte';
	import type { GoalConfig, RankedPeptide } from '$lib/utils/best-for';

	const SITE_URL = 'https://peptide-db.com';

	interface GoalResult extends GoalConfig {
		topPeptides: RankedPeptide[];
	}

	let { data }: { data: { goalResults: GoalResult[] } } = $props();

	let selectedGoal = $state<string | null>(null);
	let experience = $state<'beginner' | 'intermediate' | 'advanced' | null>(null);

	const activeGoal = $derived(data.goalResults.find((g) => g.slug === selectedGoal));
	const recommendations = $derived(activeGoal?.topPeptides || []);

	function reset() {
		selectedGoal = null;
		experience = null;
	}
</script>

<SEO
	title="Get Started with Peptides | Peptide Database"
	description="Find the right peptide for your research goals. Select your goal and experience level to get personalised recommendations with dosing protocols."
	keywords="peptide guide, which peptide should I use, peptide recommendations, beginner peptides, peptide protocol"
	siteName="Peptide Database"
	canonical="{SITE_URL}/get-started"
	twitter={true}
	openGraph={true}
/>

<div class="gs-page">
	<nav aria-label="Breadcrumb" class="gs-breadcrumb">
		<ol>
			<li><a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a><ChevronRight class="h-3.5 w-3.5 sep" /></li>
			<li><span class="current">Get Started</span></li>
		</ol>
	</nav>

	<header class="gs-header">
		<h1>Find Your Peptide</h1>
		<p class="gs-subtitle">Select your research goal to see the top-ranked peptides with dosing protocols and calculator links.</p>
	</header>

	<!-- Step 1: Goal selection -->
	<div class="gs-step">
		<div class="gs-step-label">What's your goal?</div>
		<div class="gs-goal-grid">
			{#each data.goalResults as goal}
				<button
					type="button"
					class="gs-goal"
					class:gs-goal-active={selectedGoal === goal.slug}
					onclick={() => { selectedGoal = goal.slug; experience = null; }}
				>
					<span class="gs-goal-title">{goal.title}</span>
					<span class="gs-goal-count">{goal.topPeptides.length > 3 ? '3+' : goal.topPeptides.length} peptides</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Step 2: Experience level (shown after goal selection) -->
	{#if selectedGoal}
		<div class="gs-step">
			<div class="gs-step-label">Experience level?</div>
			<div class="gs-exp-row">
				<button type="button" class="gs-exp" class:gs-exp-active={experience === 'beginner'} onclick={() => (experience = 'beginner')}>
					<span class="gs-exp-title">Beginner</span>
					<span class="gs-exp-desc">First time researching peptides</span>
				</button>
				<button type="button" class="gs-exp" class:gs-exp-active={experience === 'intermediate'} onclick={() => (experience = 'intermediate')}>
					<span class="gs-exp-title">Intermediate</span>
					<span class="gs-exp-desc">Some experience with protocols</span>
				</button>
				<button type="button" class="gs-exp" class:gs-exp-active={experience === 'advanced'} onclick={() => (experience = 'advanced')}>
					<span class="gs-exp-title">Advanced</span>
					<span class="gs-exp-desc">Familiar with stacking and cycling</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 3: Recommendations -->
	{#if selectedGoal && experience && recommendations.length > 0}
		<div class="gs-results">
			<div class="gs-results-header">
				<h2>Recommended for {activeGoal?.title}</h2>
				<button type="button" class="gs-reset" onclick={reset}>Start over</button>
			</div>

			{#if experience === 'beginner'}
				<p class="gs-results-note">
					Starting simple. These peptides have the strongest evidence and most straightforward protocols.
				</p>
			{:else if experience === 'advanced'}
				<p class="gs-results-note">
					Full ranking by effectiveness. Consider stacking — check the <a href="/tools/interactions">interaction checker</a> before combining.
				</p>
			{/if}

			<div class="gs-rec-list">
				{#each recommendations as peptide, i}
					<div class="gs-rec">
						<div class="gs-rec-rank">{String(i + 1).padStart(2, '0')}</div>
						<div class="gs-rec-body">
							<a href="/peptides/{peptide.id}" class="gs-rec-name">{peptide.name}</a>
							{#if peptide.halfLife}
								<span class="gs-rec-hl">t½ {peptide.halfLife}</span>
							{/if}
							<div class="gs-rec-inds">
								{#each peptide.indications.slice(0, 3) as ind}
									<span class="gs-rec-ind">{ind.name}</span>
								{/each}
							</div>
							<div class="gs-rec-links">
								<a href="/peptides/{peptide.id}" class="gs-link">Full profile</a>
								<a href="/calculator?peptide={peptide.id}" class="gs-link">Calculator</a>
								<a href="/peptides/best-for/{selectedGoal}" class="gs-link">See all ranked</a>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Contextual next steps -->
			<div class="gs-next">
				<h3 class="gs-next-heading">Next steps</h3>
				<div class="gs-next-grid">
					<a href="/peptides/best-for/{selectedGoal}" class="gs-next-card">
						<span class="gs-next-title">Full ranking</span>
						<span class="gs-next-desc">See all peptides ranked for {activeGoal?.title?.toLowerCase()}</span>
						<ArrowRight class="gs-next-arrow" />
					</a>
					<a href="/calculator" class="gs-next-card">
						<span class="gs-next-title">Reconstitution calculator</span>
						<span class="gs-next-desc">Calculate your dose volumes</span>
						<ArrowRight class="gs-next-arrow" />
					</a>
					<a href="/tools/interactions" class="gs-next-card">
						<span class="gs-next-title">Interaction checker</span>
						<span class="gs-next-desc">Check stack compatibility</span>
						<ArrowRight class="gs-next-arrow" />
					</a>
					<a href="/guides" class="gs-next-card">
						<span class="gs-next-title">Guides</span>
						<span class="gs-next-desc">In-depth research articles</span>
						<ArrowRight class="gs-next-arrow" />
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.gs-page {
		max-width: 48rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}

	.gs-breadcrumb ol { display: flex; align-items: center; gap: 0.375rem; list-style: none; padding: 0; margin: 0 0 1.5rem; font-size: 0.8125rem; color: hsl(var(--muted-foreground)); }
	.gs-breadcrumb li { display: flex; align-items: center; gap: 0.375rem; }
	.gs-breadcrumb a { display: flex; align-items: center; gap: 0.25rem; color: hsl(var(--muted-foreground)); text-decoration: none; }
	.gs-breadcrumb a:hover { color: hsl(var(--foreground)); }
	.gs-breadcrumb .current { color: hsl(var(--foreground)); font-weight: 500; }
	.gs-breadcrumb :global(.sep) { color: hsl(var(--border)); }

	.gs-header { margin-bottom: 2rem; }
	.gs-header h1 { font-size: 2rem; font-weight: 400; margin-bottom: 0.5rem; }
	.gs-subtitle { font-size: 0.9375rem; color: hsl(var(--muted-foreground)); }

	/* Steps */
	.gs-step {
		margin-bottom: 2rem;
	}

	.gs-step-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.75rem;
	}

	/* Goal grid */
	.gs-goal-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
	}

	.gs-goal {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.75rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		-webkit-tap-highlight-color: transparent;
	}

	.gs-goal:hover { border-color: hsl(var(--accent) / 0.5); }

	.gs-goal-active {
		border-color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.06);
	}

	.gs-goal-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.gs-goal-count {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
	}

	/* Experience */
	.gs-exp-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	@media (max-width: 480px) {
		.gs-exp-row { grid-template-columns: 1fr; }
	}

	.gs-exp {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.875rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		-webkit-tap-highlight-color: transparent;
	}

	.gs-exp:hover { border-color: hsl(var(--accent) / 0.5); }
	.gs-exp-active { border-color: hsl(var(--accent)); background: hsl(var(--accent) / 0.06); }

	.gs-exp-title { font-size: 0.875rem; font-weight: 600; color: hsl(var(--foreground)); }
	.gs-exp-desc { font-size: 0.6875rem; color: hsl(var(--muted-foreground)); }

	/* Results */
	.gs-results {
		padding-top: 1.5rem;
		border-top: 2px solid hsl(var(--foreground) / 0.15);
	}

	.gs-results-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.gs-results-header h2 { font-size: 1.25rem; font-weight: 400; }

	.gs-reset {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		background: none;
		border: none;
		cursor: pointer;
	}

	.gs-results-note {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.25rem;
	}

	.gs-results-note a { color: hsl(var(--accent)); }

	/* Recommendation cards */
	.gs-rec-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.gs-rec {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		padding: 1rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.3);
	}

	.gs-rec:last-child { border-bottom: none; }

	.gs-rec-rank {
		font-family: var(--font-mono);
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--accent));
		min-width: 1.75rem;
	}

	.gs-rec-body { flex: 1; min-width: 0; }

	.gs-rec-name {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		text-decoration: none;
	}

	.gs-rec-name:hover { color: hsl(var(--accent)); }

	.gs-rec-hl {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
		margin-left: 0.5rem;
	}

	.gs-rec-inds {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.375rem;
	}

	.gs-rec-ind {
		font-size: 0.625rem;
		font-weight: 500;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
	}

	.gs-rec-links {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.gs-link {
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
	}

	.gs-link:hover { text-decoration: underline; }

	/* Next steps */
	.gs-next {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid hsl(var(--border) / 0.5);
	}

	.gs-next-heading {
		font-size: 1rem;
		font-weight: 400;
		font-family: var(--font-serif);
		margin-bottom: 0.75rem;
	}

	.gs-next-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	@media (max-width: 480px) {
		.gs-next-grid { grid-template-columns: 1fr; }
	}

	.gs-next-card {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.875rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.15s;
		position: relative;
	}

	.gs-next-card:hover {
		border-color: hsl(var(--accent) / 0.5);
		background: hsl(var(--muted) / 0.3);
	}

	.gs-next-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.gs-next-desc {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
	}

	:global(.gs-next-arrow) {
		position: absolute;
		top: 0.875rem;
		right: 0.875rem;
		width: 0.875rem;
		height: 0.875rem;
		color: hsl(var(--border));
	}

	.gs-next-card:hover :global(.gs-next-arrow) { color: hsl(var(--accent)); }
</style>
