<script lang="ts">
	import { getAllItems } from '$lib/data/unified';
	import type { Peptide } from '$lib/types';
	import {
		calculateAccumulation,
		calculateAccumulationWithTitration,
		DOSE_FREQUENCIES,
		COMPOUND_COLORS,
		formatDuration,
		type DoseFrequency,
		type TitrationPhase,
		type AccumulationResult
	} from '$lib/utils/pharmacokinetics';
	import AccumulationChart from './AccumulationChart.svelte';
	import {
		FlaskConical,
		Clock,
		Activity,
		Info,
		AlertCircle,
		Share2,
		Check,
		Plus,
		X,
		ChevronDown,
		ChevronUp
	} from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { currentCalculatorPeptide } from '$lib/stores/calculator';

	interface Props {
		initialPeptideId?: string;
	}

	let { initialPeptideId }: Props = $props();

	// Get all items (peptides + compounds) with halfLifeSeconds
	const allItems = getAllItems();
	const peptides = allItems.filter((p) => p.molecular?.halfLifeSeconds);

	// Testosterone variants
	interface StaticCompound {
		id: string;
		name: string;
		halfLife: string;
		halfLifeSeconds: number;
	}

	const testosteroneVariants: StaticCompound[] = [
		{
			id: 'test-prop',
			name: 'Testosterone Propionate',
			halfLife: '~1.5 days',
			halfLifeSeconds: 129600
		},
		{
			id: 'test-enan',
			name: 'Testosterone Enanthate',
			halfLife: '~4.5 days',
			halfLifeSeconds: 388800
		},
		{
			id: 'test-cyp',
			name: 'Testosterone Cypionate',
			halfLife: '~8 days',
			halfLifeSeconds: 691200
		},
		{
			id: 'test-undec',
			name: 'Testosterone Undecanoate',
			halfLife: '~21 days',
			halfLifeSeconds: 1814400
		}
	];

	// Compound configuration
	interface CompoundConfig {
		id: string; // unique id for this entry
		compoundId: string; // peptide or testosterone id
		dose: number;
		doseUnit: 'mcg' | 'mg';
		frequency: DoseFrequency;
		customIntervalDays: number;
		manualHalfLife: number | null;
		useManualHalfLife: boolean;
		titration: {
			enabled: boolean;
			phases: TitrationPhase[];
		};
		expanded: boolean; // UI state for collapsing
	}

	function createDefaultCompound(compoundId: string = ''): CompoundConfig {
		return {
			id: crypto.randomUUID(),
			compoundId,
			dose: 100,
			doseUnit: 'mcg',
			frequency: 'daily',
			customIntervalDays: 7,
			manualHalfLife: null,
			useManualHalfLife: false,
			titration: {
				enabled: false,
				phases: [
					{ dose: 0.25, weeks: 4 },
					{ dose: 0.5, weeks: 4 },
					{ dose: 1, weeks: 0 }
				]
			},
			expanded: true
		};
	}

	// Parse URL params for initial state
	function getInitialState(): {
		compounds: CompoundConfig[];
		weeks: number;
		postCycle: boolean;
		postCycleWeeks: number;
	} | null {
		if (!browser) return null;
		const params = new URLSearchParams(window.location.search);

		// Try to parse multi-compound format: c=id:dose:unit:freq:interval[:h=hours][:t=dose>weeks,...]|...
		const compoundsParam = params.get('c');
		if (compoundsParam) {
			const compounds = compoundsParam.split('|').map((c, index) => {
				const parts = c.split(':');
				const [compoundId, dose, unit, freq, interval] = parts;
				const config = createDefaultCompound(compoundId);
				config.dose = Number(dose) || 100;
				config.doseUnit = (unit as 'mcg' | 'mg') || 'mcg';
				config.frequency = (freq as DoseFrequency) || 'daily';
				config.customIntervalDays = Number(interval) || 7;

				// Parse optional suffixes (h= for half-life, t= for titration)
				for (let i = 5; i < parts.length; i++) {
					const part = parts[i];
					if (part.startsWith('h=')) {
						config.manualHalfLife = Number(part.slice(2));
						config.useManualHalfLife = true;
					} else if (part.startsWith('t=')) {
						const phases = part
							.slice(2)
							.split(',')
							.map((p) => {
								const [phaseDose, weeks] = p.split('>');
								return { dose: Number(phaseDose), weeks: Number(weeks) };
							});
						if (phases.length > 0) {
							config.titration.enabled = true;
							config.titration.phases = phases;
						}
					}
				}

				config.expanded = index === 0; // Only first expanded
				return config;
			});

			return {
				compounds,
				weeks: params.get('w') ? Number(params.get('w')) : 12,
				postCycle: params.get('pc') === '1',
				postCycleWeeks: params.get('pw') ? Number(params.get('pw')) : 2
			};
		}

		// Legacy single-compound format
		const peptide = params.get('p');
		if (peptide) {
			const config = createDefaultCompound(peptide);
			config.dose = params.get('d') ? Number(params.get('d')) : 100;
			config.doseUnit = (params.get('u') as 'mcg' | 'mg') || 'mcg';
			config.frequency = (params.get('f') as DoseFrequency) || 'daily';
			config.customIntervalDays = params.get('i') ? Number(params.get('i')) : 7;
			if (params.get('h')) {
				config.manualHalfLife = Number(params.get('h'));
				config.useManualHalfLife = true;
			}

			return {
				compounds: [config],
				weeks: params.get('w') ? Number(params.get('w')) : 4,
				postCycle: params.get('pc') === '1',
				postCycleWeeks: params.get('pw') ? Number(params.get('pw')) : 2
			};
		}

		return null;
	}

	const initial = getInitialState();

	// State
	let compounds = $state<CompoundConfig[]>(
		initial?.compounds ?? [createDefaultCompound(initialPeptideId ?? '')]
	);
	let durationWeeks = $state(initial?.weeks ?? 12);
	let showPostCycle = $state(initial?.postCycle ?? false);
	let postCycleWeeks = $state(initial?.postCycleWeeks ?? 2);

	// Track if user has interacted - don't rewrite URL until they do
	// This prevents Google from seeing ?peptide=X -> ?c=X:100:mcg:daily:7 as a redirect
	let userHasInteracted = $state(false);

	// Share functionality
	let copied = $state(false);

	function getShareUrl(): string {
		const params = new URLSearchParams();

		// Encode compounds: c=id:dose:unit:freq:interval:h=hours:t=dose>weeks,...|...
		const compoundStrings = compounds.map((c) => {
			let str = `${c.compoundId}:${c.dose}:${c.doseUnit}:${c.frequency}:${c.customIntervalDays}`;
			if (c.useManualHalfLife && c.manualHalfLife) {
				str += `:h=${c.manualHalfLife}`;
			}
			if (c.titration.enabled && c.titration.phases.length > 0) {
				const titrationStr = c.titration.phases.map((p) => `${p.dose}>${p.weeks}`).join(',');
				str += `:t=${titrationStr}`;
			}
			return str;
		});
		params.set('c', compoundStrings.join('|'));

		if (durationWeeks !== 12) params.set('w', String(durationWeeks));
		if (showPostCycle) {
			params.set('pc', '1');
			if (postCycleWeeks !== 2) params.set('pw', String(postCycleWeeks));
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

	// Update URL as state changes - but only after user has interacted
	// This prevents Google from seeing the initial URL rewrite as a redirect
	$effect(() => {
		if (!browser || !userHasInteracted) return;
		const url = getShareUrl();
		const currentUrl = window.location.origin + window.location.pathname + window.location.search;
		if (url !== currentUrl) {
			window.history.replaceState({}, '', url);
		}
	});

	// Update the store with current peptide info for reactive page title
	$effect(() => {
		const firstCompound = compounds[0];
		const info = firstCompound ? getCompoundInfo(firstCompound.compoundId) : null;
		currentCalculatorPeptide.set({
			id: firstCompound?.compoundId || null,
			name: info?.name || null
		});
	});

	// Compound management
	function addCompound() {
		userHasInteracted = true;
		// Collapse existing compounds
		compounds = compounds.map((c) => ({ ...c, expanded: false }));
		compounds = [...compounds, createDefaultCompound()];
	}

	function removeCompound(id: string) {
		userHasInteracted = true;
		if (compounds.length > 1) {
			compounds = compounds.filter((c) => c.id !== id);
		}
	}

	function toggleExpanded(id: string) {
		compounds = compounds.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c));
	}

	function updateCompound(id: string, updates: Partial<CompoundConfig>) {
		userHasInteracted = true;
		compounds = compounds.map((c) => (c.id === id ? { ...c, ...updates } : c));
	}

	// Helper to get compound info
	function getCompoundInfo(
		compoundId: string
	): { name: string; halfLife: string; halfLifeSeconds: number } | null {
		const peptide = peptides.find((p) => p.id === compoundId);
		if (peptide?.molecular?.halfLifeSeconds) {
			return {
				name: peptide.name,
				halfLife: peptide.molecular.halfLife ?? 'Unknown',
				halfLifeSeconds: peptide.molecular.halfLifeSeconds
			};
		}
		const testosterone = testosteroneVariants.find((t) => t.id === compoundId);
		if (testosterone) {
			return {
				name: testosterone.name,
				halfLife: testosterone.halfLife,
				halfLifeSeconds: testosterone.halfLifeSeconds
			};
		}
		return null;
	}

	// Calculate results for each compound
	interface CompoundResult {
		config: CompoundConfig;
		result: AccumulationResult | null;
		displayResult: AccumulationResult | null;
		color: string;
		name: string;
		halfLifeDisplay: string | null;
	}

	const compoundResults = $derived.by<CompoundResult[]>(() => {
		const durationSeconds = durationWeeks * 7 * 24 * 3600;
		const postCycleDuration = showPostCycle ? postCycleWeeks * 7 * 24 * 3600 : 0;

		return compounds.map((config, index) => {
			const info = getCompoundInfo(config.compoundId);
			const halfLifeSeconds =
				config.useManualHalfLife && config.manualHalfLife
					? config.manualHalfLife * 3600
					: (info?.halfLifeSeconds ?? null);

			if (!halfLifeSeconds || config.dose <= 0) {
				return {
					config,
					result: null,
					displayResult: null,
					color: COMPOUND_COLORS[index % COMPOUND_COLORS.length],
					name: info?.name ?? 'Unknown',
					halfLifeDisplay: null
				};
			}

			const intervalSeconds =
				config.frequency === 'custom'
					? config.customIntervalDays * 24 * 3600
					: (DOSE_FREQUENCIES.find((f) => f.value === config.frequency)?.intervalSeconds ??
						24 * 3600);

			// Normalize dose to mcg
			const normalizedDose = config.doseUnit === 'mg' ? config.dose * 1000 : config.dose;

			let result: AccumulationResult;
			if (config.titration.enabled && config.titration.phases.length > 0) {
				// Convert titration phases to normalized doses
				const normalizedPhases = config.titration.phases.map((p) => ({
					dose: config.doseUnit === 'mg' ? p.dose * 1000 : p.dose,
					weeks: p.weeks
				}));
				result = calculateAccumulationWithTitration(
					normalizedPhases,
					halfLifeSeconds,
					intervalSeconds,
					durationSeconds,
					20,
					postCycleDuration
				);
			} else {
				result = calculateAccumulation(
					normalizedDose,
					halfLifeSeconds,
					intervalSeconds,
					durationSeconds,
					20,
					postCycleDuration
				);
			}

			// Convert for display if using mg
			const displayResult =
				config.doseUnit === 'mcg'
					? result
					: {
							...result,
							points: result.points.map((p) => ({ ...p, concentration: p.concentration / 1000 })),
							peakConcentration: result.peakConcentration / 1000,
							troughConcentration: result.troughConcentration / 1000,
							steadyStatePeak: result.steadyStatePeak / 1000,
							steadyStateTrough: result.steadyStateTrough / 1000
						};

			return {
				config,
				result,
				displayResult,
				color: COMPOUND_COLORS[index % COMPOUND_COLORS.length],
				name: info?.name ?? 'Custom',
				halfLifeDisplay: halfLifeSeconds ? formatDuration(halfLifeSeconds) : null
			};
		});
	});

	// Dosing duration only (not including post-cycle) - used by chart to know where "Last dose" is
	const durationSeconds = $derived(durationWeeks * 7 * 24 * 3600);
	const hasValidResults = $derived(compoundResults.some((r) => r.result !== null));
	const isMultiCompound = $derived(compoundResults.filter((r) => r.result).length > 1);

	// Determine chart unit: use majority unit, default to mcg if tied
	const chartUnit = $derived.by(() => {
		const validResults = compoundResults.filter((r) => r.result);
		if (validResults.length <= 1) {
			return validResults[0]?.config.doseUnit ?? 'mcg';
		}
		const mgCount = validResults.filter((r) => r.config.doseUnit === 'mg').length;
		const mcgCount = validResults.length - mgCount;
		return mgCount > mcgCount ? 'mg' : 'mcg';
	});

	// Titration phase management
	function addTitrationPhase(compoundId: string) {
		userHasInteracted = true;
		compounds = compounds.map((c) => {
			if (c.id === compoundId) {
				const newPhases = [...c.titration.phases];
				// Insert before the last phase (which has weeks: 0)
				const lastPhase = newPhases.pop();
				const prevDose = newPhases[newPhases.length - 1]?.dose ?? 0.25;
				newPhases.push({ dose: prevDose * 2, weeks: 4 });
				if (lastPhase) newPhases.push(lastPhase);
				return { ...c, titration: { ...c.titration, phases: newPhases } };
			}
			return c;
		});
	}

	function removeTitrationPhase(compoundId: string, phaseIndex: number) {
		userHasInteracted = true;
		compounds = compounds.map((c) => {
			if (c.id === compoundId && c.titration.phases.length > 2) {
				const newPhases = c.titration.phases.filter((_, i) => i !== phaseIndex);
				return { ...c, titration: { ...c.titration, phases: newPhases } };
			}
			return c;
		});
	}

	function updateTitrationPhase(
		compoundId: string,
		phaseIndex: number,
		updates: Partial<TitrationPhase>
	) {
		userHasInteracted = true;
		compounds = compounds.map((c) => {
			if (c.id === compoundId) {
				const newPhases = c.titration.phases.map((p, i) =>
					i === phaseIndex ? { ...p, ...updates } : p
				);
				return { ...c, titration: { ...c.titration, phases: newPhases } };
			}
			return c;
		});
	}
</script>

<div class="plotter">
	<!-- Compound Cards -->
	<div class="compounds-section">
		{#each compounds as compound, index (compound.id)}
			{@const result = compoundResults[index]}
			<div class="compound-card" style="--compound-color: {result.color}">
				<div class="compound-header-wrapper">
					<button class="compound-header" type="button" onclick={() => toggleExpanded(compound.id)}>
						<div class="compound-color-dot"></div>
						<span class="compound-name">
							{result.name || 'Select compound'}
							{#if compound.titration.enabled}
								<span class="titration-badge">Titration</span>
							{/if}
						</span>
						<span class="compound-summary">
							{compound.dose}
							{compound.doseUnit} · {DOSE_FREQUENCIES.find((f) => f.value === compound.frequency)
								?.label ?? compound.frequency}
						</span>
						<span class="expand-btn">
							{#if compound.expanded}
								<ChevronUp class="h-4 w-4" />
							{:else}
								<ChevronDown class="h-4 w-4" />
							{/if}
						</span>
					</button>
					{#if compounds.length > 1}
						<button class="remove-btn" onclick={() => removeCompound(compound.id)} type="button">
							<X class="h-4 w-4" />
						</button>
					{/if}
				</div>

				{#if compound.expanded}
					<div class="compound-body">
						<!-- Compound Selection -->
						<div class="form-row">
							<div class="form-group flex-2">
								<label for="compound-{compound.id}">Compound</label>
								<select
									id="compound-{compound.id}"
									value={compound.compoundId}
									onchange={(e) =>
										updateCompound(compound.id, {
											compoundId: (e.target as HTMLSelectElement).value
										})}
								>
									<option value="">Select...</option>
									<optgroup label="Peptides">
										{#each peptides as peptide}
											<option value={peptide.id}>{peptide.name}</option>
										{/each}
									</optgroup>
									<optgroup label="Testosterone">
										{#each testosteroneVariants as t}
											<option value={t.id}>{t.name}</option>
										{/each}
									</optgroup>
								</select>
							</div>
							{#if result.halfLifeDisplay}
								<div class="half-life-badge">
									<Clock class="h-3 w-3" />
									<span>t½: {result.halfLifeDisplay}</span>
								</div>
							{/if}
						</div>

						<!-- Custom Half-Life -->
						{#if !compound.compoundId}
							<div class="form-row">
								<div class="form-group">
									<label for="halflife-{compound.id}">Half-life (hours)</label>
									<input
										id="halflife-{compound.id}"
										type="number"
										value={compound.manualHalfLife ?? ''}
										oninput={(e) =>
											updateCompound(compound.id, {
												manualHalfLife: Number((e.target as HTMLInputElement).value) || null,
												useManualHalfLife: true
											})}
										placeholder="e.g. 24"
										min="0.1"
										step="0.1"
									/>
								</div>
							</div>
						{:else}
							<label class="toggle-label">
								<input
									type="checkbox"
									checked={compound.useManualHalfLife}
									onchange={(e) =>
										updateCompound(compound.id, {
											useManualHalfLife: (e.target as HTMLInputElement).checked
										})}
								/>
								<span>Override half-life</span>
							</label>
							{#if compound.useManualHalfLife}
								<div class="form-row">
									<div class="form-group">
										<label for="custom-halflife-{compound.id}">Custom half-life (hours)</label>
										<input
											id="custom-halflife-{compound.id}"
											type="number"
											value={compound.manualHalfLife ?? ''}
											oninput={(e) =>
												updateCompound(compound.id, {
													manualHalfLife: Number((e.target as HTMLInputElement).value) || null
												})}
											placeholder="e.g. 24"
											min="0.1"
											step="0.1"
										/>
									</div>
								</div>
							{/if}
						{/if}

						<!-- Dose & Frequency -->
						<div class="form-row">
							<div class="form-group">
								<label for="dose-{compound.id}">Dose</label>
								<div class="dose-input-group">
									<input
										id="dose-{compound.id}"
										type="number"
										value={compound.dose}
										oninput={(e) => {
											const val = (e.target as HTMLInputElement).value;
											if (val !== '') {
												updateCompound(compound.id, { dose: Number(val) || 0 });
											}
										}}
										min="0.1"
										step="0.1"
									/>
									<div class="unit-toggle">
										<button
											class:active={compound.doseUnit === 'mcg'}
											onclick={() => updateCompound(compound.id, { doseUnit: 'mcg' })}
											type="button">mcg</button
										>
										<button
											class:active={compound.doseUnit === 'mg'}
											onclick={() => updateCompound(compound.id, { doseUnit: 'mg' })}
											type="button">mg</button
										>
									</div>
								</div>
							</div>
							<div class="form-group">
								<label for="frequency-{compound.id}">Frequency</label>
								<select
									id="frequency-{compound.id}"
									value={compound.frequency}
									onchange={(e) =>
										updateCompound(compound.id, {
											frequency: (e.target as HTMLSelectElement).value as DoseFrequency
										})}
								>
									{#each DOSE_FREQUENCIES as freq}
										<option value={freq.value}>{freq.label}</option>
									{/each}
								</select>
							</div>
						</div>

						{#if compound.frequency === 'custom'}
							<div class="form-row">
								<div class="form-group">
									<label for="interval-{compound.id}">Custom Interval</label>
									<div class="custom-interval">
										<span>Every</span>
										<input
											id="interval-{compound.id}"
											type="number"
											value={compound.customIntervalDays}
											oninput={(e) =>
												updateCompound(compound.id, {
													customIntervalDays: Number((e.target as HTMLInputElement).value) || 1
												})}
											min="0.5"
											step="0.5"
										/>
										<span>days</span>
									</div>
								</div>
							</div>
						{/if}

						<!-- Titration Toggle -->
						<div class="titration-section">
							<label class="toggle-label">
								<input
									type="checkbox"
									checked={compound.titration.enabled}
									onchange={(e) =>
										updateCompound(compound.id, {
											titration: {
												...compound.titration,
												enabled: (e.target as HTMLInputElement).checked
											}
										})}
								/>
								<span>Dose titration</span>
							</label>

							{#if compound.titration.enabled}
								<div class="titration-phases">
									{#each compound.titration.phases as phase, phaseIndex}
										<div class="titration-phase">
											<input
												type="number"
												value={phase.dose}
												oninput={(e) =>
													updateTitrationPhase(compound.id, phaseIndex, {
														dose: Number((e.target as HTMLInputElement).value) || 0
													})}
												min="0.01"
												step="0.01"
												class="phase-dose"
											/>
											<span class="phase-unit">{compound.doseUnit}</span>
											<span class="phase-for">for</span>
											{#if phase.weeks === 0}
												<span class="phase-rest">remainder</span>
											{:else}
												<input
													type="number"
													value={phase.weeks}
													oninput={(e) =>
														updateTitrationPhase(compound.id, phaseIndex, {
															weeks: Number((e.target as HTMLInputElement).value) || 1
														})}
													min="1"
													step="1"
													class="phase-weeks"
												/>
												<span class="phase-weeks-label">weeks</span>
											{/if}
											{#if compound.titration.phases.length > 2 && phaseIndex < compound.titration.phases.length - 1}
												<button
													class="phase-remove"
													onclick={() => removeTitrationPhase(compound.id, phaseIndex)}
													type="button"
												>
													<X class="h-3 w-3" />
												</button>
											{/if}
										</div>
									{/each}
									<button
										class="add-phase-btn"
										onclick={() => addTitrationPhase(compound.id)}
										type="button"
									>
										<Plus class="h-3 w-3" />
										<span>Add phase</span>
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/each}

		<button class="add-compound-btn" onclick={addCompound} type="button">
			<Plus class="h-4 w-4" />
			<span>Add Compound</span>
		</button>
	</div>

	<!-- Global Settings -->
	<div class="global-settings">
		<div class="form-group">
			<label for="duration-slider">Duration: <strong>{durationWeeks} weeks</strong></label>
			<input
				id="duration-slider"
				type="range"
				bind:value={durationWeeks}
				oninput={() => (userHasInteracted = true)}
				min="1"
				max="52"
				step="1"
			/>
			<div class="slider-labels">
				<span>1 week</span>
				<span>52 weeks</span>
			</div>
		</div>

		<label class="toggle-label">
			<input
				type="checkbox"
				bind:checked={showPostCycle}
				onchange={() => (userHasInteracted = true)}
			/>
			<span>Show post-cycle taper</span>
		</label>

		{#if showPostCycle}
			<div class="form-group">
				<label for="taper-slider">Taper: <strong>{postCycleWeeks} weeks</strong></label>
				<input
					id="taper-slider"
					type="range"
					bind:value={postCycleWeeks}
					oninput={() => (userHasInteracted = true)}
					min="1"
					max="12"
					step="1"
				/>
			</div>
		{/if}
	</div>

	<!-- Chart Section -->
	{#if hasValidResults}
		<div class="chart-section">
			<AccumulationChart
				data={compoundResults
					.filter((r) => r.result)
					.map((r) => {
						const result = r.result!;
						// Convert from mcg (internal) to chart unit
						const divisor = chartUnit === 'mg' ? 1000 : 1;
						return {
							...result,
							points: result.points.map((p) => ({
								...p,
								concentration: p.concentration / divisor
							})),
							peakConcentration: result.peakConcentration / divisor,
							troughConcentration: result.troughConcentration / divisor,
							steadyStatePeak: result.steadyStatePeak / divisor,
							steadyStateTrough: result.steadyStateTrough / divisor,
							color: r.color,
							name: r.name
						};
					})}
				{durationSeconds}
				doseUnit={chartUnit}
			/>
		</div>

		<!-- Legend -->
		<div class="chart-legend">
			{#each compoundResults.filter((r) => r.result) as result}
				<div class="legend-item" style="--legend-color: {result.color}">
					<div class="legend-color" style="background: {result.color}"></div>
					<span class="legend-name">{result.name}</span>
					<div class="legend-stats">
						<span class="stat">
							<span class="stat-label">Peak</span>
							<span class="stat-value"
								>{result.displayResult?.peakConcentration.toFixed(1)} {result.config.doseUnit}</span
							>
						</span>
						<span class="stat">
							<span class="stat-label">Trough</span>
							<span class="stat-value"
								>{result.displayResult?.steadyStateTrough.toFixed(1)} {result.config.doseUnit}</span
							>
						</span>
						<span class="stat">
							<span class="stat-label">Steady state</span>
							<span class="stat-value">{formatDuration(result.result?.timeToSteadyState ?? 0)}</span
							>
						</span>
					</div>
				</div>
			{/each}
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

		<!-- Explanation -->
		<div class="explanation">
			<Info class="h-4 w-4" />
			<p>
				This model uses one-compartment pharmacokinetics to estimate relative concentration over
				time. Actual concentrations depend on bioavailability, distribution volume, and individual
				metabolism.
			</p>
		</div>
	{:else}
		<div class="no-data">
			<AlertCircle class="h-8 w-8" />
			<p>Select at least one compound with a valid dose to generate the chart.</p>
		</div>
	{/if}
</div>

<style>
	.plotter {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Compound Cards */
	.compounds-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.compound-card {
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		overflow: hidden;
		border-left: 3px solid var(--compound-color);
	}

	.compound-header-wrapper {
		display: flex;
		align-items: center;
	}

	.compound-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		cursor: pointer;
		transition: background 0.15s ease;
		flex: 1;
		background: none;
		border: none;
		text-align: left;
		font: inherit;
		color: inherit;
	}

	.compound-header:hover {
		background: hsl(var(--muted) / 0.3);
	}

	.compound-color-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--compound-color);
		flex-shrink: 0;
	}

	.compound-name {
		font-weight: 600;
		font-size: 0.9375rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.titration-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.375rem;
		background: hsl(var(--accent) / 0.15);
		color: hsl(var(--accent));
		border-radius: 0.25rem;
	}

	.compound-summary {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-left: auto;
	}

	.expand-btn,
	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		border-radius: 0.375rem;
		cursor: pointer;
		flex-shrink: 0;
	}

	.expand-btn:hover,
	.remove-btn:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.remove-btn:hover {
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
	}

	.compound-body {
		padding: 1rem;
		border-top: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.2);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		flex: 1;
	}

	.form-group.flex-2 {
		flex: 2;
	}

	.form-group label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground));
	}

	.form-group select,
	.form-group input[type='number'] {
		padding: 0.75rem 0.875rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 1rem;
		font-family: var(--font-mono);
		font-weight: 600;
		-moz-appearance: textfield;
		appearance: textfield;
		-webkit-tap-highlight-color: transparent;
	}

	.form-group input[type='number']::-webkit-outer-spin-button,
	.form-group input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	.form-group select {
		font-family: var(--font-sans);
		font-weight: 500;
		font-size: 0.875rem;
	}

	.form-group select:focus,
	.form-group input:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.half-life-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: hsl(var(--muted));
		border-radius: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	.dose-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.dose-input-group input {
		flex: 1;
		min-width: 0;
	}

	.unit-toggle {
		display: flex;
		background: hsl(var(--muted));
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.unit-toggle button {
		padding: 0.625rem 0.75rem;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.unit-toggle button.active {
		background: hsl(var(--accent));
		color: white;
	}

	.custom-interval {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.custom-interval input {
		width: 70px;
		text-align: center;
	}

	.custom-interval span {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	/* Titration */
	.titration-section {
		padding-top: 0.5rem;
		border-top: 1px dashed hsl(var(--border));
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.toggle-label input[type='checkbox'] {
		width: 16px;
		height: 16px;
		accent-color: hsl(var(--accent));
	}

	.titration-phases {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.5rem;
	}

	.titration-phase {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.phase-dose {
		width: 70px;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: hsl(var(--background));
		font-size: 0.875rem;
		text-align: right;
	}

	.phase-unit,
	.phase-for,
	.phase-weeks-label,
	.phase-rest {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.phase-weeks {
		width: 50px;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: hsl(var(--background));
		font-size: 0.875rem;
		text-align: center;
	}

	.phase-rest {
		font-style: italic;
	}

	.phase-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: none;
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
		border-radius: 0.25rem;
		cursor: pointer;
		margin-left: auto;
	}

	.add-phase-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.375rem;
		border: 1px dashed hsl(var(--border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
	}

	.add-phase-btn:hover {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
	}

	.add-compound-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem;
		border: 2px dashed hsl(var(--border));
		border-radius: 0.75rem;
		background: transparent;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.add-compound-btn:hover {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.05);
	}

	/* Global Settings */
	.global-settings {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.75rem;
	}

	.global-settings .form-group label {
		font-size: 0.875rem;
		color: hsl(var(--foreground));
	}

	input[type='range'] {
		width: 100%;
		height: 6px;
		background: hsl(var(--muted));
		border-radius: 3px;
		appearance: none;
		cursor: pointer;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		background: hsl(var(--accent));
		border-radius: 50%;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	/* Chart Section */
	.chart-section {
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		padding: 1rem;
	}

	/* Legend */
	.chart-legend {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.5rem;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.legend-name {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.legend-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-left: auto;
	}

	.stat {
		display: flex;
		gap: 0.25rem;
	}

	.stat-label {
		opacity: 0.7;
	}

	.stat-label::after {
		content: ':';
	}

	.stat-value {
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	/* Share section */
	.share-section {
		display: flex;
		justify-content: center;
	}

	.share-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.share-button:hover {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
		color: white;
	}

	/* Explanation */
	.explanation {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.5rem;
	}

	.explanation :global(svg) {
		flex-shrink: 0;
		color: hsl(var(--muted-foreground));
	}

	.explanation p {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
	}

	/* No data state */
	.no-data {
		text-align: center;
		padding: 3rem;
		color: hsl(var(--muted-foreground));
	}

	.no-data :global(svg) {
		margin: 0 auto 1rem;
		opacity: 0.5;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.plotter {
			gap: 1rem;
		}

		.compound-card {
			border-radius: 0.5rem;
		}

		.compound-header {
			padding: 0.75rem;
			gap: 0.5rem;
			flex-wrap: wrap;
		}

		.compound-color-dot {
			width: 8px;
			height: 8px;
		}

		.compound-name {
			font-size: 0.875rem;
			flex: 1;
			min-width: 0;
		}

		.titration-badge {
			order: 3;
			width: 100%;
			text-align: center;
			margin-top: 0.25rem;
		}

		.compound-summary {
			display: none;
		}

		/* Larger touch targets on mobile */
		.expand-btn,
		.remove-btn {
			width: 40px;
			height: 40px;
		}

		.compound-body {
			padding: 1rem;
			gap: 1rem;
		}

		.form-row {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.form-group {
			flex: none !important;
			width: 100%;
		}

		.form-group.flex-2 {
			flex: none !important;
		}

		.form-group select,
		.form-group input[type='number'] {
			width: 100%;
			padding: 0.875rem;
			font-size: 1rem; /* Prevents iOS zoom */
			border-radius: 0.625rem;
			box-sizing: border-box;
		}

		.half-life-badge {
			width: auto;
			align-self: flex-start;
		}

		/* Dose input group on mobile */
		.dose-input-group {
			display: flex;
			flex-direction: row;
			gap: 0.5rem;
			width: 100%;
		}

		.dose-input-group input {
			flex: 1;
			min-width: 0;
			width: auto;
		}

		.unit-toggle {
			flex-shrink: 0;
		}

		.unit-toggle button {
			padding: 0.875rem 0.875rem;
			font-size: 0.875rem;
		}

		/* Titration phases mobile */
		.titration-phases {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.titration-phase {
			background: hsl(var(--background));
			padding: 0.75rem;
			border-radius: 0.5rem;
			gap: 0.5rem;
			flex-wrap: nowrap;
		}

		.phase-dose {
			width: 70px;
			font-size: 1rem;
			padding: 0.625rem 0.5rem;
		}

		.phase-weeks {
			width: 50px;
			padding: 0.625rem 0.5rem;
			font-size: 1rem;
		}

		.phase-unit,
		.phase-for,
		.phase-weeks-label {
			font-size: 0.75rem;
		}

		.phase-remove {
			width: 32px;
			height: 32px;
		}

		.add-phase-btn {
			padding: 0.875rem;
			font-size: 0.875rem;
		}

		/* Global settings mobile */
		.global-settings {
			padding: 1rem;
			gap: 1rem;
		}

		.global-settings .form-group label {
			font-size: 0.9375rem;
		}

		input[type='range'] {
			height: 8px;
		}

		input[type='range']::-webkit-slider-thumb {
			width: 28px;
			height: 28px;
		}

		/* Chart section mobile */
		.chart-section {
			padding: 0.5rem;
			border-radius: 0.5rem;
			margin: 0 -0.5rem;
			border-left: none;
			border-right: none;
			border-radius: 0;
		}

		/* Legend mobile - stacked stats */
		.chart-legend {
			gap: 0.75rem;
		}

		.legend-item {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
			padding: 0.875rem;
		}

		.legend-color {
			display: none;
		}

		.legend-name {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			font-size: 0.9375rem;
		}

		.legend-name::before {
			content: '';
			width: 12px;
			height: 12px;
			border-radius: 3px;
			background: var(--legend-color, hsl(var(--accent)));
			flex-shrink: 0;
		}

		.legend-stats {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 0.5rem;
			font-size: 0.75rem;
			line-height: 1.4;
			margin-left: 0;
			padding-top: 0.5rem;
			border-top: 1px solid hsl(var(--border));
		}

		.stat {
			flex-direction: column;
			gap: 0.125rem;
			text-align: center;
			padding: 0.375rem;
			background: hsl(var(--muted) / 0.5);
			border-radius: 0.375rem;
		}

		.stat-label {
			font-size: 0.625rem;
			text-transform: uppercase;
			letter-spacing: 0.025em;
		}

		.stat-label::after {
			content: none;
		}

		.stat-value {
			font-size: 0.8125rem;
		}

		/* Share button mobile */
		.share-button {
			width: 100%;
			justify-content: center;
			padding: 1rem;
			font-size: 0.9375rem;
		}

		/* Explanation mobile */
		.explanation {
			padding: 0.875rem;
			gap: 0.625rem;
		}

		.explanation p {
			font-size: 0.75rem;
		}

		/* Add compound button mobile */
		.add-compound-btn {
			padding: 1rem;
			font-size: 0.9375rem;
		}

		/* No data state mobile */
		.no-data {
			padding: 2rem 1rem;
		}

		/* Toggle label touch-friendly */
		.toggle-label {
			padding: 0.5rem 0;
		}

		.toggle-label input[type='checkbox'] {
			width: 20px;
			height: 20px;
		}
	}

	/* Extra small screens */
	@media (max-width: 380px) {
		.compound-name {
			font-size: 0.8125rem;
		}

		.legend-stats {
			grid-template-columns: 1fr 1fr;
		}

		.stat:nth-child(3) {
			grid-column: 1 / -1;
		}

		.unit-toggle button {
			padding: 0.75rem 0.625rem;
			font-size: 0.8125rem;
		}

		.phase-dose {
			width: 60px;
		}

		.phase-weeks {
			width: 45px;
		}
	}
</style>
