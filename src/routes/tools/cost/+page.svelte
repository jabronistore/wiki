<script lang="ts">
	import SEO from 'sk-seo';
	import { Home, ChevronRight, DollarSign } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { getItemBySlug } from '$lib/data/unified';

	const SITE_URL = 'https://peptide-db.com';

	let { data } = $props();

	let peptideId = $state(data.peptideId);
	let peptideName = $state(data.peptideName);
	let vialSize = $state(10);
	let vialPrice = $state(0);
	let dose = $state(data.defaultDose);
	let doseUnit = $state<'mcg' | 'mg'>(data.defaultUnit);
	let dosesPerDay = $state(data.defaultFreq);
	let cycleDays = $state(28);

	// Calculations
	const doseInMcg = $derived(doseUnit === 'mg' ? dose * 1000 : dose);
	const dosesPerVial = $derived(
		doseInMcg > 0 && vialSize > 0 ? Math.floor((vialSize * 1000) / doseInMcg) : 0
	);
	const daysPerVial = $derived(
		dosesPerDay > 0 && dosesPerVial > 0 ? dosesPerVial / dosesPerDay : 0
	);
	const costPerDose = $derived(dosesPerVial > 0 && vialPrice > 0 ? vialPrice / dosesPerVial : 0);
	const costPerDay = $derived(costPerDose * dosesPerDay);
	const costPerWeek = $derived(costPerDay * 7);
	const costPerCycle = $derived(costPerDay * cycleDays);
	const vialsPerCycle = $derived(daysPerVial > 0 ? Math.ceil(cycleDays / daysPerVial) : 0);

	function selectPeptide(e: Event) {
		const id = (e.target as HTMLSelectElement).value;
		peptideId = id;

		if (id) {
			const p = getItemBySlug(id);
			peptideName = p?.name || null;

			// Parse dose defaults from the new peptide
			let newDose = 250;
			let newUnit: 'mcg' | 'mg' = 'mcg';
			let newFreq = 1;

			if (p?.quickStats?.typicalDose) {
				const doseStr = p.quickStats.typicalDose;
				const mgMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*mg/i);
				const mcgMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*mcg/i);
				if (mgMatch) {
					newDose = parseFloat(mgMatch[1]);
					newUnit = 'mg';
				} else if (mcgMatch) {
					newDose = parseFloat(mcgMatch[1]);
					newUnit = 'mcg';
				}
			}

			if (p?.quickStats?.frequency) {
				const freq = p.quickStats.frequency.toLowerCase();
				if (freq.includes('twice daily') || freq.includes('2x daily')) newFreq = 2;
				else if (freq.includes('weekly') || freq.includes('once weekly')) newFreq = 1 / 7;
				else if (freq.includes('every other day')) newFreq = 0.5;
				else if (freq.includes('twice weekly')) newFreq = 2 / 7;
				else newFreq = 1;
			}

			dose = newDose;
			doseUnit = newUnit;
			dosesPerDay = newFreq;
			vialPrice = 0;
		} else {
			peptideName = null;
			dose = 250;
			doseUnit = 'mcg';
			dosesPerDay = 1;
			vialPrice = 0;
		}

		if (browser && id) {
			goto(`/tools/cost?peptide=${id}`, { replaceState: true, noScroll: true });
		} else if (browser) {
			goto('/tools/cost', { replaceState: true, noScroll: true });
		}
	}

	// SEO
	const title = $derived(
		peptideName
			? `${peptideName} Cost Calculator | Peptide Database`
			: 'Peptide Cost Calculator | Peptide Database'
	);
	const description = $derived(
		peptideName
			? `Calculate ${peptideName} cost per dose, per week, and per cycle. Enter your vial price to see the full breakdown.`
			: 'Calculate peptide cost per dose, per week, and per cycle. Enter your vial price and dosing protocol.'
	);
	const canonical = $derived(
		peptideId ? `${SITE_URL}/tools/cost?peptide=${peptideId}` : `${SITE_URL}/tools/cost`
	);

	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: 'Peptide Cost Calculator',
				description: 'Calculate peptide cost per dose, per week, and per cycle',
				url: `${SITE_URL}/tools/cost`,
				applicationCategory: 'HealthApplication',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
					{ '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/tools` },
					{
						'@type': 'ListItem',
						position: 3,
						name: 'Cost Calculator',
						item: `${SITE_URL}/tools/cost`
					}
				]
			}
		]
	});

	const freqPresets = [
		{ label: '2x daily', value: 2 },
		{ label: 'Daily', value: 1 },
		{ label: 'Every other day', value: 0.5 },
		{ label: '2x weekly', value: 2 / 7 },
		{ label: 'Weekly', value: 1 / 7 }
	];
</script>

<SEO
	{title}
	{description}
	keywords="peptide cost calculator, peptide price per dose, peptide cost per week, how much do peptides cost"
	siteName="Peptide Database"
	{canonical}
	twitter={true}
	openGraph={true}
	schemaOrg={true}
	{jsonld}
/>

<div class="cost-page">
	<nav aria-label="Breadcrumb" class="breadcrumb">
		<ol>
			<li>
				<a href="/"><Home class="h-3.5 w-3.5" /><span>Home</span></a><ChevronRight
					class="sep h-3.5 w-3.5"
				/>
			</li>
			<li><span class="current">Cost Calculator</span></li>
		</ol>
	</nav>

	<header class="page-header">
		<h1>{peptideName ? `${peptideName} Cost Calculator` : 'Peptide Cost Calculator'}</h1>
		<p class="subtitle">
			Enter your vial price and protocol to see cost per dose, per week, and per cycle.
		</p>
	</header>

	<div class="calc-layout">
		<!-- Inputs -->
		<div class="calc-inputs">
			<!-- Peptide selector -->
			<div class="input-group">
				<label for="cost-peptide" class="field-label">Peptide</label>
				<select id="cost-peptide" value={peptideId} onchange={selectPeptide} class="field-select">
					<option value="">Select peptide...</option>
					{#each data.allPeptides as p}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
			</div>

			<!-- Vial size + price side by side -->
			<div class="input-row">
				<div class="input-group">
					<label for="cost-vial" class="field-label">Vial Size</label>
					<div class="field-box">
						<input
							id="cost-vial"
							type="number"
							bind:value={vialSize}
							min="0.1"
							step="0.1"
							inputmode="decimal"
							class="field-input"
						/>
						<span class="field-suffix">mg</span>
					</div>
				</div>
				<div class="input-group">
					<label for="cost-price" class="field-label">Vial Price</label>
					<div class="field-box">
						<span class="field-prefix">$</span>
						<input
							id="cost-price"
							type="number"
							bind:value={vialPrice}
							min="0"
							step="1"
							inputmode="decimal"
							class="field-input"
							placeholder="0"
						/>
					</div>
				</div>
			</div>

			<!-- Dose -->
			<div class="input-group">
				<label for="cost-dose" class="field-label">Dose per injection</label>
				<div class="field-box">
					<input
						id="cost-dose"
						type="number"
						bind:value={dose}
						min="0.1"
						step={doseUnit === 'mg' ? 0.5 : 50}
						inputmode="decimal"
						class="field-input"
					/>
					<div class="unit-seg">
						<button
							type="button"
							class="unit-seg-btn"
							class:unit-seg-active={doseUnit === 'mcg'}
							onclick={() => (doseUnit = 'mcg')}>mcg</button
						>
						<button
							type="button"
							class="unit-seg-btn"
							class:unit-seg-active={doseUnit === 'mg'}
							onclick={() => (doseUnit = 'mg')}>mg</button
						>
					</div>
				</div>
			</div>

			<!-- Frequency -->
			<div class="input-group">
				<span class="field-label">Frequency</span>
				<div class="freq-presets">
					{#each freqPresets as fp}
						<button
							type="button"
							class="freq-btn"
							class:freq-active={Math.abs(dosesPerDay - fp.value) < 0.001}
							onclick={() => (dosesPerDay = fp.value)}>{fp.label}</button
						>
					{/each}
				</div>
			</div>

			<!-- Cycle length -->
			<div class="input-group">
				<label for="cost-cycle" class="field-label">Cycle Length</label>
				<div class="field-box">
					<input
						id="cost-cycle"
						type="number"
						bind:value={cycleDays}
						min="1"
						max="365"
						step="1"
						inputmode="numeric"
						class="field-input"
					/>
					<span class="field-suffix">days</span>
				</div>
			</div>
		</div>

		<!-- Results -->
		<div class="calc-results">
			{#if vialPrice > 0 && dosesPerVial > 0}
				<div class="result-card result-primary">
					<span class="result-big">${costPerDose.toFixed(2)}</span>
					<span class="result-label">per dose</span>
				</div>

				<div class="result-grid">
					<div class="result-card">
						<span class="result-value">${costPerDay.toFixed(2)}</span>
						<span class="result-label">per day</span>
					</div>
					<div class="result-card">
						<span class="result-value">${costPerWeek.toFixed(2)}</span>
						<span class="result-label">per week</span>
					</div>
					<div class="result-card">
						<span class="result-value">${costPerCycle.toFixed(2)}</span>
						<span class="result-label">per cycle ({cycleDays}d)</span>
					</div>
					<div class="result-card">
						<span class="result-value">{vialsPerCycle}</span>
						<span class="result-label">vials needed</span>
					</div>
				</div>

				<div class="result-meta">
					<span>{dosesPerVial} doses per vial</span>
					<span>{daysPerVial.toFixed(1)} days per vial</span>
				</div>
			{:else}
				<div class="result-empty">Enter a vial price above to see cost breakdown.</div>
			{/if}
		</div>
	</div>

	<!-- Cross-links -->
	{#if peptideId}
		<div class="cross-links">
			<a href="/peptides/{peptideId}" class="link-pill">{peptideName} profile</a>
			<a href="/calculator?peptide={peptideId}" class="link-pill">Reconstitution calculator</a>
		</div>
	{/if}
</div>

<style>
	.cost-page {
		max-width: 48rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
		overflow-x: hidden;
	}

	/* Breadcrumb */
	.breadcrumb ol {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}
	.breadcrumb li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.breadcrumb a {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
	}
	.breadcrumb a:hover {
		color: hsl(var(--foreground));
	}
	.breadcrumb .current {
		color: hsl(var(--foreground));
		font-weight: 500;
	}
	.breadcrumb :global(.sep) {
		color: hsl(var(--border));
	}

	.page-header {
		margin-bottom: 2rem;
	}
	.page-header h1 {
		font-size: 2rem;
		font-weight: 400;
		margin-bottom: 0.5rem;
	}
	.subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
	}

	.calc-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		align-items: start;
	}

	@media (max-width: 640px) {
		.calc-layout {
			grid-template-columns: 1fr;
		}
		.input-row {
			grid-template-columns: 1fr;
		}
		.page-header h1 {
			font-size: 1.5rem;
		}
	}

	.calc-inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.input-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.field-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground));
	}

	.field-box {
		display: flex;
		align-items: center;
		border: 1.5px solid hsl(var(--border));
		max-width: 100%;
		border-radius: 0.625rem;
		background: hsl(var(--background));
		overflow: hidden;
		transition: border-color 0.15s;
	}

	.field-box:focus-within {
		border-color: hsl(var(--accent));
	}

	.field-input {
		flex: 1;
		padding: 0.75rem 0.875rem;
		font-size: 1rem;
		font-weight: 600;
		font-family: var(--font-mono);
		background: transparent;
		color: hsl(var(--foreground));
		border: none;
		outline: none;
		min-width: 0;
		width: 100%;
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.field-input::-webkit-outer-spin-button,
	.field-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	.field-suffix {
		padding: 0.75rem 0.875rem 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		user-select: none;
	}

	.field-prefix {
		padding: 0.75rem 0 0.75rem 0.875rem;
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		user-select: none;
	}

	.field-select {
		width: 100%;
		padding: 0.75rem 0.875rem;
		font-size: 0.875rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
	}

	.field-select:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	/* Unit toggle */
	.unit-seg {
		display: flex;
		margin: 0.375rem 0.375rem 0.375rem 0;
		border-radius: 0.375rem;
		overflow: hidden;
		border: 1px solid hsl(var(--border));
		flex-shrink: 0;
	}

	.unit-seg-btn {
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.unit-seg-btn:first-child {
		border-right: 1px solid hsl(var(--border));
	}
	.unit-seg-active {
		background: hsl(var(--accent));
		color: white;
	}

	/* Frequency presets */
	.freq-presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.freq-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: all 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	.freq-btn:hover {
		border-color: hsl(var(--accent) / 0.5);
	}
	.freq-active {
		background: hsl(var(--accent));
		color: white;
		border-color: hsl(var(--accent));
	}

	/* Results */
	.calc-results {
		position: sticky;
		top: 5rem;
	}

	.result-primary {
		padding: 1.5rem;
		background: hsl(var(--accent) / 0.06);
		border: 1px solid hsl(var(--accent) / 0.2);
		border-radius: 0.75rem;
		text-align: center;
		margin-bottom: 0.75rem;
	}

	.result-big {
		display: block;
		font-size: 2.5rem;
		font-weight: 600;
		font-family: var(--font-mono);
		color: hsl(var(--accent));
		line-height: 1.1;
	}

	.result-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.result-card {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.875rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
	}

	.result-value {
		font-size: 1.125rem;
		font-weight: 600;
		font-family: var(--font-mono);
		color: hsl(var(--foreground));
	}

	.result-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground));
	}

	.result-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.75rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.result-empty {
		padding: 3rem 1.5rem;
		text-align: center;
		border: 1.5px dashed hsl(var(--border));
		border-radius: 0.75rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	/* Cross-links */
	.cross-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid hsl(var(--border) / 0.5);
	}

	.link-pill {
		display: inline-flex;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
		padding: 0.3rem 0.75rem;
		border: 1px solid hsl(var(--accent) / 0.3);
		border-radius: 999px;
		transition: all 0.15s;
	}

	.link-pill:hover {
		background: hsl(var(--accent) / 0.08);
		border-color: hsl(var(--accent) / 0.5);
	}
</style>
