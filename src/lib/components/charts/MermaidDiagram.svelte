<script>
	import { onMount } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} [chart]
	 * @property {string} [title]
	 * @property {string} [accentColor]
	 */

	/** @type {Props} */
	let { chart = '', title = '', accentColor = '#CC785C' } = $props();

	/** @type {HTMLDivElement} */
	let container;
	let rendered = $state(false);

	onMount(async () => {
		if (!chart || !container) return;

		// Read CSS variables from the DOM for theme-aware colors
		const styles = getComputedStyle(document.documentElement);
		const bg = styles.getPropertyValue('--background').trim();
		const fg = styles.getPropertyValue('--foreground').trim();
		const muted = styles.getPropertyValue('--muted').trim();
		const border = styles.getPropertyValue('--border').trim();
		const mutedFg = styles.getPropertyValue('--muted-foreground').trim();

		// Convert HSL variable values to usable colors
		/** @param {string} v */
		const hsl = (v) => v ? `hsl(${v})` : '#666';

		try {
			const mermaid = (await import('mermaid')).default;
			mermaid.initialize({
				startOnLoad: false,
				theme: 'base',
				themeVariables: {
					fontFamily: 'Inter Variable, Inter, system-ui, sans-serif',
					fontSize: '13px',
					primaryColor: accentColor,
					primaryTextColor: '#ffffff',
					primaryBorderColor: hsl(border),
					lineColor: hsl(mutedFg),
					secondaryColor: hsl(muted),
					tertiaryColor: hsl(bg),
					mainBkg: accentColor,
					nodeBorder: hsl(border),
					clusterBkg: hsl(muted),
					clusterBorder: hsl(border),
					titleColor: hsl(fg),
					edgeLabelBackground: hsl(bg),
					textColor: hsl(fg),
					nodeTextColor: '#ffffff'
				},
				flowchart: {
					htmlLabels: false,
					curve: 'basis',
					padding: 12,
					nodeSpacing: 30,
					rankSpacing: 40
				}
			});

			const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
			const { svg } = await mermaid.render(id, chart);
			if (container) {
				container.innerHTML = svg;
				rendered = true;
			}
		} catch (e) {
			console.error('Mermaid render error:', e);
			if (container) {
				container.textContent = 'Diagram failed to render';
			}
		}
	});
</script>

<figure class="mermaid-container">
	{#if title}
		<figcaption class="mermaid-title">{title}</figcaption>
	{/if}
	<div bind:this={container} class="mermaid-content" class:rendered></div>
</figure>

<style>
	.mermaid-container {
		margin: 2rem 0;
		text-align: center;
	}

	.mermaid-title {
		font-family: var(--font-sans);
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--accent));
		margin-bottom: 1rem;
	}

	.mermaid-content {
		opacity: 0;
		transition: opacity 0.4s ease;
		min-height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mermaid-content.rendered {
		opacity: 1;
	}

	.mermaid-content :global(svg) {
		max-width: 100%;
		height: auto;
	}

	/* Round all node shapes */
	.mermaid-content :global(.node rect),
	.mermaid-content :global(.node polygon),
	.mermaid-content :global(.node circle) {
		rx: 8;
		ry: 8;
	}

	/* Ensure our font is used everywhere in the diagram */
	.mermaid-content :global(text),
	.mermaid-content :global(.label),
	.mermaid-content :global(.nodeLabel),
	.mermaid-content :global(.edgeLabel),
	.mermaid-content :global(span) {
		font-family: var(--font-sans) !important;
	}

	/* Node labels — ensure readable */
	.mermaid-content :global(.nodeLabel) {
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1.4;
		padding: 4px 8px;
	}

	/* Edge labels — smaller, muted */
	.mermaid-content :global(.edgeLabel) {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
	}

	/* Edge label background */
	.mermaid-content :global(.edgeLabel rect) {
		rx: 4;
		ry: 4;
		fill: hsl(var(--background)) !important;
		stroke: hsl(var(--border)) !important;
		stroke-width: 1;
	}

	/* Arrow lines — use muted foreground */
	.mermaid-content :global(.flowchart-link) {
		stroke: hsl(var(--muted-foreground)) !important;
	}

	/* Arrowhead markers */
	.mermaid-content :global(marker path) {
		fill: hsl(var(--muted-foreground)) !important;
		stroke: hsl(var(--muted-foreground)) !important;
	}

	/* Node label text — white on accent backgrounds */
	.mermaid-content :global(.node text),
	.mermaid-content :global(.node tspan),
	.mermaid-content :global(.nodeLabel) {
		fill: #ffffff !important;
		color: #ffffff !important;
	}

	/* Cluster/subgraph backgrounds */
	.mermaid-content :global(.cluster rect) {
		rx: 8 !important;
		ry: 8 !important;
		fill: hsl(var(--muted) / 0.3) !important;
		stroke: hsl(var(--border)) !important;
	}

	.mermaid-content :global(.cluster text) {
		fill: hsl(var(--foreground)) !important;
	}
</style>
