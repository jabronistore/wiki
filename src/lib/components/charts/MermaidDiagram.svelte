<script>
	import { onMount } from 'svelte';

	export let chart = '';
	export let title = '';
	export let accentColor = '#CC785C';

	/** @type {HTMLDivElement} */
	let container;
	let rendered = false;

	onMount(async () => {
		try {
			const mermaid = (await import('mermaid')).default;
			mermaid.initialize({
				startOnLoad: false,
				theme: 'base',
				themeVariables: {
					primaryColor: accentColor,
					primaryTextColor: '#ffffff',
					primaryBorderColor: '#40403E',
					lineColor: '#666663',
					secondaryColor: '#F0F0EB',
					tertiaryColor: '#FAFAF7',
					fontSize: '13px',
					nodeBorder: '#40403E',
					mainBkg: accentColor,
					edgeLabelBackground: '#F0F0EB'
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
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--muted-foreground, #666663);
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
</style>
