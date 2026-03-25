<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import SyringeVisual from './SyringeVisual.svelte';
	import { AlertTriangle, Info, Share2, Check } from 'lucide-svelte';
	import { browser } from '$app/environment';

	type SyringeSize = 0.3 | 0.5 | 1;

	interface Props {
		peptideName?: string;
		defaultVialSize?: number;
		defaultDose?: number;
		defaultUnit?: 'mcg' | 'mg';
		compact?: boolean;
	}

	let {
		peptideName,
		defaultVialSize = 10,
		defaultDose = 250,
		defaultUnit = 'mcg',
		compact = false
	}: Props = $props();

	type DoseUnit = 'mcg' | 'mg';

	// Parse URL params for initial state (short keys: v=vial, w=water, d=dose, u=unit, s=syringe)
	function getInitialState() {
		if (!browser) return null;
		const params = new URLSearchParams(window.location.search);
		return {
			vial: params.get('v') ? Number(params.get('v')) : null,
			water: params.get('w') ? Number(params.get('w')) : null,
			dose: params.get('d') ? Number(params.get('d')) : null,
			unit: params.get('u') as DoseUnit | null,
			syringe: params.get('s') ? (Number(params.get('s')) as SyringeSize) : null
		};
	}

	const initial = getInitialState();

	// State
	let vialSize = $state(initial?.vial ?? defaultVialSize);
	let waterVolume = $state(initial?.water ?? 2);
	let desiredDose = $state(initial?.dose ?? defaultDose);
	let doseUnit = $state<DoseUnit>(initial?.unit ?? defaultUnit);
	let syringeSize = $state<SyringeSize>(initial?.syringe ?? 1);
	let userHasEditedDose = $state(initial?.dose !== null);

	// Share functionality
	let copied = $state(false);

	function getShareUrl(): string {
		const params = new URLSearchParams();
		if (vialSize !== 10) params.set('v', String(vialSize));
		if (waterVolume !== 2) params.set('w', String(waterVolume));
		if (desiredDose !== 250) params.set('d', String(desiredDose));
		if (doseUnit !== 'mcg') params.set('u', doseUnit);
		if (syringeSize !== 1) params.set('s', String(syringeSize));
		const queryString = params.toString();
		const baseUrl = browser ? window.location.origin + window.location.pathname : '';
		return queryString ? `${baseUrl}?${queryString}` : baseUrl;
	}

	async function copyShareUrl() {
		const url = getShareUrl();
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// Update URL as state changes (without navigation)
	$effect(() => {
		if (!browser || compact) return; // Don't update URL when in modal/compact mode
		const url = getShareUrl();
		const currentUrl = window.location.origin + window.location.pathname + window.location.search;
		if (url !== currentUrl) {
			window.history.replaceState({}, '', url);
		}
	});

	// Common presets
	const vialPresets = [5, 10, 15, 20, 30];
	const waterPresets = [1, 2, 3, 5];
	const syringeSizes: SyringeSize[] = [0.3, 0.5, 1];

	// Calculations
	const concentration = $derived(vialSize && waterVolume ? vialSize / waterVolume : 0);
	const doseInMcg = $derived(doseUnit === 'mg' ? desiredDose * 1000 : desiredDose);
	const volumeToDraw = $derived(concentration > 0 ? doseInMcg / 1000 / concentration : 0);
	const unitsToDraw = $derived(Math.round(volumeToDraw * 100));
	const isOverCapacity = $derived(volumeToDraw > syringeSize);
	const dosesPerVial = $derived(
		doseInMcg > 0 && vialSize > 0 ? Math.floor((vialSize * 1000) / doseInMcg) : 0
	);

	function selectVialPreset(size: number) {
		vialSize = size;
	}

	function selectWaterPreset(volume: number) {
		waterVolume = volume;
	}

	function selectSyringeSize(size: SyringeSize) {
		syringeSize = size;
	}

	function selectDoseUnit(unit: DoseUnit) {
		if (!userHasEditedDose) {
			// Set smart defaults when switching units
			desiredDose = unit === 'mg' ? 1 : 250;
		} else {
			// Convert the current value
			if (unit === 'mg' && doseUnit === 'mcg') {
				desiredDose = desiredDose / 1000;
			} else if (unit === 'mcg' && doseUnit === 'mg') {
				desiredDose = desiredDose * 1000;
			}
		}
		doseUnit = unit;
	}

	function handleDoseInput(e: Event) {
		userHasEditedDose = true;
		desiredDose = parseFloat((e.target as HTMLInputElement).value) || 0;
	}

	// Reset to defaults
	function reset() {
		vialSize = defaultVialSize;
		waterVolume = 2;
		desiredDose = defaultDose;
		doseUnit = 'mcg';
		syringeSize = 1;
		userHasEditedDose = false;
	}
</script>

<div class="calculator {compact ? 'calculator-compact' : ''}">
	{#if peptideName}
		<div class="calculator-header">
			<h3 class="text-lg font-semibold">{peptideName} Calculator</h3>
		</div>
	{/if}

	<div class="calculator-layout">
		<!-- Input Section -->
		<div class="calculator-inputs">
			<!-- Vial Size -->
			<div class="input-group">
				<label for="vial-size" class="field-label">Vial Size (peptide amount)</label>
				<div class="field-box">
					<input
						id="vial-size"
						type="number"
						bind:value={vialSize}
						min="0.1"
						step="0.1"
						inputmode="decimal"
						class="field-input"
					/>
					<span class="field-suffix">mg</span>
				</div>
				<div class="presets">
					{#each vialPresets as preset}
						<button
							type="button"
							class="preset"
							class:preset-match={vialSize === preset}
							onclick={() => selectVialPreset(preset)}>{preset}</button
						>
					{/each}
				</div>
			</div>

			<!-- Water Volume -->
			<div class="input-group">
				<label for="water-volume" class="field-label">BAC Water (added to vial)</label>
				<div class="field-box">
					<input
						id="water-volume"
						type="number"
						bind:value={waterVolume}
						min="0.1"
						step="0.1"
						inputmode="decimal"
						class="field-input"
					/>
					<span class="field-suffix">mL</span>
				</div>
				<div class="presets">
					{#each waterPresets as preset}
						<button
							type="button"
							class="preset"
							class:preset-match={waterVolume === preset}
							onclick={() => selectWaterPreset(preset)}>{preset}</button
						>
					{/each}
				</div>
			</div>

			<!-- Desired Dose -->
			<div class="input-group">
				<label for="desired-dose" class="field-label">Desired Dose</label>
				<div class="field-box">
					<input
						id="desired-dose"
						type="number"
						value={desiredDose}
						oninput={handleDoseInput}
						min={doseUnit === 'mg' ? 0.1 : 1}
						step={doseUnit === 'mg' ? 0.5 : 50}
						inputmode="decimal"
						class="field-input"
					/>
					<div class="unit-seg">
						<button
							type="button"
							class="unit-seg-btn"
							class:unit-seg-active={doseUnit === 'mcg'}
							onclick={() => selectDoseUnit('mcg')}>mcg</button
						>
						<button
							type="button"
							class="unit-seg-btn"
							class:unit-seg-active={doseUnit === 'mg'}
							onclick={() => selectDoseUnit('mg')}>mg</button
						>
					</div>
				</div>
			</div>

			<!-- Syringe Size -->
			<div class="input-group">
				<Label class="text-sm font-medium">Syringe Size</Label>
				<div class="syringe-selector">
					{#each syringeSizes as size}
						<button
							type="button"
							class="syringe-btn {syringeSize === size ? 'active' : ''}"
							onclick={() => selectSyringeSize(size)}
						>
							<span class="text-lg font-semibold">{size}</span>
							<span class="text-xs text-muted-foreground">mL</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Concentration Display -->
			<div class="result-display">
				<div class="result-item">
					<span class="result-label">Concentration</span>
					<span class="result-value">{concentration.toFixed(2)} mg/mL</span>
				</div>
				<div class="result-item">
					<span class="result-label">Doses per vial</span>
					<span class="result-value">{dosesPerVial}</span>
				</div>
			</div>
		</div>

		<!-- Visual Section -->
		<div class="calculator-visual">
			<SyringeVisual {syringeSize} fillAmount={volumeToDraw} />

			{#if isOverCapacity}
				<div class="warning-box">
					<AlertTriangle class="h-4 w-4" />
					<span>Use a larger syringe or reduce dose</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Info Section -->
	{#if !compact}
		<div class="calculator-info">
			<div class="info-box">
				<Info class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
				<div class="text-sm text-muted-foreground">
					<p class="mb-2">
						<strong>How to use:</strong> Enter your vial size and the amount of bacteriostatic water
						you'll add. Then enter your desired dose to see exactly how much to draw.
					</p>
					<p>
						<strong>Tip:</strong> 1 mL = 100 units on an insulin syringe. Draw slowly to ensure accuracy.
					</p>
				</div>
			</div>
		</div>

		<!-- Share Button -->
		<div class="share-section">
			<button class="share-button" onclick={copyShareUrl} type="button">
				{#if copied}
					<Check class="h-4 w-4" />
					<span>Copied!</span>
				{:else}
					<Share2 class="h-4 w-4" />
					<span>Share these settings</span>
				{/if}
			</button>
		</div>
	{/if}

	<div class="calculator-actions">
		<Button variant="outline" size="sm" onclick={reset}>Reset</Button>
	</div>
</div>

<style>
	.calculator {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.calculator-compact {
		gap: 1rem;
	}

	.calculator-header {
		padding-bottom: 0.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.calculator-layout {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 2rem;
		align-items: start;
	}

	@media (max-width: 640px) {
		.calculator-layout {
			grid-template-columns: 1fr;
		}

		.calculator-visual {
			order: -1;
			width: 100%;
			max-width: 280px;
			margin: 0 auto;
		}

		.result-display {
			flex-direction: column;
			gap: 0.75rem;
		}

		.calculator-visual {
			min-height: auto;
			padding: 1rem;
		}

		.calculator-visual :global(.syringe-container) {
			transform: scale(0.85);
			transform-origin: top center;
		}
	}

	.calculator-inputs {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground));
	}

	/* Input-first field: large tappable number with inline suffix */
	.field-box {
		display: flex;
		align-items: center;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
		transition: border-color 0.15s;
		overflow: hidden;
	}

	.field-box:focus-within {
		border-color: hsl(var(--accent));
	}

	.field-input {
		flex: 1;
		padding: 0.75rem 0.875rem;
		font-size: 1.25rem;
		font-weight: 600;
		font-family: var(--font-mono);
		background: transparent;
		color: hsl(var(--foreground));
		border: none;
		outline: none;
		min-width: 0;
		-moz-appearance: textfield;
		appearance: textfield;
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

	/* Segmented unit toggle inside field */
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

	/* Presets — quiet suggestion row below input */
	.presets {
		display: flex;
		gap: 0.25rem;
		padding-top: 0.125rem;
	}

	.preset {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: none;
		border: none;
		padding: 0.125rem 0.375rem;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.1s;
		-webkit-tap-highlight-color: transparent;
	}

	.preset:hover {
		color: hsl(var(--foreground));
		background: hsl(var(--muted) / 0.5);
	}

	.preset-match {
		color: hsl(var(--accent));
	}

	.syringe-selector {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.syringe-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		border: 2px solid hsl(var(--border));
		background: hsl(var(--background));
		transition: all 0.15s ease;
		cursor: pointer;
	}

	.syringe-btn:hover {
		border-color: hsl(var(--muted-foreground));
	}

	.syringe-btn.active {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	.result-display {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.5rem;
	}

	.result-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.result-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.result-value {
		font-size: 1rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.calculator-visual {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 1rem;
		border: 1px solid hsl(var(--border));
		min-height: 450px;
		width: 180px;
	}

	.warning-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.calculator-info {
		padding-top: 0.5rem;
	}

	.info-box {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--border));
	}

	.calculator-actions {
		display: flex;
		justify-content: flex-end;
	}

	.share-section {
		display: flex;
		justify-content: center;
		padding-top: 0.5rem;
	}

	.share-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.share-button:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}
</style>
