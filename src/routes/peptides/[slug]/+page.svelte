<script lang="ts">
	import {
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
		ChevronRight,
		ExternalLink,
		Home,
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
	import PeptideCommunitySection from '$lib/components/community/PeptideCommunitySection.svelte';
	import PKSparkline from '$lib/components/PKSparkline.svelte';

	const SITE_URL = 'https://peptide-db.com';

	let { data }: { data: { peptide: Peptide; allPeptides: PeptideSummary[] } } = $props();

	const peptide = $derived(data.peptide);
	const allPeptides = $derived(data.allPeptides);

	let activeDeliveryMethod = $state(0);
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
	const description = $derived.by(() => {
		const parts: string[] = [];
		if (peptide.molecular?.type) {
			parts.push(`${peptide.name} is a ${peptide.molecular.type.toLowerCase()}`);
		} else {
			parts.push(`${peptide.name} research guide`);
		}
		if (peptide.keyBenefits?.length) {
			parts.push(`studied for ${peptide.keyBenefits.slice(0, 2).join(' and ').toLowerCase()}`);
		}
		if (peptide.molecular?.halfLife) {
			parts.push(`Half-life: ${peptide.molecular.halfLife}`);
		}
		const structured = parts.join('. ') + '. Dosing, safety, interactions | Peptide Database';
		if (structured.length >= 80 && structured.length <= 160) return structured;
		if (structured.length > 160) return structured.slice(0, 157) + '...';
		if (peptide.overview) {
			const sentences = peptide.overview.match(/[^.!?]+[.!?]+/g) || [];
			let desc = '';
			for (const sentence of sentences) {
				if ((desc + sentence).length <= 155) desc += sentence;
				else break;
			}
			return desc.trim() || peptide.overview.slice(0, 155) + '...';
		}
		return `${peptide.name}: dosing protocols, safety profile, interactions, and research. | Peptide Database`;
	});

	const keywords = $derived(
		[
			peptide.name.toLowerCase(),
			...(peptide.categories || []),
			'peptide',
			'dosing',
			'research'
		].join(', ')
	);

	// JSON-LD structured data
	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Article',
				headline: `${peptide.name} Overview, Dosing & Safety`,
				description: description,
				datePublished: '2025-12-09T00:00:00.000Z',
				dateModified: new Date().toISOString(),
				author: { '@type': 'Organization', name: 'Peptide Database' },
				publisher: {
					'@type': 'Organization',
					name: 'Peptide Database',
					url: SITE_URL,
					logo: { '@type': 'ImageObject', url: `${SITE_URL}/pep-logo.webp` }
				},
				mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
				keywords: keywords
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
					{ '@type': 'ListItem', position: 2, name: 'Peptides', item: `${SITE_URL}/peptides` },
					{ '@type': 'ListItem', position: 3, name: peptide.name, item: canonicalUrl }
				]
			}
		]
	});
</script>

<SEO
	title="{peptide.name} Overview, Dosing & Safety | Peptide Database"
	{description}
	{keywords}
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
			<!-- Breadcrumb -->
			<nav aria-label="Breadcrumb" class="mb-8">
				<ol class="flex items-center gap-1.5 text-sm text-muted-foreground">
					<li class="flex items-center gap-1.5">
						<a href="/" class="flex items-center gap-1 transition-colors hover:text-foreground">
							<Home class="h-3.5 w-3.5" />
							<span>Home</span>
						</a>
						<ChevronRight class="h-3.5 w-3.5" />
					</li>
					<li class="flex items-center gap-1.5">
						<a href="/peptides" class="transition-colors hover:text-foreground">Peptides</a>
						<ChevronRight class="h-3.5 w-3.5" />
					</li>
					<li>
						<span class="font-medium text-foreground">{peptide.name}</span>
					</li>
				</ol>
			</nav>

			<!-- Header Section -->
			<div class="mb-12">
				<div class="mb-4 flex flex-wrap items-start gap-4">
					<h1 class="text-3xl md:text-4xl lg:text-5xl">{peptide.name}</h1>
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

				<!-- Hero molecular stats -->
				{#if peptide.molecular && (peptide.molecular.weight || peptide.molecular.halfLife || peptide.molecular.length)}
					<div class="mt-6 flex flex-wrap items-center gap-3">
						{#if peptide.molecular.weight}
							<div
								class="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm"
							>
								<Scale class="h-4 w-4 text-muted-foreground" />
								<span class="text-muted-foreground">Weight:</span>
								<span class="font-medium">{peptide.molecular.weight}</span>
							</div>
						{/if}
						{#if peptide.molecular.halfLife}
							<div
								class="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm"
							>
								<Clock class="h-4 w-4 text-muted-foreground" />
								<span class="text-muted-foreground">Half-life:</span>
								<span class="font-medium">{peptide.molecular.halfLife}</span>
							</div>
						{/if}
						{#if peptide.molecular.length}
							<div
								class="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm"
							>
								<Beaker class="h-4 w-4 text-muted-foreground" />
								<span class="text-muted-foreground">Chain:</span>
								<span class="font-medium">{peptide.molecular.length}</span>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Evidence tracker -->
				{#if peptide.references && peptide.references.length > 0}
					{@const refCount = peptide.references.length}
					{@const latestYear = Math.max(
						...peptide.references.filter((r) => r.year).map((r) => parseInt(r.year || '0'))
					)}
					{@const hasLatest = peptide.latestResearch && peptide.latestResearch.length > 0}
					<div class="evidence-tracker">
						<div class="ev-item">
							<span class="ev-value">{refCount}</span>
							<span class="ev-label">{refCount === 1 ? 'study' : 'studies'}</span>
						</div>
						{#if latestYear > 0}
							<div class="ev-sep"></div>
							<div class="ev-item">
								<span class="ev-value">{latestYear}</span>
								<span class="ev-label">latest</span>
							</div>
						{/if}
						{#if hasLatest}
							<div class="ev-sep"></div>
							<div class="ev-item">
								<span class="ev-value">{peptide.latestResearch?.length}</span>
								<span class="ev-label">recent</span>
							</div>
						{/if}
						<div class="ev-sep"></div>
						<div class="ev-item">
							<span class="ev-value ev-status"
								>{getResearchStatusLabel(peptide.researchStatus)}</span
							>
						</div>
					</div>
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

			<!-- Community Section -->
			<PeptideCommunitySection peptideId={peptide.id} peptideName={peptide.name} />

			<!-- Main Content Sections -->
			<div class="space-y-6">
				<!-- Overview Section -->
				<section id="overview" class="sect sect-prose scroll-mt-8">
					<div class="overview-lead">
						<p class="overview-text">{peptide.overview}</p>
					</div>

					{#if peptide.mechanism}
						<div class="overview-mechanism">
							<div class="overview-mechanism-label">Mechanism of Action</div>
							<p class="overview-mechanism-text">{peptide.mechanism}</p>
						</div>
					{/if}

					{#if peptide.keyBenefits && peptide.keyBenefits.length > 0}
						<div class="overview-benefits">
							{#each peptide.keyBenefits as benefit, i}
								<div class="overview-benefit">
									<span class="overview-benefit-num">{String(i + 1).padStart(2, '0')}</span>
									<span class="overview-benefit-text">{benefit}</span>
								</div>
							{/each}
						</div>
					{/if}
				</section>

				<!-- Molecular Information -->
				{#if peptide.molecular}
					<section id="molecular" class="sect sect-data scroll-mt-8">
						<h2 class="sect-heading-data"><Beaker class="sect-icon" />Molecular Data</h2>
						<div class="sect-body">
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
					</section>
				{/if}

				<!-- Accumulation Curve (inline, collapsible) -->
				{#if peptide.molecular?.halfLifeSeconds}
					<section class="scroll-mt-8 border-b border-border/50 py-6">
						<PKSparkline {peptide} />
					</section>
				{/if}

				<!-- Research Indications -->
				{#if peptide.indications && peptide.indications.length > 0}
					<section id="indications" class="sect scroll-mt-8">
						<h2 class="sect-heading-data">
							<FlaskConical class="sect-icon" />Research Indications
						</h2>
						<div class="indications-grid">
							{#each peptide.indications as category}
								<div class="indication-group">
									<div class="indication-group-label">{category.category}</div>
									{#each category.items as item}
										<div class="indication-item">
											<div class="indication-item-header">
												<span class="indication-name">{item.name}</span>
												{#if item.effectiveness}
													<span class="indication-eff indication-eff-{item.effectiveness}"
														>{item.effectiveness.replace('-', ' ')}</span
													>
												{/if}
											</div>
											{#if item.description}
												<p class="indication-desc">{item.description}</p>
											{/if}
										</div>
									{/each}
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Delivery Methods & Protocols -->
				{#if peptide.deliveryMethods && peptide.deliveryMethods.length > 0}
					<section id="protocols" class="sect sect-data scroll-mt-8">
						<h2 class="sect-heading-data"><Syringe class="sect-icon" />Dosing Protocols</h2>
						<div class="sect-body">
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
					</section>
				{/if}

				<!-- Protocol Variants / Conflicting Protocols -->
				{#if peptide.protocolVariants && peptide.protocolVariants.length > 0}
					<section id="protocol-variants" class="sect sect-warn scroll-mt-8">
						<div class="sect-heading-warn-block">
							<h2 class="sect-heading-warn"><Scale class="sect-icon" />Protocol Variations</h2>
							<p class="text-sm text-muted-foreground">
								Multiple approaches exist - compare before choosing
							</p>
						</div>
						<div class="sect-body">
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
					</section>
				{/if}

				<!-- Interactions -->
				{#if peptide.interactions && peptide.interactions.length > 0}
					<section id="interactions" class="sect scroll-mt-8">
						<h2 class="sect-heading-data"><FlaskConical class="sect-icon" />Interactions</h2>
						<div class="interactions-table">
							{#each peptide.interactions as interaction}
								{@const statusMap: Record<string, { color: string; symbol: string }> = {
									synergistic: { color: 'var(--success, #059669)', symbol: '++' },
									compatible: { color: 'var(--success, #059669)', symbol: '+' },
									monitor: { color: 'var(--warning, #D4A27F)', symbol: '~' },
									avoid: { color: 'var(--destructive, #BF4D43)', symbol: '!' },
									'requires-timing': { color: 'var(--warning, #D4A27F)', symbol: '%' }
								}}
								{@const status = statusMap[interaction.status] || {
									color: 'var(--muted-foreground)',
									symbol: '?'
								}}
								<div class="ix-row" style="--ix-color: hsl({status.color})">
									<div class="ix-indicator" style="background: hsl({status.color})">
										{status.symbol}
									</div>
									<div class="ix-content">
										<div class="ix-name">{interaction.peptide}</div>
										{#if interaction.notes}
											<div class="ix-notes">{interaction.notes}</div>
										{/if}
									</div>
									<div class="ix-label" style="color: hsl({status.color})">
										{interaction.status.replace('-', ' ')}
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Timeline -->
				{#if peptide.timeline && peptide.timeline.length > 0}
					<section id="timeline" class="sect scroll-mt-8">
						<h2 class="sect-heading-data"><Clock class="sect-icon" />What to Expect</h2>
						<div class="timeline-track">
							{#each peptide.timeline as entry, i}
								<div class="tl-entry" style="--tl-delay: {i * 60}ms">
									<div class="tl-period">{entry.period}</div>
									<div class="tl-bar"></div>
									<div class="tl-effects">{entry.effects}</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Safety Information -->
				{#if peptide.sideEffects}
					<section id="safety" class="sect sect-warn scroll-mt-8">
						<h2 class="sect-heading-warn">
							<AlertTriangle class="sect-icon" />Side Effects & Safety
						</h2>
						<div class="sect-body">
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
					</section>
				{/if}

				<!-- Quality Checklist -->
				{#if peptide.qualityChecklist}
					<section id="quality" class="sect sect-warn scroll-mt-8">
						<h2 class="sect-heading-warn"><CheckCircle class="sect-icon" />Quality Checklist</h2>
						<div class="sect-body">
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
					</section>
				{/if}

				<!-- References -->
				{#if peptide.references && peptide.references.length > 0}
					<section id="references" class="sect sect-muted scroll-mt-8">
						<h2 class="sect-heading-muted"><BookOpen class="sect-icon" />References</h2>
						<div class="sect-body">
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
					</section>
				{/if}

				<!-- Related Peptides -->
				{#if peptide.interactions && peptide.interactions.length > 0}
					{@const related = peptide.interactions
						.filter((ix) => ix.status === 'synergistic' || ix.status === 'compatible')
						.map((ix) => {
							const match = allPeptides.find(
								(p) => p.name.toLowerCase() === ix.peptide.toLowerCase()
							);
							return match
								? { id: match.id, name: ix.peptide, status: ix.status, notes: ix.notes }
								: null;
						})
						.filter((r) => r !== null)
						.slice(0, 6)}
					{#if related.length > 0}
						<section class="sect scroll-mt-8">
							<h2 class="related-heading">Related Peptides</h2>
							<div class="related-grid">
								{#each related as rel}
									<a href="/peptides/{rel.id}" class="related-card">
										<span class="related-name">{rel.name}</span>
										<span class="related-badge related-badge-{rel.status}">{rel.status}</span>
										{#if rel.notes}
											<p class="related-notes">{rel.notes}</p>
										{/if}
									</a>
								{/each}
							</div>
						</section>
					{/if}
				{/if}

				<!-- Disclaimer at bottom -->
				<div class="status-warning mt-6 rounded-2xl border p-6">
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
	/* ============================================
	   SECTION SYSTEM — Editorial journal layout
	   Three variants: prose, data, warn, muted
	   ============================================ */

	.sect {
		padding: 2rem 0;
	}

	.sect + .sect {
		border-top: none;
	}

	.sect-body {
		padding-top: 1rem;
	}

	/* -- Overview section — editorial lead style -- */
	.overview-lead {
		position: relative;
		padding-left: 1.25rem;
		border-left: 3px solid hsl(var(--accent));
	}

	.overview-text {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		font-weight: 400;
		line-height: 1.75;
		color: hsl(var(--foreground) / 0.9);
	}

	.overview-mechanism {
		margin-top: 1.75rem;
		padding: 1.25rem 1.5rem;
		background: hsl(var(--muted) / 0.35);
		border-radius: 0.75rem;
	}

	.overview-mechanism-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--accent));
		margin-bottom: 0.5rem;
	}

	.overview-mechanism-text {
		font-size: 0.9375rem;
		line-height: 1.65;
		color: hsl(var(--foreground) / 0.8);
	}

	.overview-benefits {
		margin-top: 1.75rem;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
	}

	@media (min-width: 768px) {
		.overview-benefits {
			grid-template-columns: 1fr 1fr;
		}
	}

	.overview-benefit {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.4);
	}

	.overview-benefit:last-child,
	.overview-benefit:nth-last-child(2):nth-child(odd) {
		border-bottom: none;
	}

	@media (min-width: 768px) {
		.overview-benefit:nth-child(odd) {
			padding-right: 1.5rem;
			border-right: 1px solid hsl(var(--border) / 0.4);
		}

		.overview-benefit:nth-child(even) {
			padding-left: 1.5rem;
		}
	}

	.overview-benefit-num {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		flex-shrink: 0;
	}

	.overview-benefit-text {
		font-size: 0.875rem;
		line-height: 1.5;
		color: hsl(var(--foreground) / 0.8);
	}

	/* Evidence tracker */
	.evidence-tracker {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1rem;
		padding: 0.625rem 0;
	}

	.ev-item {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.ev-value {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.ev-label {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
	}

	.ev-status {
		font-family: var(--font-sans);
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--accent));
	}

	.ev-sep {
		width: 1px;
		height: 1rem;
		background: hsl(var(--border));
	}

	/* Wikipedia-style rule line above every section except the first */
	.sect + .sect::before {
		content: '';
		display: block;
		height: 2px;
		background: hsl(var(--foreground) / 0.15);
		margin-bottom: 2rem;
	}

	/* -- Data sections (Molecular, Protocols, Indications, Interactions, Timeline, References) -- */
	.sect-data {
		background: hsl(var(--muted) / 0.2);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-left: -0.5rem;
		margin-right: -0.5rem;
	}

	.sect-data + .sect-data {
		margin-top: 0.5rem;
	}

	:global(.sect-heading-data) {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 1.125rem;
		font-weight: 400;
		color: hsl(var(--foreground));
		letter-spacing: -0.01em;
	}

	:global(.sect-heading-muted) {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 1.125rem;
		font-weight: 400;
		color: hsl(var(--muted-foreground));
	}

	:global(.sect-icon) {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--accent));
		flex-shrink: 0;
	}

	.sect-muted :global(.sect-icon) {
		color: hsl(var(--muted-foreground));
	}

	/* -- Warning/safety sections -- */
	.sect-warn {
		border-left: 3px solid hsl(var(--destructive));
		padding-left: 1.25rem;
		margin-left: -0.25rem;
	}

	:global(.sect-heading-warn) {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 1.125rem;
		font-weight: 400;
		color: hsl(var(--foreground));
	}

	.sect-warn :global(.sect-icon) {
		color: hsl(var(--destructive));
	}

	:global(.sect-heading-warn-block) {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* -- Muted sections (References) -- */
	.sect-muted {
		opacity: 0.85;
	}

	/* ============================================
	   INDICATIONS — grouped card layout
	   ============================================ */

	.indications-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.indication-group {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.indication-group-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--accent));
		padding-bottom: 0.5rem;
		margin-bottom: 0;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
	}

	.indication-item {
		padding: 0.625rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.3);
	}

	.indication-item:last-child {
		border-bottom: none;
	}

	.indication-item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.indication-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.indication-eff {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.1875rem 0.5rem;
		border-radius: 0.25rem;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.indication-eff-most-effective {
		background: hsl(var(--success, 142 71% 45%) / 0.12);
		color: hsl(var(--success, 142 71% 45%));
	}

	.indication-eff-effective {
		background: hsl(var(--accent) / 0.12);
		color: hsl(var(--accent));
	}

	.indication-eff-moderate {
		background: hsl(var(--warning, 30 80% 65%) / 0.12);
		color: hsl(var(--warning, 30 80% 65%));
	}

	.indication-eff-emerging {
		background: hsl(var(--muted-foreground) / 0.12);
		color: hsl(var(--muted-foreground));
	}

	.indication-desc {
		font-size: 0.8125rem;
		line-height: 1.5;
		color: hsl(var(--muted-foreground));
		margin-top: 0.25rem;
	}

	/* ============================================
	   INTERACTIONS — compact table rows
	   ============================================ */

	.interactions-table {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.ix-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.3);
	}

	.ix-row:last-child {
		border-bottom: none;
	}

	.ix-indicator {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6875rem;
		font-weight: 700;
		color: white;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.ix-content {
		flex: 1;
		min-width: 0;
	}

	.ix-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.ix-notes {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-top: 0.125rem;
		line-height: 1.45;
	}

	.ix-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	/* ============================================
	   TIMELINE — horizontal stepped layout
	   ============================================ */

	.timeline-track {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.tl-entry {
		display: grid;
		grid-template-columns: 7.5rem 3px 1fr;
		gap: 1rem;
		min-height: 4rem;
		align-items: start;
	}

	.tl-period {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-align: right;
		padding-top: 0.125rem;
		line-height: 1.4;
	}

	.tl-bar {
		width: 3px;
		height: 100%;
		min-height: 3rem;
		background: linear-gradient(to bottom, hsl(var(--accent)), hsl(var(--accent) / 0.2));
		border-radius: 2px;
		justify-self: center;
	}

	.tl-effects {
		font-size: 0.875rem;
		line-height: 1.6;
		color: hsl(var(--foreground) / 0.8);
		padding-bottom: 1rem;
	}

	@media (max-width: 640px) {
		.tl-entry {
			grid-template-columns: 5rem 3px 1fr;
			gap: 0.75rem;
		}

		.tl-period {
			font-size: 0.6875rem;
		}
	}

	/* Related Peptides */
	.related-heading {
		font-size: 1.125rem;
		font-weight: 400;
		margin-bottom: 1rem;
	}

	.related-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.625rem;
	}

	.related-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.875rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.15s;
	}

	.related-card:hover {
		border-color: hsl(var(--accent) / 0.5);
		background: hsl(var(--muted) / 0.2);
	}

	.related-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.related-badge {
		font-size: 0.5625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		width: fit-content;
	}

	.related-badge-synergistic {
		background: hsl(142 71% 45% / 0.12);
		color: hsl(142 71% 45%);
	}

	.related-badge-compatible {
		background: hsl(var(--accent) / 0.12);
		color: hsl(var(--accent));
	}

	.related-notes {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.4;
	}

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
