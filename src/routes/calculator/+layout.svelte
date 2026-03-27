<script lang="ts">
	import { page } from '$app/stores';
	import { Calculator, Beaker, TrendingUp, AlertTriangle } from 'lucide-svelte';

	let { children } = $props();

	const tabs = [
		{
			href: '/calculator',
			label: 'Reconstitution',
			icon: Calculator,
			title: 'Reconstitution Calculator',
			subtitle: 'Calculate peptide doses with our visual syringe guide'
		},
		{
			href: '/calculator/blend',
			label: 'Blend',
			icon: Beaker,
			title: 'Blend Calculator',
			subtitle: 'Calculate individual peptide doses from blended vials'
		},
		{
			href: '/calculator/accumulation',
			label: 'Accumulation',
			icon: TrendingUp,
			title: 'Accumulation Plotter',
			subtitle: 'Visualize peptide concentration over time'
		}
	];

	function isActive(href: string, pathname: string): boolean {
		if (href === '/calculator') {
			return pathname === '/calculator';
		}
		return pathname.startsWith(href);
	}

	const activeTab = $derived(tabs.find((t) => isActive(t.href, $page.url.pathname)) || tabs[0]);
</script>

<div class="calculator-page">
	<!-- Hero Section -->
	<div class="hero">
		<div class="hero-content">
			<div class="hero-badge">
				<activeTab.icon class="h-4 w-4" />
				<span>Dosing Tools</span>
			</div>
			<h1 class="hero-title">Peptide {activeTab.title}</h1>
			<p class="hero-subtitle">{activeTab.subtitle}</p>
		</div>
	</div>

	<!-- Tab Navigation -->
	<div class="tabs-section">
		<nav class="tabs-container" aria-label="Calculator types">
			{#each tabs as tab}
				<a
					href={tab.href}
					class="tab-btn"
					class:active={isActive(tab.href, $page.url.pathname)}
					aria-current={isActive(tab.href, $page.url.pathname) ? 'page' : undefined}
				>
					<tab.icon class="h-4 w-4" />
					<span>{tab.label}</span>
				</a>
			{/each}
		</nav>
	</div>

	<!-- Main Content -->
	<div class="main-section">
		<div class="calculator-card">
			{@render children()}
		</div>
	</div>

	<!-- Disclaimer -->
	<div class="disclaimer-section">
		<div class="disclaimer-box">
			<div class="disclaimer-icon">
				<AlertTriangle class="h-5 w-5" />
			</div>
			<div class="disclaimer-content">
				<h3 class="disclaimer-heading">Research Purposes Only</h3>
				<p>
					These calculators are provided for educational and research purposes only. Always verify
					calculations and consult with qualified professionals. The information provided is not
					medical advice. Peptides should only be used in accordance with applicable laws and
					regulations.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.calculator-page {
		min-height: 100vh;
		overflow-x: hidden;
	}

	/* Hero */
	.hero {
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.3);
	}

	.hero-content {
		max-width: 48rem;
		margin: 0 auto;
		padding: 3rem 1.5rem;
		text-align: center;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: hsl(var(--muted));
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 1.5rem;
	}

	.hero-title {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		letter-spacing: -0.025em;
	}

	.hero-subtitle {
		font-size: 1.125rem;
		color: hsl(var(--muted-foreground));
		max-width: 36rem;
		margin: 0 auto;
	}

	@media (max-width: 640px) {
		.hero-content {
			padding: 2rem 1rem;
		}

		.hero-title {
			font-size: 1.75rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}
	}

	/* Tabs Section */
	.tabs-section {
		max-width: 64rem;
		margin: 0 auto;
		padding: 1.5rem 1.5rem 0;
	}

	.tabs-container {
		display: flex;
		gap: 0.5rem;
		background: hsl(var(--muted) / 0.5);
		padding: 0.25rem;
		border-radius: 0.75rem;
		width: fit-content;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.tab-btn:hover {
		color: hsl(var(--foreground));
	}

	.tab-btn.active {
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		box-shadow: 0 1px 3px hsl(var(--foreground) / 0.1);
	}

	@media (max-width: 640px) {
		.tabs-section {
			padding: 1rem 1rem 0;
		}

		.tabs-container {
			width: 100%;
		}

		.tab-btn {
			flex: 1;
			justify-content: center;
			padding: 0.5rem 0.75rem;
		}

		.tab-btn span {
			display: none;
		}
	}

	@media (min-width: 641px) and (max-width: 768px) {
		.tab-btn {
			padding: 0.5rem 1rem;
		}
	}

	/* Main Section */
	.main-section {
		max-width: 64rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	.calculator-card {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 1rem;
		padding: 2rem;
		overflow: hidden;
		max-width: 100%;
		box-sizing: border-box;
	}

	@media (max-width: 640px) {
		.main-section {
			padding: 1.5rem 1rem;
		}

		.calculator-card {
			padding: 1.5rem 1rem;
		}
	}

	/* Disclaimer */
	.disclaimer-section {
		max-width: 64rem;
		margin: 0 auto;
		padding: 0 1.5rem 3rem;
	}

	.disclaimer-box {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		background: hsl(var(--muted) / 0.5);
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
	}

	.disclaimer-icon {
		flex-shrink: 0;
		color: hsl(var(--muted-foreground));
	}

	.disclaimer-heading {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.disclaimer-content p {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
	}
</style>
