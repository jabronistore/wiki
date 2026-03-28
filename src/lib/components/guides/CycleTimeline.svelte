<script lang="ts">
	interface Compound {
		name: string;
		url?: string;
		startWeek: number;
		endWeek: number;
		dose: string;
		color?: string;
	}

	interface Props {
		title?: string;
		weeks: number;
		compounds: Compound[];
	}

	let { title, weeks, compounds }: Props = $props();

	// Default colors for compounds that don't specify one
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

	function getColor(compound: Compound, index: number): string {
		return compound.color || `hsl(${defaultColors[index % defaultColors.length]})`;
	}

	// Generate week markers
	const weekMarkers = $derived(Array.from({ length: weeks }, (_, i) => i + 1));

	// Selected compound for detail view
	let selectedIndex: number | null = $state(null);

	function toggleSelect(index: number) {
		selectedIndex = selectedIndex === index ? null : index;
	}
</script>

<div class="cycle-timeline">
	{#if title}
		<div class="timeline-header">
			<h3 class="timeline-title">{title}</h3>
		</div>
	{/if}

	<div class="timeline-body">
		<!-- Scrollable chart area -->
		<div class="chart-scroll">
			<div class="chart" style="--total-weeks: {weeks}">
				<!-- Week header row -->
				<div class="week-header">
					<div class="label-cell">
						<span class="label-heading">Compound</span>
					</div>
					<div class="week-cells">
						{#each weekMarkers as week}
							<div class="week-cell">
								<span class="week-number">{week}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Compound rows -->
				{#each compounds as compound, i}
					{@const color = getColor(compound, i)}
					{@const startPct = ((compound.startWeek - 1) / weeks) * 100}
					{@const widthPct = ((compound.endWeek - compound.startWeek + 1) / weeks) * 100}
					<div class="compound-row" class:selected={selectedIndex === i}>
						<div class="label-cell">
							{#if compound.url}
								<a href={compound.url} class="compound-name link">{compound.name}</a>
							{:else}
								<span class="compound-name">{compound.name}</span>
							{/if}
						</div>
						<div class="week-cells">
							<!-- Background grid lines -->
							{#each weekMarkers as _}
								<div class="grid-line"></div>
							{/each}
							<!-- The bar -->
							<button
								type="button"
								class="bar"
								style="left: {startPct}%; width: {widthPct}%; --bar-color: {color};"
								onclick={() => toggleSelect(i)}
								title="{compound.name}: {compound.dose} (Wk {compound.startWeek}-{compound.endWeek})"
							>
								<span class="bar-label">
									{compound.dose}
								</span>
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Detail panel -->
		{#if selectedIndex !== null && compounds[selectedIndex]}
			{@const c = compounds[selectedIndex]}
			{@const color = getColor(c, selectedIndex)}
			<div class="detail-panel">
				<div class="detail-swatch" style="background: {color};"></div>
				<div class="detail-info">
					<p class="detail-name">
						{#if c.url}
							<a href={c.url} class="detail-link">{c.name}</a>
						{:else}
							{c.name}
						{/if}
					</p>
					<p class="detail-meta">
						{c.dose} &middot; Weeks {c.startWeek}&ndash;{c.endWeek}
						({c.endWeek - c.startWeek + 1} weeks)
					</p>
				</div>
				<button type="button" class="detail-close" onclick={() => (selectedIndex = null)}>
					&times;
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.cycle-timeline {
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--card));
		overflow: hidden;
	}

	.timeline-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.5);
	}

	.timeline-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.timeline-body {
		padding: 1.25rem 1.5rem;
	}

	/* Scrollable wrapper for mobile */
	.chart-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		margin: 0 -0.25rem;
		padding: 0 0.25rem;
	}

	.chart {
		min-width: max(100%, calc(var(--total-weeks) * 3rem + 9rem));
	}

	/* Week header */
	.week-header {
		display: flex;
		align-items: flex-end;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid hsl(var(--border));
		margin-bottom: 0.25rem;
	}

	.label-cell {
		flex-shrink: 0;
		width: 9rem;
		padding-right: 0.75rem;
	}

	.label-heading {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--muted-foreground));
	}

	.week-cells {
		flex: 1;
		display: flex;
		position: relative;
	}

	.week-cell {
		flex: 1;
		text-align: center;
	}

	.week-number {
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		font-family: var(--font-mono);
	}

	/* Compound rows */
	.compound-row {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0.375rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
		transition: background 0.15s ease;
	}

	.compound-row:last-child {
		border-bottom: none;
	}

	.compound-row:hover,
	.compound-row.selected {
		background: hsl(var(--muted) / 0.4);
	}

	.compound-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
	}

	.compound-name.link {
		color: hsl(var(--accent));
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.compound-name.link:hover {
		text-decoration: underline;
	}

	/* Grid lines behind bars */
	.compound-row .week-cells {
		min-height: 2rem;
		align-items: center;
	}

	.grid-line {
		flex: 1;
		height: 100%;
		border-right: 1px solid hsl(var(--border) / 0.3);
	}

	.grid-line:last-child {
		border-right: none;
	}

	/* The bar */
	.bar {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		height: 1.75rem;
		background: var(--bar-color);
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: 0 0.5rem;
		transition:
			opacity 0.15s ease,
			box-shadow 0.15s ease;
		z-index: 1;
	}

	.bar:hover {
		opacity: 0.9;
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.15);
	}

	.selected .bar {
		box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px var(--bar-color);
	}

	.bar-label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	/* Detail panel */
	.detail-panel {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1rem;
		padding: 0.875rem 1rem;
		background: hsl(var(--muted) / 0.5);
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
	}

	.detail-swatch {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 0.25rem;
		flex-shrink: 0;
	}

	.detail-info {
		flex: 1;
		min-width: 0;
	}

	.detail-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.detail-link {
		color: hsl(var(--accent));
		text-decoration: none;
	}

	.detail-link:hover {
		text-decoration: underline;
	}

	.detail-meta {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin: 0.125rem 0 0;
	}

	.detail-close {
		font-size: 1.25rem;
		line-height: 1;
		color: hsl(var(--muted-foreground));
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		transition: color 0.15s ease;
	}

	.detail-close:hover {
		color: hsl(var(--foreground));
	}

	/* Mobile refinements */
	@media (max-width: 640px) {
		.timeline-body {
			padding: 1rem;
		}

		.label-cell {
			width: 6.5rem;
		}

		.compound-name {
			font-size: 0.75rem;
		}

		.bar-label {
			font-size: 0.625rem;
		}
	}
</style>
