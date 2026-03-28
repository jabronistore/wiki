<script lang="ts">
	interface Compound {
		name: string;
		url?: string;
		note?: string;
	}

	interface Family {
		name: string;
		description: string;
		color?: string;
		compounds: Compound[];
	}

	interface Props {
		title?: string;
		families: Family[];
	}

	let { title, families }: Props = $props();

	// Default colors for families that don't specify one
	const defaultColors = [
		'var(--accent)',
		'var(--success)',
		'var(--warning)',
		'var(--growth-hormone)',
		'var(--longevity)',
		'var(--sleep)',
		'var(--cognitive)',
		'var(--skin)'
	];

	function getFamilyColor(family: Family, index: number): string {
		return family.color || `hsl(${defaultColors[index % defaultColors.length]})`;
	}
</script>

<div class="family-tree">
	{#if title}
		<div class="tree-header">
			<h3 class="tree-title">{title}</h3>
		</div>
	{/if}

	<div class="families-grid" style="--cols: {families.length}">
		{#each families as family, i}
			{@const color = getFamilyColor(family, i)}
			<div class="family-column">
				<!-- Family header -->
				<div class="family-head">
					<div class="family-accent" style="background: {color};"></div>
					<h4 class="family-name">{family.name}</h4>
					<p class="family-description">{family.description}</p>
				</div>

				<!-- Connector line -->
				<div class="connector" style="--connector-color: {color};"></div>

				<!-- Compounds list -->
				<ul class="compound-list">
					{#each family.compounds as compound}
						<li class="compound-item">
							<div class="compound-dot" style="background: {color};"></div>
							<div class="compound-content">
								{#if compound.url}
									<a href={compound.url} class="compound-link">
										{compound.name}
									</a>
								{:else}
									<span class="compound-label">{compound.name}</span>
								{/if}
								{#if compound.note}
									<span class="compound-note">{compound.note}</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</div>

<style>
	.family-tree {
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--card));
		overflow: hidden;
	}

	.tree-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.5);
	}

	.tree-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	/* Grid of family columns */
	.families-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		gap: 0;
		padding: 0;
	}

	.family-column {
		display: flex;
		flex-direction: column;
		padding: 1.25rem 1rem;
		border-right: 1px solid hsl(var(--border) / 0.5);
	}

	.family-column:last-child {
		border-right: none;
	}

	/* Family header */
	.family-head {
		text-align: center;
		padding-bottom: 0.75rem;
	}

	.family-accent {
		width: 2.5rem;
		height: 3px;
		border-radius: 2px;
		margin: 0 auto 0.75rem;
	}

	.family-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 0.375rem;
		line-height: 1.3;
	}

	.family-description {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
		margin: 0;
	}

	/* Connector line between header and compounds */
	.connector {
		width: 1px;
		height: 1rem;
		background: var(--connector-color);
		opacity: 0.4;
		margin: 0 auto;
	}

	/* Compounds list */
	.compound-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.compound-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		transition: background 0.15s ease;
	}

	.compound-item:hover {
		background: hsl(var(--muted) / 0.5);
	}

	.compound-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 0.375rem;
	}

	.compound-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.compound-link {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
		transition: color 0.15s ease;
		line-height: 1.4;
	}

	.compound-link:hover {
		text-decoration: underline;
	}

	.compound-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		line-height: 1.4;
	}

	.compound-note {
		font-size: 0.6875rem;
		font-style: italic;
		color: hsl(var(--muted-foreground));
		line-height: 1.4;
	}

	/* Responsive: stack columns on small screens */
	@media (max-width: 768px) {
		.families-grid {
			grid-template-columns: 1fr;
		}

		.family-column {
			border-right: none;
			border-bottom: 1px solid hsl(var(--border) / 0.5);
			padding: 1rem;
		}

		.family-column:last-child {
			border-bottom: none;
		}

		.family-head {
			text-align: left;
		}

		.family-accent {
			margin: 0 0 0.625rem;
		}

		.connector {
			margin: 0 0 0 1.125rem;
		}
	}
</style>
