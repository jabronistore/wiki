<script lang="ts">
	interface PathwayNode {
		id: string;
		label: string;
		type: 'hormone' | 'enzyme' | 'blocker';
		detail?: string;
		url?: string;
	}

	interface PathwayConnection {
		from: string;
		to: string;
		enzyme?: string;
		blocker?: string;
	}

	interface Props {
		title?: string;
		nodes: PathwayNode[];
		connections: PathwayConnection[];
	}

	let { title, nodes, connections }: Props = $props();

	let activeNodeId: string | null = $state(null);
	let tooltipPosition: { x: number; y: number } | null = $state(null);
	let diagramEl: HTMLDivElement | undefined = $state(undefined);

	const nodeMap = $derived(
		nodes.reduce<Record<string, PathwayNode>>((map, node) => {
			map[node.id] = node;
			return map;
		}, {})
	);

	// Build the layout: find root hormones (not targets of any connection) and walk the graph
	const hormoneIds = $derived(new Set(nodes.filter((n) => n.type === 'hormone').map((n) => n.id)));

	const targetIds = $derived(new Set(connections.map((c) => c.to)));

	const rootHormones = $derived(
		nodes.filter((n) => n.type === 'hormone' && !targetIds.has(n.id)).map((n) => n.id)
	);

	// Build adjacency: from hormone -> connections leaving it
	const adjacency = $derived(
		connections.reduce<Record<string, PathwayConnection[]>>((adj, conn) => {
			if (!adj[conn.from]) adj[conn.from] = [];
			adj[conn.from].push(conn);
			return adj;
		}, {})
	);

	// Build ordered rows via BFS from roots
	interface PathwayRow {
		sourceId: string;
		connection: PathwayConnection;
		targetId: string;
	}

	const rows = $derived.by(() => {
		const result: PathwayRow[] = [];
		const visited = new Set<string>();
		const queue = [...rootHormones];

		for (const id of queue) {
			if (visited.has(id)) continue;
			visited.add(id);
			const conns = adjacency[id] || [];
			for (const conn of conns) {
				result.push({ sourceId: conn.from, connection: conn, targetId: conn.to });
				if (!visited.has(conn.to)) {
					queue.push(conn.to);
				}
			}
		}
		return result;
	});

	// Collect unique hormones in display order
	const orderedHormones = $derived.by(() => {
		const seen = new Set<string>();
		const order: string[] = [];
		for (const root of rootHormones) {
			if (!seen.has(root)) {
				seen.add(root);
				order.push(root);
			}
		}
		for (const row of rows) {
			if (!seen.has(row.targetId) && hormoneIds.has(row.targetId)) {
				seen.add(row.targetId);
				order.push(row.targetId);
			}
		}
		return order;
	});

	function handleNodeClick(nodeId: string, event: MouseEvent) {
		const node = nodeMap[nodeId];
		if (!node) return;

		if (activeNodeId === nodeId) {
			activeNodeId = null;
			tooltipPosition = null;
			return;
		}

		activeNodeId = nodeId;

		if (diagramEl) {
			const rect = diagramEl.getBoundingClientRect();
			const target = event.currentTarget as HTMLElement;
			const targetRect = target.getBoundingClientRect();
			tooltipPosition = {
				x: targetRect.left - rect.left + targetRect.width / 2,
				y: targetRect.top - rect.top
			};
		}
	}

	function handleKeydown(nodeId: string, event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleNodeClick(nodeId, event as unknown as MouseEvent);
		} else if (event.key === 'Escape') {
			activeNodeId = null;
			tooltipPosition = null;
		}
	}

	function closeTooltip() {
		activeNodeId = null;
		tooltipPosition = null;
	}

	const activeNode = $derived(activeNodeId ? nodeMap[activeNodeId] : null);
</script>

<div class="pathway-wrapper">
	{#if title}
		<h3 class="pathway-title">{title}</h3>
	{/if}

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="pathway-diagram" bind:this={diagramEl} role="img" aria-label={title || 'Hormone pathway diagram'}>
		<!-- Tooltip/Popover -->
		{#if activeNode && tooltipPosition}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="tooltip-backdrop" onclick={closeTooltip}></div>
			<div
				class="tooltip-popover"
				style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;"
			>
				<div class="tooltip-header">
					<span class="tooltip-type-badge tooltip-type-{activeNode.type}">{activeNode.type}</span>
					<button class="tooltip-close" onclick={closeTooltip} aria-label="Close">&times;</button>
				</div>
				<p class="tooltip-label">{activeNode.label}</p>
				{#if activeNode.detail}
					<p class="tooltip-detail">{activeNode.detail}</p>
				{/if}
				{#if activeNode.url}
					<a href={activeNode.url} class="tooltip-link">View compound page &rarr;</a>
				{/if}
			</div>
		{/if}

		<!-- Flow layout -->
		<div class="flow-container">
			{#each rows as row, i}
				{@const source = nodeMap[row.sourceId]}
				{@const target = nodeMap[row.targetId]}
				{@const enzyme = row.connection.enzyme ? nodeMap[row.connection.enzyme] : null}
				{@const blocker = row.connection.blocker ? nodeMap[row.connection.blocker] : null}
				{@const isFirstForSource = i === 0 || rows[i - 1].sourceId !== row.sourceId}

				<!-- Source hormone (only render if first connection from this source) -->
				{#if isFirstForSource}
					{#if i > 0}
						<div class="flow-spacer"></div>
					{/if}
					<div class="flow-step">
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="node node-hormone"
							class:node-active={activeNodeId === row.sourceId}
							role="button"
							tabindex="0"
							onclick={(e) => handleNodeClick(row.sourceId, e)}
							onkeydown={(e) => handleKeydown(row.sourceId, e)}
						>
							{source?.label}
						</div>
					</div>
				{/if}

				<!-- Arrow with enzyme/blocker -->
				<div class="flow-step flow-arrow-step">
					<div class="arrow-group">
						{#if enzyme}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="enzyme-label"
								class:node-active={activeNodeId === enzyme.id}
								role="button"
								tabindex="0"
								onclick={(e) => handleNodeClick(enzyme.id, e)}
								onkeydown={(e) => handleKeydown(enzyme.id, e)}
							>
								{enzyme.label}
							</div>
						{/if}
						<div class="arrow-line">
							<div class="arrow-shaft"></div>
							{#if blocker}
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="blocker-mark"
									class:node-active={activeNodeId === blocker.id}
									role="button"
									tabindex="0"
									onclick={(e) => handleNodeClick(blocker.id, e)}
									onkeydown={(e) => handleKeydown(blocker.id, e)}
								>
									<span class="blocker-x">&times;</span>
									<span class="blocker-label">{blocker.label}</span>
								</div>
							{/if}
							<div class="arrow-head"></div>
						</div>
					</div>
				</div>

				<!-- Target hormone -->
				<div class="flow-step">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="node node-hormone"
						class:node-active={activeNodeId === row.targetId}
						role="button"
						tabindex="0"
						onclick={(e) => handleNodeClick(row.targetId, e)}
						onkeydown={(e) => handleKeydown(row.targetId, e)}
					>
						{target?.label}
					</div>
				</div>
			{/each}
		</div>

		<!-- Legend -->
		<div class="pathway-legend">
			<div class="legend-item">
				<div class="legend-swatch legend-hormone"></div>
				<span>Hormone</span>
			</div>
			<div class="legend-item">
				<div class="legend-swatch legend-enzyme"></div>
				<span>Enzyme</span>
			</div>
			<div class="legend-item">
				<div class="legend-swatch legend-blocker"></div>
				<span>Blocker</span>
			</div>
		</div>
	</div>
</div>

<style>
	.pathway-wrapper {
		margin: 1.5rem 0;
	}

	.pathway-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 1rem;
	}

	.pathway-diagram {
		position: relative;
		padding: 1.5rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		overflow: visible;
	}

	/* Flow container - horizontal on desktop, vertical on mobile */
	.flow-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		flex-wrap: wrap;
		padding: 0.5rem 0;
	}

	.flow-spacer {
		width: 100%;
		height: 0.75rem;
	}

	.flow-step {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* Hormone nodes */
	.node {
		cursor: pointer;
		user-select: none;
		transition: all 0.2s ease;
	}

	.node:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.node-hormone {
		padding: 0.625rem 1.25rem;
		background: hsl(var(--accent) / 0.1);
		border: 2px solid hsl(var(--accent) / 0.3);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		white-space: nowrap;
	}

	.node-hormone:hover {
		background: hsl(var(--accent) / 0.18);
		border-color: hsl(var(--accent) / 0.5);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.06);
	}

	.node-hormone.node-active {
		background: hsl(var(--accent) / 0.2);
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 3px hsl(var(--accent) / 0.15);
	}

	/* Arrow group between nodes */
	.flow-arrow-step {
		min-width: 100px;
		padding: 0 0.25rem;
	}

	.arrow-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		width: 100%;
	}

	.enzyme-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--success));
		background: hsl(var(--success) / 0.08);
		padding: 0.2rem 0.5rem;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		border: 1px solid transparent;
	}

	.enzyme-label:hover {
		background: hsl(var(--success) / 0.15);
		border-color: hsl(var(--success) / 0.3);
	}

	.enzyme-label:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.enzyme-label.node-active {
		background: hsl(var(--success) / 0.2);
		border-color: hsl(var(--success));
	}

	/* Arrow line */
	.arrow-line {
		display: flex;
		align-items: center;
		width: 100%;
		position: relative;
	}

	.arrow-shaft {
		flex: 1;
		height: 2px;
		background: hsl(var(--muted-foreground) / 0.4);
	}

	.arrow-head {
		width: 0;
		height: 0;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
		border-left: 8px solid hsl(var(--muted-foreground) / 0.4);
		flex-shrink: 0;
	}

	/* Blocker mark */
	.blocker-mark {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 1;
	}

	.blocker-mark:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 4px;
		border-radius: 4px;
	}

	.blocker-x {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		background: hsl(var(--destructive) / 0.12);
		color: hsl(var(--destructive));
		border: 2px solid hsl(var(--destructive) / 0.4);
		border-radius: 50%;
		font-size: 0.875rem;
		font-weight: 700;
		line-height: 1;
	}

	.blocker-label {
		font-size: 0.625rem;
		font-weight: 500;
		color: hsl(var(--destructive));
		white-space: nowrap;
		margin-top: 0.125rem;
	}

	.blocker-mark:hover .blocker-x {
		background: hsl(var(--destructive) / 0.2);
		border-color: hsl(var(--destructive) / 0.6);
		transform: scale(1.1);
	}

	.blocker-mark.node-active .blocker-x {
		background: hsl(var(--destructive) / 0.25);
		border-color: hsl(var(--destructive));
		box-shadow: 0 0 0 3px hsl(var(--destructive) / 0.15);
	}

	/* Tooltip */
	.tooltip-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10;
	}

	.tooltip-popover {
		position: absolute;
		z-index: 20;
		transform: translate(-50%, calc(-100% - 12px));
		background: hsl(var(--popover));
		color: hsl(var(--popover-foreground));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		box-shadow: 0 8px 24px hsl(var(--foreground) / 0.12);
		min-width: 200px;
		max-width: 300px;
	}

	.tooltip-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.375rem;
	}

	.tooltip-type-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
	}

	.tooltip-type-hormone {
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
	}

	.tooltip-type-enzyme {
		background: hsl(var(--success) / 0.1);
		color: hsl(var(--success));
	}

	.tooltip-type-blocker {
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
	}

	.tooltip-close {
		background: none;
		border: none;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		transition: all 0.15s ease;
	}

	.tooltip-close:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.tooltip-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.tooltip-detail {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
		margin: 0.375rem 0 0;
	}

	.tooltip-link {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
		margin-top: 0.5rem;
		transition: color 0.15s ease;
	}

	.tooltip-link:hover {
		text-decoration: underline;
	}

	/* Legend */
	.pathway-legend {
		display: flex;
		gap: 1.25rem;
		justify-content: center;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.legend-swatch {
		width: 12px;
		height: 12px;
		border-radius: 0.25rem;
		border: 1.5px solid;
	}

	.legend-hormone {
		background: hsl(var(--accent) / 0.1);
		border-color: hsl(var(--accent) / 0.3);
	}

	.legend-enzyme {
		background: hsl(var(--success) / 0.08);
		border-color: hsl(var(--success) / 0.3);
		border-radius: 9999px;
	}

	.legend-blocker {
		background: hsl(var(--destructive) / 0.12);
		border-color: hsl(var(--destructive) / 0.4);
		border-radius: 50%;
	}

	/* Responsive: vertical stack on mobile */
	@media (max-width: 640px) {
		.pathway-diagram {
			padding: 1rem;
		}

		.flow-container {
			flex-direction: column;
			gap: 0;
		}

		.flow-spacer {
			width: auto;
			height: 0.5rem;
		}

		.flow-arrow-step {
			min-width: unset;
			padding: 0.25rem 0;
		}

		.arrow-group {
			flex-direction: column;
		}

		.arrow-line {
			flex-direction: column;
			align-items: center;
			width: auto;
			height: 40px;
		}

		.arrow-shaft {
			flex: 1;
			width: 2px;
			height: auto;
		}

		.arrow-head {
			border-top: 8px solid hsl(var(--muted-foreground) / 0.4);
			border-left: 5px solid transparent;
			border-right: 5px solid transparent;
			border-bottom: none;
		}

		.blocker-mark {
			flex-direction: row;
			gap: 0.25rem;
		}

		.blocker-label {
			margin-top: 0;
		}

		.tooltip-popover {
			left: 50% !important;
			max-width: calc(100% - 2rem);
		}
	}
</style>
