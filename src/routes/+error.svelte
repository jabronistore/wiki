<script lang="ts">
	import { page } from '$app/stores';
	import { Home, BookOpen, ArrowRight, FlaskConical } from 'lucide-svelte';

	const status = $derived($page.status);
	const errorMessage = $derived($page.error?.message || 'Page not found');

	const helpfulLinks = [
		{
			title: 'Browse Peptides',
			description: 'Explore our peptide database',
			href: '/peptides',
			icon: BookOpen
		},
		{
			title: 'Categories',
			description: 'Browse peptides by category',
			href: '/categories',
			icon: FlaskConical
		},
		{
			title: 'Home',
			description: 'Return to the homepage',
			href: '/',
			icon: Home
		}
	];
</script>

<svelte:head>
	<title>{status} - Peptide Database</title>
	<meta
		name="description"
		content="The page you're looking for doesn't exist. Explore our site to find what you need."
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-16">
	<div class="mx-auto max-w-2xl text-center">
		<!-- Brand -->
		<div class="mb-8">
			<a href="/" class="inline-flex items-center gap-3">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"
				>
					<FlaskConical class="h-6 w-6" />
				</div>
				<span class="text-2xl font-bold">Peptide Database</span>
			</a>
		</div>

		<!-- Error Code -->
		<div class="mb-8">
			<div class="mb-6 inline-flex h-32 w-32 items-center justify-center rounded-full bg-muted">
				<span class="font-mono text-4xl font-bold text-primary">
					{status || '404'}
				</span>
			</div>

			<h2 class="mb-4 text-3xl font-bold">
				{#if status === 404}
					Page Not Found
				{:else if status && status >= 500}
					Server Error
				{:else}
					Something Went Wrong
				{/if}
			</h2>

			<p class="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
				{#if status === 404}
					The page you're looking for doesn't exist or has been moved.
				{:else if status && status >= 500}
					We're experiencing technical difficulties. Please try again later.
				{:else}
					{errorMessage}
				{/if}
			</p>
		</div>

		<!-- Helpful Links -->
		<div class="mb-12">
			<h3 class="mb-6 text-xl font-semibold">Where would you like to go?</h3>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				{#each helpfulLinks as link}
					<a
						href={link.href}
						class="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
					>
						<div class="flex flex-col items-center space-y-4 text-center">
							<div class="rounded-lg bg-muted p-3 transition-colors group-hover:bg-primary/10">
								{#if link.icon === Home}
									<Home class="h-6 w-6 text-primary" />
								{:else if link.icon === BookOpen}
									<BookOpen class="h-6 w-6 text-primary" />
								{:else}
									<FlaskConical class="h-6 w-6 text-primary" />
								{/if}
							</div>
							<div>
								<h4
									class="mb-1 flex items-center justify-center text-sm font-semibold transition-colors group-hover:text-primary"
								>
									{link.title}
								</h4>
								<p class="text-sm text-muted-foreground">
									{link.description}
								</p>
							</div>
							<ArrowRight
								class="h-4 w-4 transform text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary"
							/>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Back link -->
		<div class="text-center">
			<a href="/" class="inline-flex items-center text-sm font-medium text-primary hover:underline">
				<ArrowRight class="mr-1 h-3 w-3 rotate-180" />
				Back to Home
			</a>
		</div>
	</div>
</div>
