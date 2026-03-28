<script>
	/**
	 * Printable bloodwork order checklist for guides.
	 * Users pick a panel tab, check off markers, and copy the list to take to the lab.
	 *
	 * @typedef {{ name: string; category: string; essential: boolean }} Marker
	 * @typedef {{ id: string; name: string; description: string; markers: Marker[] }} Panel
	 *
	 * @typedef {Object} Props
	 * @property {string} [title]
	 * @property {Panel[]} panels
	 */

	/** @type {Props} */
	let { title = 'Bloodwork Order Checklist', panels } = $props();

	/** @type {string} */
	let activePanel = $state(panels.length > 0 ? panels[0].id : '');

	/** @type {Record<string, Set<string>>} */
	let checkedByPanel = $state({});

	let copied = $state(false);

	const currentPanel = $derived(panels.find((p) => p.id === activePanel));

	const checkedSet = $derived(checkedByPanel[activePanel] ?? new Set());

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

	const totalMarkers = $derived(currentPanel ? currentPanel.markers.length : 0);

	const checkedCount = $derived(checkedSet.size);

	const essentialCount = $derived(
		currentPanel ? currentPanel.markers.filter((m) => m.essential).length : 0
	);

	const allEssentialsChecked = $derived.by(() => {
		if (!currentPanel) return false;
		return currentPanel.markers
			.filter((m) => m.essential)
			.every((m) => checkedSet.has(m.name));
	});

	/** @param {string} id */
	function selectPanel(id) {
		activePanel = id;
		copied = false;
	}

	/** @param {string} markerName */
	function toggleMarker(markerName) {
		const current = checkedByPanel[activePanel] ?? new Set();
		const next = new Set(current);
		if (next.has(markerName)) {
			next.delete(markerName);
		} else {
			next.add(markerName);
		}
		checkedByPanel = { ...checkedByPanel, [activePanel]: next };
		copied = false;
	}

	function selectAllEssentials() {
		if (!currentPanel) return;
		const current = checkedByPanel[activePanel] ?? new Set();
		const next = new Set(current);
		for (const marker of currentPanel.markers) {
			if (marker.essential) {
				next.add(marker.name);
			}
		}
		checkedByPanel = { ...checkedByPanel, [activePanel]: next };
		copied = false;
	}

	async function copyList() {
		if (!currentPanel) return;
		const checked = checkedByPanel[activePanel] ?? new Set();
		if (checked.size === 0) return;

		const lines = [];
		for (const category of categories) {
			const categoryMarkers = groupedMarkers[category].filter((m) => checked.has(m.name));
			if (categoryMarkers.length > 0) {
				lines.push(category + ':');
				for (const marker of categoryMarkers) {
					lines.push('  - ' + marker.name);
				}
				lines.push('');
			}
		}

		const text = currentPanel.name + '\n\n' + lines.join('\n').trim();
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Clipboard API not available
		}
	}

	/** @param {string} markerName */
	function isChecked(markerName) {
		return checkedSet.has(markerName);
	}
</script>

<div class="checklist">
	{#if title}
		<div class="checklist-header">
			<h3 class="checklist-title">{title}</h3>
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

	{#if currentPanel}
		<!-- Panel description & progress -->
		<div class="panel-meta">
			<p class="panel-description">{currentPanel.description}</p>
			<span class="progress-badge">
				{checkedCount}/{totalMarkers} selected
			</span>
		</div>

		<!-- Action buttons -->
		<div class="actions-bar">
			<button
				type="button"
				class="action-button"
				onclick={selectAllEssentials}
				disabled={allEssentialsChecked}
			>
				Select all essentials ({essentialCount})
			</button>
			<button
				type="button"
				class="action-button copy-button"
				onclick={copyList}
				disabled={checkedCount === 0}
			>
				{#if copied}
					Copied
				{:else}
					Copy list
				{/if}
			</button>
		</div>

		<!-- Markers grouped by category -->
		<div class="markers-container">
			{#each categories as category}
				<div class="category-group">
					<div class="category-header">
						<span class="category-name">{category}</span>
						<span class="category-count">
							{groupedMarkers[category].filter((m) => isChecked(m.name)).length}/{groupedMarkers[category].length}
						</span>
					</div>

					<div class="marker-list">
						{#each groupedMarkers[category] as marker}
							<label class="marker-row" class:checked={isChecked(marker.name)}>
								<input
									type="checkbox"
									class="marker-checkbox"
									checked={isChecked(marker.name)}
									onchange={() => toggleMarker(marker.name)}
								/>
								<span
									class="marker-name"
									class:essential={marker.essential}
								>
									{marker.name}
								</span>
								{#if marker.essential}
									<span class="essential-tag">Required</span>
								{/if}
							</label>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.checklist {
		margin: 2rem 0;
		border: 1px solid hsl(var(--border));
		overflow: hidden;
		background-color: hsl(var(--card));
	}

	.checklist-header {
		padding: 1.25rem 1.5rem 0;
	}

	.checklist-title {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
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
		color: hsl(var(--muted-foreground));
		background: none;
		border: 1px solid hsl(var(--border));
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
		color: hsl(var(--foreground));
		background-color: hsl(var(--muted));
	}

	.tab-button.active {
		color: hsl(var(--foreground));
		background-color: hsl(var(--muted));
		font-weight: 600;
		border-color: hsl(var(--border));
		z-index: 1;
	}

	/* Panel meta */

	.panel-meta {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background-color: hsl(var(--muted));
		border-top: 1px solid hsl(var(--border));
		border-bottom: 1px solid hsl(var(--border));
	}

	.panel-description {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		line-height: 1.5;
	}

	.progress-badge {
		flex-shrink: 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--accent));
		background-color: hsl(var(--card));
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--border));
		white-space: nowrap;
		font-family: var(--font-mono);
	}

	/* Actions bar */

	.actions-bar {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.action-button {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.375rem 0.875rem;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--background));
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.action-button:hover:not(:disabled) {
		border-color: hsl(var(--foreground) / 0.3);
		color: hsl(var(--foreground));
	}

	.action-button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.copy-button {
		margin-left: auto;
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
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.category-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.category-count {
		font-size: 0.6875rem;
		font-family: var(--font-mono);
		color: hsl(var(--muted-foreground));
	}

	/* Marker rows */

	.marker-list {
		display: flex;
		flex-direction: column;
	}

	.marker-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.4375rem 0.25rem;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
		cursor: pointer;
		transition: background-color 0.1s ease;
		user-select: none;
	}

	.marker-row:last-child {
		border-bottom: none;
	}

	.marker-row:hover {
		background-color: hsl(var(--muted));
		border-radius: 4px;
	}

	.marker-row.checked {
		background-color: hsl(var(--accent) / 0.04);
	}

	.marker-checkbox {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		accent-color: hsl(var(--accent));
		cursor: pointer;
		margin: 0;
	}

	.marker-name {
		font-size: 0.8125rem;
		color: hsl(var(--foreground));
		flex: 1;
		min-width: 0;
		line-height: 1.4;
	}

	.marker-name.essential {
		font-weight: 600;
	}

	.marker-row.checked .marker-name {
		color: hsl(var(--muted-foreground));
		text-decoration: line-through;
		text-decoration-color: hsl(var(--border));
	}

	.essential-tag {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.08);
		padding: 0.125rem 0.4375rem;
		border-radius: 3px;
		flex-shrink: 0;
		white-space: nowrap;
	}

	/* Print styles */

	@media print {
		.checklist {
			border: 1px solid #ccc;
			break-inside: avoid;
		}

		.tab-bar,
		.actions-bar {
			display: none;
		}

		.panel-meta {
			background: none;
			border: none;
			padding: 0.5rem 1rem;
		}

		.marker-row:hover {
			background: none;
		}
	}

	/* Mobile adjustments */

	@media (max-width: 640px) {
		.checklist-header {
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

		.actions-bar {
			padding: 0.5rem 1rem;
			flex-wrap: wrap;
		}

		.markers-container {
			padding: 0.75rem 1rem 1rem;
		}

		.marker-name {
			font-size: 0.75rem;
		}

		.essential-tag {
			font-size: 0.5625rem;
		}
	}
</style>
