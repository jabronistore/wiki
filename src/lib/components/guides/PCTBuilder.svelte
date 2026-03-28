<script lang="ts">
	interface Props {
		title?: string;
	}

	let { title = 'PCT Protocol Builder' }: Props = $props();

	// --- Types ---

	type CompoundKey =
		| 'test-short'
		| 'test-long'
		| 'nandrolone'
		| 'trenbolone'
		| 'sarms'
		| 'oral';

	type CycleDuration = '8' | '12' | '16' | '20+';

	interface CompoundOption {
		key: CompoundKey;
		label: string;
		detail: string;
		clearanceDays: number;
	}

	interface TimelinePhase {
		label: string;
		description: string;
		duration: string;
		compounds: { name: string; dose: string; href?: string }[];
		type: 'clearance' | 'bridge' | 'pct';
	}

	// --- Built-in data ---

	const compoundOptions: CompoundOption[] = [
		{
			key: 'test-short',
			label: 'Testosterone (short ester)',
			detail: 'Propionate, Suspension',
			clearanceDays: 3
		},
		{
			key: 'test-long',
			label: 'Testosterone (long ester)',
			detail: 'Enanthate, Cypionate, Sustanon',
			clearanceDays: 14
		},
		{
			key: 'nandrolone',
			label: 'Nandrolone',
			detail: 'Deca, NPP',
			clearanceDays: 21
		},
		{
			key: 'trenbolone',
			label: 'Trenbolone',
			detail: 'Acetate, Enanthate',
			clearanceDays: 21
		},
		{
			key: 'sarms',
			label: 'SARMs only',
			detail: 'Ostarine, LGD-4033, RAD-140, etc.',
			clearanceDays: 0
		},
		{
			key: 'oral',
			label: 'Oral only',
			detail: 'Anavar, Turinabol, Dianabol, etc.',
			clearanceDays: 1
		}
	];

	const durationOptions: { value: CycleDuration; label: string }[] = [
		{ value: '8', label: '8 weeks' },
		{ value: '12', label: '12 weeks' },
		{ value: '16', label: '16 weeks' },
		{ value: '20+', label: '20+ weeks' }
	];

	// --- State ---

	let selectedCompounds: CompoundKey[] = $state([]);
	let cycleDuration: CycleDuration | null = $state(null);
	let fertilityPreserve: boolean | null = $state(null);
	let showResult = $state(false);

	// --- Derived ---

	const currentStep = $derived.by(() => {
		if (selectedCompounds.length === 0) return 1;
		if (cycleDuration === null) return 2;
		if (fertilityPreserve === null) return 3;
		return 4;
	});

	const stepsComplete = $derived(currentStep > 3);

	const progressPercent = $derived(((Math.min(currentStep, 4) - 1) / 3) * 100);

	const maxClearanceDays = $derived.by(() => {
		if (selectedCompounds.length === 0) return 0;
		return Math.max(
			...selectedCompounds.map((key) => {
				const opt = compoundOptions.find((o) => o.key === key);
				return opt ? opt.clearanceDays : 0;
			})
		);
	});

	const durationWeeks = $derived.by(() => {
		if (!cycleDuration) return 0;
		if (cycleDuration === '20+') return 20;
		return parseInt(cycleDuration);
	});

	const isLongCycle = $derived(durationWeeks > 12);
	const isVeryLongCycle = $derived(durationWeeks >= 20);

	const pctWeeks = $derived.by(() => {
		if (isVeryLongCycle) return 6;
		if (isLongCycle) return 6;
		return 4;
	});

	const suppressionLevel = $derived.by(() => {
		const hasNand = selectedCompounds.includes('nandrolone');
		const hasTren = selectedCompounds.includes('trenbolone');
		if ((hasNand || hasTren) && isLongCycle) return 'severe';
		if (hasNand || hasTren || isVeryLongCycle) return 'heavy';
		if (selectedCompounds.includes('sarms') && selectedCompounds.length === 1) return 'mild';
		if (selectedCompounds.includes('oral') && selectedCompounds.length === 1) return 'moderate';
		return 'moderate';
	});

	const timeline = $derived.by((): TimelinePhase[] => {
		if (!stepsComplete) return [];

		const phases: TimelinePhase[] = [];

		// Phase 1: Clearance period (if needed)
		if (maxClearanceDays > 0) {
			const clearanceLabel =
				maxClearanceDays === 1
					? '1 day'
					: maxClearanceDays < 7
						? `${maxClearanceDays} days`
						: `${Math.round(maxClearanceDays / 7)} weeks`;

			phases.push({
				label: 'Clearance',
				description: `Wait for compounds to clear before starting PCT. Based on the longest ester in your cycle.`,
				duration: clearanceLabel,
				compounds: [],
				type: 'clearance'
			});
		}

		// Phase 2: HCG bridge (for long cycles or fertility)
		if (isLongCycle || fertilityPreserve) {
			const hcgDuration = fertilityPreserve ? '2-3 weeks' : '2 weeks';
			const hcgDose = fertilityPreserve ? '500 IU EOD' : '500 IU EOD';

			phases.push({
				label: 'HCG Bridge',
				description: fertilityPreserve
					? 'Restart testicular function and support fertility recovery before PCT begins.'
					: 'Restart testicular function before starting SERMs. Critical for longer cycles.',
				duration: hcgDuration,
				compounds: [
					{
						name: 'HCG',
						dose: hcgDose,
						href: '/peptides/hcg'
					}
				],
				type: 'bridge'
			});
		}

		// Phase 3: PCT proper
		const pctCompounds: { name: string; dose: string; href?: string }[] = [];

		// Primary SERM
		if (suppressionLevel === 'severe' || suppressionLevel === 'heavy') {
			pctCompounds.push({
				name: 'Enclomiphene',
				dose: `25 mg/day (${pctWeeks} weeks)`
			});
			pctCompounds.push({
				name: 'Tamoxifen (alternative)',
				dose: `20 mg/day (${pctWeeks} weeks)`
			});
		} else if (suppressionLevel === 'mild') {
			pctCompounds.push({
				name: 'Enclomiphene',
				dose: `12.5-25 mg/day (4 weeks)`
			});
			pctCompounds.push({
				name: 'Tamoxifen (alternative)',
				dose: `10-20 mg/day (4 weeks)`
			});
		} else {
			pctCompounds.push({
				name: 'Enclomiphene',
				dose: `25 mg/day (${pctWeeks} weeks)`
			});
			pctCompounds.push({
				name: 'Tamoxifen (alternative)',
				dose: `20 mg/day (${pctWeeks} weeks)`
			});
		}

		// Gonadorelin support for heavy/severe suppression
		if (suppressionLevel === 'severe' || suppressionLevel === 'heavy') {
			pctCompounds.push({
				name: 'Gonadorelin (optional)',
				dose: '100 mcg 2x/day',
				href: '/peptides/gonadorelin'
			});
		}

		// Kisspeptin for fertility recovery
		if (fertilityPreserve) {
			pctCompounds.push({
				name: 'Kisspeptin-10 (optional)',
				dose: '100-200 mcg/day',
				href: '/peptides/kisspeptin'
			});
		}

		phases.push({
			label: 'PCT',
			description: getPctDescription(),
			duration: `${pctWeeks} weeks`,
			compounds: pctCompounds,
			type: 'pct'
		});

		return phases;
	});

	// --- Functions ---

	function toggleCompound(key: CompoundKey) {
		if (selectedCompounds.includes(key)) {
			selectedCompounds = selectedCompounds.filter((k) => k !== key);
		} else {
			selectedCompounds = [...selectedCompounds, key];
		}
		// Reset downstream selections when changing compounds
		showResult = false;
	}

	function selectDuration(value: CycleDuration) {
		cycleDuration = value;
		showResult = false;
	}

	function selectFertility(value: boolean) {
		fertilityPreserve = value;
		showResult = true;
	}

	function getPctDescription(): string {
		if (suppressionLevel === 'severe') {
			return 'Aggressive PCT for heavily suppressive compounds and long duration. Consider bloodwork at 4 weeks to assess recovery.';
		}
		if (suppressionLevel === 'heavy') {
			return 'Extended PCT recommended due to deeply suppressive compounds. Monitor LH, FSH, and testosterone levels.';
		}
		if (suppressionLevel === 'mild') {
			return 'Light PCT should be sufficient for SARM-level suppression. Bloodwork still recommended to confirm recovery.';
		}
		return 'Standard PCT protocol. Get bloodwork 4-6 weeks after completing PCT to verify recovery.';
	}

	function getClearanceNote(): string {
		if (maxClearanceDays >= 21) {
			return 'Nandrolone and Trenbolone have very long-acting metabolites. Starting PCT too early is ineffective because the androgens are still active.';
		}
		if (maxClearanceDays >= 14) {
			return 'Long ester testosterone needs about 2 weeks to clear enough to begin PCT effectively.';
		}
		if (maxClearanceDays >= 3) {
			return 'Short esters clear quickly. You can begin PCT within a few days.';
		}
		if (maxClearanceDays === 1) {
			return 'Oral steroids clear within 24 hours. PCT can begin the day after your last dose.';
		}
		return 'SARMs have short half-lives. Begin PCT the day after your last dose.';
	}

	function getSuppressionBadge(): { label: string; level: string } {
		switch (suppressionLevel) {
			case 'severe':
				return { label: 'Severe Suppression', level: 'severe' };
			case 'heavy':
				return { label: 'Heavy Suppression', level: 'heavy' };
			case 'mild':
				return { label: 'Mild Suppression', level: 'mild' };
			default:
				return { label: 'Moderate Suppression', level: 'moderate' };
		}
	}

	function reset() {
		selectedCompounds = [];
		cycleDuration = null;
		fertilityPreserve = null;
		showResult = false;
	}
</script>

<div class="pct-builder">
	<div class="pct-header">
		<h3 class="pct-title">{title}</h3>
		<div class="pct-progress-row">
			<span class="pct-progress-label">Step {Math.min(currentStep, 3)} of 3</span>
			<div class="pct-progress-bar">
				<div class="pct-progress-fill" style="width: {progressPercent}%"></div>
			</div>
		</div>
	</div>

	<!-- Step 1: Compound Selection -->
	<div class="pct-step" class:active={currentStep >= 1}>
		<div class="step-header">
			<span class="step-number">1</span>
			<div>
				<p class="step-label">What did you run?</p>
				<p class="step-sublabel">Select all that apply</p>
			</div>
		</div>
		<div class="compound-grid">
			{#each compoundOptions as option}
				<button
					type="button"
					class="compound-option"
					class:selected={selectedCompounds.includes(option.key)}
					onclick={() => toggleCompound(option.key)}
				>
					<span class="compound-name">{option.label}</span>
					<span class="compound-detail">{option.detail}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Step 2: Cycle Duration -->
	{#if currentStep >= 2}
		<div class="pct-step" class:active={currentStep >= 2}>
			<div class="step-header">
				<span class="step-number">2</span>
				<div>
					<p class="step-label">How long was your cycle?</p>
					<p class="step-sublabel">Total duration on cycle</p>
				</div>
			</div>
			<div class="duration-row">
				{#each durationOptions as option}
					<button
						type="button"
						class="duration-option"
						class:selected={cycleDuration === option.value}
						onclick={() => selectDuration(option.value)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Step 3: Fertility -->
	{#if currentStep >= 3}
		<div class="pct-step" class:active={currentStep >= 3}>
			<div class="step-header">
				<span class="step-number">3</span>
				<div>
					<p class="step-label">Do you want to preserve fertility?</p>
					<p class="step-sublabel">This adds HCG and adjusts protocol accordingly</p>
				</div>
			</div>
			<div class="fertility-row">
				<button
					type="button"
					class="fertility-option"
					class:selected={fertilityPreserve === true}
					onclick={() => selectFertility(true)}
				>
					Yes, fertility matters
				</button>
				<button
					type="button"
					class="fertility-option"
					class:selected={fertilityPreserve === false}
					onclick={() => selectFertility(false)}
				>
					No, just recovery
				</button>
			</div>
		</div>
	{/if}

	<!-- Result: Timeline -->
	{#if showResult && timeline.length > 0}
		<div class="pct-result">
			<div class="result-header">
				<div class="result-title-row">
					<h4 class="result-title">Your PCT Protocol</h4>
					<span class="suppression-badge {getSuppressionBadge().level}">
						{getSuppressionBadge().label}
					</span>
				</div>
				<p class="result-clearance-note">{getClearanceNote()}</p>
			</div>

			<div class="timeline">
				{#each timeline as phase, i}
					<div class="timeline-phase {phase.type}">
						<div class="timeline-marker">
							<div class="timeline-dot"></div>
							{#if i < timeline.length - 1}
								<div class="timeline-line"></div>
							{/if}
						</div>
						<div class="timeline-content">
							<div class="phase-header">
								<span class="phase-label">{phase.label}</span>
								<span class="phase-duration">{phase.duration}</span>
							</div>
							<p class="phase-description">{phase.description}</p>
							{#if phase.compounds.length > 0}
								<div class="phase-compounds">
									{#each phase.compounds as compound}
										<div class="compound-item">
											{#if compound.href}
												<a href={compound.href} class="compound-link">
													{compound.name}
												</a>
											{:else}
												<span class="compound-name-inline">{compound.name}</span>
											{/if}
											<span class="compound-dose">{compound.dose}</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="result-footer">
				<p class="disclaimer">
					This is an educational reference only. Always get pre- and post-cycle bloodwork (LH,
					FSH, Total &amp; Free Testosterone, Estradiol) and consult a healthcare provider.
				</p>
				<button type="button" class="pct-reset" onclick={reset}>Start over</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.pct-builder {
		border: 1px solid hsl(var(--border));
		background: hsl(var(--card));
		padding: 1.5rem;
		margin: 2rem 0;
	}

	.pct-header {
		margin-bottom: 1.5rem;
	}

	.pct-title {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 1rem;
	}

	.pct-progress-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.pct-progress-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	.pct-progress-bar {
		flex: 1;
		height: 4px;
		background: hsl(var(--muted));
		overflow: hidden;
	}

	.pct-progress-fill {
		height: 100%;
		background: hsl(var(--accent));
		transition: width 0.3s ease;
	}

	/* Steps */

	.pct-step {
		margin-bottom: 1.5rem;
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	.pct-step.active {
		opacity: 1;
	}

	.step-header {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--accent));
		border: 1px solid hsl(var(--accent) / 0.4);
		background: hsl(var(--accent) / 0.08);
		flex-shrink: 0;
	}

	.step-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
		line-height: 1.4;
	}

	.step-sublabel {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin: 0.125rem 0 0;
		line-height: 1.4;
	}

	/* Compound grid */

	.compound-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.compound-option {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--background));
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.compound-option:hover {
		border-color: hsl(var(--foreground) / 0.3);
	}

	.compound-option.selected {
		border-color: hsl(var(--accent) / 0.6);
		background: hsl(var(--accent) / 0.06);
	}

	.compound-option .compound-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.compound-option.selected .compound-name {
		color: hsl(var(--accent));
	}

	.compound-detail {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.4;
	}

	/* Duration row */

	.duration-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.duration-option {
		padding: 0.5rem 1.25rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.duration-option:hover {
		border-color: hsl(var(--foreground) / 0.3);
	}

	.duration-option.selected {
		border-color: hsl(var(--accent) / 0.6);
		background: hsl(var(--accent) / 0.06);
		color: hsl(var(--accent));
	}

	/* Fertility row */

	.fertility-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.fertility-option {
		padding: 0.5rem 1.25rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: all 0.15s ease;
		flex: 1;
		min-width: 140px;
	}

	.fertility-option:hover {
		border-color: hsl(var(--foreground) / 0.3);
	}

	.fertility-option.selected {
		border-color: hsl(var(--accent) / 0.6);
		background: hsl(var(--accent) / 0.06);
		color: hsl(var(--accent));
	}

	/* Result */

	.pct-result {
		border-top: 1px solid hsl(var(--border));
		padding-top: 1.5rem;
		margin-top: 0.5rem;
	}

	.result-header {
		margin-bottom: 1.5rem;
	}

	.result-title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.result-title {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.suppression-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.2rem 0.625rem;
	}

	.suppression-badge.mild {
		background: hsl(var(--success) / 0.1);
		color: hsl(var(--success));
	}

	.suppression-badge.moderate {
		background: hsl(var(--warning) / 0.15);
		color: hsl(var(--warning));
	}

	.suppression-badge.heavy {
		background: hsl(var(--accent) / 0.12);
		color: hsl(var(--accent));
	}

	.suppression-badge.severe {
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
	}

	.result-clearance-note {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0;
	}

	/* Timeline */

	.timeline {
		display: flex;
		flex-direction: column;
	}

	.timeline-phase {
		display: flex;
		gap: 1rem;
		position: relative;
	}

	.timeline-marker {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
		width: 1.25rem;
	}

	.timeline-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		border: 2px solid hsl(var(--border));
		background: hsl(var(--card));
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.timeline-phase.clearance .timeline-dot {
		border-color: hsl(var(--muted-foreground));
	}

	.timeline-phase.bridge .timeline-dot {
		border-color: hsl(var(--warning));
		background: hsl(var(--warning) / 0.2);
	}

	.timeline-phase.pct .timeline-dot {
		border-color: hsl(var(--success));
		background: hsl(var(--success) / 0.2);
	}

	.timeline-line {
		width: 2px;
		flex: 1;
		background: hsl(var(--border));
		min-height: 1rem;
	}

	.timeline-content {
		padding-bottom: 1.5rem;
		flex: 1;
		min-width: 0;
	}

	.phase-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.375rem;
	}

	.phase-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.phase-duration {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.phase-description {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0 0 0.75rem;
	}

	.phase-compounds {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.compound-item {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.8125rem;
		padding: 0.375rem 0.625rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
	}

	.compound-link {
		font-weight: 600;
		color: hsl(var(--accent));
		text-decoration: none;
		white-space: nowrap;
	}

	.compound-link:hover {
		text-decoration: underline;
	}

	.compound-name-inline {
		font-weight: 600;
		color: hsl(var(--foreground));
		white-space: nowrap;
	}

	.compound-dose {
		color: hsl(var(--muted-foreground));
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}

	/* Footer */

	.result-footer {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	.disclaimer {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0 0 1rem;
		font-style: italic;
	}

	.pct-reset {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.375rem 1rem;
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.pct-reset:hover {
		border-color: hsl(var(--foreground) / 0.3);
		color: hsl(var(--foreground));
	}

	/* Responsive */

	@media (max-width: 640px) {
		.pct-builder {
			padding: 1rem;
		}

		.compound-grid {
			grid-template-columns: 1fr;
		}

		.duration-row {
			flex-direction: column;
		}

		.duration-option {
			text-align: center;
		}

		.fertility-row {
			flex-direction: column;
		}

		.compound-item {
			flex-direction: column;
			gap: 0.125rem;
		}

		.result-title-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
