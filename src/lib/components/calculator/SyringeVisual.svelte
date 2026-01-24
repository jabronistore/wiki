<script lang="ts">
	type SyringeSize = 0.3 | 0.5 | 1;

	interface Props {
		syringeSize?: SyringeSize;
		fillAmount: number; // mL to draw
		maxCapacity?: number; // optional override
	}

	let { syringeSize = 1, fillAmount, maxCapacity }: Props = $props();

	// Syringe specifications
	const syringeSpecs = {
		0.3: { totalUnits: 30, majorTick: 5, minorTick: 1, label: '0.3mL / 30 units' },
		0.5: { totalUnits: 50, majorTick: 5, minorTick: 1, label: '0.5mL / 50 units' },
		1: { totalUnits: 100, majorTick: 10, minorTick: 2, label: '1mL / 100 units' }
	};

	const spec = $derived(syringeSpecs[syringeSize]);
	const capacity = $derived(maxCapacity ?? syringeSize);
	// Round to nearest 0.5 units for better precision
	const unitsRaw = $derived(fillAmount * 100);
	const units = $derived(Math.round(unitsRaw * 2) / 2);
	const unitsDisplay = $derived(units % 1 === 0 ? units.toString() : units.toFixed(1));
	const fillPercent = $derived(Math.min(100, Math.max(0, (fillAmount / capacity) * 100)));
	const isOverCapacity = $derived(fillAmount > capacity);

	// SVG dimensions
	const width = 120;
	const height = 320;
	const barrelWidth = 60;
	const barrelHeight = 220;
	const barrelX = (width - barrelWidth) / 2;
	const barrelY = 40;

	// Generate tick marks
	const ticks = $derived.by(() => {
		const result: { y: number; isMajor: boolean; label: string }[] = [];
		for (let i = 0; i <= spec.totalUnits; i += spec.minorTick) {
			const isMajor = i % spec.majorTick === 0;
			const y = barrelY + barrelHeight - (i / spec.totalUnits) * barrelHeight;
			result.push({
				y,
				isMajor,
				label: isMajor ? String(i) : ''
			});
		}
		return result;
	});

	// Fill position (from bottom)
	const fillHeight = $derived((fillPercent / 100) * barrelHeight);
	const fillY = $derived(barrelY + barrelHeight - fillHeight);

	// Draw line position
	const drawLineY = $derived(fillY);
</script>

<div class="syringe-container">
	<svg viewBox="0 0 {width} {height}" class="syringe-svg">
		<!-- Plunger handle -->
		<rect
			x={barrelX + 10}
			y="5"
			width={barrelWidth - 20}
			height="8"
			rx="2"
			class="fill-muted-foreground/30"
		/>

		<!-- Plunger rod -->
		<rect
			x={barrelX + 25}
			y="13"
			width={barrelWidth - 50}
			height={barrelY - 13 + (barrelHeight - fillHeight)}
			class="fill-muted-foreground/20"
		/>

		<!-- Plunger head -->
		<rect
			x={barrelX + 4}
			y={fillY - 4}
			width={barrelWidth - 8}
			height="6"
			rx="1"
			class="fill-muted-foreground/40"
		/>

		<!-- Barrel outline -->
		<rect
			x={barrelX}
			y={barrelY}
			width={barrelWidth}
			height={barrelHeight}
			rx="4"
			class="fill-background stroke-border"
			stroke-width="2"
		/>

		<!-- Liquid fill -->
		{#if fillPercent > 0}
			<rect
				x={barrelX + 2}
				y={fillY}
				width={barrelWidth - 4}
				height={fillHeight}
				rx="2"
				class="syringe-liquid {isOverCapacity ? 'fill-destructive/60' : 'fill-accent/70'}"
			/>
		{/if}

		<!-- Tick marks -->
		{#each ticks as tick}
			<line
				x1={barrelX + barrelWidth - (tick.isMajor ? 12 : 6)}
				y1={tick.y}
				x2={barrelX + barrelWidth}
				y2={tick.y}
				class="stroke-muted-foreground/60"
				stroke-width={tick.isMajor ? 1.5 : 1}
			/>
			{#if tick.label}
				<text
					x={barrelX + barrelWidth - 16}
					y={tick.y + 3}
					text-anchor="end"
					class="fill-muted-foreground font-mono text-[9px]"
				>
					{tick.label}
				</text>
			{/if}
		{/each}

		<!-- Draw line indicator -->
		{#if fillPercent > 0 && fillPercent < 100}
			<line
				x1={barrelX - 8}
				y1={drawLineY}
				x2={barrelX + 8}
				y2={drawLineY}
				class="draw-line stroke-primary"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<polygon
				points="{barrelX - 4},{drawLineY - 4} {barrelX - 4},{drawLineY + 4} {barrelX +
					2},{drawLineY}"
				class="fill-primary"
			/>
		{/if}

		<!-- Needle hub -->
		<path
			d="M{barrelX + 20} {barrelY + barrelHeight}
			   L{barrelX + 20} {barrelY + barrelHeight + 15}
			   L{barrelX + barrelWidth - 20} {barrelY + barrelHeight + 15}
			   L{barrelX + barrelWidth - 20} {barrelY + barrelHeight}
			   L{barrelX + barrelWidth / 2 + 3} {barrelY + barrelHeight + 25}
			   L{barrelX + barrelWidth / 2 - 3} {barrelY + barrelHeight + 25}
			   Z"
			class="fill-muted stroke-border"
			stroke-width="1"
		/>

		<!-- Needle -->
		<line
			x1={width / 2}
			y1={barrelY + barrelHeight + 25}
			x2={width / 2}
			y2={height - 5}
			class="stroke-muted-foreground"
			stroke-width="2"
			stroke-linecap="round"
		/>

		<!-- Needle tip -->
		<line
			x1={width / 2}
			y1={height - 5}
			x2={width / 2 + 3}
			y2={height - 15}
			class="stroke-muted-foreground"
			stroke-width="1.5"
			stroke-linecap="round"
		/>
	</svg>

	<!-- Labels -->
	<div class="syringe-labels">
		<div class="mb-1 text-xs text-muted-foreground">{spec.label}</div>
		<div
			class="text-2xl font-bold tabular-nums {isOverCapacity
				? 'text-destructive'
				: 'text-foreground'}"
		>
			{unitsDisplay} <span class="text-sm font-normal text-muted-foreground">units</span>
		</div>
		<div class="text-sm tabular-nums text-muted-foreground">
			{fillAmount.toFixed(3)} mL
		</div>
		{#if isOverCapacity}
			<div class="mt-2 text-xs font-medium text-destructive">Exceeds syringe capacity!</div>
		{/if}
	</div>
</div>

<style>
	.syringe-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.syringe-svg {
		width: 120px;
		height: 320px;
	}

	.syringe-liquid {
		transition: all 0.3s ease-out;
	}

	.draw-line {
		animation: pulse-line 2s ease-in-out infinite;
	}

	@keyframes pulse-line {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.syringe-labels {
		text-align: center;
	}
</style>
