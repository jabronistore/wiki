<script lang="ts">
	import { PeptideCalculator } from '$lib/components/calculator';
	import { Droplets, Syringe, FlaskConical } from 'lucide-svelte';
	import SEO from 'sk-seo';
	import { goto } from '$app/navigation';
	import { currentReconstitutionPeptide } from '$lib/stores/calculator';

	let { data } = $props();

	// Use store for reactive updates, fallback to SSR data
	const peptideName = $derived($currentReconstitutionPeptide.name || data.peptideName);
	const peptideId = $derived($currentReconstitutionPeptide.id || data.peptideId);

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
</script>

<SEO
	{title}
	{description}
	{keywords}
	siteName="Peptide Database"
	{canonical}
	twitter={true}
	openGraph={true}
/>

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

<PeptideCalculator defaultDose={data.defaultDose} />

<!-- Reference Section -->
<div class="reference-section">
	<h2 class="section-title">Reference Guide</h2>

	<div class="reference-grid">
		<!-- Common Vial Sizes -->
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
						<tr>
							<td>BPC-157</td>
							<td>5mg, 10mg</td>
						</tr>
						<tr>
							<td>TB-500</td>
							<td>5mg, 10mg</td>
						</tr>
						<tr>
							<td>Semaglutide</td>
							<td>3mg, 5mg</td>
						</tr>
						<tr>
							<td>Ipamorelin</td>
							<td>5mg, 10mg</td>
						</tr>
						<tr>
							<td>CJC-1295</td>
							<td>2mg, 5mg</td>
						</tr>
						<tr>
							<td>Tirzepatide</td>
							<td>5mg, 10mg, 15mg</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<!-- Syringe Comparison -->
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
						<tr>
							<td>0.3mL</td>
							<td>30 units</td>
							<td>Small doses, precision</td>
						</tr>
						<tr>
							<td>0.5mL</td>
							<td>50 units</td>
							<td>Most peptides</td>
						</tr>
						<tr>
							<td>1mL</td>
							<td>100 units</td>
							<td>Larger doses</td>
						</tr>
					</tbody>
				</table>
			</div>
			<p class="reference-note">
				Smaller syringes offer better precision for small doses. Use the smallest syringe that fits
				your dose.
			</p>
		</div>

		<!-- Reconstitution Tips -->
		<div class="reference-card">
			<div class="reference-icon">
				<Droplets class="h-5 w-5" />
			</div>
			<h3 class="reference-heading">Reconstitution Tips</h3>
			<ul class="tips-list">
				<li>
					<strong>Use bacteriostatic water (BAC)</strong> - contains 0.9% benzyl alcohol for preservation
				</li>
				<li>
					<strong>Inject water slowly</strong> - aim down the vial wall, not directly onto powder
				</li>
				<li>
					<strong>Never shake</strong> - gently swirl or roll the vial until dissolved
				</li>
				<li>
					<strong>Store properly</strong> - refrigerate at 2-8°C after reconstitution
				</li>
				<li>
					<strong>Use within 28 days</strong> - most reconstituted peptides remain stable for about 4
					weeks
				</li>
				<li>
					<strong>Keep sterile</strong> - always clean vial tops with alcohol before drawing
				</li>
			</ul>
		</div>
	</div>
</div>

<style>
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
			align-items: center;
			justify-content: space-between;
		}
	}

	.header-content {
		flex: 1;
	}

	.calculator-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.calculator-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0.25rem 0 0;
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
		border-top: 1px solid hsl(var(--border));
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.reference-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.reference-card {
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.reference-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background: hsl(var(--muted));
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		color: hsl(var(--muted-foreground));
	}

	.reference-heading {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.reference-table table {
		width: 100%;
		font-size: 0.875rem;
	}

	.reference-table th,
	.reference-table td {
		padding: 0.5rem;
		text-align: left;
		border-bottom: 1px solid hsl(var(--border));
	}

	.reference-table th {
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.reference-table tbody tr:last-child td {
		border-bottom: none;
	}

	.reference-note {
		margin-top: 1rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.tips-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tips-list li {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		padding-left: 1rem;
		position: relative;
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
