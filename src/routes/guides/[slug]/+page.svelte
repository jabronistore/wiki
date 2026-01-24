<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft, Clock, Calendar, User, Tag } from 'lucide-svelte';
	import SEO from 'sk-seo';
	import type { Guide, GuideCategory, GuideDifficulty } from '$lib/types';

	let { data }: { data: { content: ConstructorOfATypedSvelteComponent; meta: Guide } } = $props();

	const SITE_URL = 'https://peptide-db.com';
	const canonicalUrl = data.meta.canonical || `${SITE_URL}/guides/${data.meta.slug}`;

	const categoryLabels: Record<GuideCategory, string> = {
		basics: 'Basics',
		safety: 'Safety',
		protocols: 'Protocols',
		'research-methods': 'Research Methods',
		equipment: 'Equipment',
		troubleshooting: 'Troubleshooting'
	};

	const difficultyConfig: Record<GuideDifficulty, { label: string; color: string }> = {
		beginner: { label: 'Beginner', color: 'success' },
		intermediate: { label: 'Intermediate', color: 'warning' },
		advanced: { label: 'Advanced', color: 'accent' }
	};

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// JSON-LD structured data for SEO (matching geopera blog pattern)
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: data.meta.title,
		image: data.meta.image,
		datePublished: data.meta.date ? new Date(data.meta.date).toISOString() : null,
		dateModified: data.meta.lastUpdated
			? new Date(data.meta.lastUpdated).toISOString()
			: data.meta.date
				? new Date(data.meta.date).toISOString()
				: null,
		author: {
			'@type': data.meta.authorUrl ? 'Organization' : 'Person',
			name: data.meta.author || 'Peptide Database',
			url: data.meta.authorUrl
		},
		publisher: {
			'@type': 'Organization',
			name: 'Peptide Database',
			sameAs: SITE_URL,
			image: '/pep-logo.webp',
			logo: {
				'@type': 'ImageObject',
				url: '/pep-logo.webp'
			}
		},
		description: data.meta.description,
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': canonicalUrl
		},
		articleSection: categoryLabels[data.meta.category],
		keywords: data.meta.keywords || data.meta.tags?.join(', ')
	};
</script>

<SEO
	title="{data.meta.title} | Guides | Peptide Database"
	description={data.meta.description}
	keywords={data.meta.keywords || data.meta.tags?.join(', ')}
	siteName="Peptide Database"
	canonical={canonicalUrl}
	twitter={true}
	openGraph={true}
	schemaOrg={true}
	schemaType="Article"
	jsonld={jsonLd}
	imageURL={data.meta.image}
	author={data.meta.author}
/>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<article class="guide-article">
		<!-- Back link -->
		<a href="/guides" class="back-link">
			<ArrowLeft class="h-4 w-4" />
			<span>All Guides</span>
		</a>

		<!-- Header -->
		<header class="article-header">
			<div class="header-meta">
				<span class="category-badge">{categoryLabels[data.meta.category]}</span>
				<span
					class="difficulty-badge"
					class:beginner={data.meta.difficulty === 'beginner'}
					class:intermediate={data.meta.difficulty === 'intermediate'}
					class:advanced={data.meta.difficulty === 'advanced'}
				>
					{difficultyConfig[data.meta.difficulty].label}
				</span>
			</div>

			<h1>{data.meta.title}</h1>

			<div class="article-info">
				<div class="info-item">
					<Clock class="h-4 w-4" />
					<span>{data.meta.readingTime}</span>
				</div>
				<div class="info-item">
					<Calendar class="h-4 w-4" />
					<span>{formatDate(data.meta.date)}</span>
				</div>
				{#if data.meta.author}
					<div class="info-item">
						<User class="h-4 w-4" />
						<span>{data.meta.author}</span>
					</div>
				{/if}
			</div>

			{#if data.meta.tags && data.meta.tags.length > 0}
				<div class="tags">
					{#each data.meta.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
			{#if data.meta.image}
				<div class="hero-image">
					<img
						src={data.meta.image}
						alt={data.meta.imageAlt || data.meta.title}
						loading="eager"
						class:invert-dark={data.meta.invertImageInDark}
					/>
				</div>
			{/if}
		</header>

		<!-- Content -->
		<div class="prose-guide">
			<data.content />
		</div>

		<!-- Author Bio -->
		{#if data.meta.authorBio}
			<div class="author-bio">
				{#if data.meta.authorImage}
					<img
						src={data.meta.authorImage}
						alt={data.meta.author}
						class="author-image"
						loading="lazy"
					/>
				{/if}
				<div class="author-info">
					<h3>{data.meta.author}</h3>
					<p>{data.meta.authorBio}</p>
					{#if data.meta.authorSocial}
						<div class="author-social">
							{#if data.meta.authorSocial.twitter}
								<a href={data.meta.authorSocial.twitter} target="_blank" rel="noopener noreferrer"
									>Twitter</a
								>
							{/if}
							{#if data.meta.authorSocial.linkedin}
								<a href={data.meta.authorSocial.linkedin} target="_blank" rel="noopener noreferrer"
									>LinkedIn</a
								>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Related Guides -->
		{#if data.meta.relatedGuides && data.meta.relatedGuides.length > 0}
			<div class="related-guides">
				<h3>Related Guides</h3>
				<div class="related-guides-grid">
					{#each data.meta.relatedGuides as guide}
						<a href="/guides/{guide.slug}" class="related-guide-card">
							{#if guide.image}
								<img src={guide.image} alt={guide.title} loading="lazy" />
							{/if}
							<h4>{guide.title}</h4>
							{#if guide.excerpt}
								<p>{guide.excerpt}</p>
							{/if}
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Related peptides -->
		{#if data.meta.relatedPeptides && data.meta.relatedPeptides.length > 0}
			<aside class="related-peptides">
				<h3>Related Peptides</h3>
				<div class="peptide-links">
					{#each data.meta.relatedPeptides as slug}
						<a href="/peptides/{slug}" class="peptide-link">{slug}</a>
					{/each}
				</div>
			</aside>
		{/if}
	</article>
</div>

<style>
	.guide-article {
		max-width: 48rem;
		margin: 0 auto;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		margin-bottom: 1.5rem;
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: hsl(var(--accent));
	}

	.article-header {
		margin-bottom: 2.5rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.header-meta {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.category-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.75rem;
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
		border-radius: 9999px;
	}

	.difficulty-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
	}

	.difficulty-badge.beginner {
		background: hsl(var(--success) / 0.1);
		color: hsl(var(--success));
	}

	.difficulty-badge.intermediate {
		background: hsl(var(--warning) / 0.15);
		color: hsl(var(--warning-foreground));
	}

	.difficulty-badge.advanced {
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
	}

	.article-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		line-height: 1.25;
		margin-bottom: 0.75rem;
	}

	.article-info {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
		margin-top: 1.5rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}

	.tag {
		font-size: 0.75rem;
		padding: 0.25rem 0.625rem;
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		border-radius: 0.25rem;
	}

	/* Prose styling for markdown content */
	.prose-guide {
		font-size: 1rem;
		line-height: 1.75;
		color: hsl(var(--foreground));
	}

	.prose-guide :global(h2) {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin-top: 2.5rem;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.prose-guide :global(h3) {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}

	.prose-guide :global(p) {
		margin-bottom: 1.25rem;
	}

	.prose-guide :global(ul) {
		margin-bottom: 1.25rem;
		padding-left: 1.5rem;
		list-style-type: disc;
	}

	.prose-guide :global(ol) {
		margin-bottom: 1.25rem;
		padding-left: 1.5rem;
		list-style-type: decimal;
	}

	.prose-guide :global(li) {
		margin-bottom: 0.5rem;
	}

	.prose-guide :global(li::marker) {
		color: hsl(var(--muted-foreground));
	}

	.prose-guide :global(strong) {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.prose-guide :global(a) {
		color: hsl(var(--accent));
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.prose-guide :global(a:hover) {
		text-decoration-thickness: 2px;
	}

	.prose-guide :global(code) {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.875em;
		padding: 0.125rem 0.375rem;
		background: hsl(var(--muted));
		border-radius: 0.25rem;
	}

	.prose-guide :global(pre) {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.875rem;
		padding: 1rem 1.25rem;
		background: hsl(var(--muted));
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1.25rem;
	}

	.prose-guide :global(pre code) {
		padding: 0;
		background: none;
	}

	.prose-guide :global(blockquote) {
		margin: 1.5rem 0;
		padding: 1rem 1.25rem;
		border-left: 3px solid hsl(var(--accent));
		background: hsl(var(--accent) / 0.05);
		border-radius: 0 0.5rem 0.5rem 0;
	}

	.prose-guide :global(blockquote p) {
		margin-bottom: 0;
	}

	.prose-guide :global(blockquote strong) {
		color: hsl(var(--accent));
	}

	.prose-guide :global(table) {
		width: 100%;
		margin-bottom: 1.5rem;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.prose-guide :global(th),
	.prose-guide :global(td) {
		padding: 0.75rem 1rem;
		text-align: left;
		border: 1px solid hsl(var(--border));
	}

	.prose-guide :global(th) {
		background: hsl(var(--muted));
		font-weight: 600;
	}

	.prose-guide :global(tr:nth-child(even) td) {
		background: hsl(var(--muted) / 0.3);
	}

	.prose-guide :global(hr) {
		margin: 2rem 0;
		border: none;
		border-top: 1px solid hsl(var(--border));
	}

	/* Hero Image */
	.hero-image {
		margin-top: 2rem;
	}

	.hero-image img {
		width: 100%;
		height: auto;
		border-radius: 0.75rem;
		object-fit: cover;
	}

	:global(.dark) .hero-image img.invert-dark {
		filter: invert(1) hue-rotate(180deg);
	}

	/* Author Bio */
	.author-bio {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-top: 3rem;
		padding: 1.5rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.75rem;
	}

	.author-image {
		width: 64px;
		height: 64px;
		border-radius: 0.5rem;
		object-fit: cover;
		flex-shrink: 0;
	}

	.author-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.author-info p {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
	}

	.author-social {
		display: flex;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.author-social a {
		font-size: 0.875rem;
		color: hsl(var(--accent));
		text-decoration: none;
		font-weight: 500;
	}

	.author-social a:hover {
		text-decoration: underline;
	}

	/* Related Guides */
	.related-guides {
		margin-top: 3rem;
	}

	.related-guides h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 1rem;
	}

	.related-guides-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.related-guide-card {
		display: block;
		padding: 1rem;
		background: hsl(var(--muted) / 0.5);
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.related-guide-card:hover {
		border-color: hsl(var(--accent));
		transform: translateY(-2px);
	}

	.related-guide-card img {
		width: 100%;
		height: 120px;
		object-fit: cover;
		border-radius: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.related-guide-card h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.related-guide-card p {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.4;
	}

	/* Related Peptides */
	.related-peptides {
		margin-top: 2rem;
		padding: 1.5rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.75rem;
	}

	.related-peptides h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 1rem;
	}

	.peptide-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.peptide-link {
		font-size: 0.875rem;
		padding: 0.375rem 0.75rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		color: hsl(var(--foreground));
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.peptide-link:hover {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
	}

	@media (max-width: 640px) {
		.article-header h1 {
			font-size: 1.5rem;
		}

		.author-bio {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.related-guides-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
