<script lang="ts">
	import { RotateCcw } from 'lucide-svelte';

	interface MarkerRange {
		low: number;
		optimalLow: number;
		optimalHigh: number;
		high: number;
	}

	interface Marker {
		id: string;
		name: string;
		unit: string;
		category: string;
		ranges: MarkerRange;
		context?: string;
		ifHigh?: string;
		ifLow?: string;
	}

	interface Props {
		title?: string;
		markers: Marker[];
	}

	let { title = 'Bloodwork Interpreter', markers }: Props = $props();

	/** User-entered values keyed by marker id */
	let values: Record<string, string> = $state({});

	/** Which categories are collapsed */
	let collapsedCategories: Set<string> = $state(new Set());

	/** Group markers by category, preserving insertion order */
	const grouped = $derived.by(() => {
		const map = new Map<string, Marker[]>();
		for (const m of markers) {
			const existing = map.get(m.category);
			if (existing) {
				existing.push(m);
			} else {
				map.set(m.category, [m]);
			}
		}
		return map;
	});

	const categories = $derived([...grouped.keys()]);

	type Zone = 'low' | 'below-optimal' | 'optimal' | 'above-optimal' | 'high';

	interface MarkerResult {
		marker: Marker;
		value: number;
		zone: Zone;
		position: number; // 0-100 percentage position on the bar
	}

	function getZone(value: number, ranges: MarkerRange): Zone {
		if (value < ranges.low) return 'low';
		if (value < ranges.optimalLow) return 'below-optimal';
		if (value <= ranges.optimalHigh) return 'optimal';
		if (value <= ranges.high) return 'above-optimal';
		return 'high';
	}

	function getZoneLabel(zone: Zone): string {
		switch (zone) {
			case 'low':
				return 'Low';
			case 'below-optimal':
				return 'Below Optimal';
			case 'optimal':
				return 'Optimal';
			case 'above-optimal':
				return 'Above Optimal';
			case 'high':
				return 'High';
		}
	}

	/**
	 * Calculate position (0-100) of a value on the range bar.
	 * The bar spans from (low - padding) to (high + padding) where
	 * padding gives some room beyond critical thresholds.
	 */
	function getPosition(value: number, ranges: MarkerRange): number {
		const span = ranges.high - ranges.low;
		const padding = span * 0.2;
		const barMin = ranges.low - padding;
		const barMax = ranges.high + padding;
		const pct = ((value - barMin) / (barMax - barMin)) * 100;
		return Math.max(0, Math.min(100, pct));
	}

	/**
	 * Calculate width percentages for each zone segment on the bar.
	 */
	function getSegments(ranges: MarkerRange): {
		lowPct: number;
		belowOptPct: number;
		optPct: number;
		aboveOptPct: number;
		highPct: number;
	} {
		const span = ranges.high - ranges.low;
		const padding = span * 0.2;
		const total = span + 2 * padding; // barMax - barMin
		return {
			lowPct: (padding / total) * 100,
			belowOptPct: ((ranges.optimalLow - ranges.low) / total) * 100,
			optPct: ((ranges.optimalHigh - ranges.optimalLow) / total) * 100,
			aboveOptPct: ((ranges.high - ranges.optimalHigh) / total) * 100,
			highPct: (padding / total) * 100
		};
	}

	function getResult(marker: Marker): MarkerResult | null {
		const raw = values[marker.id];
		if (raw === undefined || raw === '') return null;
		const num = parseFloat(raw);
		if (isNaN(num)) return null;
		return {
			marker,
			value: num,
			zone: getZone(num, marker.ranges),
			position: getPosition(num, marker.ranges)
		};
	}

	/** All evaluated results for markers that have values entered */
	const allResults = $derived.by(() => {
		const results: MarkerResult[] = [];
		for (const m of markers) {
			const r = getResult(m);
			if (r) results.push(r);
		}
		return results;
	});

	const enteredCount = $derived(allResults.length);
	const optimalCount = $derived(allResults.filter((r) => r.zone === 'optimal').length);
	const attentionCount = $derived(allResults.filter((r) => r.zone !== 'optimal').length);

	function toggleCategory(cat: string) {
		const next = new Set(collapsedCategories);
		if (next.has(cat)) {
			next.delete(cat);
		} else {
			next.add(cat);
		}
		collapsedCategories = next;
	}

	function resetAll() {
		values = {};
		collapsedCategories = new Set();
	}

	function isOutOfRange(zone: Zone): boolean {
		return zone !== 'optimal';
	}

	function isCritical(zone: Zone): boolean {
		return zone === 'low' || zone === 'high';
	}
</script>

<div class="bloodwork-interpreter">
	<!-- Header -->
	<div class="interpreter-header">
		<h3 class="interpreter-title">{title}</h3>
		{#if enteredCount > 0}
			<button class="reset-btn" onclick={resetAll}>
				<RotateCcw class="h-3.5 w-3.5" />
				Reset
			</button>
		{/if}
	</div>

	<p class="interpreter-instructions">
		Enter your lab values below to see where they fall relative to optimal ranges.
	</p>

	<!-- Summary bar -->
	{#if enteredCount > 0}
		<div class="summary-bar">
			<span class="summary-item">
				<span class="summary-count">{enteredCount}</span> marker{enteredCount !== 1 ? 's' : ''} entered
			</span>
			<span class="summary-divider"></span>
			<span class="summary-item">
				<span class="summary-count summary-optimal">{optimalCount}</span> optimal
			</span>
			{#if attentionCount > 0}
				<span class="summary-divider"></span>
				<span class="summary-item">
					<span class="summary-count summary-attention">{attentionCount}</span> need{attentionCount === 1 ? 's' : ''} attention
				</span>
			{/if}
		</div>
	{/if}

	<!-- Marker categories -->
	<div class="categories-container">
		{#each categories as category}
			{@const categoryMarkers = grouped.get(category) ?? []}
			{@const isCollapsed = collapsedCategories.has(category)}
			{@const categoryResults = categoryMarkers.map((m) => getResult(m)).filter((r): r is MarkerResult => r !== null)}
			{@const categoryOptimal = categoryResults.filter((r) => r.zone === 'optimal').length}
			{@const categoryAttention = categoryResults.filter((r) => r.zone !== 'optimal').length}

			<div class="category-section">
				<button class="category-toggle" onclick={() => toggleCategory(category)}>
					<span class="category-chevron" class:collapsed={isCollapsed}>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<path
								d="M4 5.25L7 8.75L10 5.25"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</span>
					<span class="category-name">{category}</span>
					<span class="category-meta">
						{categoryMarkers.length} marker{categoryMarkers.length !== 1 ? 's' : ''}
						{#if categoryResults.length > 0}
							<span class="category-badge-group">
								{#if categoryOptimal > 0}
									<span class="category-badge badge-optimal">{categoryOptimal}</span>
								{/if}
								{#if categoryAttention > 0}
									<span class="category-badge badge-attention">{categoryAttention}</span>
								{/if}
							</span>
						{/if}
					</span>
				</button>

				{#if !isCollapsed}
					<div class="markers-list">
						{#each categoryMarkers as marker}
							{@const result = getResult(marker)}
							{@const segments = getSegments(marker.ranges)}
							<div class="marker-item">
								<div class="marker-input-row">
									<div class="marker-label">
										<span class="marker-name">{marker.name}</span>
										<span class="marker-unit">{marker.unit}</span>
									</div>
									<div class="marker-input-wrapper">
										<input
											type="number"
											class="marker-input"
											class:has-value={result !== null}
											class:input-optimal={result !== null && result.zone === 'optimal'}
											class:input-warning={result !== null && (result.zone === 'below-optimal' || result.zone === 'above-optimal')}
											class:input-critical={result !== null && (result.zone === 'low' || result.zone === 'high')}
											placeholder="--"
											value={values[marker.id] ?? ''}
											oninput={(e) => {
												const target = e.target as HTMLInputElement;
												values[marker.id] = target.value;
											}}
											step="any"
										/>
									</div>
								</div>

								{#if marker.context}
									<p class="marker-context">{marker.context}</p>
								{/if}

								<!-- Range bar -->
								{#if result}
									<div class="range-bar-container">
										<div class="range-bar">
											<div class="segment segment-critical-low" style="width: {segments.lowPct}%"></div>
											<div class="segment segment-below-optimal" style="width: {segments.belowOptPct}%"></div>
											<div class="segment segment-optimal" style="width: {segments.optPct}%"></div>
											<div class="segment segment-above-optimal" style="width: {segments.aboveOptPct}%"></div>
											<div class="segment segment-critical-high" style="width: {segments.highPct}%"></div>

											<!-- Marker arrow -->
											<div
												class="value-marker"
												class:marker-optimal={result.zone === 'optimal'}
												class:marker-warning={result.zone === 'below-optimal' || result.zone === 'above-optimal'}
												class:marker-critical={result.zone === 'low' || result.zone === 'high'}
												style="left: {result.position}%"
											>
												<div class="value-arrow"></div>
												<span class="value-label">{result.value}</span>
											</div>
										</div>

										<!-- Range labels -->
										<div class="range-labels">
											<span class="range-label label-low">{marker.ranges.low}</span>
											<span class="range-label label-optimal-low">{marker.ranges.optimalLow}</span>
											<span class="range-label label-optimal-high">{marker.ranges.optimalHigh}</span>
											<span class="range-label label-high">{marker.ranges.high}</span>
										</div>

										<!-- Zone badge -->
										<div class="zone-row">
											<span
												class="zone-badge"
												class:zone-optimal={result.zone === 'optimal'}
												class:zone-warning={result.zone === 'below-optimal' || result.zone === 'above-optimal'}
												class:zone-critical={result.zone === 'low' || result.zone === 'high'}
											>
												{getZoneLabel(result.zone)}
											</span>
										</div>

										<!-- Recommendation text -->
										{#if isOutOfRange(result.zone)}
											{#if (result.zone === 'low' || result.zone === 'below-optimal') && marker.ifLow}
												<p class="recommendation-text">{marker.ifLow}</p>
											{:else if (result.zone === 'high' || result.zone === 'above-optimal') && marker.ifHigh}
												<p class="recommendation-text">{marker.ifHigh}</p>
											{/if}
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.bloodwork-interpreter {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin: 1.5rem 0;
	}

	.interpreter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.interpreter-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.reset-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.reset-btn:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--foreground) / 0.2);
	}

	.interpreter-instructions {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.25rem;
		line-height: 1.5;
	}

	/* Summary bar */
	.summary-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}

	.summary-item {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}

	.summary-count {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--foreground));
	}

	.summary-optimal {
		color: hsl(142 71% 45%);
	}

	.summary-attention {
		color: hsl(var(--destructive));
	}

	.summary-divider {
		width: 1px;
		height: 1rem;
		background: hsl(var(--border));
	}

	/* Category sections */
	.categories-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.category-section {
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.category-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--muted));
		border: none;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition: background-color 0.15s ease;
	}

	.category-toggle:hover {
		background: hsl(var(--muted-foreground) / 0.08);
	}

	.category-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--muted-foreground));
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.category-chevron.collapsed {
		transform: rotate(-90deg);
	}

	.category-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.category-meta {
		margin-left: auto;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.category-badge-group {
		display: inline-flex;
		gap: 0.25rem;
	}

	.category-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.375rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
	}

	.badge-optimal {
		background: hsl(142 71% 45% / 0.15);
		color: hsl(142 71% 35%);
	}

	:global(.dark) .badge-optimal {
		color: hsl(142 71% 55%);
	}

	.badge-attention {
		background: hsl(var(--destructive) / 0.15);
		color: hsl(var(--destructive));
	}

	/* Markers list */
	.markers-list {
		padding: 0.5rem 1rem 1rem;
	}

	.marker-item {
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
	}

	.marker-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.marker-input-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.marker-label {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
		min-width: 0;
		flex: 1;
	}

	.marker-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.marker-unit {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
		flex-shrink: 0;
	}

	.marker-input-wrapper {
		flex-shrink: 0;
	}

	.marker-input {
		width: 5.5rem;
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
		font-family: var(--font-mono, monospace);
		font-variant-numeric: tabular-nums;
		color: hsl(var(--foreground));
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		text-align: right;
		outline: none;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.marker-input::-webkit-outer-spin-button,
	.marker-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.marker-input:focus {
		border-color: hsl(var(--ring));
		box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
	}

	.marker-input.input-optimal {
		border-color: hsl(142 71% 45% / 0.5);
	}

	.marker-input.input-optimal:focus {
		border-color: hsl(142 71% 45%);
		box-shadow: 0 0 0 2px hsl(142 71% 45% / 0.2);
	}

	.marker-input.input-warning {
		border-color: hsl(var(--warning) / 0.7);
	}

	.marker-input.input-warning:focus {
		border-color: hsl(var(--warning));
		box-shadow: 0 0 0 2px hsl(var(--warning) / 0.2);
	}

	.marker-input.input-critical {
		border-color: hsl(var(--destructive) / 0.7);
	}

	.marker-input.input-critical:focus {
		border-color: hsl(var(--destructive));
		box-shadow: 0 0 0 2px hsl(var(--destructive) / 0.2);
	}

	.marker-context {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
		margin: 0.375rem 0 0;
	}

	/* Range bar */
	.range-bar-container {
		margin-top: 0.75rem;
	}

	.range-bar {
		position: relative;
		display: flex;
		height: 0.5rem;
		border-radius: 9999px;
		overflow: visible;
	}

	.segment {
		height: 100%;
	}

	.segment:first-child {
		border-radius: 9999px 0 0 9999px;
	}

	.segment:last-child {
		border-radius: 0 9999px 9999px 0;
	}

	.segment-critical-low {
		background: hsl(var(--destructive) / 0.7);
	}

	.segment-below-optimal {
		background: hsl(var(--warning) / 0.7);
	}

	.segment-optimal {
		background: hsl(142 71% 45% / 0.7);
	}

	.segment-above-optimal {
		background: hsl(var(--warning) / 0.7);
	}

	.segment-critical-high {
		background: hsl(var(--destructive) / 0.7);
	}

	/* Value marker / arrow */
	.value-marker {
		position: absolute;
		top: -0.125rem;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: none;
		z-index: 1;
	}

	.value-arrow {
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 7px solid hsl(var(--foreground));
	}

	.marker-optimal .value-arrow {
		border-top-color: hsl(142 71% 35%);
	}

	:global(.dark) .marker-optimal .value-arrow {
		border-top-color: hsl(142 71% 55%);
	}

	.marker-warning .value-arrow {
		border-top-color: hsl(var(--warning));
	}

	.marker-critical .value-arrow {
		border-top-color: hsl(var(--destructive));
	}

	.value-label {
		margin-top: 0.625rem;
		font-size: 0.6875rem;
		font-weight: 700;
		font-family: var(--font-mono, monospace);
		font-variant-numeric: tabular-nums;
		color: hsl(var(--foreground));
		white-space: nowrap;
	}

	.marker-optimal .value-label {
		color: hsl(142 71% 35%);
	}

	:global(.dark) .marker-optimal .value-label {
		color: hsl(142 71% 55%);
	}

	.marker-warning .value-label {
		color: hsl(var(--warning));
	}

	.marker-critical .value-label {
		color: hsl(var(--destructive));
	}

	/* Range labels */
	.range-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 1.75rem;
		padding: 0 0.125rem;
	}

	.range-label {
		font-size: 0.625rem;
		font-family: var(--font-mono, monospace);
		color: hsl(var(--muted-foreground) / 0.7);
	}

	/* Zone badge */
	.zone-row {
		margin-top: 0.5rem;
	}

	.zone-badge {
		display: inline-block;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.1875rem 0.5rem;
		border-radius: 9999px;
	}

	.zone-optimal {
		background: hsl(142 71% 45% / 0.12);
		color: hsl(142 71% 35%);
	}

	:global(.dark) .zone-optimal {
		color: hsl(142 71% 55%);
	}

	.zone-warning {
		background: hsl(var(--warning) / 0.15);
		color: hsl(var(--warning));
	}

	.zone-critical {
		background: hsl(var(--destructive) / 0.12);
		color: hsl(var(--destructive));
	}

	/* Recommendation text */
	.recommendation-text {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
		margin: 0.5rem 0 0;
		padding: 0.5rem 0.75rem;
		background: hsl(var(--muted) / 0.5);
		border-left: 2px solid hsl(var(--warning));
		border-radius: 0 0.25rem 0.25rem 0;
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.bloodwork-interpreter {
			padding: 1rem;
			border-radius: 0.5rem;
		}

		.summary-bar {
			gap: 0.5rem;
			padding: 0.625rem 0.75rem;
		}

		.summary-item {
			font-size: 0.75rem;
		}

		.category-toggle {
			padding: 0.625rem 0.75rem;
		}

		.category-name {
			font-size: 0.8125rem;
		}

		.markers-list {
			padding: 0.375rem 0.75rem 0.75rem;
		}

		.marker-input {
			width: 4.5rem;
			font-size: 0.75rem;
		}

		.marker-name {
			font-size: 0.75rem;
		}

		.range-labels {
			margin-top: 1.5rem;
		}

		.recommendation-text {
			font-size: 0.75rem;
		}
	}
</style>
