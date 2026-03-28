<script>
	import { onMount } from 'svelte';

	/**
	 * A horizontal spectrum/gradient bar with labelled segments.
	 * Great for showing ranges like peptide half-lives, dose ranges, bioavailability scales, etc.
	 *
	 * @typedef {Object} Props
	 * @property {{ label: string, sublabel?: string, width: number, color: string }[]} [segments]
	 * @property {string} [title]
	 * @property {string} [leftLabel]
	 * @property {string} [rightLabel]
	 * @property {{ label: string, position: number }[]} [markers]
	 */

	/** @type {Props} */
	let {
		segments = [],
		title = '',
		leftLabel = '',
		rightLabel = '',
		markers = []
	} = $props();

	let mounted = $state(false);

	onMount(() => {
		setTimeout(() => {
			mounted = true;
		}, 100);
	});

	let totalWidth = $derived(segments.reduce((sum, s) => sum + s.width, 0));
</script>

<figure class="spectrum-container">
	{#if title}
		<figcaption class="spectrum-title">{title}</figcaption>
	{/if}

	<div class="spectrum-bar" class:mounted>
		{#each segments as segment, i}
			<div
				class="segment"
				style="
					flex: {segment.width};
					background-color: {segment.color};
					transition-delay: {i * 100}ms;
				"
			>
				<div class="segment-content">
					<span class="segment-label">{segment.label}</span>
					{#if segment.sublabel}
						<span class="segment-sublabel">{segment.sublabel}</span>
					{/if}
				</div>
			</div>
		{/each}

		{#each markers as marker}
			<div class="marker-line" style="left: {(marker.position / totalWidth) * 100}%">
				<span class="marker-label">{marker.label}</span>
			</div>
		{/each}
	</div>

	{#if leftLabel || rightLabel}
		<div class="edge-labels">
			<span>{leftLabel}</span>
			<span>{rightLabel}</span>
		</div>
	{/if}
</figure>

<style>
	.spectrum-container {
		margin: 2rem 0;
	}

	.spectrum-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted-foreground, #666663);
		margin-bottom: 1rem;
		text-align: center;
	}

	.spectrum-bar {
		display: flex;
		height: 52px;
		border-radius: 10px;
		overflow: hidden;
		position: relative;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.segment {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		overflow: hidden;
		opacity: 0;
		transform: scaleX(0);
		transform-origin: left;
		transition:
			opacity 0.5s ease,
			transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.mounted .segment {
		opacity: 1;
		transform: scaleX(1);
	}

	.segment-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		padding: 0 0.125rem;
		min-width: 0;
		overflow: hidden;
	}

	.segment-label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.segment-sublabel {
		font-size: 0.5625rem;
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.marker-line {
		position: absolute;
		top: -8px;
		bottom: -8px;
		width: 2px;
		background-color: var(--foreground, #191919);
		transform: translateX(-50%);
	}

	.marker-label {
		position: absolute;
		top: -22px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--foreground, #191919);
		white-space: nowrap;
	}

	.edge-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.6875rem;
		color: var(--muted-foreground, #91918d);
		font-style: italic;
	}

	@media (max-width: 640px) {
		.spectrum-bar {
			height: 44px;
		}

		.segment-label {
			font-size: 0.5625rem;
		}

		.segment-sublabel {
			display: none;
		}

		.edge-labels {
			font-size: 0.625rem;
		}
	}
</style>
