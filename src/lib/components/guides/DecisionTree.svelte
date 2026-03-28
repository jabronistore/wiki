<script lang="ts">
	import { RotateCcw, ChevronRight, ArrowRight, Beaker } from 'lucide-svelte';

	interface DecisionOption {
		label: string;
		next: string;
	}

	interface DecisionNode {
		id: string;
		question: string;
		detail?: string;
		options: DecisionOption[];
	}

	interface ResultData {
		title: string;
		description: string;
		compounds?: { name: string; url: string }[];
	}

	interface Props {
		title?: string;
		nodes: DecisionNode[];
		results: Record<string, ResultData>;
	}

	let { title, nodes, results }: Props = $props();

	// Build a lookup map for nodes by id
	const nodeMap = $derived(
		nodes.reduce(
			(map, node) => {
				map[node.id] = node;
				return map;
			},
			{} as Record<string, DecisionNode>
		)
	);

	// Trail of breadcrumb entries: which node was shown and which option was picked
	let trail: { nodeId: string; chosenLabel: string }[] = $state([]);

	// The current node id (start at first node)
	let currentNodeId: string = $state(nodes.length > 0 ? nodes[0].id : '');

	// Whether we've reached a result
	let currentResult: ResultData | null = $derived(results[currentNodeId] ?? null);

	// The current node (null if we're at a result)
	let currentNode: DecisionNode | null = $derived(
		currentResult ? null : (nodeMap[currentNodeId] ?? null)
	);

	// Animation state
	let transitioning = $state(false);
	let direction: 'forward' | 'backward' = $state('forward');

	function choose(option: DecisionOption) {
		direction = 'forward';
		transitioning = true;

		setTimeout(() => {
			trail = [...trail, { nodeId: currentNodeId, chosenLabel: option.label }];
			currentNodeId = option.next;
			transitioning = false;
		}, 200);
	}

	function reset() {
		direction = 'backward';
		transitioning = true;

		setTimeout(() => {
			trail = [];
			currentNodeId = nodes.length > 0 ? nodes[0].id : '';
			transitioning = false;
		}, 200);
	}

	function goBackTo(index: number) {
		direction = 'backward';
		transitioning = true;

		setTimeout(() => {
			currentNodeId = trail[index].nodeId;
			trail = trail.slice(0, index);
			transitioning = false;
		}, 200);
	}
</script>

<div class="decision-tree">
	{#if title}
		<div class="tree-header">
			<Beaker class="header-icon" />
			<h3 class="tree-title">{title}</h3>
		</div>
	{/if}

	<!-- Breadcrumb trail -->
	{#if trail.length > 0}
		<nav class="breadcrumbs" aria-label="Decision path">
			<button type="button" class="crumb-btn crumb-start" onclick={reset}>
				Start
			</button>
			{#each trail as step, i}
				<ChevronRight class="crumb-separator" />
				<button type="button" class="crumb-btn" onclick={() => goBackTo(i)}>
					{step.chosenLabel}
				</button>
			{/each}
		</nav>
	{/if}

	<!-- Question / Result card area -->
	<div class="card-area">
		<div
			class="card-content"
			class:slide-out={transitioning && direction === 'forward'}
			class:slide-out-back={transitioning && direction === 'backward'}
		>
			{#if currentNode}
				<!-- Question node -->
				<div class="question-card">
					<p class="step-indicator">Step {trail.length + 1}</p>
					<h4 class="question-text">{currentNode.question}</h4>
					{#if currentNode.detail}
						<p class="question-detail">{currentNode.detail}</p>
					{/if}

					<div class="options-list">
						{#each currentNode.options as option}
							<button
								type="button"
								class="option-btn"
								onclick={() => choose(option)}
							>
								<span class="option-label">{option.label}</span>
								<ArrowRight class="option-arrow" />
							</button>
						{/each}
					</div>
				</div>
			{:else if currentResult}
				<!-- Result node -->
				<div class="result-card">
					<p class="result-badge">Recommendation</p>
					<h4 class="result-title">{currentResult.title}</h4>
					<p class="result-description">{currentResult.description}</p>

					{#if currentResult.compounds && currentResult.compounds.length > 0}
						<div class="compounds-section">
							<p class="compounds-heading">Related compounds</p>
							<div class="compounds-list">
								{#each currentResult.compounds as compound}
									<a href={compound.url} class="compound-link">
										{compound.name}
									</a>
								{/each}
							</div>
						</div>
					{/if}

					<button type="button" class="reset-btn" onclick={reset}>
						<RotateCcw class="reset-icon" />
						Start Over
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.decision-tree {
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--card));
		overflow: hidden;
	}

	.tree-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.5);
	}

	.tree-header :global(.header-icon) {
		width: 1.125rem;
		height: 1.125rem;
		color: hsl(var(--accent));
		flex-shrink: 0;
	}

	.tree-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	/* Breadcrumbs */
	.breadcrumbs {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.75rem 1.5rem;
		background: hsl(var(--muted) / 0.35);
		border-bottom: 1px solid hsl(var(--border));
	}

	.crumb-btn {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.crumb-btn:hover {
		color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.08);
	}

	.crumb-start {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.breadcrumbs :global(.crumb-separator) {
		width: 0.875rem;
		height: 0.875rem;
		color: hsl(var(--muted-foreground) / 0.5);
		flex-shrink: 0;
	}

	/* Card area and animations */
	.card-area {
		overflow: hidden;
	}

	.card-content {
		padding: 1.5rem;
		transition:
			opacity 0.2s ease,
			transform 0.2s ease;
	}

	.card-content.slide-out {
		opacity: 0;
		transform: translateX(-1.5rem);
	}

	.card-content.slide-out-back {
		opacity: 0;
		transform: translateX(1.5rem);
	}

	/* Question card */
	.question-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.step-indicator {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--accent));
		margin: 0;
	}

	.question-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		line-height: 1.4;
		margin: 0;
	}

	.question-detail {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0 0 0.5rem;
	}

	/* Options */
	.options-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.option-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: hsl(var(--muted) / 0.5);
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}

	.option-btn:hover {
		border-color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.06);
		transform: translateX(4px);
	}

	.option-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		line-height: 1.4;
	}

	.option-btn :global(.option-arrow) {
		width: 1rem;
		height: 1rem;
		color: hsl(var(--muted-foreground));
		flex-shrink: 0;
		transition: color 0.15s ease;
	}

	.option-btn:hover :global(.option-arrow) {
		color: hsl(var(--accent));
	}

	/* Result card */
	.result-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.result-badge {
		display: inline-block;
		width: fit-content;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.625rem;
		background: hsl(var(--success) / 0.1);
		color: hsl(var(--success));
		border-radius: 9999px;
		margin: 0;
	}

	.result-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		line-height: 1.3;
		margin: 0.25rem 0 0;
	}

	.result-description {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.7;
		margin: 0;
	}

	/* Compounds section */
	.compounds-section {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--border));
	}

	.compounds-heading {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--muted-foreground));
		margin: 0 0 0.5rem;
	}

	.compounds-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.compound-link {
		font-size: 0.8125rem;
		font-weight: 500;
		padding: 0.375rem 0.75rem;
		background: hsl(var(--accent) / 0.08);
		color: hsl(var(--accent));
		border: 1px solid hsl(var(--accent) / 0.2);
		border-radius: 9999px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.compound-link:hover {
		background: hsl(var(--accent) / 0.15);
		border-color: hsl(var(--accent) / 0.4);
	}

	/* Reset button */
	.reset-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		width: fit-content;
		margin-top: 1rem;
		padding: 0.625rem 1.25rem;
		font-size: 0.8125rem;
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

	.reset-btn :global(.reset-icon) {
		width: 0.875rem;
		height: 0.875rem;
	}
</style>
