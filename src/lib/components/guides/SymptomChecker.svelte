<script lang="ts">
	import { RotateCcw } from 'lucide-svelte';

	interface Category {
		id: string;
		name: string;
		symptoms: string[];
	}

	interface Props {
		title?: string;
		categories: Category[];
		recommendations: Record<string, string>;
	}

	let { title = 'Symptom Checker', categories, recommendations }: Props = $props();

	let selected: Set<string> = $state(new Set());

	// Build a lookup: symptom -> which category ids it belongs to
	const symptomToCategories = $derived.by(() => {
		const map = new Map<string, string[]>();
		for (const cat of categories) {
			for (const symptom of cat.symptoms) {
				const existing = map.get(symptom) || [];
				existing.push(cat.id);
				map.set(symptom, existing);
			}
		}
		return map;
	});

	// Deduplicated list of all symptoms
	const allSymptoms = $derived.by(() => {
		const seen = new Set<string>();
		const result: string[] = [];
		for (const cat of categories) {
			for (const symptom of cat.symptoms) {
				if (!seen.has(symptom)) {
					seen.add(symptom);
					result.push(symptom);
				}
			}
		}
		return result;
	});

	// Match scores: how many selected symptoms belong to each category
	const scores = $derived.by(() => {
		const result: { id: string; name: string; matched: number; total: number; pct: number }[] = [];
		for (const cat of categories) {
			const matched = cat.symptoms.filter((s) => selected.has(s)).length;
			const total = cat.symptoms.length;
			const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
			result.push({ id: cat.id, name: cat.name, matched, total, pct });
		}
		return result.sort((a, b) => b.pct - a.pct || b.matched - a.matched);
	});

	// The leading category (highest match %)
	const leader = $derived(scores.length > 0 && scores[0].matched > 0 ? scores[0] : null);

	// Threshold: show recommendation when leader has >= 40% match and at least 2 symptoms
	const showRecommendation = $derived(
		leader !== null && leader.pct >= 40 && leader.matched >= 2
	);

	function toggle(symptom: string) {
		const next = new Set(selected);
		if (next.has(symptom)) {
			next.delete(symptom);
		} else {
			next.add(symptom);
		}
		selected = next;
	}

	function reset() {
		selected = new Set();
	}

	// Which category a symptom chip should be colored by (first category it belongs to)
	function chipCategoryId(symptom: string): string | null {
		const cats = symptomToCategories.get(symptom);
		return cats && cats.length > 0 ? cats[0] : null;
	}
</script>

<div class="symptom-checker">
	<div class="checker-header">
		<h3 class="checker-title">{title}</h3>
		{#if selected.size > 0}
			<button class="reset-btn" onclick={reset}>
				<RotateCcw class="h-3.5 w-3.5" />
				Reset
			</button>
		{/if}
	</div>

	<p class="checker-instructions">
		Select the symptoms you are experiencing to see which category matches best.
	</p>

	<!-- Symptom chips -->
	<div class="symptom-grid">
		{#each allSymptoms as symptom}
			{@const isSelected = selected.has(symptom)}
			<button
				class="symptom-chip"
				class:active={isSelected}
				onclick={() => toggle(symptom)}
				aria-pressed={isSelected}
			>
				<span class="chip-indicator" class:checked={isSelected}>
					{#if isSelected}
						<svg viewBox="0 0 16 16" fill="none" class="check-icon">
							<path d="M4 8.5L6.5 11L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					{/if}
				</span>
				{symptom}
			</button>
		{/each}
	</div>

	<!-- Results panel -->
	{#if selected.size > 0}
		<div class="results-panel">
			<div class="results-header">
				<span class="results-label">Match Analysis</span>
				<span class="results-count">{selected.size} symptom{selected.size !== 1 ? 's' : ''} selected</span>
			</div>

			<div class="category-bars">
				{#each scores as score, i}
					{@const isLeader = i === 0 && score.matched > 0}
					<div class="category-row" class:is-leader={isLeader}>
						<div class="category-info">
							<span class="category-name" class:leader-name={isLeader}>{score.name}</span>
							<span class="category-score">{score.matched}/{score.total}</span>
						</div>
						<div class="bar-track">
							<div
								class="bar-fill"
								class:bar-leader={isLeader}
								style="width: {score.pct}%"
							></div>
						</div>
						<span class="category-pct">{score.pct}%</span>
					</div>
				{/each}
			</div>

			<!-- Recommendation -->
			{#if showRecommendation && leader}
				<div class="recommendation">
					<div class="recommendation-badge">
						Likely: {leader.name}
					</div>
					{#if recommendations[leader.id]}
						<p class="recommendation-text">{recommendations[leader.id]}</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.symptom-checker {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin: 1.5rem 0;
	}

	.checker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.checker-title {
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

	.checker-instructions {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.25rem;
		line-height: 1.5;
	}

	.symptom-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.symptom-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
		line-height: 1.3;
	}

	.symptom-chip:hover {
		border-color: hsl(var(--accent) / 0.5);
		background: hsl(var(--accent) / 0.05);
	}

	.symptom-chip.active {
		background: hsl(var(--accent) / 0.1);
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
	}

	.chip-indicator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		border-radius: 0.25rem;
		border: 1.5px solid hsl(var(--border));
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.chip-indicator.checked {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
		color: white;
	}

	.check-icon {
		width: 0.75rem;
		height: 0.75rem;
	}

	.results-panel {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid hsl(var(--border));
	}

	.results-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.results-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.results-count {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.category-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.category-row {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 0.75rem;
		align-items: center;
	}

	@media (min-width: 640px) {
		.category-row {
			grid-template-columns: 10rem 1fr 2.5rem;
		}
	}

	.category-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-width: 0;
	}

	.category-name {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.leader-name {
		color: hsl(var(--foreground));
		font-weight: 600;
	}

	.category-score {
		font-size: 0.6875rem;
		font-family: monospace;
		color: hsl(var(--muted-foreground));
		flex-shrink: 0;
	}

	.bar-track {
		height: 0.5rem;
		background: hsl(var(--muted));
		border-radius: 9999px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: hsl(var(--muted-foreground) / 0.3);
		border-radius: 9999px;
		transition: width 0.3s ease;
		min-width: 0;
	}

	.bar-fill.bar-leader {
		background: hsl(var(--accent));
	}

	.category-pct {
		font-size: 0.75rem;
		font-family: monospace;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-align: right;
		min-width: 2.5rem;
	}

	.is-leader .category-pct {
		color: hsl(var(--accent));
	}

	.recommendation {
		margin-top: 1.25rem;
		padding: 1rem 1.25rem;
		background: hsl(var(--accent) / 0.06);
		border: 1px solid hsl(var(--accent) / 0.2);
		border-radius: 0.625rem;
	}

	.recommendation-badge {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--accent));
		margin-bottom: 0.5rem;
	}

	.recommendation-text {
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		line-height: 1.65;
		margin: 0;
	}
</style>
