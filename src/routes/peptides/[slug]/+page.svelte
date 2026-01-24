<script lang="ts">
	import {
		ArrowLeft,
		FlaskConical,
		Clock,
		Thermometer,
		Syringe,
		Pill,
		AlertTriangle,
		CheckCircle,
		XCircle,
		Info,
		BookOpen,
		Beaker,
		ChevronDown,
		ExternalLink,
		Menu,
		X,
		Calculator,
		Scale,
		TrendingUp
	} from 'lucide-svelte';
	import SEO from 'sk-seo';
	import type { Peptide, PeptideSummary } from '$lib/types';
	import SequenceViewer from '$lib/components/SequenceViewer.svelte';
	import TableOfContents from '$lib/components/TableOfContents.svelte';
	import PeptideSidebar from '$lib/components/PeptideSidebar.svelte';
	import { CalculatorModal } from '$lib/components/calculator';

	const SITE_URL = 'https://peptide-db.com';

	let { data }: { data: { peptide: Peptide; allPeptides: PeptideSummary[] } } = $props();

	const peptide = $derived(data.peptide);
	const allPeptides = $derived(data.allPeptides);

	let activeDeliveryMethod = $state(0);
	let expandedSections = $state<Record<string, boolean>>({
		overview: true,
		molecular: true,
		indications: true,
		protocols: true,
		protocolVariants: true,
		interactions: true,
		timeline: true,
		safety: true,
		quality: true,
		references: true
	});

	let mobileSidebarOpen = $state(false);

	// Define sections for TOC - derived from what's available in the peptide
	const tocSections = $derived([
		{ id: 'overview', title: 'Overview', show: true },
		{ id: 'molecular', title: 'Molecular Information', show: !!peptide.molecular },
		{
			id: 'indications',
			title: 'Research Indications',
			show: !!(peptide.indications && peptide.indications.length > 0)
		},
		{
			id: 'protocols',
			title: 'Dosing Protocols',
			show: !!(peptide.deliveryMethods && peptide.deliveryMethods.length > 0)
		},
		{
			id: 'protocol-variants',
			title: 'Protocol Variations',
			show: !!(peptide.protocolVariants && peptide.protocolVariants.length > 0)
		},
		{
			id: 'interactions',
			title: 'Peptide Interactions',
			show: !!(peptide.interactions && peptide.interactions.length > 0)
		},
		{
			id: 'timeline',
			title: 'What to Expect',
			show: !!(peptide.timeline && peptide.timeline.length > 0)
		},
		{ id: 'safety', title: 'Side Effects & Safety', show: !!peptide.sideEffects },
		{ id: 'quality', title: 'Quality Checklist', show: !!peptide.qualityChecklist },
		{
			id: 'references',
			title: 'References',
			show: !!(peptide.references && peptide.references.length > 0)
		}
	]);

	function toggleSection(section: string) {
		expandedSections[section] = !expandedSections[section];
	}

	function getResearchStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			'extensively-studied': 'Extensively Studied',
			'well-studied': 'Well Studied',
			'moderate-research': 'Moderate Research',
			emerging: 'Emerging',
			'limited-research': 'Limited Research',
			'fda-approved': 'FDA Approved'
		};
		return labels[status] || status;
	}

	function getDeliveryIcon(type: string) {
		switch (type) {
			case 'injectable':
				return Syringe;
			case 'oral':
				return Pill;
			default:
				return FlaskConical;
		}
	}

	const canonicalUrl = $derived(`${SITE_URL}/peptides/${peptide.id}`);
	const description = $derived(
		peptide.overview?.slice(0, 160) || `Research information about ${peptide.name}`
	);

	// JSON-LD structured data for peptide pages
	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: `${peptide.name} Overview, Dosing & Safety`,
		description: description,
		author: {
			'@type': 'Organization',
			name: 'Peptide Database'
		},
		publisher: {
			'@type': 'Organization',
			name: 'Peptide Database',
			url: SITE_URL
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': canonicalUrl
		},
		keywords: peptide.categories?.join(', ')
	});
</script>

<SEO
	title="{peptide.name} Overview, Dosing & Safety | Peptide Database"
	{description}
	keywords={peptide.categories?.join(', ') || 'peptide research'}
	siteName="Peptide Database"
	canonical={canonicalUrl}
	twitter={true}
	openGraph={true}
	schemaOrg={true}
	schemaType="Article"
	{jsonld}
/>

<!-- Mobile Navigation FAB -->
<button
	onclick={() => (mobileSidebarOpen = !mobileSidebarOpen)}
	class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/25 transition-all duration-200 hover:scale-105 hover:shadow-primary/40 active:scale-95 lg:hidden"
	aria-label="Toggle navigation"
>
	<div class="relative h-5 w-5">
		<span
			class="absolute inset-0 flex items-center justify-center transition-all duration-300 {mobileSidebarOpen
				? 'rotate-0 opacity-100'
				: 'rotate-90 opacity-0'}"
		>
			<X class="h-5 w-5" />
		</span>
		<span
			class="absolute inset-0 flex items-center justify-center transition-all duration-300 {mobileSidebarOpen
				? '-rotate-90 opacity-0'
				: 'rotate-0 opacity-100'}"
		>
			<Menu class="h-5 w-5" />
		</span>
	</div>
</button>

<!-- Mobile sidebar overlay -->
{#if mobileSidebarOpen}
	<div class="fixed inset-0 top-16 z-40 lg:hidden">
		<!-- Backdrop with blur -->
		<button
			class="animate-fade-in absolute inset-0 h-full w-full cursor-default border-none bg-background/80 backdrop-blur-sm"
			onclick={() => (mobileSidebarOpen = false)}
			aria-label="Close sidebar"
		></button>
		<!-- Slide-in drawer -->
		<div
			class="animate-slide-in-left mobile-sidebar-drawer absolute bottom-0 left-0 top-0 w-80 max-w-[85vw] overflow-hidden border-r border-border bg-card shadow-2xl"
		>
			<div class="h-full overflow-y-auto overscroll-contain pt-2">
				<PeptideSidebar
					peptides={allPeptides}
					currentPeptideId={peptide.id}
					currentCategory={peptide.categories?.[0] || ''}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Three Column Layout Container -->
<div class="peptide-layout">
	<!-- Left Sidebar - Peptide Navigation (desktop) -->
	<aside class="peptide-sidebar-left">
		<div class="scrollbar-thin h-full overflow-y-auto overscroll-contain">
			<PeptideSidebar
				peptides={allPeptides}
				currentPeptideId={peptide.id}
				currentCategory={peptide.categories?.[0] || ''}
			/>
		</div>
	</aside>

	<!-- Main Content - Primary scroll area -->
	<main class="peptide-main">
		<div class="peptide-content">
			<!-- Back button -->
			<a
				href="/peptides"
				class="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to Peptides
			</a>

			<!-- Header Section -->
			<div class="mb-12">
				<div class="mb-4 flex flex-wrap items-start gap-4">
					<h1 class="text-3xl font-bold md:text-4xl lg:text-5xl">{peptide.name}</h1>
					<div class="flex gap-2">
						<span
							class="inline-flex rounded-full border px-3 py-1.5 text-sm font-medium badge-{peptide.researchStatus}"
						>
							{getResearchStatusLabel(peptide.researchStatus)}
						</span>
						{#if peptide.fdaApproved && peptide.researchStatus !== 'fda-approved'}
							<span
								class="badge-fda-approved inline-flex rounded-full border px-3 py-1.5 text-sm font-medium"
							>
								FDA Approved
							</span>
						{/if}
					</div>
				</div>
				{#if peptide.subtitle}
					<p class="text-lg text-muted-foreground">{peptide.subtitle}</p>
				{/if}
			</div>

			<!-- Quick Stats (mobile only) -->
			<div class="mb-8 lg:hidden">
				<div class="quick-stats-mobile">
					<div class="quick-stats-grid">
						<div class="quick-stat-item">
							<span class="quick-stat-label">Dose</span>
							<span class="quick-stat-value">{peptide.quickStats.typicalDose}</span>
						</div>
						<div class="quick-stat-item">
							<span class="quick-stat-label">Frequency</span>
							<span class="quick-stat-value">{peptide.quickStats.frequency}</span>
						</div>
						<div class="quick-stat-item">
							<span class="quick-stat-label">Cycle</span>
							<span class="quick-stat-value">{peptide.quickStats.cycleDuration}</span>
						</div>
						<div class="quick-stat-item">
							<span class="quick-stat-label">Storage</span>
							<span class="quick-stat-value">{peptide.quickStats.storage}</span>
						</div>
					</div>
					<div class="quick-stats-cta-mobile">
						<CalculatorModal {peptide} buttonClass="w-full" />
						{#if peptide.molecular?.halfLifeSeconds}
							<a href="/calculator/accumulation?peptide={peptide.id}" class="accumulation-btn">
								<TrendingUp class="h-4 w-4" />
								<span>Accumulation Plotter</span>
							</a>
						{/if}
					</div>
				</div>
			</div>

			<!-- Main Content Sections -->
			<div class="space-y-6">
				<!-- Overview Section -->
				<section id="overview" class="scroll-mt-8 border-b border-border/50 py-6">
					<button
						onclick={() => toggleSection('overview')}
						class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-accent py-2 pl-3 text-left transition-colors hover:bg-muted/30"
					>
						<div class="flex items-center gap-3">
							<div class="section-icon">
								<Info class="h-5 w-5" />
							</div>
							<h2 class="text-xl font-semibold">Overview</h2>
						</div>
						<ChevronDown
							class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.overview
								? 'rotate-180'
								: ''}"
						/>
					</button>
					{#if expandedSections.overview}
						<div class="animate-fade-in pt-4">
							<p class="mb-6 leading-relaxed text-foreground/90">{peptide.overview}</p>

							{#if peptide.mechanism}
								<div class="mt-6">
									<h3 class="mb-2 font-semibold">Mechanism of Action</h3>
									<p class="text-muted-foreground">{peptide.mechanism}</p>
								</div>
							{/if}

							{#if peptide.keyBenefits && peptide.keyBenefits.length > 0}
								<div class="mt-6">
									<h3 class="mb-3 font-semibold">Key Benefits</h3>
									<ul class="grid grid-cols-1 gap-2 md:grid-cols-2">
										{#each peptide.keyBenefits as benefit}
											<li class="flex items-start gap-2">
												<CheckCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
												<span class="text-muted-foreground">{benefit}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					{/if}
				</section>

				<!-- Molecular Information -->
				{#if peptide.molecular}
					<section id="molecular" class="scroll-mt-8 border-b border-border/50 py-6">
						<button
							onclick={() => toggleSection('molecular')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-accent py-2 pl-3 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="section-icon">
									<Beaker class="h-5 w-5" />
								</div>
								<h2 class="text-xl font-semibold">Molecular Information</h2>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.molecular
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.molecular}
							<div class="animate-fade-in pt-4">
								<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
									{#if peptide.molecular.weight}
										<div class="rounded-xl bg-muted/50 p-4">
											<div class="mb-1 text-sm text-muted-foreground">Molecular Weight</div>
											<div class="font-semibold">{peptide.molecular.weight}</div>
										</div>
									{/if}
									{#if peptide.molecular.length}
										<div class="rounded-xl bg-muted/50 p-4">
											<div class="mb-1 text-sm text-muted-foreground">Chain Length</div>
											<div class="font-semibold">{peptide.molecular.length}</div>
										</div>
									{/if}
									{#if peptide.molecular.type}
										<div class="rounded-xl bg-muted/50 p-4">
											<div class="mb-1 text-sm text-muted-foreground">Type</div>
											<div class="font-semibold">{peptide.molecular.type}</div>
										</div>
									{/if}
								</div>
								{#if peptide.molecular.sequence}
									<div class="mt-6 rounded-xl border border-border bg-muted/30 p-4">
										<div class="mb-4 text-sm font-medium">Amino Acid Sequence</div>
										<SequenceViewer sequence={peptide.molecular.sequence} />
									</div>
								{/if}
							</div>
						{/if}
					</section>
				{/if}

				<!-- Research Indications -->
				{#if peptide.indications && peptide.indications.length > 0}
					<section id="indications" class="scroll-mt-8 border-b border-border/50 py-6">
						<button
							onclick={() => toggleSection('indications')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-accent py-2 pl-3 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="section-icon">
									<FlaskConical class="h-5 w-5" />
								</div>
								<h2 class="text-xl font-semibold">Research Indications</h2>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.indications
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.indications}
							<div class="animate-fade-in pt-4">
								<div class="space-y-6">
									{#each peptide.indications as category}
										<div>
											<h3 class="mb-3 font-semibold text-primary">{category.category}</h3>
											<ul class="space-y-2">
												{#each category.items as item}
													<li class="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
														<CheckCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
														<div>
															<span class="font-medium">{item.name}</span>
															{#if item.description}
																<p class="mt-1 text-sm text-muted-foreground">{item.description}</p>
															{/if}
														</div>
													</li>
												{/each}
											</ul>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</section>
				{/if}

				<!-- Delivery Methods & Protocols -->
				{#if peptide.deliveryMethods && peptide.deliveryMethods.length > 0}
					<section id="protocols" class="scroll-mt-8 border-b border-border/50 py-6">
						<button
							onclick={() => toggleSection('protocols')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-accent py-2 pl-3 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="section-icon">
									<Syringe class="h-5 w-5" />
								</div>
								<h2 class="text-xl font-semibold">Dosing Protocols</h2>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.protocols
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.protocols}
							<div class="animate-fade-in pt-4">
								<!-- Delivery Method Tabs -->
								{#if peptide.deliveryMethods.length > 1}
									<div class="mb-6 flex gap-2 overflow-x-auto pb-2">
										{#each peptide.deliveryMethods as method, i}
											{@const DeliveryIcon = getDeliveryIcon(method.type)}
											<button
												onclick={() => (activeDeliveryMethod = i)}
												class="flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors {activeDeliveryMethod ===
												i
													? 'bg-primary text-primary-foreground'
													: 'bg-muted text-muted-foreground hover:text-foreground'}"
											>
												<DeliveryIcon class="h-4 w-4" />
												<span class="capitalize">{method.type}</span>
												{#if !method.available}
													<span class="text-xs opacity-60">(N/A)</span>
												{/if}
											</button>
										{/each}
									</div>
								{/if}

								{#if peptide.deliveryMethods[activeDeliveryMethod]}
									{@const method = peptide.deliveryMethods[activeDeliveryMethod]}

									{#if method.overview}
										<p class="mb-6 text-muted-foreground">{method.overview}</p>
									{/if}

									<!-- Protocols Table -->
									{#if method.protocols && method.protocols.length > 0}
										<div class="overflow-x-auto">
											<table class="w-full text-sm">
												<thead>
													<tr class="border-b border-border">
														<th class="px-4 py-3 text-left font-semibold">Goal</th>
														<th class="px-4 py-3 text-left font-semibold">Dose</th>
														<th class="px-4 py-3 text-left font-semibold">Frequency</th>
														<th class="px-4 py-3 text-left font-semibold">Route</th>
													</tr>
												</thead>
												<tbody>
													{#each method.protocols as protocol}
														<tr class="border-b border-border/50 hover:bg-muted/30">
															<td class="px-4 py-3">{protocol.goal}</td>
															<td class="px-4 py-3 font-mono text-primary">{protocol.dose}</td>
															<td class="px-4 py-3">{protocol.frequency}</td>
															<td class="px-4 py-3">{protocol.route}</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									{/if}

									<!-- Reconstitution -->
									{#if method.reconstitution}
										<div class="mt-6 rounded-xl bg-muted/30 p-4">
											<h4 class="mb-3 font-semibold">Reconstitution Instructions</h4>
											{#if method.reconstitution.materials && method.reconstitution.materials.length > 0}
												<div class="mb-4">
													<div class="mb-2 text-sm text-muted-foreground">Materials Needed:</div>
													<ul class="flex flex-wrap gap-2">
														{#each method.reconstitution.materials as material}
															<li class="rounded-lg bg-card px-3 py-1 text-sm">{material}</li>
														{/each}
													</ul>
												</div>
											{/if}
											<ol class="space-y-2">
												{#each method.reconstitution.steps as step, i}
													<li class="flex gap-3">
														<span
															class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
														>
															{i + 1}
														</span>
														<span class="text-muted-foreground">{step}</span>
													</li>
												{/each}
											</ol>
										</div>
									{/if}
								{/if}
							</div>
						{/if}
					</section>
				{/if}

				<!-- Protocol Variants / Conflicting Protocols -->
				{#if peptide.protocolVariants && peptide.protocolVariants.length > 0}
					<section id="protocol-variants" class="scroll-mt-8 border-b border-border/50 py-6">
						<button
							onclick={() => toggleSection('protocolVariants')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-warning py-2 pl-3 text-left transition-colors hover:bg-warning/10"
						>
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground"
								>
									<Scale class="h-5 w-5" />
								</div>
								<div>
									<h2 class="text-xl font-semibold">Protocol Variations</h2>
									<p class="text-sm text-muted-foreground">
										Multiple approaches exist - compare before choosing
									</p>
								</div>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.protocolVariants
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.protocolVariants}
							<div class="animate-fade-in pt-4">
								<div class="mb-4 rounded-lg border border-warning/20 bg-warning/10 p-4">
									<div class="flex items-start gap-3">
										<AlertTriangle class="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-foreground" />
										<p class="text-sm text-muted-foreground">
											Different sources recommend different protocols for this peptide. Review each
											approach and consider your goals, tolerance, and experience level before
											choosing.
										</p>
									</div>
								</div>

								<div class="grid gap-6 lg:grid-cols-2">
									{#each peptide.protocolVariants as variant, i}
										<div class="rounded-xl border border-border bg-card p-5">
											<div class="mb-4">
												<div class="mb-2 flex items-start justify-between gap-2">
													<h3 class="text-lg font-semibold">{variant.name}</h3>
													{#if i === 0}
														<span
															class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
															>Traditional</span
														>
													{:else}
														<span
															class="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
															>Alternative</span
														>
													{/if}
												</div>
												<p class="mb-1 text-sm text-muted-foreground">
													<span class="font-medium">Source:</span>
													{#if variant.sourceUrl}
														<a
															href={variant.sourceUrl}
															target="_blank"
															rel="noopener noreferrer"
															class="inline-flex items-center gap-1 text-primary hover:underline"
														>
															{variant.source}
															<ExternalLink class="h-3 w-3" />
														</a>
													{:else}
														{variant.source}
													{/if}
												</p>
												<p class="text-sm italic text-accent">"{variant.philosophy}"</p>
											</div>

											<p class="mb-4 text-sm text-muted-foreground">{variant.description}</p>

											<!-- Key Differences -->
											<div class="mb-4">
												<h4 class="mb-2 text-sm font-semibold">Key Points</h4>
												<ul class="space-y-1.5">
													{#each variant.keyDifferences as diff}
														<li class="flex items-start gap-2 text-sm text-muted-foreground">
															<span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent"
															></span>
															{diff}
														</li>
													{/each}
												</ul>
											</div>

											<!-- Dosing Table -->
											<div class="rounded-lg bg-muted/50 p-3">
												<h4 class="mb-2 text-sm font-semibold">Dosing Schedule</h4>
												<div class="space-y-2">
													{#each variant.doses as dose}
														<div class="flex items-center justify-between text-sm">
															<span class="text-muted-foreground">{dose.phase}</span>
															<div class="text-right">
																<span class="font-mono font-medium text-primary">{dose.dose}</span>
																<span class="text-muted-foreground"> · {dose.frequency}</span>
															</div>
														</div>
													{/each}
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</section>
				{/if}

				<!-- Interactions -->
				{#if peptide.interactions && peptide.interactions.length > 0}
					<section id="interactions" class="scroll-mt-8 border-b border-border/50 py-6">
						<button
							onclick={() => toggleSection('interactions')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-accent py-2 pl-3 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="section-icon">
									<FlaskConical class="h-5 w-5" />
								</div>
								<h2 class="text-xl font-semibold">Peptide Interactions</h2>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.interactions
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.interactions}
							<div class="animate-fade-in pt-4">
								<div class="space-y-3">
									{#each peptide.interactions as interaction}
										{@const statusColors: Record<string, string> = {
											synergistic: 'interaction-synergistic',
											compatible: 'interaction-compatible',
											monitor: 'interaction-monitor',
											avoid: 'interaction-avoid',
											'requires-timing': 'interaction-requires-timing'
										}}
										<div class="flex items-center justify-between rounded-xl bg-muted/30 p-4">
											<div>
												<span class="font-medium">{interaction.peptide}</span>
												{#if interaction.notes}
													<p class="mt-1 text-sm text-muted-foreground">{interaction.notes}</p>
												{/if}
											</div>
											<span
												class="rounded-full border px-3 py-1 text-xs font-medium capitalize {statusColors[
													interaction.status
												] || ''}"
											>
												{interaction.status.replace('-', ' ')}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</section>
				{/if}

				<!-- Timeline -->
				{#if peptide.timeline && peptide.timeline.length > 0}
					<section id="timeline" class="scroll-mt-8 border-b border-border/50 py-6">
						<button
							onclick={() => toggleSection('timeline')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-accent py-2 pl-3 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="section-icon">
									<Clock class="h-5 w-5" />
								</div>
								<h2 class="text-xl font-semibold">What to Expect</h2>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.timeline
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.timeline}
							<div class="animate-fade-in pt-4">
								<div class="relative">
									<div class="absolute bottom-0 left-4 top-0 w-0.5 bg-border"></div>
									<div class="space-y-6">
										{#each peptide.timeline as entry}
											<div class="relative flex gap-4 pl-10">
												<div
													class="absolute left-2 h-4 w-4 rounded-full border-4 border-background bg-primary"
												></div>
												<div>
													<div class="font-semibold text-primary">{entry.period}</div>
													<p class="mt-1 text-muted-foreground">{entry.effects}</p>
												</div>
											</div>
										{/each}
									</div>
								</div>
							</div>
						{/if}
					</section>
				{/if}

				<!-- Safety Information -->
				{#if peptide.sideEffects}
					<section id="safety" class="scroll-mt-8 border-b border-border/50 py-6">
						<button
							onclick={() => toggleSection('safety')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-accent py-2 pl-3 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="section-icon">
									<AlertTriangle class="h-5 w-5" />
								</div>
								<h2 class="text-xl font-semibold">Side Effects & Safety</h2>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.safety
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.safety}
							<div class="animate-fade-in pt-4">
								{#if peptide.sideEffects.common && peptide.sideEffects.common.length > 0}
									<div class="mb-6">
										<h4 class="mb-3 font-semibold">Common Side Effects</h4>
										<ul class="grid grid-cols-1 gap-2 md:grid-cols-2">
											{#each peptide.sideEffects.common as effect}
												<li class="flex items-center gap-2 text-muted-foreground">
													<div class="h-1.5 w-1.5 rounded-full bg-warning"></div>
													{effect}
												</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if peptide.sideEffects.stopSigns && peptide.sideEffects.stopSigns.length > 0}
									<div class="status-danger rounded-xl border p-4">
										<h4 class="status-danger-text mb-3 font-semibold">
											Stop Signs - Discontinue if:
										</h4>
										<ul class="space-y-2">
											{#each peptide.sideEffects.stopSigns as sign}
												<li class="status-danger-text flex items-start gap-2">
													<XCircle class="h-5 w-5 flex-shrink-0" />
													{sign}
												</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if peptide.sideEffects.contraindications && peptide.sideEffects.contraindications.length > 0}
									<div class="mt-6">
										<h4 class="mb-3 font-semibold">Contraindications</h4>
										<ul class="space-y-2">
											{#each peptide.sideEffects.contraindications as contraindication}
												<li class="flex items-start gap-2 text-muted-foreground">
													<AlertTriangle class="h-5 w-5 flex-shrink-0 text-warning" />
													{contraindication}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						{/if}
					</section>
				{/if}

				<!-- Quality Checklist -->
				{#if peptide.qualityChecklist}
					<section id="quality" class="scroll-mt-8 border-b border-border/50 py-6">
						<button
							onclick={() => toggleSection('quality')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-accent py-2 pl-3 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="section-icon">
									<CheckCircle class="h-5 w-5" />
								</div>
								<h2 class="text-xl font-semibold">Quality Checklist</h2>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.quality
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.quality}
							<div class="animate-fade-in pt-4">
								<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
									{#if peptide.qualityChecklist.good && peptide.qualityChecklist.good.length > 0}
										<div class="status-good rounded-xl border p-4">
											<h4 class="status-good-text mb-3 flex items-center gap-2 font-semibold">
												<CheckCircle class="h-5 w-5" />
												Good Signs
											</h4>
											<ul class="space-y-2 text-sm">
												{#each peptide.qualityChecklist.good as item}
													<li class="status-good-text">{item}</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if peptide.qualityChecklist.warning && peptide.qualityChecklist.warning.length > 0}
										<div class="status-warning rounded-xl border p-4">
											<h4 class="status-warning-text mb-3 flex items-center gap-2 font-semibold">
												<AlertTriangle class="h-5 w-5" />
												Warning Signs
											</h4>
											<ul class="space-y-2 text-sm">
												{#each peptide.qualityChecklist.warning as item}
													<li class="status-warning-text">{item}</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if peptide.qualityChecklist.bad && peptide.qualityChecklist.bad.length > 0}
										<div class="status-danger rounded-xl border p-4">
											<h4 class="status-danger-text mb-3 flex items-center gap-2 font-semibold">
												<XCircle class="h-5 w-5" />
												Bad Signs
											</h4>
											<ul class="space-y-2 text-sm">
												{#each peptide.qualityChecklist.bad as item}
													<li class="status-danger-text">{item}</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</section>
				{/if}

				<!-- References -->
				{#if peptide.references && peptide.references.length > 0}
					<section
						id="references"
						class="scroll-mt-8 border-b border-border/50 py-6 last:border-b-0"
					>
						<button
							onclick={() => toggleSection('references')}
							class="flex w-full items-center justify-between rounded-r-lg border-l-[3px] border-muted-foreground/30 py-2 pl-3 text-left transition-colors hover:bg-muted/30"
						>
							<div class="flex items-center gap-3">
								<div class="section-icon-muted">
									<BookOpen class="h-5 w-5" />
								</div>
								<h2 class="text-xl font-semibold">References</h2>
							</div>
							<ChevronDown
								class="h-5 w-5 text-muted-foreground transition-transform {expandedSections.references
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.references}
							<div class="animate-fade-in pt-4">
								<ul class="space-y-4">
									{#each peptide.references as ref}
										<li class="rounded-xl bg-muted/30 p-4">
											<div class="flex items-start justify-between gap-4">
												<div>
													<div class="font-medium">{ref.title}</div>
													{#if ref.authors}
														<div class="mt-1 text-sm text-muted-foreground">{ref.authors}</div>
													{/if}
													{#if ref.year || ref.journal}
														<div class="text-sm text-muted-foreground">
															{ref.journal ? ref.journal : ''}{ref.year ? ` (${ref.year})` : ''}
														</div>
													{/if}
													{#if ref.keyFindings}
														<p class="mt-2 text-sm text-muted-foreground">{ref.keyFindings}</p>
													{/if}
												</div>
												{#if ref.url}
													<a
														href={ref.url}
														target="_blank"
														rel="noopener noreferrer"
														class="flex-shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground"
													>
														<ExternalLink class="h-4 w-4" />
													</a>
												{/if}
											</div>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</section>
				{/if}

				<!-- Disclaimer at bottom -->
				<div class="status-warning rounded-2xl border p-6">
					<div class="flex items-start gap-3">
						<AlertTriangle class="h-5 w-5 flex-shrink-0 text-warning" />
						<div>
							<h4 class="status-warning-text mb-1 font-semibold">Disclaimer</h4>
							<p class="text-sm text-muted-foreground">
								This information is for educational and research purposes only. Consult a healthcare
								professional before use.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- Right Sidebar - Table of Contents (desktop) -->
	<aside class="peptide-sidebar-right">
		<div class="scrollbar-thin h-full overflow-y-auto overscroll-contain p-4">
			<!-- Quick Stats Card -->
			<div class="quick-stats-sidebar">
				<div class="quick-stat-row">
					<span class="quick-stat-label">Dose</span>
					<span class="quick-stat-value">{peptide.quickStats.typicalDose}</span>
				</div>
				<div class="quick-stat-row">
					<span class="quick-stat-label">Frequency</span>
					<span class="quick-stat-value">{peptide.quickStats.frequency}</span>
				</div>
				<div class="quick-stat-row">
					<span class="quick-stat-label">Cycle</span>
					<span class="quick-stat-value">{peptide.quickStats.cycleDuration}</span>
				</div>
				<div class="quick-stat-row">
					<span class="quick-stat-label">Storage</span>
					<span class="quick-stat-value">{peptide.quickStats.storage}</span>
				</div>
				<div class="quick-stat-cta">
					<CalculatorModal {peptide} buttonClass="w-full" />
					{#if peptide.molecular?.halfLifeSeconds}
						<a href="/calculator/accumulation?peptide={peptide.id}" class="accumulation-btn">
							<TrendingUp class="h-4 w-4" />
							<span>Accumulation</span>
						</a>
					{/if}
				</div>
			</div>

			<!-- TOC -->
			<TableOfContents sections={tocSections} />
		</div>
	</aside>
</div>

<style>
	/* Quick Stats - Mobile */
	.quick-stats-mobile {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.quick-stats-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
	}

	.quick-stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.875rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
	}

	.quick-stat-item:last-child {
		border-bottom: none;
	}

	/* Quick Stats - Sidebar */
	.quick-stats-sidebar {
		margin-bottom: 1.5rem;
	}

	.quick-stat-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.625rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.4);
	}

	.quick-stat-row:first-child {
		padding-top: 0;
	}

	.quick-stat-row:last-of-type {
		border-bottom: none;
		padding-bottom: 0;
	}

	.quick-stat-cta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	/* Shared label/value styles */
	.quick-stat-label {
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--muted-foreground));
	}

	.quick-stat-value {
		font-size: 0.8125rem;
		line-height: 1.4;
		color: hsl(var(--foreground));
	}

	/* Three Column Layout - Fixed sidebars, scrolling center */
	.peptide-layout {
		display: flex;
		height: calc(100vh - 4rem);
		overflow: hidden;
	}

	.peptide-sidebar-left {
		display: none;
		width: 16rem;
		flex-shrink: 0;
		border-right: 1px solid hsl(var(--border));
		background: hsl(var(--card) / 0.5);
	}

	.peptide-sidebar-right {
		display: none;
		width: 16rem;
		flex-shrink: 0;
		border-left: 1px solid hsl(var(--border));
		background: hsl(var(--card) / 0.3);
	}

	.peptide-main {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
	}

	.peptide-content {
		max-width: 56rem;
		margin: 0 auto;
		padding: 2rem 1rem 6rem; /* Extra bottom padding for FAB on mobile */
	}

	/* Tablet: Show left sidebar */
	@media (min-width: 1024px) {
		.peptide-sidebar-left {
			display: block;
		}
		.peptide-content {
			padding: 2rem 2rem 2rem; /* Normal padding when FAB is hidden */
		}
	}

	/* Desktop: Show both sidebars */
	@media (min-width: 1280px) {
		.peptide-sidebar-right {
			display: block;
		}
	}

	/* Refined scrollbar for sidebars */
	.scrollbar-thin::-webkit-scrollbar {
		width: 4px;
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: hsl(var(--muted-foreground) / 0.2);
		border-radius: 2px;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--muted-foreground) / 0.4);
	}

	/* Mobile slide-in animation */
	:global(.animate-slide-in-left) {
		animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes slide-in-left {
		from {
			opacity: 0;
			transform: translateX(-100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* CTA buttons container */
	.quick-stats-cta-mobile {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Accumulation button */
	.accumulation-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--muted) / 0.5);
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.accumulation-btn:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		border-color: hsl(var(--accent) / 0.5);
	}
</style>
