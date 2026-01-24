<script lang="ts">
	import { FlaskConical, MessageSquare, BarChart3 } from 'lucide-svelte';

	interface Props {
		peptideId: string;
		peptideName: string;
	}

	let { peptideId, peptideName }: Props = $props();
</script>

<section class="community-section">
	<div class="section-header">
		<h2>Community Research</h2>
		<p>Share experiences and learn from others researching {peptideName}</p>
	</div>

	<div class="action-links">
		<a href="/peptides/{peptideId}/results" class="action-link">
			<BarChart3 class="h-5 w-5" />
			<div class="link-content">
				<span class="link-title">View Results</span>
				<span class="link-desc">See aggregated findings from the community</span>
			</div>
		</a>
		<a href="/peptides/{peptideId}/discussion" class="action-link">
			<MessageSquare class="h-5 w-5" />
			<div class="link-content">
				<span class="link-title">Discussion</span>
				<span class="link-desc">Ask questions and share experiences</span>
			</div>
		</a>
		<a href="/peptides/{peptideId}/submit-findings" class="action-link primary">
			<FlaskConical class="h-5 w-5" />
			<div class="link-content">
				<span class="link-title">Submit Findings</span>
				<span class="link-desc">Contribute your research data</span>
			</div>
		</a>
	</div>
</section>

<style>
	.community-section {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 1.5rem;
	}

	.section-header {
		margin-bottom: 1.25rem;
	}

	.section-header h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--foreground);
		margin: 0 0 0.25rem 0;
	}

	.section-header p {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		margin: 0;
	}

	.action-links {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.action-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 10px;
		text-decoration: none;
		transition: all 0.2s;
	}

	.action-link:hover {
		border-color: var(--accent);
	}

	.action-link:hover .link-title {
		color: var(--accent);
	}

	.action-link.primary {
		background: var(--accent);
		border-color: var(--accent);
	}

	.action-link.primary .link-title,
	.action-link.primary .link-desc {
		color: white;
	}

	.action-link.primary:hover {
		opacity: 0.9;
	}

	.link-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.link-title {
		font-weight: 500;
		color: var(--foreground);
	}

	.link-desc {
		font-size: 0.8125rem;
		color: var(--muted-foreground);
	}
</style>
