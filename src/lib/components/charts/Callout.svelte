<script>
	/** @type {'info' | 'warning' | 'research' | 'tldr'} */
	export let type = 'info';
	export let title = '';

	const icons = {
		info: '💡',
		warning: '⚠️',
		research: '🔬',
		tldr: '⚡'
	};

	const colors = {
		info: { bg: 'var(--muted, #F0F0EB)', border: 'var(--accent, #CC785C)' },
		warning: { bg: '#fef3c7', border: 'var(--warning, #D4A27F)' },
		research: { bg: 'var(--muted, #F0F0EB)', border: '#6366f1' },
		tldr: { bg: 'var(--muted, #F0F0EB)', border: 'var(--foreground, #191919)' }
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
		<slot />
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
		font-size: 1.125rem;
		line-height: 1;
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
