<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import type { ConcentrationPoint, AccumulationResult } from '$lib/utils/pharmacokinetics';
	import { getTimeUnit, formatDuration } from '$lib/utils/pharmacokinetics';

	interface CompoundData extends AccumulationResult {
		color: string;
		name: string;
	}

	interface Props {
		data: CompoundData[];
		durationSeconds: number;
		doseUnit?: string;
		height?: number;
	}

	let { data, durationSeconds, doseUnit = 'mcg', height = 300 }: Props = $props();

	// Single compound = classic styling (gray taper, "Last dose" label)
	const isSingleCompound = $derived(data.length === 1);

	let container: HTMLDivElement;
	let width = $state(0);
	let hoverInfo = $state<{
		time: number;
		x: number;
		y: number;
		values: { name: string; concentration: number; color: string }[];
	} | null>(null);

	const margin = { top: 20, right: 20, bottom: 40, left: 60 };

	function renderChart() {
		if (!container || width === 0 || !data.length || !data[0].points.length) return;

		// Clear previous chart
		d3.select(container).selectAll('*').remove();

		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		// Get time unit from the first series (they should all have similar duration)
		const totalDuration = data[0].totalDuration;
		const timeUnit = getTimeUnit(totalDuration);

		// Create scales
		const xScale = d3
			.scaleLinear()
			.domain([0, totalDuration / timeUnit.divisor])
			.range([0, chartWidth]);

		// Calculate max across all series
		const maxConcentration = Math.max(
			...data.flatMap((s) => [
				d3.max(s.points, (d) => d.concentration) ?? 1,
				s.steadyStatePeak * 1.1
			])
		);

		const yScale = d3.scaleLinear().domain([0, maxConcentration]).nice().range([chartHeight, 0]);

		// Create SVG
		const svg = d3
			.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.attr('class', 'accumulation-chart');

		// Add clip path and defs
		const defs = svg.append('defs');

		defs
			.append('clipPath')
			.attr('id', 'chart-clip')
			.append('rect')
			.attr('width', chartWidth)
			.attr('height', chartHeight);

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Create gradients for each series
		data.forEach((series, index) => {
			const gradientId = `area-gradient-${index}`;
			const gradient = defs
				.append('linearGradient')
				.attr('id', gradientId)
				.attr('x1', '0%')
				.attr('y1', '0%')
				.attr('x2', '0%')
				.attr('y2', '100%');
			gradient
				.append('stop')
				.attr('offset', '0%')
				.attr('stop-color', series.color)
				.attr('stop-opacity', !isSingleCompound ? 0.25 : 0.4);
			gradient
				.append('stop')
				.attr('offset', '100%')
				.attr('stop-color', series.color)
				.attr('stop-opacity', 0.02);
		});

		// Post-cycle gradient (shared) - stronger for single compound
		const postCycleGradient = defs
			.append('linearGradient')
			.attr('id', 'area-gradient-postcycle')
			.attr('x1', '0%')
			.attr('y1', '0%')
			.attr('x2', '0%')
			.attr('y2', '100%');
		postCycleGradient
			.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', 'hsl(var(--muted-foreground))')
			.attr('stop-opacity', !isSingleCompound ? 0.15 : 0.2);
		postCycleGradient
			.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', 'hsl(var(--muted-foreground))')
			.attr('stop-opacity', 0.02);

		// Create area and line generators
		const area = d3
			.area<ConcentrationPoint>()
			.x((d) => xScale(d.time / timeUnit.divisor))
			.y0(chartHeight)
			.y1((d) => yScale(d.concentration))
			.curve(d3.curveMonotoneX);

		const line = d3
			.line<ConcentrationPoint>()
			.x((d) => xScale(d.time / timeUnit.divisor))
			.y((d) => yScale(d.concentration))
			.curve(d3.curveMonotoneX);

		// Draw end of dosing marker if there's post-cycle data
		const hasPostCycle = data.some((s) => s.points.some((p) => p.time > durationSeconds));
		if (hasPostCycle) {
			const endOfDosingX = xScale(durationSeconds / timeUnit.divisor);

			g.append('line')
				.attr('x1', endOfDosingX)
				.attr('x2', endOfDosingX)
				.attr('y1', 0)
				.attr('y2', chartHeight)
				.attr('stroke', 'hsl(var(--muted-foreground))')
				.attr('stroke-dasharray', '4,4')
				.attr('stroke-width', 1)
				.attr('opacity', 0.5);

			g.append('text')
				.attr('x', endOfDosingX + 5)
				.attr('y', 12)
				.attr('fill', 'hsl(var(--muted-foreground))')
				.attr('font-size', '10px')
				.text('Last dose');
		}

		// Draw steady state reference lines for single compound only
		if (isSingleCompound) {
			const series = data[0];
			if (series.timeToSteadyState < durationSeconds) {
				g.append('line')
					.attr('x1', 0)
					.attr('x2', xScale(durationSeconds / timeUnit.divisor))
					.attr('y1', yScale(series.steadyStatePeak))
					.attr('y2', yScale(series.steadyStatePeak))
					.attr('stroke', 'hsl(var(--muted-foreground))')
					.attr('stroke-dasharray', '4,4')
					.attr('stroke-width', 1)
					.attr('opacity', 0.5);

				g.append('line')
					.attr('x1', 0)
					.attr('x2', xScale(durationSeconds / timeUnit.divisor))
					.attr('y1', yScale(series.steadyStateTrough))
					.attr('y2', yScale(series.steadyStateTrough))
					.attr('stroke', 'hsl(var(--muted-foreground))')
					.attr('stroke-dasharray', '4,4')
					.attr('stroke-width', 1)
					.attr('opacity', 0.5);
			}
		}

		// Draw each series
		data.forEach((series, index) => {
			const activePoints = series.points.filter((p) => p.time <= durationSeconds);
			const postCyclePoints = series.points.filter((p) => p.time >= durationSeconds);

			// Draw post-cycle first (behind)
			if (postCyclePoints.length > 1) {
				g.append('path')
					.datum(postCyclePoints)
					.attr('fill', 'url(#area-gradient-postcycle)')
					.attr('d', area);

				g.append('path')
					.datum(postCyclePoints)
					.attr('fill', 'none')
					.attr('stroke', isSingleCompound ? 'hsl(var(--muted-foreground))' : series.color)
					.attr('stroke-width', isSingleCompound ? 2 : 1.5)
					.attr('stroke-dasharray', '6,4')
					.attr('opacity', isSingleCompound ? 0.6 : 0.4)
					.attr('d', line);
			}

			// Draw active dosing area (with reduced opacity for multi-compound)
			g.append('path')
				.datum(activePoints)
				.attr('fill', `url(#area-gradient-${index})`)
				.attr('d', area);

			// Draw active dosing line
			g.append('path')
				.datum(activePoints)
				.attr('fill', 'none')
				.attr('stroke', series.color)
				.attr('stroke-width', 2)
				.attr('d', line);

			// Draw dose markers (only during active period)
			const dosePoints = activePoints.filter((d) => d.isDose);
			g.selectAll(`.dose-marker-${index}`)
				.data(dosePoints)
				.enter()
				.append('circle')
				.attr('class', `dose-marker-${index}`)
				.attr('cx', (d) => xScale(d.time / timeUnit.divisor))
				.attr('cy', (d) => yScale(d.concentration))
				.attr('r', isSingleCompound ? 4 : 3)
				.attr('fill', series.color)
				.attr('stroke', 'hsl(var(--background))')
				.attr('stroke-width', isSingleCompound ? 2 : 1.5);
		});

		// Interactive hover elements
		const hoverLine = g
			.append('line')
			.attr('class', 'hover-line')
			.attr('y1', 0)
			.attr('y2', chartHeight)
			.attr('stroke', 'hsl(var(--foreground))')
			.attr('stroke-width', 1)
			.attr('opacity', 0);

		// One hover circle per series
		const hoverCircles = data.map((series, index) =>
			g
				.append('circle')
				.attr('class', `hover-circle-${index}`)
				.attr('r', 5)
				.attr('fill', series.color)
				.attr('stroke', 'hsl(var(--background))')
				.attr('stroke-width', 2)
				.attr('opacity', 0)
		);

		// Invisible overlay for mouse events
		const overlay = g
			.append('rect')
			.attr('width', chartWidth)
			.attr('height', chartHeight)
			.attr('fill', 'transparent')
			.style('cursor', 'crosshair');

		// Bisector for finding closest point
		const bisect = d3.bisector<ConcentrationPoint, number>((d) => d.time).left;

		function handleMouseMove(event: MouseEvent) {
			const [mx] = d3.pointer(event);
			const timeValue = xScale.invert(mx) * timeUnit.divisor;

			const values: { name: string; concentration: number; color: string; y: number }[] = [];

			data.forEach((series, index) => {
				// Find closest data point for this series
				const idx = bisect(series.points, timeValue);
				const d0 = series.points[idx - 1];
				const d1 = series.points[idx];

				let closest: ConcentrationPoint;
				if (!d0) {
					closest = d1;
				} else if (!d1) {
					closest = d0;
				} else {
					closest = timeValue - d0.time > d1.time - timeValue ? d1 : d0;
				}

				if (closest) {
					const x = xScale(closest.time / timeUnit.divisor);
					const y = yScale(closest.concentration);

					hoverCircles[index].attr('cx', x).attr('cy', y).attr('opacity', 1);

					values.push({
						name: series.name,
						concentration: closest.concentration,
						color: series.color,
						y
					});
				}
			});

			if (values.length > 0) {
				const x = xScale(timeValue / timeUnit.divisor);
				hoverLine.attr('x1', x).attr('x2', x).attr('opacity', 0.5);

				// Position tooltip at average y of all values
				const avgY = values.reduce((sum, v) => sum + v.y, 0) / values.length;

				hoverInfo = {
					time: timeValue,
					x: x + margin.left,
					y: avgY + margin.top,
					values: values.map((v) => ({
						name: v.name,
						concentration: v.concentration,
						color: v.color
					}))
				};
			}
		}

		function handleMouseLeave() {
			hoverLine.attr('opacity', 0);
			hoverCircles.forEach((c) => c.attr('opacity', 0));
			hoverInfo = null;
		}

		overlay
			.on('mousemove', handleMouseMove)
			.on('touchmove', (event: TouchEvent) => {
				event.preventDefault();
				const touch = event.touches[0];
				const rect = (event.target as Element).getBoundingClientRect();
				handleMouseMove({
					clientX: touch.clientX - rect.left,
					clientY: touch.clientY - rect.top
				} as unknown as MouseEvent);
			})
			.on('mouseleave', handleMouseLeave)
			.on('touchend', handleMouseLeave);

		// X axis
		const xAxis = d3.axisBottom(xScale).ticks(Math.min(10, totalDuration / timeUnit.divisor));

		g.append('g')
			.attr('transform', `translate(0,${chartHeight})`)
			.call(xAxis)
			.attr('color', 'hsl(var(--muted-foreground))')
			.selectAll('text')
			.attr('fill', 'hsl(var(--muted-foreground))');

		// X axis label
		g.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', chartHeight + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', 'hsl(var(--muted-foreground))')
			.attr('font-size', '12px')
			.text(timeUnit.label);

		// Y axis
		const yAxis = d3.axisLeft(yScale).ticks(5);

		g.append('g')
			.call(yAxis)
			.attr('color', 'hsl(var(--muted-foreground))')
			.selectAll('text')
			.attr('fill', 'hsl(var(--muted-foreground))');

		// Y axis label
		g.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', -chartHeight / 2)
			.attr('y', -45)
			.attr('text-anchor', 'middle')
			.attr('fill', 'hsl(var(--muted-foreground))')
			.attr('font-size', '12px')
			.text(`Concentration (${doseUnit})`);
	}

	function handleResize() {
		if (container) {
			width = container.clientWidth;
		}
	}

	onMount(() => {
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	$effect(() => {
		if (data && width > 0) {
			renderChart();
		}
	});

	// Format hover time display
	const hoverTimeDisplay = $derived(hoverInfo ? formatDuration(hoverInfo.time) : '');
</script>

<div class="chart-wrapper">
	<div class="chart-container" bind:this={container}></div>

	{#if hoverInfo}
		<div
			class="tooltip"
			class:multi={!isSingleCompound && hoverInfo.values.length > 1}
			style="left: {Math.min(hoverInfo.x, width - 140)}px; top: {Math.max(
				hoverInfo.y - (!isSingleCompound ? 80 : 60),
				10
			)}px"
		>
			<div class="tooltip-time">{hoverTimeDisplay}</div>
			{#each hoverInfo.values as value}
				<div class="tooltip-row">
					{#if !isSingleCompound && hoverInfo.values.length > 1}
						<span class="tooltip-dot" style="background: {value.color}"></span>
					{/if}
					<span class="tooltip-value">{value.concentration.toFixed(1)}</span>
					<span class="tooltip-unit">{doseUnit}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.chart-wrapper {
		position: relative;
		width: 100%;
	}

	.chart-container {
		width: 100%;
		min-height: 300px;
	}

	.chart-container :global(svg) {
		display: block;
	}

	.chart-container :global(.domain),
	.chart-container :global(.tick line) {
		stroke: hsl(var(--border));
	}

	.tooltip {
		position: absolute;
		pointer-events: none;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		padding: 0.5rem 0.75rem;
		box-shadow: 0 4px 12px hsl(var(--foreground) / 0.1);
		z-index: 10;
	}

	.tooltip.multi {
		min-width: 100px;
	}

	.tooltip-time {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.25rem;
	}

	.tooltip-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.tooltip-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.tooltip-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.tooltip-unit {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	/* Mobile */
	@media (max-width: 640px) {
		.chart-container {
			min-height: 250px;
		}

		.tooltip {
			padding: 0.375rem 0.5rem;
			border-radius: 0.375rem;
			max-width: 140px;
		}

		.tooltip-time {
			font-size: 0.6875rem;
		}

		.tooltip-value {
			font-size: 0.8125rem;
		}

		.tooltip-dot {
			width: 6px;
			height: 6px;
		}
	}
</style>
