<script lang="ts">
	import {
		FileText,
		Clock,
		CheckCircle,
		Edit,
		Trash2,
		ExternalLink,
		FlaskConical
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Database } from '$lib/types/database';
	import { getAllPeptideSummaries } from '$lib/data/peptides';

	type Finding = Database['public']['Tables']['findings']['Row'] & {
		finding_results: Database['public']['Tables']['finding_results']['Row'][];
	};

	let { data }: { data: PageData } = $props();
	const profile = data.profile;
	const findings = data.findings as Finding[];

	// Get peptide info
	const peptides = getAllPeptideSummaries();
	const peptideMap = Object.fromEntries(peptides.map((p) => [p.id, p]));

	let deletingId = $state<string | null>(null);

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function deleteFinding(id: string) {
		if (!confirm('Are you sure you want to delete this submission?')) return;

		deletingId = id;

		try {
			const response = await fetch(`/api/findings/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Remove from local state
				window.location.reload();
			} else {
				alert('Failed to delete submission');
			}
		} catch {
			alert('Failed to delete submission');
		} finally {
			deletingId = null;
		}
	}
</script>

<svelte:head>
	<title>My Submissions | PepPedia</title>
	<meta name="description" content="View and manage your research findings submissions." />
</svelte:head>

<div class="submissions-page">
	<header class="page-header">
		<h1>
			<FileText class="h-8 w-8" />
			My Submissions
		</h1>
		<p class="subtitle">Manage your research findings and drafts</p>
	</header>

	<!-- Stats Summary -->
	<div class="stats-bar">
		<div class="stat">
			<span class="stat-value">{findings.length}</span>
			<span class="stat-label">Total</span>
		</div>
		<div class="stat">
			<span class="stat-value">{findings.filter((f) => f.status === 'published').length}</span>
			<span class="stat-label">Published</span>
		</div>
		<div class="stat">
			<span class="stat-value">{findings.filter((f) => f.status === 'draft').length}</span>
			<span class="stat-label">Drafts</span>
		</div>
	</div>

	{#if findings.length === 0}
		<div class="empty-state">
			<FlaskConical class="h-16 w-16 text-muted-foreground" />
			<h2>No Submissions Yet</h2>
			<p>Share your research findings with the community.</p>
			<a href="/peptides" class="btn-primary">Browse Peptides</a>
		</div>
	{:else}
		<div class="submissions-list">
			{#each findings as finding (finding.id)}
				{@const peptide = peptideMap[finding.peptide_id]}
				{@const result = finding.finding_results?.[0]}
				<div class="submission-card">
					<div class="submission-header">
						<div class="peptide-info">
							<h3>
								<a href="/peptides/{finding.peptide_id}">{peptide?.name || finding.peptide_id}</a>
							</h3>
							<span class="status-badge" class:draft={finding.status === 'draft'}>
								{#if finding.status === 'draft'}
									<Clock class="h-3 w-3" />
									Draft
								{:else}
									<CheckCircle class="h-3 w-3" />
									Published
								{/if}
							</span>
						</div>
						<time datetime={finding.created_at}>{formatDate(finding.created_at)}</time>
					</div>

					<div class="submission-body">
						<div class="detail-grid">
							{#if result?.effectiveness_rating}
								<div class="detail-item">
									<span class="detail-label">Effectiveness</span>
									<span class="detail-value">{result.effectiveness_rating}/10</span>
								</div>
							{/if}
							{#if finding.cycle_length_weeks}
								<div class="detail-item">
									<span class="detail-label">Cycle Length</span>
									<span class="detail-value">{finding.cycle_length_weeks} weeks</span>
								</div>
							{/if}
							{#if finding.administration_method}
								<div class="detail-item">
									<span class="detail-label">Method</span>
									<span class="detail-value">{finding.administration_method}</span>
								</div>
							{/if}
							{#if finding.would_use_again}
								<div class="detail-item">
									<span class="detail-label">Would Use Again</span>
									<span class="detail-value capitalize">{finding.would_use_again}</span>
								</div>
							{/if}
						</div>

						{#if finding.notes}
							<p class="notes">{finding.notes.slice(0, 150)}{finding.notes.length > 150 ? '...' : ''}</p>
						{/if}
					</div>

					<div class="submission-actions">
						{#if finding.status === 'draft'}
							<a href="/peptides/{finding.peptide_id}/submit-findings?edit={finding.id}" class="btn-action">
								<Edit class="h-4 w-4" />
								Continue Editing
							</a>
						{:else}
							<a href="/peptides/{finding.peptide_id}/results" class="btn-action">
								<ExternalLink class="h-4 w-4" />
								View Results
							</a>
						{/if}
						<button
							class="btn-action danger"
							onclick={() => deleteFinding(finding.id)}
							disabled={deletingId === finding.id}
						>
							<Trash2 class="h-4 w-4" />
							{deletingId === finding.id ? 'Deleting...' : 'Delete'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.submissions-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 2rem;
		font-weight: 600;
		color: var(--foreground);
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: var(--muted-foreground);
	}

	/* Stats Bar */
	.stats-bar {
		display: flex;
		gap: 2rem;
		padding: 1.5rem;
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--foreground);
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.empty-state h2 {
		font-size: 1.5rem;
		margin: 1rem 0 0.5rem;
	}

	.empty-state p {
		color: var(--muted-foreground);
		margin-bottom: 1.5rem;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
	}

	/* Submissions List */
	.submissions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.submission-card {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
	}

	.submission-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.peptide-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.peptide-info h3 {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.peptide-info a {
		color: var(--foreground);
		text-decoration: none;
	}

	.peptide-info a:hover {
		color: var(--accent);
	}

	.status-badge {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: #22c55e20;
		color: #22c55e;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-badge.draft {
		background: var(--warning);
		color: var(--foreground);
	}

	.submission-header time {
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	/* Submission Body */
	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-label {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-weight: 500;
		color: var(--foreground);
	}

	.detail-value.capitalize {
		text-transform: capitalize;
	}

	.notes {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		line-height: 1.5;
		padding: 0.75rem;
		background: var(--background);
		border-radius: 6px;
	}

	/* Actions */
	.submission-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.btn-action {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.875rem;
		color: var(--foreground);
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-action:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.btn-action.danger:hover {
		border-color: var(--destructive);
		color: var(--destructive);
	}

	.btn-action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.stats-bar {
			justify-content: space-around;
		}

		.submission-header {
			flex-direction: column;
			gap: 0.5rem;
		}

		.submission-actions {
			flex-direction: column;
		}

		.btn-action {
			justify-content: center;
		}
	}
</style>
