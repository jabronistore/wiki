<script lang="ts">
	import { Clock, BookOpen } from 'lucide-svelte';
	import type { Guide, GuideCategory, GuideDifficulty } from '$lib/types';

	interface Props {
		guide: Guide;
	}

	let { guide }: Props = $props();

	const categoryLabels: Record<GuideCategory, string> = {
		basics: 'Basics',
		safety: 'Safety',
		protocols: 'Protocols',
		'research-methods': 'Research',
		equipment: 'Equipment',
		troubleshooting: 'Troubleshooting'
	};

	const difficultyConfig: Record<GuideDifficulty, { label: string; dots: number; color: string }> =
		{
			beginner: { label: 'Beginner', dots: 1, color: 'bg-success' },
			intermediate: { label: 'Intermediate', dots: 2, color: 'bg-warning' },
			advanced: { label: 'Advanced', dots: 3, color: 'bg-accent' }
		};

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<a href="/guides/{guide.slug}" class="guide-card group">
	<div class="card-header">
		<span class="category-badge">{categoryLabels[guide.category]}</span>
		<div class="difficulty" title={difficultyConfig[guide.difficulty].label}>
			{#each Array(3) as _, i}
				<span
					class="dot"
					class:active={i < difficultyConfig[guide.difficulty].dots}
					style:--dot-color="var(--{difficultyConfig[guide.difficulty].color.replace('bg-', '')})"
				></span>
			{/each}
		</div>
	</div>

	<h3 class="card-title">{guide.title}</h3>
	<p class="card-description">{guide.description}</p>

	<div class="card-footer">
		<div class="meta-item">
			<Clock class="h-3.5 w-3.5" />
			<span>{guide.readingTime}</span>
		</div>
		<div class="meta-item">
			<BookOpen class="h-3.5 w-3.5" />
			<span>{formatDate(guide.date)}</span>
		</div>
	</div>
</a>

<style>
	.guide-card {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.guide-card:hover {
		border-color: hsl(var(--accent));
		transform: translateY(-2px);
		box-shadow: 0 4px 12px hsl(var(--foreground) / 0.08);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.category-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.625rem;
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
		border-radius: 9999px;
	}

	.difficulty {
		display: flex;
		gap: 0.25rem;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: hsl(var(--muted));
	}

	.dot.active {
		background: hsl(var(--accent));
	}

	.card-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		line-height: 1.4;
		margin-bottom: 0.5rem;
		transition: color 0.15s ease;
	}

	.guide-card:hover .card-title {
		color: hsl(var(--accent));
	}

	.card-description {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		flex: 1;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-footer {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}
</style>
