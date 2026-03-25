<script lang="ts">
	import {
		calculateAccumulation,
		COMPOUND_COLORS,
		type AccumulationResult
	} from '$lib/utils/pharmacokinetics';
	import AccumulationChart from '$lib/components/calculator/AccumulationChart.svelte';
	import { ChevronDown, TrendingUp, Sliders } from 'lucide-svelte';
	import type { Peptide } from '$lib/types';

	interface Props {
		peptide: Peptide;
	}

	let { peptide }: Props = $props();

	const halfLifeSeconds = $derived(peptide.molecular?.halfLifeSeconds ?? 3600);

	// Infer sensible defaults from the peptide's actual protocol data
	function inferDefaults(p: Peptide): {
		doseVal: number;
		unit: 'mcg' | 'mg';
		intervalSec: number;
		durationD: number;
	} {
		let doseVal = 250;
		let unit: 'mcg' | 'mg' = 'mcg';
		let intervalSec = 86400;
		let durationD = 14;

		const method = p.deliveryMethods?.[0];
		const proto = method?.protocols?.[0];
		if (proto?.dose) {
			const doseStr = proto.dose.toLowerCase();
			const numMatch = doseStr.match(/([\d.]+)\s*(mg|mcg|ug)/);
			if (numMatch) {
				doseVal = parseFloat(numMatch[1]);
				unit = numMatch[2] === 'mg' ? 'mg' : 'mcg';
			} else {
				const simpleMatch = doseStr.match(/([\d.]+)\s*mg/);
				if (simpleMatch) {
					doseVal = parseFloat(simpleMatch[1]);
					unit = 'mg';
				}
			}

			const freq = proto.frequency?.toLowerCase() ?? '';
			if (freq.includes('twice daily') || freq.includes('2x daily') || freq.includes('bid')) {
				intervalSec = 43200;
			} else if (freq.includes('daily') || freq.includes('once daily') || freq.includes('qd')) {
				intervalSec = 86400;
			} else if (freq.includes('every other day') || freq.includes('every 2 day')) {
				intervalSec = 172800;
			} else if (freq.includes('twice weekly') || freq.includes('2x week')) {
				intervalSec = 302400;
			} else if (
				freq.includes('weekly') ||
				freq.includes('once weekly') ||
				freq.includes('once a week')
			) {
				intervalSec = 604800;
			} else if (freq.includes('every 2 week') || freq.includes('biweekly')) {
				intervalSec = 1209600;
			}
		}

		const dosesTarget = 8;
		durationD = Math.max(7, Math.min(90, Math.round((intervalSec * dosesTarget) / 86400)));

		return { doseVal, unit, intervalSec, durationD };
	}

	let dose = $state(0);
	let doseUnit = $state<'mcg' | 'mg'>('mcg');
	let intervalDays = $state(1);
	let durationDays = $state(14);
	let showControls = $state(false);

	// Reset all state when peptide changes
	$effect(() => {
		const d = inferDefaults(peptide);
		dose = d.doseVal;
		doseUnit = d.unit;
		intervalDays = d.intervalSec / 86400;
		durationDays = d.durationD;
		showControls = false;
	});

	const doseInMcg = $derived(doseUnit === 'mg' ? dose * 1000 : dose);
	const intervalSeconds = $derived(intervalDays * 86400);
	const durationSeconds = $derived(durationDays * 86400);
	const postCycleSeconds = $derived(Math.max(halfLifeSeconds * 5, 86400 * 2));

	const result: AccumulationResult = $derived(
		calculateAccumulation(
			doseInMcg,
			halfLifeSeconds,
			intervalSeconds,
			durationSeconds,
			12,
			postCycleSeconds
		)
	);

	const chartData = $derived([
		{
			...result,
			color: COMPOUND_COLORS[0],
			name: peptide.name
		}
	]);

	// Format stat values in the right unit
	function fmtConc(val: number): string {
		if (doseUnit === 'mg') return (val / 1000).toFixed(2) + ' mg';
		return val.toFixed(1) + ' mcg';
	}

	// Format interval for display
	function fmtInterval(days: number): string {
		if (days >= 7 && days % 7 === 0) return `${days / 7}w`;
		if (days >= 1 && Number.isInteger(days)) return `${days}d`;
		const hours = days * 24;
		if (Number.isInteger(hours)) return `${hours}h`;
		return `${days.toFixed(1)}d`;
	}
</script>

<div class="pk-section">
	<button onclick={() => (showControls = !showControls)} class="pk-toggle">
		<div class="pk-toggle-left">
			<TrendingUp class="h-4 w-4 text-accent" />
			<span class="pk-toggle-title">Accumulation Curve</span>
			<span class="pk-toggle-sub">
				{dose}{doseUnit} / {fmtInterval(intervalDays)} / {durationDays}d
			</span>
		</div>
		<div class="pk-toggle-right">
			<Sliders class="h-3.5 w-3.5 text-muted-foreground" />
		</div>
	</button>

	{#if showControls}
		<div class="pk-controls-wrapper">
			<div class="pk-controls">
				<label class="pk-control">
					<span class="pk-control-label">Dose</span>
					<div class="pk-input-group">
						<input
							type="number"
							bind:value={dose}
							min={0.01}
							max={10000}
							step={doseUnit === 'mg' ? 0.5 : 10}
							class="pk-input"
						/>
						<select bind:value={doseUnit} class="pk-select">
							<option value="mcg">mcg</option>
							<option value="mg">mg</option>
						</select>
					</div>
				</label>
				<label class="pk-control">
					<span class="pk-control-label">Every (days)</span>
					<input
						type="number"
						bind:value={intervalDays}
						min={0.5}
						max={30}
						step={0.5}
						class="pk-input"
					/>
				</label>
				<label class="pk-control">
					<span class="pk-control-label">Duration (days)</span>
					<input
						type="number"
						bind:value={durationDays}
						min={1}
						max={180}
						step={1}
						class="pk-input"
					/>
				</label>
			</div>
			<a href="/calculator/accumulation?peptide={peptide.id}" class="pk-full-link">
				Open full plotter
			</a>
		</div>
	{/if}

	<!-- Chart always visible -->
	<div class="pk-chart">
		<AccumulationChart
			data={chartData}
			durationSeconds={result.totalDuration}
			{doseUnit}
			height={220}
		/>
	</div>

	<!-- Stats row -->
	<div class="pk-stats">
		<div class="pk-stat">
			<span class="pk-stat-label">Peak</span>
			<span class="pk-stat-value">{fmtConc(result.peakConcentration)}</span>
		</div>
		<div class="pk-stat">
			<span class="pk-stat-label">Trough</span>
			<span class="pk-stat-value">{fmtConc(result.troughConcentration)}</span>
		</div>
		<div class="pk-stat">
			<span class="pk-stat-label">SS Peak</span>
			<span class="pk-stat-value">{fmtConc(result.steadyStatePeak)}</span>
		</div>
		<div class="pk-stat">
			<span class="pk-stat-label">SS Trough</span>
			<span class="pk-stat-value">{fmtConc(result.steadyStateTrough)}</span>
		</div>
	</div>
</div>

<style>
	.pk-section {
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		overflow: hidden;
		background: hsl(var(--card) / 0.5);
	}

	.pk-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.625rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.pk-toggle:hover {
		background: hsl(var(--muted) / 0.5);
	}

	.pk-toggle-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.pk-toggle-right {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.pk-toggle-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.pk-toggle-sub {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		font-family: monospace;
	}

	.pk-controls-wrapper {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.3);
	}

	.pk-controls {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		flex: 1;
	}

	.pk-control {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 90px;
	}

	.pk-control-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.pk-input-group {
		display: flex;
		gap: 0;
	}

	.pk-input-group .pk-input {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-right: none;
	}

	.pk-select {
		padding: 0.375rem 0.375rem;
		font-size: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0 0.375rem 0.375rem 0;
		background: hsl(var(--muted) / 0.5);
		color: hsl(var(--foreground));
		outline: none;
		cursor: pointer;
	}

	.pk-input {
		width: 100%;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		font-family: monospace;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		outline: none;
		transition: border-color 0.15s;
	}

	.pk-input:focus {
		border-color: hsl(var(--accent));
	}

	.pk-full-link {
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--accent));
		text-decoration: none;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.pk-full-link:hover {
		text-decoration: underline;
	}

	.pk-chart {
		overflow: hidden;
	}

	.pk-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-top: 1px solid hsl(var(--border));
	}

	.pk-stat {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.pk-stat-label {
		font-size: 0.5625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground));
	}

	.pk-stat-value {
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: monospace;
		color: hsl(var(--foreground));
	}

	@media (max-width: 640px) {
		.pk-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.pk-toggle-sub {
			display: none;
		}

		.pk-controls-wrapper {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
