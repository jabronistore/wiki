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
					viewBox="0 0 200 500"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class="body-outline"
					role="img"
					aria-label="Human body outline with injection sites"
				>
					<!-- Medical illustration style human figure — front view, neutral anatomical position -->
					<!-- Head and neck -->
					<path d="M100 8 C82 8 72 22 72 38 C72 50 78 60 86 65 L86 72 C86 76 90 80 94 80 L106 80 C110 80 114 76 114 72 L114 65 C122 60 128 50 128 38 C128 22 118 8 100 8Z" class="body-path" />

					<!-- Shoulders and upper torso -->
					<path d="M94 80 L84 82 C68 84 52 90 42 100 C38 104 36 110 36 116 L36 128 C36 130 38 132 40 132 L40 132" class="body-path limb-path" />
					<path d="M106 80 L116 82 C132 84 148 90 158 100 C162 104 164 110 164 116 L164 128 C164 130 162 132 160 132 L160 132" class="body-path limb-path" />

					<!-- Torso -->
					<path d="M62 96 C58 110 56 130 56 150 C56 170 57 190 60 205 C62 215 66 225 72 232 L76 236 C84 242 92 244 100 244 C108 244 116 242 124 236 L128 232 C134 225 138 215 140 205 C143 190 144 170 144 150 C144 130 142 110 138 96" class="body-path" />

					<!-- Chest line -->
					<path d="M72 120 C80 126 90 128 100 128 C110 128 120 126 128 120" class="body-detail" />

					<!-- Navel -->
					<circle cx="100" cy="196" r="2.5" class="body-detail" />

					<!-- Left arm -->
					<path d="M40 132 C38 148 34 165 32 180 C30 196 28 212 28 228 C28 240 30 248 32 252" class="body-path limb-path" />
					<!-- Left forearm -->
					<path d="M32 252 C30 268 26 284 24 300 C22 310 22 316 24 320" class="body-path limb-path" />
					<!-- Left hand -->
					<path d="M24 320 C22 326 20 332 20 336 C20 342 22 346 26 348 C30 350 34 348 36 344 C38 340 36 334 34 328 C32 324 30 320 32 316" class="body-path" />

					<!-- Right arm -->
					<path d="M160 132 C162 148 166 165 168 180 C170 196 172 212 172 228 C172 240 170 248 168 252" class="body-path limb-path" />
					<!-- Right forearm -->
					<path d="M168 252 C170 268 174 284 176 300 C178 310 178 316 176 320" class="body-path limb-path" />
					<!-- Right hand -->
					<path d="M176 320 C178 326 180 332 180 336 C180 342 178 346 174 348 C170 350 166 348 164 344 C162 340 164 334 166 328 C168 324 170 320 168 316" class="body-path" />

					<!-- Hip crease -->
					<path d="M72 232 C80 240 90 244 100 244" class="body-detail" />
					<path d="M128 232 C120 240 110 244 100 244" class="body-detail" />

					<!-- Left leg -->
					<path d="M76 236 C74 256 72 276 70 296 C68 316 66 336 66 356 C66 372 66 384 68 396" class="body-path limb-path" />
					<path d="M100 244 C98 260 96 276 94 296 C92 316 90 336 90 356 C90 372 90 384 88 396" class="body-path limb-path" />

					<!-- Left knee -->
					<path d="M70 340 C74 344 80 346 84 344" class="body-detail" />

					<!-- Left foot -->
					<path d="M68 396 C66 408 62 420 58 428 C56 432 54 436 54 440 C54 446 58 450 66 450 C74 450 82 448 88 446 C92 444 90 440 88 436 C88 420 88 408 88 396" class="body-path" />

					<!-- Right leg -->
					<path d="M124 236 C126 256 128 276 130 296 C132 316 134 336 134 356 C134 372 134 384 132 396" class="body-path limb-path" />
					<path d="M100 244 C102 260 104 276 106 296 C108 316 110 336 110 356 C110 372 110 384 112 396" class="body-path limb-path" />

					<!-- Right knee -->
					<path d="M116 344 C120 340 126 340 130 344" class="body-detail" />

					<!-- Right foot -->
					<path d="M132 396 C132 408 132 420 132 428 C132 432 130 436 128 440 C126 446 130 450 138 450 C146 450 150 446 150 440 C150 436 148 432 146 428 C142 420 136 408 134 396" class="body-path" />
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
		stroke: hsl(var(--muted-foreground) / 0.35);
		stroke-width: 1.2;
		fill: hsl(var(--muted) / 0.15);
		stroke-linejoin: round;
	}

	.limb-path {
		fill: none;
		stroke-width: 1.2;
		stroke-linecap: round;
	}

	:global(.body-detail) {
		stroke: hsl(var(--muted-foreground) / 0.2);
		stroke-width: 0.8;
		fill: none;
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
