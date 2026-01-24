<script lang="ts">
	import { Heart, Trash2, ExternalLink, FlaskConical } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Database } from '$lib/types/database';
	import { getAllPeptideSummaries } from '$lib/data/peptides';

	type Favorite = Database['public']['Tables']['user_favorite_peptides']['Row'];

	let { data }: { data: PageData } = $props();
	let favorites = $state(data.favorites as Favorite[]);

	// Get peptide info
	const peptides = getAllPeptideSummaries();
	const peptideMap = Object.fromEntries(peptides.map((p) => [p.id, p]));

	let removingId = $state<string | null>(null);

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function removeFavorite(id: string, peptideId: string) {
		removingId = id;

		try {
			const response = await fetch('/api/favorites', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ peptideId })
			});

			if (response.ok) {
				favorites = favorites.filter((f) => f.id !== id);
			} else {
				alert('Failed to remove favorite');
			}
		} catch {
			alert('Failed to remove favorite');
		} finally {
			removingId = null;
		}
	}
</script>

<svelte:head>
	<title>Favorites | PepPedia</title>
	<meta name="description" content="View and manage your favorite peptides." />
</svelte:head>

<div class="favorites-page">
	<header class="page-header">
		<h1>
			<Heart class="h-8 w-8" />
			My Favorites
		</h1>
		<p class="subtitle">Peptides you've bookmarked for quick access</p>
	</header>

	{#if favorites.length === 0}
		<div class="empty-state">
			<Heart class="h-16 w-16 text-muted-foreground" />
			<h2>No Favorites Yet</h2>
			<p>Add peptides to your favorites to quickly access them later.</p>
			<a href="/peptides" class="btn-primary">Browse Peptides</a>
		</div>
	{:else}
		<div class="favorites-grid">
			{#each favorites as favorite (favorite.id)}
				{@const peptide = peptideMap[favorite.peptide_id]}
				{#if peptide}
					<div class="favorite-card">
						<div class="card-content">
							<h3>
								<a href="/peptides/{peptide.id}">{peptide.name}</a>
							</h3>
							{#if peptide.subtitle}
								<p class="description">{peptide.subtitle}</p>
							{/if}
							{#if peptide.categories && peptide.categories.length > 0}
								<div class="categories">
									{#each peptide.categories.slice(0, 3) as category}
										<span class="category-tag">{category}</span>
									{/each}
								</div>
							{/if}
							<time datetime={favorite.created_at}>Added {formatDate(favorite.created_at)}</time>
						</div>
						<div class="card-actions">
							<a href="/peptides/{peptide.id}" class="btn-action">
								<ExternalLink class="h-4 w-4" />
								View
							</a>
							<a href="/peptides/{peptide.id}/submit-findings" class="btn-action">
								<FlaskConical class="h-4 w-4" />
								Submit Findings
							</a>
							<button
								class="btn-action danger"
								onclick={() => removeFavorite(favorite.id, favorite.peptide_id)}
								disabled={removingId === favorite.id}
							>
								<Trash2 class="h-4 w-4" />
								{removingId === favorite.id ? 'Removing...' : 'Remove'}
							</button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.favorites-page {
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

	/* Favorites Grid */
	.favorites-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.favorite-card {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
	}

	.card-content {
		flex: 1;
	}

	.card-content h3 {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.card-content a {
		color: var(--foreground);
		text-decoration: none;
	}

	.card-content a:hover {
		color: var(--accent);
	}

	.description {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		line-height: 1.5;
		margin-bottom: 0.75rem;
	}

	.categories {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.category-tag {
		padding: 0.25rem 0.5rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	.card-content time {
		display: block;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	.card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
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
		font-size: 0.8125rem;
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
		.favorites-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
