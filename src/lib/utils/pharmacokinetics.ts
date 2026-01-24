/**
 * Pharmacokinetic calculations for peptide accumulation modeling
 * Uses one-compartment exponential decay model: C(t) = C₀ × e^(-kt)
 * where k = ln(2) / t½
 */

export type DoseFrequency =
	| 'twice_daily'
	| 'daily'
	| 'every_2_days'
	| 'every_3_days'
	| 'every_4_days'
	| 'twice_weekly'
	| 'weekly'
	| 'every_10_days'
	| 'every_2_weeks'
	| 'monthly'
	| 'custom';

export interface DoseFrequencyOption {
	value: DoseFrequency;
	label: string;
	intervalSeconds: number; // 0 for custom (user provides)
}

export const DOSE_FREQUENCIES: DoseFrequencyOption[] = [
	{ value: 'twice_daily', label: 'Twice daily (12h)', intervalSeconds: 12 * 3600 },
	{ value: 'daily', label: 'Daily', intervalSeconds: 24 * 3600 },
	{ value: 'every_2_days', label: 'Every 2 days', intervalSeconds: 48 * 3600 },
	{ value: 'every_3_days', label: 'Every 3 days', intervalSeconds: 72 * 3600 },
	{ value: 'every_4_days', label: 'Every 4 days', intervalSeconds: 96 * 3600 },
	{ value: 'twice_weekly', label: 'Twice weekly (3.5 days)', intervalSeconds: 3.5 * 24 * 3600 },
	{ value: 'weekly', label: 'Weekly', intervalSeconds: 7 * 24 * 3600 },
	{ value: 'every_10_days', label: 'Every 10 days', intervalSeconds: 10 * 24 * 3600 },
	{ value: 'every_2_weeks', label: 'Every 2 weeks', intervalSeconds: 14 * 24 * 3600 },
	{ value: 'monthly', label: 'Monthly (30 days)', intervalSeconds: 30 * 24 * 3600 },
	{ value: 'custom', label: 'Custom interval...', intervalSeconds: 0 }
];

export interface ConcentrationPoint {
	time: number; // seconds from start
	concentration: number; // relative concentration (normalized 0-1 or absolute)
	isDose: boolean; // whether a dose was administered at this point
}

export interface AccumulationResult {
	points: ConcentrationPoint[];
	peakConcentration: number;
	troughConcentration: number;
	steadyStatePeak: number;
	steadyStateTrough: number;
	timeToSteadyState: number; // seconds
	lastDoseTime: number; // seconds - when the last dose was administered
	totalDuration: number; // seconds - total chart duration including post-cycle
}

// Titration support
export interface TitrationPhase {
	dose: number; // dose amount in same unit as main dose
	weeks: number; // duration of this phase in weeks
}

export interface TitrationConfig {
	enabled: boolean;
	phases: TitrationPhase[]; // e.g., [{dose: 0.25, weeks: 4}, {dose: 0.5, weeks: 4}, {dose: 1, weeks: 0}]
	// Last phase with weeks: 0 means "rest of duration"
}

// Multi-compound chart support
export interface CompoundSeries {
	id: string;
	name: string;
	color: string;
	result: AccumulationResult;
	doseUnit: 'mcg' | 'mg';
}

export interface MultiCompoundResult {
	series: CompoundSeries[];
	totalDuration: number;
}

/**
 * Calculate decay constant k from half-life
 * k = ln(2) / t½
 */
export function calculateDecayConstant(halfLifeSeconds: number): number {
	return Math.LN2 / halfLifeSeconds;
}

/**
 * Calculate concentration at time t after a single dose
 * C(t) = dose × e^(-kt)
 */
export function calculateDecay(
	dose: number,
	halfLifeSeconds: number,
	elapsedSeconds: number
): number {
	const k = calculateDecayConstant(halfLifeSeconds);
	return dose * Math.exp(-k * elapsedSeconds);
}

/**
 * Calculate theoretical steady-state peak and trough
 * For repeated dosing at interval τ:
 * Peak(ss) = dose / (1 - e^(-kτ))
 * Trough(ss) = dose × e^(-kτ) / (1 - e^(-kτ))
 */
export function calculateSteadyState(
	dose: number,
	halfLifeSeconds: number,
	intervalSeconds: number
): { peak: number; trough: number } {
	const k = calculateDecayConstant(halfLifeSeconds);
	const decayFactor = Math.exp(-k * intervalSeconds);
	const accumFactor = 1 / (1 - decayFactor);

	return {
		peak: dose * accumFactor,
		trough: dose * decayFactor * accumFactor
	};
}

/**
 * Estimate time to reach steady state (typically 4-5 half-lives for ~94-97%)
 */
export function calculateTimeToSteadyState(
	halfLifeSeconds: number,
	percentSteadyState: number = 0.95
): number {
	// Time to reach X% of steady state: t = -ln(1-X) / k
	const k = calculateDecayConstant(halfLifeSeconds);
	return -Math.log(1 - percentSteadyState) / k;
}

/**
 * Generate concentration curve for multi-dose accumulation
 * @param postCycleDuration - Optional duration in seconds to show decay after last dose
 */
export function calculateAccumulation(
	dose: number,
	halfLifeSeconds: number,
	intervalSeconds: number,
	durationSeconds: number,
	pointsPerInterval: number = 20,
	postCycleDuration: number = 0
): AccumulationResult {
	const k = calculateDecayConstant(halfLifeSeconds);
	const points: ConcentrationPoint[] = [];

	// Calculate number of doses
	const numDoses = Math.floor(durationSeconds / intervalSeconds) + 1;

	// Track dose times
	const doseTimes: number[] = [];
	for (let i = 0; i < numDoses; i++) {
		doseTimes.push(i * intervalSeconds);
	}

	const lastDoseTime = doseTimes[doseTimes.length - 1] ?? 0;
	const totalDuration = durationSeconds + postCycleDuration;

	// Generate time points
	const timeStep = intervalSeconds / pointsPerInterval;
	const timePoints: number[] = [];
	for (let t = 0; t <= totalDuration; t += timeStep) {
		timePoints.push(t);
	}
	// Ensure we include dose times
	doseTimes.forEach((dt) => {
		if (!timePoints.includes(dt)) {
			timePoints.push(dt);
		}
	});
	// Ensure we include the end of dosing period
	if (!timePoints.includes(durationSeconds)) {
		timePoints.push(durationSeconds);
	}
	timePoints.sort((a, b) => a - b);

	// Calculate concentration at each time point
	let peakConcentration = 0;
	let troughConcentration = Infinity;
	let lastDoseIndex = -1;

	for (const t of timePoints) {
		let concentration = 0;

		// Sum contributions from all previous doses
		for (let i = 0; i < doseTimes.length; i++) {
			if (doseTimes[i] <= t) {
				const elapsed = t - doseTimes[i];
				concentration += dose * Math.exp(-k * elapsed);
				lastDoseIndex = i;
			}
		}

		const isDose = doseTimes.includes(t);
		points.push({ time: t, concentration, isDose });

		// Track peak and trough (after first dose settles, during dosing period only)
		if (t > 0 && t <= durationSeconds) {
			if (isDose) {
				peakConcentration = Math.max(peakConcentration, concentration);
			} else if (lastDoseIndex >= 0) {
				// Trough is just before next dose
				const nextDoseTime = doseTimes[lastDoseIndex + 1];
				if (nextDoseTime !== undefined && Math.abs(t - nextDoseTime) < timeStep * 1.5) {
					troughConcentration = Math.min(troughConcentration, concentration);
				}
			}
		}
	}

	// If we never found a valid trough, use the last point before post-cycle
	if (troughConcentration === Infinity) {
		const lastDosingPoint = points.filter((p) => p.time <= durationSeconds).pop();
		troughConcentration = lastDosingPoint?.concentration ?? 0;
	}

	// Calculate theoretical steady state
	const steadyState = calculateSteadyState(dose, halfLifeSeconds, intervalSeconds);
	const timeToSteadyState = calculateTimeToSteadyState(halfLifeSeconds);

	return {
		points,
		peakConcentration,
		troughConcentration,
		steadyStatePeak: steadyState.peak,
		steadyStateTrough: steadyState.trough,
		timeToSteadyState,
		lastDoseTime,
		totalDuration
	};
}

/**
 * Calculate accumulation with titration phases
 * Each phase's ending concentration carries forward to the next phase
 */
export function calculateAccumulationWithTitration(
	titrationPhases: TitrationPhase[],
	halfLifeSeconds: number,
	intervalSeconds: number,
	totalDurationSeconds: number,
	pointsPerInterval: number = 20,
	postCycleDuration: number = 0
): AccumulationResult {
	const k = calculateDecayConstant(halfLifeSeconds);
	const points: ConcentrationPoint[] = [];
	const allDoseTimes: { time: number; dose: number }[] = [];

	// Build dose schedule from phases
	let currentTime = 0;
	for (let phaseIndex = 0; phaseIndex < titrationPhases.length; phaseIndex++) {
		const phase = titrationPhases[phaseIndex];
		const phaseDuration =
			phase.weeks === 0
				? totalDurationSeconds - currentTime // Rest of duration
				: phase.weeks * 7 * 24 * 3600;

		const phaseEnd = Math.min(currentTime + phaseDuration, totalDurationSeconds);

		// Add doses for this phase
		let doseTime = currentTime;
		while (doseTime <= phaseEnd) {
			allDoseTimes.push({ time: doseTime, dose: phase.dose });
			doseTime += intervalSeconds;
		}

		currentTime = phaseEnd;
		if (currentTime >= totalDurationSeconds) break;
	}

	const lastDoseTime = allDoseTimes[allDoseTimes.length - 1]?.time ?? 0;
	const totalDuration = totalDurationSeconds + postCycleDuration;

	// Generate time points
	const timeStep = intervalSeconds / pointsPerInterval;
	const timePoints: number[] = [];
	for (let t = 0; t <= totalDuration; t += timeStep) {
		timePoints.push(t);
	}
	// Include dose times
	allDoseTimes.forEach((dt) => {
		if (!timePoints.includes(dt.time)) {
			timePoints.push(dt.time);
		}
	});
	if (!timePoints.includes(totalDurationSeconds)) {
		timePoints.push(totalDurationSeconds);
	}
	timePoints.sort((a, b) => a - b);

	// Calculate concentration at each time point
	let peakConcentration = 0;
	let troughConcentration = Infinity;
	let lastDoseIndex = -1;

	for (const t of timePoints) {
		let concentration = 0;

		// Sum contributions from all previous doses
		for (let i = 0; i < allDoseTimes.length; i++) {
			if (allDoseTimes[i].time <= t) {
				const elapsed = t - allDoseTimes[i].time;
				concentration += allDoseTimes[i].dose * Math.exp(-k * elapsed);
				lastDoseIndex = i;
			}
		}

		const isDose = allDoseTimes.some((dt) => dt.time === t);
		points.push({ time: t, concentration, isDose });

		// Track peak and trough
		if (t > 0 && t <= totalDurationSeconds) {
			if (isDose) {
				peakConcentration = Math.max(peakConcentration, concentration);
			} else if (lastDoseIndex >= 0 && lastDoseIndex < allDoseTimes.length - 1) {
				const nextDoseTime = allDoseTimes[lastDoseIndex + 1]?.time;
				if (nextDoseTime !== undefined && Math.abs(t - nextDoseTime) < timeStep * 1.5) {
					troughConcentration = Math.min(troughConcentration, concentration);
				}
			}
		}
	}

	if (troughConcentration === Infinity) {
		const lastDosingPoint = points.filter((p) => p.time <= totalDurationSeconds).pop();
		troughConcentration = lastDosingPoint?.concentration ?? 0;
	}

	// Calculate steady state based on final dose
	const finalDose = titrationPhases[titrationPhases.length - 1]?.dose ?? 0;
	const steadyState = calculateSteadyState(finalDose, halfLifeSeconds, intervalSeconds);
	const timeToSteadyState = calculateTimeToSteadyState(halfLifeSeconds);

	return {
		points,
		peakConcentration,
		troughConcentration,
		steadyStatePeak: steadyState.peak,
		steadyStateTrough: steadyState.trough,
		timeToSteadyState,
		lastDoseTime,
		totalDuration
	};
}

// Color palette for multiple compounds
export const COMPOUND_COLORS = [
	'hsl(var(--accent))', // Primary accent (book cloth orange)
	'hsl(210, 70%, 50%)', // Blue
	'hsl(150, 60%, 45%)', // Green
	'hsl(280, 60%, 55%)', // Purple
	'hsl(45, 80%, 50%)', // Yellow/Gold
	'hsl(340, 70%, 55%)' // Pink/Magenta
];

/**
 * Format time duration for display
 */
export function formatDuration(seconds: number): string {
	if (seconds < 3600) {
		const minutes = Math.round(seconds / 60);
		return `${minutes} min`;
	} else if (seconds < 86400) {
		const hours = seconds / 3600;
		return hours === 1 ? '1 hour' : `${hours.toFixed(1)} hours`;
	} else if (seconds < 604800) {
		const days = seconds / 86400;
		return days === 1 ? '1 day' : `${days.toFixed(1)} days`;
	} else {
		const weeks = seconds / 604800;
		return weeks === 1 ? '1 week' : `${weeks.toFixed(1)} weeks`;
	}
}

/**
 * Get appropriate time unit for x-axis based on duration
 */
export function getTimeUnit(durationSeconds: number): {
	unit: 'hours' | 'days' | 'weeks';
	divisor: number;
	label: string;
} {
	if (durationSeconds <= 3 * 86400) {
		return { unit: 'hours', divisor: 3600, label: 'Hours' };
	} else if (durationSeconds <= 4 * 604800) {
		return { unit: 'days', divisor: 86400, label: 'Days' };
	} else {
		return { unit: 'weeks', divisor: 604800, label: 'Weeks' };
	}
}
