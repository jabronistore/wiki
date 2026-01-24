<script lang="ts">
	import {
		ArrowRight,
		Sparkles,
		TrendingUp,
		Scale,
		Brain,
		Clock,
		Palette,
		Shield,
		Moon,
		Zap,
		Heart,
		FlaskConical
	} from 'lucide-svelte';
	import SEO from 'sk-seo';
	import type { PeptideSummary } from '$lib/types';

	let { data }: { data: { peptides: PeptideSummary[] } } = $props();

	const categories = [
		{
			id: 'healing',
			name: 'Healing & Recovery',
			icon: Sparkles,
			description: 'Tissue repair, wound healing, and recovery peptides'
		},
		{
			id: 'growth-hormone',
			name: 'Growth Hormone',
			icon: TrendingUp,
			description: 'GH releasing peptides and secretagogues'
		},
		{
			id: 'weight-loss',
			name: 'Weight Loss',
			icon: Scale,
			description: 'Metabolic support and appetite regulation'
		},
		{
			id: 'cognitive',
			name: 'Cognitive',
			icon: Brain,
			description: 'Nootropic and brain health peptides'
		},
		{
			id: 'longevity',
			name: 'Longevity',
			icon: Clock,
			description: 'Anti-aging and cellular health peptides'
		},
		{
			id: 'skin',
			name: 'Skin & Hair',
			icon: Palette,
			description: 'Cosmetic and dermal health peptides'
		},
		{ id: 'immune', name: 'Immune', icon: Shield, description: 'Immune modulation and support' },
		{ id: 'sleep', name: 'Sleep', icon: Moon, description: 'Sleep quality and circadian support' },
		{ id: 'metabolic', name: 'Metabolic', icon: Zap, description: 'Metabolic health and energy' },
		{
			id: 'sexual-health',
			name: 'Sexual Health',
			icon: Heart,
			description: 'Sexual function and libido support'
		},
		{
			id: 'protocol',
			name: 'Protocols',
			icon: FlaskConical,
			description: 'Multi-peptide stacks and protocols'
		}
	];

	function getPeptideCount(categoryId: string): number {
		return (data.peptides || []).filter((p) => p.categories?.includes(categoryId as any)).length;
	}

	function getPeptidesForCategory(categoryId: string): PeptideSummary[] {
		return (data.peptides || [])
			.filter((p) => p.categories?.includes(categoryId as any))
			.slice(0, 4);
	}
</script>

<SEO
	title="Categories | Peptide Database"
	description="Browse peptides by category. Explore healing, growth hormone, weight loss, cognitive, and other peptide categories."
	keywords="peptide categories, healing peptides, growth hormone peptides, weight loss peptides, cognitive peptides"
	siteName="Peptide Database"
	canonical="https://peptide-db.com/categories"
	twitter={true}
	openGraph={true}
/>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-12">
		<h1 class="mb-4 text-3xl font-bold md:text-4xl">Peptide Categories</h1>
		<p class="max-w-2xl text-muted-foreground">
			Browse our peptide database by category. Each category contains peptides with similar
			mechanisms of action or therapeutic applications.
		</p>
	</div>

	<!-- Categories Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each categories as category}
			{@const count = getPeptideCount(category.id)}
			{@const peptides = getPeptidesForCategory(category.id)}
			{@const Icon = category.icon}
			<div
				id={category.id}
				class="card-hover group relative overflow-hidden rounded-2xl border border-border bg-card"
			>
				<!-- Header -->
				<div class="border-b border-border bg-muted/50 p-6">
					<div class="mb-2 flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
						>
							<Icon class="h-5 w-5" />
						</div>
						<div>
							<h2 class="text-lg font-semibold">{category.name}</h2>
							<p class="text-xs text-muted-foreground">{count} peptide{count !== 1 ? 's' : ''}</p>
						</div>
					</div>
					<p class="mt-2 text-sm text-muted-foreground">{category.description}</p>
				</div>

				<!-- Peptide list -->
				<div class="p-4">
					{#if peptides.length > 0}
						<ul class="space-y-1">
							{#each peptides as peptide}
								<li>
									<a
										href="/peptides/{peptide.id}"
										class="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
									>
										<span class="text-sm font-medium">{peptide.name}</span>
										<ArrowRight
											class="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
										/>
									</a>
								</li>
							{/each}
						</ul>
						{#if count > 4}
							<a
								href="/peptides?category={category.id}"
								class="mt-4 flex items-center justify-center gap-2 p-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
							>
								View all {count} peptides
								<ArrowRight class="h-4 w-4" />
							</a>
						{/if}
					{:else}
						<p class="py-4 text-center text-sm text-muted-foreground">
							No peptides in this category yet.
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
