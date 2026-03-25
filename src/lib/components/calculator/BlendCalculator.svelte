<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import SyringeVisual from './SyringeVisual.svelte';
	import { AlertTriangle, Info, Plus, X, Share2, Check } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { currentBlend } from '$lib/stores/calculator';

	type SyringeSize = 0.3 | 0.5 | 1;
	type DoseUnit = 'mcg' | 'mg';

	interface BlendComponent {
		name: string;
		amount: number;
		ratio: number;
	}

	interface BlendData {
		id: string;
		name: string;
		totalAmount: number;
		unit: string;
		components: BlendComponent[];
	}

	interface Props {
		presetBlend?: BlendData;
	}

	let { presetBlend }: Props = $props();

	// If a preset blend is provided, use only that blend
	const singleBlendMode = $derived(!!presetBlend);

	// Parse URL params for initial state (short keys: b=blend, w=water, a=anchor, d=dose, u=unit, s=syringe, c=custom)
	function getInitialState() {
		if (!browser) return null;
		const params = new URLSearchParams(window.location.search);
		let customComps: BlendComponent[] | null = null;
		const customParam = params.get('c');
		if (customParam) {
			// Parse pipe-separated "name:amount" format
			const parts = customParam.split('|');
			if (parts.length > 0 && parts[0].includes(':')) {
				customComps = parts.map((part) => {
					const lastColon = part.lastIndexOf(':');
					const name = part.substring(0, lastColon);
					const amount = parseFloat(part.substring(lastColon + 1)) || 0;
					return { name, amount, ratio: 1 };
				});
			}
		}
		return {
			blend: params.get('b') || null,
			water: params.get('w') ? Number(params.get('w')) : null,
			anchor: params.get('a') || null,
			dose: params.get('d') ? Number(params.get('d')) : null,
			unit: params.get('u') as DoseUnit | null,
			syringe: params.get('s') ? (Number(params.get('s')) as SyringeSize) : null,
			custom: customComps
		};
	}

	const initial = getInitialState();

	// Built-in preset blends
	const builtInBlends: BlendData[] = [
		{
			id: 'klow',
			name: 'KLOW',
			totalAmount: 80,
			unit: 'mg',
			components: [
				{ name: 'GHK-Cu', amount: 50, ratio: 5 },
				{ name: 'TB-500', amount: 10, ratio: 1 },
				{ name: 'BPC-157', amount: 10, ratio: 1 },
				{ name: 'KPV', amount: 10, ratio: 1 }
			]
		},
		{
			id: 'glow',
			name: 'GLOW',
			totalAmount: 70,
			unit: 'mg',
			components: [
				{ name: 'GHK-Cu', amount: 50, ratio: 5 },
				{ name: 'TB-500', amount: 10, ratio: 1 },
				{ name: 'BPC-157', amount: 10, ratio: 1 }
			]
		},
		{
			id: 'cjc-ipa',
			name: 'CJC/IPA',
			totalAmount: 4,
			unit: 'mg',
			components: [
				{ name: 'CJC-1295', amount: 2, ratio: 1 },
				{ name: 'Ipamorelin', amount: 2, ratio: 1 }
			]
		},
		{
			id: 'wolverine',
			name: 'Wolverine',
			totalAmount: 20,
			unit: 'mg',
			components: [
				{ name: 'BPC-157', amount: 10, ratio: 1 },
				{ name: 'TB-500', amount: 10, ratio: 1 }
			]
		},
		{
			id: 'tri-heal-max',
			name: 'Tri-Heal Max',
			totalAmount: 45,
			unit: 'mg',
			components: [
				{ name: 'TB-500', amount: 25, ratio: 5 },
				{ name: 'BPC-157', amount: 10, ratio: 2 },
				{ name: 'KPV', amount: 10, ratio: 2 }
			]
		},
		{
			id: 'tesa-ipa',
			name: 'Tesa/IPA',
			totalAmount: 10,
			unit: 'mg',
			components: [
				{ name: 'Tesamorelin', amount: 5, ratio: 1 },
				{ name: 'Ipamorelin', amount: 5, ratio: 1 }
			]
		},
		{
			id: 'illumineuro',
			name: 'IllumiNeuro',
			totalAmount: 48,
			unit: 'mg',
			components: [
				{ name: 'NA-Semax', amount: 20, ratio: 4 },
				{ name: 'PE-22-28', amount: 10, ratio: 2 },
				{ name: 'Pinealon', amount: 10, ratio: 2 },
				{ name: 'NA-Selank', amount: 8, ratio: 1.6 }
			]
		}
	];

	// Combined list of available blends
	const availableBlends = $derived.by(() => {
		if (presetBlend) {
			return [presetBlend];
		}
		return builtInBlends;
	});

	// State
	let selectedBlendId = $state(initial?.blend || presetBlend?.id || 'klow');
	let waterVolume = $state(initial?.water ?? 2);
	let anchorComponentName = $state(
		initial?.anchor || presetBlend?.components[0]?.name || 'BPC-157'
	);
	let desiredAnchorDose = $state(initial?.dose ?? 250);
	let doseUnit = $state<DoseUnit>(initial?.unit ?? 'mcg');
	let syringeSize = $state<SyringeSize>(initial?.syringe ?? 1);
	let userHasEditedDose = $state(initial?.dose !== null);

	// Custom blend state
	let customComponents = $state<BlendComponent[]>(
		initial?.custom || [
			{ name: 'Peptide 1', amount: 10, ratio: 1 },
			{ name: 'Peptide 2', amount: 10, ratio: 1 }
		]
	);

	// Share functionality
	let copied = $state(false);

	function getShareUrl(): string {
		const params = new URLSearchParams();
		if (selectedBlendId !== 'klow') params.set('b', selectedBlendId);
		if (waterVolume !== 2) params.set('w', String(waterVolume));
		if (anchorComponentName !== 'BPC-157') params.set('a', anchorComponentName);
		if (desiredAnchorDose !== 250) params.set('d', String(desiredAnchorDose));
		if (doseUnit !== 'mcg') params.set('u', doseUnit);
		if (syringeSize !== 1) params.set('s', String(syringeSize));
		if (selectedBlendId === 'custom') {
			// Compact custom blend: pipe-separated "name:amount" pairs
			const compact = customComponents.map((c) => `${c.name}:${c.amount}`).join('|');
			params.set('c', compact);
		}
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
		if (!browser || singleBlendMode) return;
		const url = getShareUrl();
		const currentUrl = window.location.origin + window.location.pathname + window.location.search;
		if (url !== currentUrl) {
			window.history.replaceState({}, '', url);
		}
	});

	// Update the store with current blend info for reactive page title
	$effect(() => {
		currentBlend.set({
			id: selectedBlend.id,
			name: selectedBlend.name
		});
	});

	const syringeSizes: SyringeSize[] = [0.3, 0.5, 1];
	const waterPresets = [1, 2, 3, 4, 5];

	// Check if custom blend is selected
	const isCustomBlend = $derived(selectedBlendId === 'custom' && !singleBlendMode);

	// Calculate custom blend total
	const customTotal = $derived(customComponents.reduce((sum, c) => sum + c.amount, 0));

	// Get the active blend (preset or custom)
	const selectedBlend = $derived.by<BlendData>(() => {
		if (isCustomBlend) {
			return {
				id: 'custom',
				name: 'Custom',
				totalAmount: customTotal,
				unit: 'mg',
				components: customComponents.map((c: BlendComponent) => ({ ...c, ratio: 1 }))
			};
		}
		return availableBlends.find((b) => b.id === selectedBlendId) || availableBlends[0];
	});

	// Update anchor component when blend changes
	$effect(() => {
		if (
			selectedBlend &&
			!selectedBlend.components.find((c: BlendComponent) => c.name === anchorComponentName)
		) {
			anchorComponentName = selectedBlend.components[0]?.name || '';
		}
	});

	const anchorComponent = $derived.by(() => {
		return (
			selectedBlend.components.find((c: BlendComponent) => c.name === anchorComponentName) ||
			selectedBlend.components[0]
		);
	});

	// Convert desired dose to mcg
	const desiredDoseInMcg = $derived(
		doseUnit === 'mg' ? desiredAnchorDose * 1000 : desiredAnchorDose
	);

	// Calculate the fraction of total blend that the anchor component represents
	const anchorFraction = $derived(anchorComponent.amount / selectedBlend.totalAmount);

	// Calculate total blend needed to get desired anchor amount
	const totalBlendNeededMcg = $derived(desiredDoseInMcg / anchorFraction);
	const totalBlendNeededMg = $derived(totalBlendNeededMcg / 1000);

	// Calculate what you'll get of each component
	const componentDoses = $derived(
		selectedBlend.components.map((comp: BlendComponent) => ({
			name: comp.name,
			mcg: Math.round((comp.amount / selectedBlend.totalAmount) * totalBlendNeededMcg),
			isAnchor: comp.name === anchorComponentName
		}))
	);

	// Calculate concentration and volume to draw
	const concentration = $derived(selectedBlend.totalAmount / waterVolume); // mg/mL
	const volumeToDraw = $derived(totalBlendNeededMg / concentration); // mL
	const isOverCapacity = $derived(volumeToDraw > syringeSize);
	const dosesPerVial = $derived(
		totalBlendNeededMcg > 0
			? Math.floor((selectedBlend.totalAmount * 1000) / totalBlendNeededMcg)
			: 0
	);

	function selectWaterPreset(volume: number) {
		waterVolume = volume;
	}

	function selectSyringeSize(size: SyringeSize) {
		syringeSize = size;
	}

	function selectDoseUnit(unit: DoseUnit) {
		if (!userHasEditedDose) {
			desiredAnchorDose = unit === 'mg' ? 1 : 250;
		} else {
			// Convert the current value
			if (unit === 'mg' && doseUnit === 'mcg') {
				desiredAnchorDose = desiredAnchorDose / 1000;
			} else if (unit === 'mcg' && doseUnit === 'mg') {
				desiredAnchorDose = desiredAnchorDose * 1000;
			}
		}
		doseUnit = unit;
	}

	function handleDoseInput(e: Event) {
		userHasEditedDose = true;
		desiredAnchorDose = parseFloat((e.target as HTMLInputElement).value) || 0;
	}

	function addComponent() {
		customComponents = [
			...customComponents,
			{ name: `Peptide ${customComponents.length + 1}`, amount: 10, ratio: 1 }
		];
	}

	function removeComponent(index: number) {
		if (customComponents.length > 1) {
			customComponents = customComponents.filter((_, i) => i !== index);
		}
	}

	function updateComponentName(index: number, name: string) {
		customComponents[index].name = name;
	}

	function updateComponentAmount(index: number, amount: number) {
		customComponents[index].amount = amount;
	}

	function reset() {
		selectedBlendId = 'klow';
		waterVolume = 2;
		anchorComponentName = 'BPC-157';
		desiredAnchorDose = 250;
		doseUnit = 'mcg';
		syringeSize = 1;
		userHasEditedDose = false;
		customComponents = [
			{ name: 'Peptide 1', amount: 10, ratio: 1 },
			{ name: 'Peptide 2', amount: 10, ratio: 1 }
		];
	}

	function formatDose(mcg: number): string {
		if (mcg >= 1000) {
			return `${(mcg / 1000).toFixed(2)} mg`;
		}
		return `${mcg} mcg`;
	}
</script>

<div class="calculator">
	<div class="calculator-layout">
		<!-- Input Section -->
		<div class="calculator-inputs">
			<!-- Blend Selection (hidden in single blend mode) -->
			{#if !singleBlendMode}
				<div class="input-group">
					<Label for="blend-select" class="text-sm font-medium">Select Blend</Label>
					<select id="blend-select" bind:value={selectedBlendId} class="blend-select">
						{#each availableBlends as blend}
							<option value={blend.id}>{blend.name}</option>
						{/each}
						<option value="custom">Custom Blend</option>
					</select>
				</div>
			{/if}

			<!-- Custom Blend Editor -->
			{#if isCustomBlend}
				<div class="custom-blend-editor">
					<div class="custom-header">
						<span class="font-medium">Custom Blend Components</span>
						<span class="text-sm text-muted-foreground">Total: {customTotal}mg</span>
					</div>
					<div class="custom-components">
						{#each customComponents as comp, index}
							<div class="custom-component-row">
								<input
									type="text"
									value={comp.name}
									oninput={(e) => updateComponentName(index, (e.target as HTMLInputElement).value)}
									class="component-name-input"
									placeholder="Name"
								/>
								<input
									type="number"
									value={comp.amount}
									oninput={(e) =>
										updateComponentAmount(
											index,
											parseFloat((e.target as HTMLInputElement).value) || 0
										)}
									class="component-amount-input"
									min="0.1"
									step="0.1"
								/>
								<span class="component-unit">mg</span>
								{#if customComponents.length > 1}
									<button type="button" class="remove-btn" onclick={() => removeComponent(index)}>
										<X class="h-4 w-4" />
									</button>
								{/if}
							</div>
						{/each}
					</div>
					<button type="button" class="add-component-btn" onclick={addComponent}>
						<Plus class="h-4 w-4" />
						<span>Add Component</span>
					</button>
				</div>
			{:else}
				<!-- Blend Composition Display -->
				<div class="composition-box">
					<div class="composition-header">
						<span class="font-medium">{selectedBlend.name} Composition</span>
						<span class="text-muted-foreground"
							>({selectedBlend.totalAmount}{selectedBlend.unit} vial)</span
						>
					</div>
					<div class="composition-list">
						{#each selectedBlend.components as comp}
							<div class="composition-item">
								<span class="comp-name">{comp.name}</span>
								<span class="comp-amount">{comp.amount}{selectedBlend.unit}</span>
								<span class="comp-percent"
									>({((comp.amount / selectedBlend.totalAmount) * 100).toFixed(1)}%)</span
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Water Volume -->
			<div class="input-group">
				<label for="blend-water" class="field-label">BAC Water (added to vial)</label>
				<div class="field-box">
					<input
						id="blend-water"
						type="number"
						bind:value={waterVolume}
						min="0.5"
						step="0.5"
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
				<label class="field-label" for="desired-dose-input">Desired Dose</label>
				<div class="dose-anchor-row">
					<div class="field-box dose-field-box">
						<input
							id="desired-dose-input"
							type="number"
							value={desiredAnchorDose}
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
					<span class="anchor-of">of</span>
					<select bind:value={anchorComponentName} class="component-select">
						{#each selectedBlend.components as comp}
							<option value={comp.name}>{comp.name}</option>
						{/each}
					</select>
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

			<!-- Results -->
			<div class="results-section">
				<div class="results-header">Results</div>

				<div class="result-primary">
					<span class="result-label">Total blend to inject</span>
					<span class="result-value">{formatDose(totalBlendNeededMcg)}</span>
				</div>

				<div class="result-breakdown">
					<span class="breakdown-label">You'll get:</span>
					{#each componentDoses as comp}
						<div class="breakdown-item {comp.isAnchor ? 'anchor' : ''}">
							<span class="comp-name">{comp.name}</span>
							<span class="comp-dose">{formatDose(comp.mcg)}</span>
							{#if comp.isAnchor}
								<span class="anchor-badge">anchor</span>
							{/if}
						</div>
					{/each}
				</div>

				<div class="result-row">
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

	<div class="calculator-info">
		<div class="info-box">
			<Info class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
			<div class="text-sm text-muted-foreground">
				<p>
					<strong>How it works:</strong> Select a blend, enter how much water you added, then specify
					the dose you want of any single component. The calculator figures out how much total blend
					to inject and shows what you'll get of each peptide.
				</p>
			</div>
		</div>
	</div>

	<!-- Share Button -->
	{#if !singleBlendMode}
		<div class="share-section">
			<button class="share-button" onclick={copyShareUrl} type="button">
				{#if copied}
					<Check class="h-4 w-4" />
					<span>Copied!</span>
				{:else}
					<Share2 class="h-4 w-4" />
					<span>Share this blend</span>
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
		overflow-x: hidden;
		max-width: 100%;
	}

	.calculator-layout {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 2rem;
		align-items: start;
	}

	@media (max-width: 768px) {
		.calculator-layout {
			grid-template-columns: 1fr;
		}

		.calculator-visual {
			order: -1;
			width: 100%;
			max-width: 280px;
			margin: 0 auto;
		}

		.dose-anchor-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.dose-field-box {
			min-width: 100%;
		}

		.anchor-of {
			display: none;
		}

		.component-select {
			width: 100%;
			min-width: unset;
		}

		.custom-component-row {
			flex-wrap: wrap;
		}

		.component-name-input {
			width: 100%;
			flex: none;
		}

		.component-amount-input {
			flex: 1;
		}

		.result-row {
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

	.blend-select,
	.component-select {
		padding: 0.5rem 2rem 0.5rem 0.75rem;
		font-size: 0.875rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.5rem center;
		background-size: 1rem;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}

	.blend-select {
		width: 100%;
	}

	.component-select {
		min-width: 0;
		flex: 1;
		width: 100%;
	}

	.blend-select:hover,
	.component-select:hover {
		border-color: hsl(var(--muted-foreground));
	}

	.blend-select:focus,
	.component-select:focus {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}

	.anchor-of {
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
	}

	.composition-box {
		padding: 1rem;
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
	}

	.composition-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}

	.composition-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.composition-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}

	.comp-name {
		flex: 1;
	}

	.comp-amount {
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.comp-percent {
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
	}

	/* Custom Blend Editor */
	.custom-blend-editor {
		padding: 1rem;
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
	}

	.custom-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}

	.custom-components {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.custom-component-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.component-name-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
	}

	.component-name-input:focus {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}

	.component-amount-input {
		width: 80px;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		text-align: right;
	}

	.component-amount-input:focus {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}

	.component-unit {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.remove-btn:hover {
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
	}

	.add-component-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px dashed hsl(var(--border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.add-component-btn:hover {
		border-color: hsl(var(--primary));
		color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	/* Input-first field pattern (matches reconstitution calculator) */
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
		border-radius: 0.625rem;
		background: hsl(var(--background));
		transition: border-color 0.15s;
		overflow: hidden;
		max-width: 100%;
	}

	.field-box:focus-within {
		border-color: hsl(var(--accent));
	}

	.field-input {
		flex: 1;
		padding: 0.75rem 0.875rem;
		font-size: 1.125rem;
		font-weight: 600;
		font-family: var(--font-mono);
		background: transparent;
		color: hsl(var(--foreground));
		border: none;
		outline: none;
		min-width: 0;
		width: 100%;
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

	/* Segmented unit toggle */
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

	/* Dose + anchor row */
	.dose-anchor-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.dose-field-box {
		flex: 1 1 100%;
		min-width: 0;
	}

	@media (min-width: 480px) {
		.dose-field-box {
			flex: 1 1 auto;
			min-width: 160px;
		}
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

	.results-section {
		padding: 1rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.results-header {
		font-weight: 600;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
	}

	.result-primary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: hsl(var(--primary) / 0.1);
		border-radius: 0.5rem;
	}

	.result-primary .result-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: hsl(var(--primary));
	}

	.result-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
	}

	.breakdown-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.25rem;
	}

	.breakdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}

	.breakdown-item .comp-name {
		flex: 1;
	}

	.breakdown-item .comp-dose {
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.breakdown-item.anchor {
		color: hsl(var(--primary));
	}

	.anchor-badge {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border-radius: 9999px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.result-row {
		display: flex;
		gap: 1rem;
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
		flex-shrink: 0;
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
