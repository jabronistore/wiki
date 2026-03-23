<script>
	import { onMount } from 'svelte';

	/**
	 * @type {{ label: string, value: number, color?: string, suffix?: string }[]}
	 */
	export let data = [];
	export let title = '';
	export let horizontal = true;
	export let showValues = true;
	export let maxValue = 0;
	export let height = 'auto';
	export let barColor = '#CC785C';
	export let animated = true;

	let mounted = false;
	let computedMax = 0;

	$: computedMax = maxValue || Math.max(...data.map((d) => d.value)) * 1.1;

	/**
	 * If bar fill is less than 25% wide, show value outside (to the right)
	 * @param {number} value
	 */
	function isNarrow(value) {
		return (value / computedMax) * 100 < 25;
	}

	onMount(() => {
		if (animated) {
			setTimeout(() => {
				mounted = true;
			}, 100);
		} else {
			mounted = true;
		}
	});
</script>

<figure class="chart-container" style={height !== 'auto' ? `height: ${height}` : ''}>
	{#if title}
		<figcaption class="chart-title">{title}</figcaption>
	{/if}

	{#if horizontal}
		<div class="bar-chart horizontal">
			{#each data as item, i}
				<div class="bar-row">
					<span class="bar-label">{item.label}</span>
					<div class="bar-track">
						<div
							class="bar-fill"
							style="
								width: {mounted ? (item.value / computedMax) * 100 : 0}%;
								background-color: {item.color || barColor};
								transition-delay: {i * 80}ms;
							"
						>
							{#if showValues && !isNarrow(item.value)}
								<span class="bar-value inside" class:visible={mounted}>
									{item.value}{item.suffix || ''}
								</span>
							{/if}
						</div>
						{#if showValues && isNarrow(item.value)}
							<span
								class="bar-value outside"
								class:visible={mounted}
								style="left: {mounted
									? (item.value / computedMax) * 100 + 1
									: 1}%; transition-delay: {i * 80 + 400}ms;"
							>
								{item.value}{item.suffix || ''}
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="bar-chart vertical">
			{#each data as item, i}
				<div class="bar-col">
					{#if showValues}
						<span class="bar-value-top" class:visible={mounted}>
							{item.value}{item.suffix || ''}
						</span>
					{/if}
					<div class="bar-track-v">
						<div
							class="bar-fill-v"
							style="
								height: {mounted ? (item.value / computedMax) * 100 : 0}%;
								background-color: {item.color || barColor};
								transition-delay: {i * 80}ms;
							"
						/>
					</div>
					<span class="bar-label-v">{item.label}</span>
				</div>
			{/each}
		</div>
	{/if}
</figure>

<style>
	.chart-container {
		margin: 2rem 0;
	}

	.chart-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted-foreground, #666663);
		margin-bottom: 1rem;
		text-align: center;
	}

	.bar-chart.horizontal {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.bar-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bar-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--foreground, #191919);
		width: 18%;
		min-width: 0;
		text-align: right;
		flex-shrink: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar-track {
		flex: 1;
		min-width: 0;
		height: 28px;
		background-color: var(--muted, #F0F0EB);
		border-radius: 6px;
		overflow: visible;
		position: relative;
	}

	.bar-fill {
		height: 100%;
		border-radius: 6px;
		transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 8px;
		min-width: 0;
		overflow: hidden;
	}

	.bar-value.inside {
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		opacity: 0;
		transition: opacity 0.3s ease 0.6s;
		white-space: nowrap;
	}

	.bar-value.outside {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--foreground, #191919);
		opacity: 0;
		transition:
			opacity 0.3s ease,
			left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		white-space: nowrap;
		padding-left: 6px;
	}

	.bar-value.visible {
		opacity: 1;
	}

	.bar-chart.vertical {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 1rem;
		height: 250px;
		padding-top: 1.5rem;
	}

	.bar-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		min-width: 0;
		max-width: 80px;
		height: 100%;
	}

	.bar-value-top {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent, #CC785C);
		opacity: 0;
		transition: opacity 0.3s ease 0.6s;
		margin-bottom: 0.25rem;
	}

	.bar-value-top.visible {
		opacity: 1;
	}

	.bar-track-v {
		flex: 1;
		width: 100%;
		background-color: var(--muted, #F0F0EB);
		border-radius: 6px 6px 0 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.bar-fill-v {
		width: 100%;
		border-radius: 6px 6px 0 0;
		transition: height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.bar-label-v {
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--muted-foreground, #666663);
		margin-top: 0.5rem;
		text-align: center;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	@media (max-width: 640px) {
		.bar-label {
			width: 22%;
			font-size: 0.6875rem;
		}

		.bar-track {
			height: 24px;
		}

		.bar-value.inside,
		.bar-value.outside {
			font-size: 0.625rem;
		}

		.bar-chart.vertical {
			height: 200px;
			gap: 0.5rem;
		}

		.bar-label-v {
			font-size: 0.5625rem;
		}
	}
</style>
