<script>
	/**
	 * @typedef {Object} Props
	 * @property {'info' | 'warning' | 'research' | 'tldr'} [type]
	 * @property {string} [title]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { type = 'info', title = '', children } = $props();

	const icons = {
		info: '*',
		warning: '!',
		research: '~',
		tldr: '>'
	};

	const colors = {
		info: { bg: 'var(--muted)', border: 'var(--accent)' },
		warning: { bg: 'var(--muted)', border: 'var(--destructive)' },
		research: { bg: 'var(--muted)', border: 'var(--ring)' },
		tldr: { bg: 'var(--muted)', border: 'var(--foreground)' }
	};
</script>

<aside
	class="callout"
	style="
		background-color: {colors[type].bg};
		border-left-color: {colors[type].border};
	"
>
	{#if title}
		<div class="callout-header">
			<span class="callout-icon">{icons[type]}</span>
			<span class="callout-title">{title}</span>
		</div>
	{/if}
	<div class="callout-body">
		{@render children?.()}
	</div>
</aside>

<style>
	.callout {
		margin: 1.5rem 0;
		padding: 1.25rem 1.5rem;
		border-left: 4px solid;
		border-radius: 0 8px 8px 0;
	}

	.callout-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.callout-icon {
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1.5px solid var(--border);
		color: var(--muted-foreground);
		flex-shrink: 0;
	}

	.callout-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--foreground, #191919);
	}

	.callout-body {
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--foreground, #191919);
	}

	.callout-body :global(p) {
		margin: 0;
	}

	.callout-body :global(p + p) {
		margin-top: 0.5rem;
	}
</style>
