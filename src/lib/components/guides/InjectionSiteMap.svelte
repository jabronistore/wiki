<script lang="ts">
	interface InjectionSite {
		id: string;
		name: string;
		x: number;
		y: number;
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

	let { title = 'Injection Site Map', sites }: Props = $props();

	let selectedSiteId: string | null = $state(null);

	const selectedSite = $derived(sites.find((s) => s.id === selectedSiteId) ?? null);

	const difficultyConfig: Record<
		InjectionSite['difficulty'],
		{ label: string; color: string; dotColor: string; bgClass: string }
	> = {
		easy: {
			label: 'Easy',
			color: 'hsl(var(--success))',
			dotColor: 'hsl(var(--success))',
			bgClass: 'difficulty-easy'
		},
		moderate: {
			label: 'Moderate',
			color: 'hsl(var(--warning))',
			dotColor: 'hsl(var(--warning))',
			bgClass: 'difficulty-moderate'
		},
		advanced: {
			label: 'Advanced',
			color: 'hsl(var(--destructive))',
			dotColor: 'hsl(var(--destructive))',
			bgClass: 'difficulty-advanced'
		}
	};

	function selectSite(id: string) {
		selectedSiteId = selectedSiteId === id ? null : id;
	}

	function handleKeydown(event: KeyboardEvent, id: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectSite(id);
		}
	}
</script>

<div class="site-map-container">
	{#if title}
		<h3 class="site-map-title">{title}</h3>
	{/if}

	<div class="site-map-layout">
		<!-- Body outline with injection site dots -->
		<div class="body-map-wrapper">
			<div class="body-map">
				<svg
					viewBox="0 0 200 440"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="body-outline"
					role="img"
					aria-label="Human body outline with injection sites"
				>
					<!-- Head -->
					<ellipse cx="100" cy="38" rx="22" ry="28" class="body-path" />

					<!-- Neck -->
					<rect x="91" y="64" width="18" height="16" rx="4" class="body-path" />

					<!-- Torso -->
					<path
						d="M66 80 Q60 82 56 100 Q52 130 54 170 Q56 200 66 210 L72 212 Q80 216 100 216 Q120 216 128 212 L134 210 Q144 200 146 170 Q148 130 144 100 Q140 82 134 80 Z"
						class="body-path"
					/>

					<!-- Left arm -->
					<path
						d="M56 100 Q46 102 38 120 Q30 145 28 170 Q26 190 30 210 Q32 218 36 220"
						class="body-path limb-path"
					/>

					<!-- Right arm -->
					<path
						d="M144 100 Q154 102 162 120 Q170 145 172 170 Q174 190 170 210 Q168 218 164 220"
						class="body-path limb-path"
					/>

					<!-- Left hand -->
					<ellipse cx="34" cy="226" rx="8" ry="10" class="body-path" />

					<!-- Right hand -->
					<ellipse cx="166" cy="226" rx="8" ry="10" class="body-path" />

					<!-- Left leg -->
					<path
						d="M76 216 Q72 240 70 280 Q68 320 66 350 Q64 380 62 400"
						class="body-path limb-path"
					/>
					<path
						d="M96 216 Q94 240 92 280 Q90 320 88 350 Q86 380 84 400"
						class="body-path limb-path"
					/>

					<!-- Right leg -->
					<path
						d="M104 216 Q106 240 108 280 Q110 320 112 350 Q114 380 116 400"
						class="body-path limb-path"
					/>
					<path
						d="M124 216 Q128 240 130 280 Q132 320 134 350 Q136 380 138 400"
						class="body-path limb-path"
					/>

					<!-- Left foot -->
					<ellipse cx="73" cy="412" rx="14" ry="10" class="body-path" />

					<!-- Right foot -->
					<ellipse cx="127" cy="412" rx="14" ry="10" class="body-path" />
				</svg>

				<!-- Injection site dots -->
				{#each sites as site (site.id)}
					<button
						class="site-dot"
						class:selected={selectedSiteId === site.id}
						style:left="{site.x}%"
						style:top="{site.y}%"
						style:--dot-color={difficultyConfig[site.difficulty].dotColor}
						onclick={() => selectSite(site.id)}
						onkeydown={(e) => handleKeydown(e, site.id)}
						aria-label="{site.name} - {difficultyConfig[site.difficulty].label} difficulty"
						title={site.name}
					>
						<span class="dot-pulse"></span>
					</button>
				{/each}
			</div>

			<!-- Legend -->
			<div class="legend">
				{#each (['easy', 'moderate', 'advanced'] as const) as diff}
					<div class="legend-item">
						<span class="legend-dot" style:background={difficultyConfig[diff].dotColor}></span>
						<span class="legend-label">{difficultyConfig[diff].label}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Detail panel -->
		<div class="detail-panel" class:visible={selectedSite !== null}>
			{#if selectedSite}
				{@const config = difficultyConfig[selectedSite.difficulty]}
				<div class="panel-content">
					<div class="panel-header">
						<h4 class="panel-title">{selectedSite.name}</h4>
						<span class="difficulty-badge {config.bgClass}">
							{config.label}
						</span>
					</div>

					<div class="panel-details">
						<div class="detail-row">
							<span class="detail-label">Technique</span>
							<span class="detail-value">{selectedSite.technique}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Needle</span>
							<span class="detail-value">{selectedSite.needle}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Max Volume</span>
							<span class="detail-value">{selectedSite.maxVolume}</span>
						</div>
					</div>

					{#if selectedSite.notes}
						<div class="panel-notes">
							<span class="notes-label">Notes</span>
							<p class="notes-text">{selectedSite.notes}</p>
						</div>
					{/if}

					<button class="close-btn" onclick={() => (selectedSiteId = null)}>
						Dismiss
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.site-map-container {
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--card));
		overflow: hidden;
	}

	.site-map-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		padding: 1rem 1.25rem;
		margin: 0;
		border-bottom: 1px solid hsl(var(--border));
	}

	.site-map-layout {
		display: flex;
		gap: 0;
	}

	.body-map-wrapper {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1.25rem 1rem;
	}

	.body-map {
		position: relative;
		width: 220px;
		height: 480px;
	}

	.body-outline {
		width: 100%;
		height: 100%;
	}

	.body-path {
		stroke: hsl(var(--muted-foreground) / 0.4);
		stroke-width: 1.5;
		fill: hsl(var(--muted) / 0.3);
	}

	.limb-path {
		fill: none;
		stroke-width: 10;
		stroke-linecap: round;
	}

	/* Injection site dot */
	.site-dot {
		position: absolute;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--dot-color);
		border: 2px solid hsl(var(--card));
		transform: translate(-50%, -50%);
		cursor: pointer;
		z-index: 2;
		transition: all 0.2s ease;
		box-shadow: 0 1px 4px hsl(var(--foreground) / 0.12);
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.site-dot:hover {
		transform: translate(-50%, -50%) scale(1.25);
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.2);
		z-index: 3;
	}

	.site-dot:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.site-dot.selected {
		transform: translate(-50%, -50%) scale(1.35);
		box-shadow:
			0 0 0 3px hsl(var(--card)),
			0 0 0 5px var(--dot-color);
		z-index: 4;
	}

	/* Subtle pulse for selected dot */
	.dot-pulse {
		display: none;
	}

	.site-dot.selected .dot-pulse {
		display: block;
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: var(--dot-color);
		opacity: 0.4;
		animation: pulse 2s ease-out infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 0.4;
		}
		100% {
			transform: scale(2.2);
			opacity: 0;
		}
	}

	/* Legend */
	.legend {
		display: flex;
		gap: 1rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--border));
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-label {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
	}

	/* Detail panel */
	.detail-panel {
		flex: 1;
		min-width: 0;
		border-left: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.3);
		display: flex;
		align-items: flex-start;
		opacity: 0;
		transform: translateX(8px);
		transition: all 0.25s ease;
		overflow: hidden;
		max-width: 0;
	}

	.detail-panel.visible {
		opacity: 1;
		transform: translateX(0);
		max-width: 320px;
	}

	.panel-content {
		padding: 1.5rem 1.25rem;
		width: 100%;
		min-width: 240px;
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.panel-title {
		font-size: 1.0625rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
		line-height: 1.3;
	}

	.difficulty-badge {
		flex-shrink: 0;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.2rem 0.5rem;
		border-radius: 9999px;
	}

	.difficulty-easy {
		background: hsl(var(--success) / 0.12);
		color: hsl(var(--success));
	}

	.difficulty-moderate {
		background: hsl(var(--warning) / 0.15);
		color: hsl(var(--warning));
	}

	.difficulty-advanced {
		background: hsl(var(--destructive) / 0.12);
		color: hsl(var(--destructive));
	}

	.panel-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.detail-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--muted-foreground));
	}

	.detail-value {
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		line-height: 1.5;
	}

	.panel-notes {
		padding: 0.75rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--border));
		margin-bottom: 1rem;
	}

	.notes-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--muted-foreground));
		display: block;
		margin-bottom: 0.25rem;
	}

	.notes-text {
		font-size: 0.8125rem;
		color: hsl(var(--foreground));
		line-height: 1.5;
		margin: 0;
	}

	.close-btn {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: none;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		padding: 0.375rem 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.close-btn:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--muted-foreground));
	}

	/* Mobile layout */
	@media (max-width: 640px) {
		.site-map-layout {
			flex-direction: column;
		}

		.body-map-wrapper {
			padding: 1rem 0.75rem 0.75rem;
		}

		.body-map {
			width: 180px;
			height: 400px;
		}

		.site-dot {
			width: 24px;
			height: 24px;
		}

		.detail-panel {
			border-left: none;
			border-top: 1px solid hsl(var(--border));
			max-width: none;
			transform: translateY(8px);
		}

		.detail-panel.visible {
			transform: translateY(0);
			max-width: none;
		}

		.panel-content {
			min-width: unset;
			padding: 1rem;
		}

		.legend {
			gap: 0.75rem;
		}
	}
</style>
