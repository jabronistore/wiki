<script lang="ts">
	import { PeptideCalculator } from '$lib/components/calculator';
	import { Droplets, Syringe, FlaskConical, ChevronRight, Home, BookOpen, ExternalLink } from 'lucide-svelte';
	import SEO from 'sk-seo';
	import { goto } from '$app/navigation';
	import { currentReconstitutionPeptide } from '$lib/stores/calculator';

	let { data } = $props();

	// Use store for reactive updates, fallback to SSR data
	const peptideName = $derived($currentReconstitutionPeptide.name || data.peptideName);
	const peptideId = $derived($currentReconstitutionPeptide.id || data.peptideId);
	const ctx = $derived(data.peptideContext);
	const guides = $derived(data.relatedGuides || []);

	// Dynamic SEO based on selected peptide
	const title = $derived(
		peptideName
			? `${peptideName} Reconstitution Calculator | Peptide Database`
			: 'Reconstitution Calculator | Peptide Database'
	);

	const description = $derived(
		peptideName
			? `Calculate ${peptideName} reconstitution doses with our visual syringe guide. See exactly how much to draw for your ${peptideName} dose.`
			: 'Calculate peptide reconstitution doses with our visual syringe guide. See exactly how much to draw for your dose.'
	);

	const keywords = $derived(
		peptideName
			? `${peptideName} reconstitution calculator, ${peptideName} dosing calculator, ${peptideName} calculator, peptide calculator`
			: 'peptide calculator, reconstitution calculator, peptide dosing, syringe calculator'
	);

	const canonical = $derived(
		peptideId
			? `https://peptide-db.com/calculator?peptide=${peptideId}`
			: 'https://peptide-db.com/calculator'
	);

	const SITE_URL = 'https://peptide-db.com';

	// JSON-LD with BreadcrumbList + FAQ
	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: title,
				description: description,
				url: canonical,
				applicationCategory: 'HealthApplication',
				operatingSystem: 'Any',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				publisher: {
					'@type': 'Organization',
					name: 'Peptide Database',
					url: SITE_URL
				}
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
					{ '@type': 'ListItem', position: 2, name: 'Calculator', item: `${SITE_URL}/calculator` },
					...(peptideName ? [{ '@type': 'ListItem', position: 3, name: peptideName, item: canonical }] : [])
				]
			},
			{
				'@type': 'FAQPage',
				mainEntity: [
					{
						'@type': 'Question',
						name: 'How do I reconstitute peptides with bacteriostatic water?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: 'Draw bacteriostatic water into a syringe, inject slowly down the vial wall (not directly onto powder), then gently swirl until dissolved. Never shake. Store refrigerated at 2-8C and use within 28 days.'
						}
					},
					{
						'@type': 'Question',
						name: 'How many units should I draw on an insulin syringe?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: '1 mL equals 100 units on a standard insulin syringe. Divide your required volume in mL by 0.01 to get units. For example, 0.25 mL = 25 units. Use the smallest syringe that fits your dose for better precision.'
						}
					},
					{
						'@type': 'Question',
						name: 'What syringe size should I use for peptide injections?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: '0.3 mL (30 unit) syringes offer the best precision for small doses under 0.3 mL. 0.5 mL (50 unit) syringes work for most peptides. 1 mL (100 unit) syringes are needed for larger dose volumes.'
						}
					}
				]
			}
		]
	});

	// Handle peptide selection change
	function handlePeptideChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const selectedId = select.value;

		if (selectedId) {
			const selectedPeptide = data.allPeptides.find((p: { id: string }) => p.id === selectedId);
			currentReconstitutionPeptide.set({
				id: selectedId,
				name: selectedPeptide?.name || null
			});
			goto(`/calculator?peptide=${selectedId}`, { replaceState: true, noScroll: true });
		} else {
			currentReconstitutionPeptide.set({ id: null, name: null });
			goto('/calculator', { replaceState: true, noScroll: true });
		}
	}

	// Set initial store value from SSR data
	$effect(() => {
		if (data.peptideId && data.peptideName) {
			currentReconstitutionPeptide.set({
				id: data.peptideId,
				name: data.peptideName
			});
		}
	});

	// Check if selected peptide is a blend that has a dedicated blend calculator
	const blendMap: Record<string, string> = {
		'klow-protocol': 'klow',
		'glow-protocol': 'glow',
		'cjc-ipa-protocol': 'cjc-ipa',
		'wolverine-stack': 'wolverine',
		'tri-heal-max-protocol': 'tri-heal-max',
		'tesa-ipa-protocol': 'tesa-ipa',
		'illumineuro-protocol': 'illumineuro'
	};
	const blendCalcId = $derived(peptideId ? blendMap[peptideId] ?? null : null);

	// Get first injectable method's protocols for contextual reference
	const injectableMethod = $derived(
		ctx?.deliveryMethods?.find(m => m.type === 'injectable')
	);
</script>

<SEO
	{title}
	{description}
	{keywords}
	siteName="Peptide Database"
	{canonical}
	twitter={true}
	openGraph={true}
	schemaOrg={true}
	{jsonld}
/>

<!-- Breadcrumb -->
<nav aria-label="Breadcrumb" class="calc-breadcrumb">
	<ol>
		<li>
			<a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a>
			<ChevronRight class="h-3.5 w-3.5 sep" />
		</li>
		<li>
			{#if peptideName}
				<a href="/calculator">Calculator</a>
				<ChevronRight class="h-3.5 w-3.5 sep" />
			{:else}
				<span class="current">Calculator</span>
			{/if}
		</li>
		{#if peptideName}
			<li><span class="current">{peptideName}</span></li>
		{/if}
	</ol>
</nav>

<!-- Calculator Header with Peptide Selector -->
<div class="calculator-header">
	<div class="header-content">
		{#if peptideName}
			<h1 class="calculator-title">{peptideName} Calculator</h1>
			<p class="calculator-subtitle">Calculate reconstitution doses for {peptideName}</p>
		{:else}
			<h1 class="calculator-title">Reconstitution Calculator</h1>
			<p class="calculator-subtitle">Calculate peptide doses with our visual syringe guide</p>
		{/if}

		<!-- Cross-links (only when peptide selected) -->
		{#if peptideId}
			<div class="cross-links">
				<a href="/peptides/{peptideId}" class="cross-link">
					<FlaskConical class="h-3.5 w-3.5" />
					<span>{peptideName} profile</span>
				</a>
				{#if ctx?.molecular?.halfLifeSeconds}
					<a href="/calculator/accumulation?peptide={peptideId}" class="cross-link">
						<span>Accumulation plotter</span>
					</a>
				{/if}
				{#each guides as guide}
					<a href="/guides/{guide.slug}" class="cross-link">
						<BookOpen class="h-3.5 w-3.5" />
						<span>{guide.title}</span>
					</a>
				{/each}
			</div>
		{/if}
	</div>
	<div class="peptide-selector">
		<select
			id="peptide-select"
			value={peptideId || ''}
			onchange={handlePeptideChange}
			class="selector-dropdown"
		>
			<option value="">All Peptides</option>
			{#each data.allPeptides as peptide}
				<option value={peptide.id}>{peptide.name}</option>
			{/each}
		</select>
	</div>
</div>

{#if blendCalcId}
	<a href="/calculator/blend?b={blendCalcId}" class="blend-nudge">
		{peptideName} is a multi-peptide blend. Use the <strong>blend calculator →</strong> to see individual component doses.
	</a>
{/if}

<PeptideCalculator defaultDose={data.defaultDose} defaultUnit={data.defaultUnit} />

<!-- Contextual Reference Section -->
<div class="reference-section">
	{#if ctx && injectableMethod}
		<!-- Peptide-specific reference -->
		<h2 class="section-title">{peptideName} Reference</h2>

		<div class="reference-grid">
			<!-- Peptide-specific protocols -->
			{#if injectableMethod.protocols && injectableMethod.protocols.length > 0}
				<div class="reference-card">
					<div class="reference-icon">
						<Syringe class="h-5 w-5" />
					</div>
					<h3 class="reference-heading">{peptideName} Dosing Protocols</h3>
					<div class="reference-table">
						<table>
							<thead>
								<tr>
									<th>Goal</th>
									<th>Dose</th>
									<th>Frequency</th>
								</tr>
							</thead>
							<tbody>
								{#each injectableMethod.protocols as protocol}
									<tr>
										<td>{protocol.goal}</td>
										<td class="dose-cell">{protocol.dose}</td>
										<td>{protocol.frequency}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- Peptide-specific reconstitution -->
			{#if injectableMethod.reconstitution}
				<div class="reference-card">
					<div class="reference-icon">
						<Droplets class="h-5 w-5" />
					</div>
					<h3 class="reference-heading">Reconstitution Steps</h3>
					<ol class="recon-steps">
						{#each injectableMethod.reconstitution.steps as step, i}
							<li>
								<span class="step-num">{String(i + 1).padStart(2, '0')}</span>
								<span>{step}</span>
							</li>
						{/each}
					</ol>
				</div>
			{/if}

			<!-- Quick stats -->
			<div class="reference-card">
				<div class="reference-icon">
					<FlaskConical class="h-5 w-5" />
				</div>
				<h3 class="reference-heading">Quick Reference</h3>
				<div class="quick-ref">
					{#if ctx.quickStats?.typicalDose}
						<div class="quick-ref-row">
							<span class="quick-ref-label">Typical Dose</span>
							<span class="quick-ref-value">{ctx.quickStats.typicalDose}</span>
						</div>
					{/if}
					{#if ctx.quickStats?.frequency}
						<div class="quick-ref-row">
							<span class="quick-ref-label">Frequency</span>
							<span class="quick-ref-value">{ctx.quickStats.frequency}</span>
						</div>
					{/if}
					{#if ctx.molecular?.halfLife}
						<div class="quick-ref-row">
							<span class="quick-ref-label">Half-life</span>
							<span class="quick-ref-value">{ctx.molecular.halfLife}</span>
						</div>
					{/if}
					{#if ctx.quickStats?.storage}
						<div class="quick-ref-row">
							<span class="quick-ref-label">Storage</span>
							<span class="quick-ref-value">{ctx.quickStats.storage}</span>
						</div>
					{/if}
					{#if ctx.quickStats?.cycleDuration}
						<div class="quick-ref-row">
							<span class="quick-ref-label">Cycle</span>
							<span class="quick-ref-value">{ctx.quickStats.cycleDuration}</span>
						</div>
					{/if}
				</div>
				<a href="/peptides/{peptideId}" class="ref-profile-link">
					View full {peptideName} profile
					<ExternalLink class="h-3 w-3" />
				</a>
			</div>
		</div>
	{:else}
		<!-- Generic reference (no peptide selected) -->
		<h2 class="section-title">Reference Guide</h2>

		<div class="reference-grid">
			<div class="reference-card">
				<div class="reference-icon">
					<FlaskConical class="h-5 w-5" />
				</div>
				<h3 class="reference-heading">Common Vial Sizes</h3>
				<div class="reference-table">
					<table>
						<thead>
							<tr>
								<th>Peptide</th>
								<th>Typical Size</th>
							</tr>
						</thead>
						<tbody>
							<tr><td>BPC-157</td><td>5mg, 10mg</td></tr>
							<tr><td>TB-500</td><td>5mg, 10mg</td></tr>
							<tr><td>Semaglutide</td><td>3mg, 5mg</td></tr>
							<tr><td>Ipamorelin</td><td>5mg, 10mg</td></tr>
							<tr><td>CJC-1295</td><td>2mg, 5mg</td></tr>
							<tr><td>Tirzepatide</td><td>5mg, 10mg, 15mg</td></tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="reference-card">
				<div class="reference-icon">
					<Syringe class="h-5 w-5" />
				</div>
				<h3 class="reference-heading">Syringe Types</h3>
				<div class="reference-table">
					<table>
						<thead>
							<tr>
								<th>Size</th>
								<th>Units</th>
								<th>Best For</th>
							</tr>
						</thead>
						<tbody>
							<tr><td>0.3mL</td><td>30 units</td><td>Small doses, precision</td></tr>
							<tr><td>0.5mL</td><td>50 units</td><td>Most peptides</td></tr>
							<tr><td>1mL</td><td>100 units</td><td>Larger doses</td></tr>
						</tbody>
					</table>
				</div>
				<p class="reference-note">
					Smaller syringes offer better precision for small doses. Use the smallest syringe that fits your dose.
				</p>
			</div>

			<div class="reference-card">
				<div class="reference-icon">
					<Droplets class="h-5 w-5" />
				</div>
				<h3 class="reference-heading">Reconstitution Tips</h3>
				<ul class="tips-list">
					<li><strong>Use bacteriostatic water (BAC)</strong> - contains 0.9% benzyl alcohol for preservation</li>
					<li><strong>Inject water slowly</strong> - aim down the vial wall, not directly onto powder</li>
					<li><strong>Never shake</strong> - gently swirl or roll the vial until dissolved</li>
					<li><strong>Store properly</strong> - refrigerate at 2-8C after reconstitution</li>
					<li><strong>Use within 28 days</strong> - most reconstituted peptides remain stable for about 4 weeks</li>
					<li><strong>Keep sterile</strong> - always clean vial tops with alcohol before drawing</li>
				</ul>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Blend nudge */
	.blend-nudge {
		display: block;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		font-size: 0.8125rem;
		color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.06);
		border: 1px solid hsl(var(--accent) / 0.2);
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.15s;
	}

	.blend-nudge:hover {
		background: hsl(var(--accent) / 0.1);
		border-color: hsl(var(--accent) / 0.4);
	}

	/* Breadcrumb */
	.calc-breadcrumb {
		margin-bottom: 1rem;
	}

	.calc-breadcrumb ol {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.calc-breadcrumb li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.calc-breadcrumb a {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		transition: color 0.15s;
	}

	.calc-breadcrumb a:hover {
		color: hsl(var(--foreground));
	}

	.calc-breadcrumb .current {
		color: hsl(var(--foreground));
		font-weight: 500;
	}

	.calc-breadcrumb :global(.sep) {
		color: hsl(var(--border));
	}

	/* Calculator Header */
	.calculator-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	@media (min-width: 640px) {
		.calculator-header {
			flex-direction: row;
			align-items: flex-start;
			justify-content: space-between;
		}
	}

	.header-content {
		flex: 1;
	}

	.calculator-title {
		font-size: 1.5rem;
		font-weight: 400;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.calculator-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0.25rem 0 0;
	}

	/* Cross-links */
	.cross-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.cross-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--accent) / 0.3);
		border-radius: 999px;
		transition: all 0.15s;
	}

	.cross-link:hover {
		background: hsl(var(--accent) / 0.08);
		border-color: hsl(var(--accent) / 0.5);
	}

	.peptide-selector {
		flex-shrink: 0;
	}

	.selector-dropdown {
		padding: 0.5rem 2.5rem 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
		min-width: 180px;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 1rem;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}

	.selector-dropdown:hover {
		border-color: hsl(var(--muted-foreground));
	}

	.selector-dropdown:focus {
		outline: none;
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 2px hsl(var(--accent) / 0.2);
	}

	/* Reference Section */
	.reference-section {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 2px solid hsl(var(--foreground) / 0.15);
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 400;
		margin-bottom: 1.5rem;
	}

	.reference-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.reference-grid {
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		}
	}

	.reference-card {
		background: hsl(var(--muted) / 0.2);
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		padding: 1.25rem;
	}

	.reference-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: hsl(var(--muted));
		border-radius: 0.375rem;
		margin-bottom: 0.75rem;
		color: hsl(var(--accent));
	}

	.reference-heading {
		font-size: 0.9375rem;
		font-weight: 600;
		font-family: var(--font-sans);
		margin-bottom: 0.75rem;
	}

	.reference-table table {
		width: 100%;
		font-size: 0.8125rem;
	}

	.reference-table th,
	.reference-table td {
		padding: 0.5rem 0.375rem;
		text-align: left;
		border-bottom: 1px solid hsl(var(--border) / 0.5);
	}

	.reference-table th {
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.reference-table tbody tr:last-child td {
		border-bottom: none;
	}

	.dose-cell {
		font-family: var(--font-mono);
		font-weight: 500;
		color: hsl(var(--accent));
	}

	.reference-note {
		margin-top: 0.75rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	/* Reconstitution steps */
	.recon-steps {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.recon-steps li {
		display: flex;
		align-items: baseline;
		gap: 0.625rem;
		font-size: 0.8125rem;
		color: hsl(var(--foreground) / 0.8);
		line-height: 1.5;
	}

	.step-num {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--accent));
		flex-shrink: 0;
	}

	/* Quick reference */
	.quick-ref {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.quick-ref-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0.5rem 0;
		border-bottom: 1px solid hsl(var(--border) / 0.4);
		gap: 0.75rem;
	}

	.quick-ref-row:last-child {
		border-bottom: none;
	}

	.quick-ref-label {
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground));
		flex-shrink: 0;
	}

	.quick-ref-value {
		font-size: 0.8125rem;
		color: hsl(var(--foreground));
		text-align: right;
	}

	.ref-profile-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
	}

	.ref-profile-link:hover {
		text-decoration: underline;
	}

	/* Tips list */
	.tips-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.tips-list li {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		padding-left: 0.875rem;
		position: relative;
		line-height: 1.5;
	}

	.tips-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.5rem;
		width: 4px;
		height: 4px;
		background: hsl(var(--accent));
		border-radius: 50%;
	}

	.tips-list li strong {
		color: hsl(var(--foreground));
	}
</style>
