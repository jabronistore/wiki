<script lang="ts">
	interface InjectionSite {
		id: string;
		name: string;
		type: 'subq' | 'im';
		technique: string;
		needle: string;
		maxVolume: string;
		difficulty: 'easy' | 'moderate' | 'advanced';
		notes?: string;
	}

	interface Props {
		title?: string;
		sites: InjectionSite[];
	}

	let { title = 'Injection Sites', sites }: Props = $props();

	let expandedId: string | null = $state(null);

	const subqSites = $derived(sites.filter((s) => s.type === 'subq'));
	const imSites = $derived(sites.filter((s) => s.type === 'im'));

	const diffColors: Record<string, string> = {
		easy: 'hsl(142 71% 45%)',
		moderate: 'hsl(var(--warning))',
		advanced: 'hsl(var(--destructive))'
	};

	function toggle(id: string) {
		expandedId = expandedId === id ? null : id;
	}
</script>

<div class="ism">
	{#if title}
		<div class="ism-title">{title}</div>
	{/if}

	{#if subqSites.length > 0}
		<div class="ism-group">
			<div class="ism-group-header">
				<span class="ism-group-label">Subcutaneous (SubQ)</span>
				<span class="ism-group-count">{subqSites.length} sites</span>
			</div>
			{#each subqSites as site (site.id)}
				<button class="ism-card" class:expanded={expandedId === site.id} onclick={() => toggle(site.id)}>
					<div class="ism-card-top">
						<span class="ism-dot" style:background={diffColors[site.difficulty]}></span>
						<span class="ism-name">{site.name}</span>
						<span class="ism-diff" style:color={diffColors[site.difficulty]}>{site.difficulty}</span>
					</div>
					{#if expandedId === site.id}
						<div class="ism-details">
							<div class="ism-row">
								<span class="ism-label">Technique</span>
								<span class="ism-value">{site.technique}</span>
							</div>
							<div class="ism-row">
								<span class="ism-label">Needle</span>
								<span class="ism-value">{site.needle}</span>
							</div>
							<div class="ism-row">
								<span class="ism-label">Max Volume</span>
								<span class="ism-value">{site.maxVolume}</span>
							</div>
							{#if site.notes}
								<div class="ism-notes">{site.notes}</div>
							{/if}
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	{#if imSites.length > 0}
		<div class="ism-group">
			<div class="ism-group-header">
				<span class="ism-group-label">Intramuscular (IM)</span>
				<span class="ism-group-count">{imSites.length} sites</span>
			</div>
			{#each imSites as site (site.id)}
				<button class="ism-card" class:expanded={expandedId === site.id} onclick={() => toggle(site.id)}>
					<div class="ism-card-top">
						<span class="ism-dot" style:background={diffColors[site.difficulty]}></span>
						<span class="ism-name">{site.name}</span>
						<span class="ism-diff" style:color={diffColors[site.difficulty]}>{site.difficulty}</span>
					</div>
					{#if expandedId === site.id}
						<div class="ism-details">
							<div class="ism-row">
								<span class="ism-label">Technique</span>
								<span class="ism-value">{site.technique}</span>
							</div>
							<div class="ism-row">
								<span class="ism-label">Needle</span>
								<span class="ism-value">{site.needle}</span>
							</div>
							<div class="ism-row">
								<span class="ism-label">Max Volume</span>
								<span class="ism-value">{site.maxVolume}</span>
							</div>
							{#if site.notes}
								<div class="ism-notes">{site.notes}</div>
							{/if}
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<div class="ism-legend">
		<span class="ism-legend-item"><span class="ism-dot" style:background={diffColors.easy}></span> Easy</span>
		<span class="ism-legend-item"><span class="ism-dot" style:background={diffColors.moderate}></span> Moderate</span>
		<span class="ism-legend-item"><span class="ism-dot" style:background={diffColors.advanced}></span> Advanced</span>
	</div>
</div>

<style>
	.ism {
		margin: 1.5rem 0;
	}

	.ism-title {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		font-weight: 400;
		color: hsl(var(--foreground));
		margin-bottom: 1rem;
	}

	.ism-group {
		margin-bottom: 1.25rem;
	}

	.ism-group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.5rem;
		margin-bottom: 0.375rem;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
	}

	.ism-group-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--accent));
	}

	.ism-group-count {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
	}

	.ism-card {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0;
		margin: 0;
		border: 1px solid hsl(var(--border) / 0.4);
		border-radius: 0.5rem;
		background: hsl(var(--card));
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s;
		margin-bottom: 0.375rem;
	}

	.ism-card:hover {
		border-color: hsl(var(--border));
	}

	.ism-card.expanded {
		border-color: hsl(var(--accent) / 0.4);
	}

	.ism-card-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.875rem;
	}

	.ism-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.ism-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		flex: 1;
	}

	.ism-diff {
		font-size: 0.5625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.ism-details {
		padding: 0 0.875rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		border-top: 1px solid hsl(var(--border) / 0.3);
		margin-top: 0;
		padding-top: 0.625rem;
	}

	.ism-row {
		display: flex;
		gap: 0.75rem;
	}

	.ism-label {
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		min-width: 5rem;
		flex-shrink: 0;
	}

	.ism-value {
		font-size: 0.75rem;
		color: hsl(var(--foreground) / 0.85);
		line-height: 1.5;
	}

	.ism-notes {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
		padding-top: 0.25rem;
		border-top: 1px solid hsl(var(--border) / 0.2);
		margin-top: 0.25rem;
	}

	.ism-legend {
		display: flex;
		gap: 1rem;
		padding-top: 0.5rem;
	}

	.ism-legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
	}
</style>
