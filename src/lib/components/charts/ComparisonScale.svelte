<script>
	import { onMount } from 'svelte';

	/**
	 * A 1-10 scale with markers showing where items fall — great for comparing peptide properties
	 * @type {{ label: string, position: number, color?: string }[]}
	 */
	export let items = [];
	export let title = '';
	export let leftLabel = '';
	export let rightLabel = '';
	export let min = 1;
	export let max = 10;
	export let accentColor = '#CC785C';

	let mounted = false;

	onMount(() => {
		setTimeout(() => {
			mounted = true;
		}, 150);
	});

	/** @param {number} pos */
	function getPercent(pos) {
		return ((pos - min) / (max - min)) * 100;
	}

	const range = max - min;
	const midTick = Math.round(range / 2);
	/** @type {Set<number>} */
	const sparseSet = new Set([0, midTick, range]);
</script>

<figure class="scale-container">
	{#if title}
		<figcaption class="scale-title">{title}</figcaption>
	{/if}

	<div class="scale-items">
		{#each items as item, i}
			<div class="scale-row">
				<span class="item-label">{item.label}</span>
				<div class="scale-track">
					<div class="scale-gradient"></div>
					<div class="tick-marks">
						{#each Array(max - min + 1) as _, t}
							<div
								class="tick"
								class:tick-sparse={sparseSet.has(t)}
								style="left: {(t / (max - min)) * 100}%"
							>
								<span class="tick-number">{min + t}</span>
							</div>
						{/each}
					</div>
					<div
						class="marker"
						style="
							left: {mounted ? getPercent(item.position) : 0}%;
							background-color: {item.color || accentColor};
							transition-delay: {i * 120}ms;
						"
					>
						<span class="marker-value">{item.position}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if leftLabel || rightLabel}
		<div class="scale-labels">
			<span class="edge-label">{leftLabel}</span>
			<span class="edge-label">{rightLabel}</span>
		</div>
	{/if}
</figure>

<style>
	.scale-container {
		margin: 2rem 0;
	}

	.scale-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted-foreground, #666663);
		margin-bottom: 1.25rem;
		text-align: center;
	}

	.scale-items {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.scale-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.item-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--foreground, #191919);
		width: 22%;
		min-width: 0;
		text-align: right;
		flex-shrink: 0;
		line-height: 1.25;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.scale-track {
		flex: 1;
		min-width: 0;
		height: 28px;
		position: relative;
		border-radius: 8px;
		overflow: visible;
	}

	.scale-gradient {
		position: absolute;
		inset: 0;
		border-radius: 8px;
		background: linear-gradient(to right, var(--muted, #F0F0EB), var(--border, #E5E4DF));
	}

	.tick-marks {
		position: absolute;
		inset: 0;
	}

	.tick {
		position: absolute;
		top: 0;
		height: 100%;
		width: 1px;
		background-color: rgba(0, 0, 0, 0.08);
	}

	.tick-number {
		position: absolute;
		bottom: -16px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.5625rem;
		color: var(--muted-foreground, #91918D);
	}

	.marker {
		position: absolute;
		top: 3px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: left 1s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		z-index: 1;
	}

	.marker-value {
		font-size: 0.625rem;
		font-weight: 700;
		color: white;
	}

	.scale-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 1.5rem;
		padding-left: calc(22% + 0.75rem);
	}

	.edge-label {
		font-size: 0.6875rem;
		color: var(--muted-foreground, #91918D);
		font-style: italic;
	}

	@media (max-width: 640px) {
		.scale-items {
			gap: 0.625rem;
		}

		.item-label {
			width: 28%;
			font-size: 0.625rem;
		}

		.scale-track {
			height: 24px;
		}

		.marker {
			width: 20px;
			height: 20px;
			top: 2px;
		}

		.marker-value {
			font-size: 0.5625rem;
		}

		.tick-number {
			display: none;
		}

		.tick-sparse .tick-number {
			display: block;
		}

		.scale-labels {
			padding-left: calc(28% + 0.75rem);
		}
	}
</style>
