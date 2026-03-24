<script lang="ts">
	import { FlaskConical, MessageSquare, BarChart3, Users, ArrowRight } from 'lucide-svelte';

	interface Props {
		peptideId: string;
		peptideName: string;
	}

	let { peptideId, peptideName }: Props = $props();
</script>

<section class="community-section">
	<div class="section-header">
		<div class="header-icon">
			<Users class="h-6 w-6" />
		</div>
		<div class="header-text">
			<h2>Community Research</h2>
			<p>Join others researching {peptideName} — share findings, ask questions, and learn from real experiences</p>
		</div>
	</div>

	<div class="action-cards">
		<a href="/peptides/{peptideId}/results" class="action-card">
			<div class="card-icon results">
				<BarChart3 class="h-5 w-5" />
			</div>
			<div class="card-content">
				<span class="card-title">View Results</span>
				<span class="card-desc">Aggregated community findings</span>
			</div>
			<ArrowRight class="h-4 w-4 card-arrow" />
		</a>

		<a href="/peptides/{peptideId}/discussion" class="action-card">
			<div class="card-icon discussion">
				<MessageSquare class="h-5 w-5" />
			</div>
			<div class="card-content">
				<span class="card-title">Discussion</span>
				<span class="card-desc">Questions & experiences</span>
			</div>
			<ArrowRight class="h-4 w-4 card-arrow" />
		</a>

		<a href="/peptides/{peptideId}/submit-findings" class="action-card cta">
			<div class="card-icon submit">
				<FlaskConical class="h-5 w-5" />
			</div>
			<div class="card-content">
				<span class="card-title">Submit Your Findings</span>
				<span class="card-desc">Contribute your research data</span>
			</div>
			<ArrowRight class="h-4 w-4 card-arrow" />
		</a>
	</div>
</section>

<style>
	.community-section {
		background: linear-gradient(135deg, hsl(var(--accent) / 0.08) 0%, hsl(var(--accent) / 0.02) 100%);
		border: 2px solid hsl(var(--accent) / 0.2);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
		overflow: hidden;
		max-width: 100%;
		box-sizing: border-box;
	}

	.section-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: hsl(var(--accent));
		color: white;
		border-radius: 0.75rem;
		flex-shrink: 0;
	}

	.header-text {
		min-width: 0;
		flex: 1;
	}

	.header-text h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0 0 0.25rem 0;
	}

	.header-text p {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		line-height: 1.5;
		word-wrap: break-word;
	}

	.action-cards {
		display: grid;
		gap: 0.75rem;
		width: 100%;
	}

	@media (min-width: 768px) {
		.action-cards {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.action-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.action-card:hover {
		border-color: hsl(var(--accent) / 0.5);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px hsl(var(--accent) / 0.1);
	}

	.action-card.cta {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
	}

	.action-card.cta:hover {
		background: hsl(var(--accent) / 0.9);
		transform: translateY(-2px);
		box-shadow: 0 4px 16px hsl(var(--accent) / 0.3);
	}

	.action-card.cta .card-title,
	.action-card.cta .card-desc {
		color: white;
	}

	.action-card.cta .card-icon {
		background: hsl(0 0% 100% / 0.2);
		color: white;
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		flex-shrink: 0;
	}

	.card-icon.results {
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
	}

	.card-icon.discussion {
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
	}

	.card-icon.submit {
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-weight: 600;
		font-size: 0.9375rem;
		color: hsl(var(--foreground));
	}

	.card-desc {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

</style>
