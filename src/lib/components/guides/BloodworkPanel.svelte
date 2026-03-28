<script>
	/**
	 * Interactive bloodwork panel builder for guides.
	 * User selects a situation (e.g. "Natural Baseline", "On-Cycle") and gets
	 * a tailored list of blood markers grouped by category.
	 *
	 * @typedef {{ name: string; category: string; range?: string; why?: string }} Marker
	 * @typedef {{ id: string; name: string; description: string; markers: Marker[] }} Panel
	 *
	 * @typedef {Object} Props
	 * @property {string} [title]
	 * @property {Panel[]} panels
	 */

	/** @type {Props} */
	let { title = 'Bloodwork Panel Builder', panels } = $props();

	/** @type {string} */
	let activePanel = $state(panels.length > 0 ? panels[0].id : '');

	/** @type {Set<number>} */
	let expandedRows = $state(new Set());

	const currentPanel = $derived(panels.find((p) => p.id === activePanel));

	/** @type {Record<string, Marker[]>} */
	const groupedMarkers = $derived.by(() => {
		if (!currentPanel) return {};
		/** @type {Record<string, Marker[]>} */
		const groups = {};
		for (const marker of currentPanel.markers) {
			if (!groups[marker.category]) {
				groups[marker.category] = [];
			}
			groups[marker.category].push(marker);
		}
		return groups;
	});

	const categories = $derived(Object.keys(groupedMarkers));

	const markerCount = $derived(currentPanel ? currentPanel.markers.length : 0);

	/** @param {number} index */
	function toggleRow(index) {
		const next = new Set(expandedRows);
		if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		expandedRows = next;
	}

	/** @param {string} id */
	function selectPanel(id) {
		activePanel = id;
		expandedRows = new Set();
	}

	/** Category icon/color mapping */
	const categoryStyles = /** @type {Record<string, { color: string; icon: string }>} */ ({
		Hormones: { color: 'var(--accent)', icon: 'H' },
		Blood: { color: 'var(--destructive)', icon: 'B' },
		Lipids: { color: 'var(--warning)', icon: 'L' },
		Liver: { color: 'var(--success)', icon: 'Lv' },
		Kidney: { color: 'var(--ring)', icon: 'K' },
		Metabolic: { color: 'var(--growth-hormone)', icon: 'M' },
		Thyroid: { color: 'var(--longevity)', icon: 'T' },
		Inflammation: { color: 'var(--skin)', icon: 'I' },
		Vitamins: { color: 'var(--cognitive)', icon: 'V' },
		Cardiac: { color: 'var(--destructive)', icon: 'C' },
		Iron: { color: 'var(--warning)', icon: 'Fe' }
	});

	/**
	 * @param {string} category
	 * @returns {{ color: string; icon: string }}
	 */
	function getCategoryStyle(category) {
		return categoryStyles[category] || { color: 'var(--muted-foreground)', icon: category.charAt(0) };
	}
</script>

<div class="bloodwork-panel">
	{#if title}
		<div class="panel-header">
			<h3 class="panel-title">{title}</h3>
		</div>
	{/if}

	<!-- Tab selector -->
	<div class="tab-bar">
		{#each panels as panel}
			<button
				class="tab-button"
				class:active={activePanel === panel.id}
				onclick={() => selectPanel(panel.id)}
			>
				{panel.name}
			</button>
		{/each}
	</div>

	<!-- Panel description & marker count -->
	{#if currentPanel}
		<div class="panel-meta">
			<p class="panel-description">{currentPanel.description}</p>
			<span class="marker-count">{markerCount} marker{markerCount !== 1 ? 's' : ''}</span>
		</div>

		<!-- Markers table grouped by category -->
		<div class="markers-container">
			{#each categories as category}
				{@const style = getCategoryStyle(category)}
				<div class="category-group">
					<div class="category-header">
						<span class="category-icon" style="background-color: {style.color};">
							{style.icon}
						</span>
						<span class="category-name">{category}</span>
						<span class="category-count">{groupedMarkers[category].length}</span>
					</div>

					<div class="marker-table">
						{#each groupedMarkers[category] as marker, i}
							{@const globalIndex = currentPanel.markers.indexOf(marker)}
							{@const hasWhy = marker.why && marker.why.length > 0}
							{@const isExpanded = expandedRows.has(globalIndex)}
							<div class="marker-row" class:expanded={isExpanded}>
								<button
									class="marker-row-button"
									onclick={() => hasWhy && toggleRow(globalIndex)}
									disabled={!hasWhy}
									class:clickable={hasWhy}
								>
									<span class="marker-name">{marker.name}</span>
									{#if marker.range}
										<span class="marker-range">{marker.range}</span>
									{/if}
									{#if hasWhy}
										<span class="expand-icon" class:rotated={isExpanded}>
											<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
												<path
													d="M3 4.5L6 7.5L9 4.5"
													stroke="currentColor"
													stroke-width="1.5"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										</span>
									{/if}
								</button>
								{#if hasWhy && isExpanded}
									<div class="marker-why">
										{marker.why}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.bloodwork-panel {
		margin: 2rem 0;
		border: 1px solid var(--border, #e5e4df);
		border-radius: 12px;
		overflow: hidden;
		background-color: var(--card, #ffffff);
	}

	.panel-header {
		padding: 1.25rem 1.5rem 0;
	}

	.panel-title {
		font-size: 1.0625rem;
		font-weight: 700;
		color: var(--foreground, #191919);
		margin: 0;
		line-height: 1.3;
	}

	/* Tab bar */
	.tab-bar {
		display: flex;
		gap: 0;
		padding: 1rem 1.5rem 0;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.tab-bar::-webkit-scrollbar {
		display: none;
	}

	.tab-button {
		flex-shrink: 0;
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--muted-foreground, #666663);
		background: none;
		border: 1px solid var(--border, #e5e4df);
		border-bottom: none;
		cursor: pointer;
		transition:
			color 0.15s ease,
			background-color 0.15s ease;
		white-space: nowrap;
		border-radius: 8px 8px 0 0;
		margin-right: -1px;
		position: relative;
	}

	.tab-button:hover {
		color: var(--foreground, #191919);
		background-color: var(--muted, #f0f0eb);
	}

	.tab-button.active {
		color: var(--foreground, #191919);
		background-color: var(--muted, #f0f0eb);
		font-weight: 600;
		border-color: var(--border, #e5e4df);
		z-index: 1;
	}

	/* Panel meta */
	.panel-meta {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background-color: var(--muted, #f0f0eb);
		border-top: 1px solid var(--border, #e5e4df);
		border-bottom: 1px solid var(--border, #e5e4df);
	}

	.panel-description {
		font-size: 0.8125rem;
		color: var(--muted-foreground, #666663);
		margin: 0;
		line-height: 1.5;
	}

	.marker-count {
		flex-shrink: 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent, #cc785c);
		background-color: var(--card, #ffffff);
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid var(--border, #e5e4df);
		white-space: nowrap;
	}

	/* Markers container */
	.markers-container {
		padding: 1rem 1.5rem 1.5rem;
	}

	/* Category groups */
	.category-group {
		margin-bottom: 1.25rem;
	}

	.category-group:last-child {
		margin-bottom: 0;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid var(--border, #e5e4df);
	}

	.category-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 6px;
		font-size: 0.625rem;
		font-weight: 700;
		color: white;
		flex-shrink: 0;
		line-height: 1;
	}

	.category-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--foreground, #191919);
	}

	.category-count {
		font-size: 0.6875rem;
		color: var(--muted-foreground, #91918d);
		margin-left: auto;
	}

	/* Marker table */
	.marker-table {
		display: flex;
		flex-direction: column;
	}

	.marker-row {
		border-bottom: 1px solid var(--border, #e5e4df);
	}

	.marker-row:last-child {
		border-bottom: none;
	}

	.marker-row-button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.25rem;
		background: none;
		border: none;
		text-align: left;
		font-family: inherit;
		color: inherit;
	}

	.marker-row-button.clickable {
		cursor: pointer;
	}

	.marker-row-button.clickable:hover {
		background-color: var(--muted, #f0f0eb);
		border-radius: 6px;
	}

	.marker-row-button:disabled {
		cursor: default;
	}

	.marker-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--foreground, #191919);
		flex: 1;
		min-width: 0;
	}

	.marker-range {
		font-size: 0.75rem;
		font-family: var(--font-mono, monospace);
		color: var(--muted-foreground, #91918d);
		flex-shrink: 0;
		white-space: nowrap;
	}

	.expand-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		color: var(--muted-foreground, #91918d);
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.expand-icon.rotated {
		transform: rotate(180deg);
	}

	.marker-why {
		padding: 0.375rem 0.25rem 0.75rem 0.25rem;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--muted-foreground, #666663);
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.bloodwork-panel {
			border-radius: 8px;
		}

		.panel-header {
			padding: 1rem 1rem 0;
		}

		.tab-bar {
			padding: 0.75rem 1rem 0;
		}

		.tab-button {
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}

		.panel-meta {
			padding: 0.75rem 1rem;
			flex-direction: column;
			gap: 0.5rem;
		}

		.markers-container {
			padding: 0.75rem 1rem 1rem;
		}

		.marker-row-button {
			gap: 0.5rem;
			padding: 0.5rem 0.125rem;
		}

		.marker-name {
			font-size: 0.75rem;
		}

		.marker-range {
			font-size: 0.6875rem;
		}

		.marker-why {
			font-size: 0.75rem;
		}
	}
</style>
