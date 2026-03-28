<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';

	interface Compound {
		name: string;
		url?: string;
		dose?: string;
	}

	interface Tier {
		level: number;
		name: string;
		description: string;
		compounds?: Compound[];
		risk?: 'low' | 'moderate' | 'high';
	}

	interface Props {
		title?: string;
		tiers: Tier[];
	}

	let { title, tiers }: Props = $props();

	let expandedTiers: Set<number> = $state(new Set());

	function toggleTier(level: number) {
		const next = new Set(expandedTiers);
		if (next.has(level)) {
			next.delete(level);
		} else {
			next.add(level);
		}
		expandedTiers = next;
	}

	function riskColor(risk: 'low' | 'moderate' | 'high' | undefined): string {
		switch (risk) {
			case 'low':
				return 'var(--success)';
			case 'moderate':
				return 'var(--warning)';
			case 'high':
				return 'var(--destructive)';
			default:
				return 'var(--muted-foreground)';
		}
	}

	function riskLabel(risk: 'low' | 'moderate' | 'high' | undefined): string {
		switch (risk) {
			case 'low':
				return 'Low risk';
			case 'moderate':
				return 'Moderate risk';
			case 'high':
				return 'High risk';
			default:
				return '';
		}
	}

	const sortedTiers = $derived([...tiers].sort((a, b) => a.level - b.level));
</script>

<div class="ladder">
	{#if title}
		<h3 class="ladder-title">{title}</h3>
	{/if}

	<div class="ladder-track">
		{#each sortedTiers as tier, i}
			{@const isExpanded = expandedTiers.has(tier.level)}
			{@const color = riskColor(tier.risk)}
			<div class="tier" class:expanded={isExpanded}>
				<!-- Connecting line segment (not on the first tier) -->
				{#if i > 0}
					<div class="connector" style:--connector-color="hsl({color})"></div>
				{/if}

				<!-- Tier node and content -->
				<div class="tier-row">
					<!-- Left indicator -->
					<div class="indicator-col">
						<div class="node" style:--node-color="hsl({color})">
							<span class="node-level">{tier.level}</span>
						</div>
					</div>

					<!-- Tier content -->
					<button
						class="tier-content"
						class:expanded={isExpanded}
						onclick={() => toggleTier(tier.level)}
						aria-expanded={isExpanded}
					>
						<div class="tier-header">
							<div class="tier-header-text">
								<span class="tier-name">{tier.name}</span>
								{#if tier.risk}
									<span class="risk-badge" style:--badge-color="hsl({color})">
										{riskLabel(tier.risk)}
									</span>
								{/if}
							</div>
							<div class="chevron" class:rotated={isExpanded}>
								<ChevronDown class="h-4 w-4" />
							</div>
						</div>

						{#if isExpanded}
							<div class="tier-body">
								<p class="tier-description">{tier.description}</p>

								{#if tier.compounds && tier.compounds.length > 0}
									<ul class="compound-list">
										{#each tier.compounds as compound}
											<li class="compound-item">
												<span
													class="compound-dot"
													style:--dot-color="hsl({color})"
												></span>
												{#if compound.url}
													<a href={compound.url} class="compound-link">
														{compound.name}
													</a>
												{:else}
													<span class="compound-name">{compound.name}</span>
												{/if}
												{#if compound.dose}
													<span class="compound-dose">{compound.dose}</span>
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/if}
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.ladder {
		padding: 1.5rem 0;
	}

	.ladder-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 1.25rem;
	}

	.ladder-track {
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.tier {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	/* Vertical connecting line between tiers */
	.connector {
		position: absolute;
		left: 1.125rem;
		top: 0;
		width: 2px;
		height: 1rem;
		background: linear-gradient(
			to bottom,
			hsl(var(--accent) / 0.3),
			var(--connector-color, hsl(var(--accent) / 0.3))
		);
		transform: translateX(-50%);
	}

	.tier-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding-top: 1rem;
	}

	.tier:first-child .tier-row {
		padding-top: 0;
	}

	/* Left indicator column */
	.indicator-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
		width: 2.25rem;
		position: relative;
	}

	/* The node circle */
	.node {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--node-color, hsl(var(--accent)));
		background: hsl(var(--background));
		position: relative;
		z-index: 1;
		flex-shrink: 0;
	}

	.node-level {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--node-color, hsl(var(--accent)));
		font-variant-numeric: tabular-nums;
	}

	/* Vertical line extending below node for non-last tiers */
	.tier:not(:last-child) .indicator-col::after {
		content: '';
		position: absolute;
		top: 2.25rem;
		left: 50%;
		transform: translateX(-50%);
		width: 2px;
		height: calc(100% - 2.25rem + 1rem);
		background: hsl(var(--accent) / 0.2);
	}

	/* Tier content card */
	.tier-content {
		flex: 1;
		min-width: 0;
		text-align: left;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		padding: 0.875rem 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: block;
		width: 100%;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
	}

	.tier-content:hover {
		border-color: hsl(var(--accent) / 0.5);
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.04);
	}

	.tier-content.expanded {
		border-color: hsl(var(--accent) / 0.4);
		background: hsl(var(--card));
	}

	.tier-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.tier-header-text {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}

	.tier-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.risk-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		color: var(--badge-color, hsl(var(--muted-foreground)));
		background: color-mix(in srgb, var(--badge-color) 12%, transparent);
	}

	.chevron {
		color: hsl(var(--muted-foreground));
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	/* Expanded body */
	.tier-body {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--border));
	}

	.tier-description {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0;
	}

	.compound-list {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.compound-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.compound-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--dot-color, hsl(var(--accent)));
		flex-shrink: 0;
	}

	.compound-link {
		color: hsl(var(--accent));
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.15s ease;
	}

	.compound-link:hover {
		opacity: 0.8;
		text-decoration: underline;
	}

	.compound-name {
		color: hsl(var(--foreground));
		font-weight: 500;
	}

	.compound-dose {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-left: auto;
		font-variant-numeric: tabular-nums;
	}
</style>
