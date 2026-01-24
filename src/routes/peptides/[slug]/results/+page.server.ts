import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPeptideBySlug } from '$lib/data/peptides';
import type { Database } from '$lib/types/database';

type AnonymousFinding = Database['public']['Views']['findings_anonymous']['Row'];
type DosingPhase = Database['public']['Tables']['finding_dosing_phases']['Row'];
type SideEffect = Database['public']['Tables']['finding_side_effects']['Row'];
type FindingResult = Database['public']['Tables']['finding_results']['Row'];
type ConcurrentCompound = Database['public']['Tables']['finding_concurrent_compounds']['Row'];
type CustomResult = Database['public']['Tables']['finding_custom_results']['Row'];

export const load: PageServerLoad = async ({ params, locals }) => {
	const peptide = getPeptideBySlug(params.slug);
	if (!peptide) {
		throw redirect(303, '/peptides');
	}

	const supabase = locals.supabase;

	// Return empty data if supabase not available
	if (!supabase) {
		return {
			peptide,
			findings: [],
			dosingPhases: {} as Record<string, DosingPhase[]>,
			sideEffects: {} as Record<string, SideEffect[]>,
			results: {} as Record<string, FindingResult>,
			concurrentCompounds: {} as Record<string, ConcurrentCompound[]>,
			customResults: {} as Record<string, CustomResult[]>,
			aggregateStats: calculateAggregateStats([], {}, [], [], [], [])
		};
	}

	// Fetch published findings for this peptide from the anonymized view
	const { data: findings, error: findingsError } = await supabase
		.from('findings_anonymous')
		.select('*')
		.eq('peptide_id', params.slug)
		.eq('status', 'published')
		.order('created_at', { ascending: false });

	if (findingsError) {
		console.error('Error fetching findings:', findingsError);
	}

	// Fetch dosing phases for all findings
	const findingIds = (findings?.map((f) => f.id).filter(Boolean) as string[]) || [];
	let dosingPhases: Record<string, DosingPhase[]> = {};
	let sideEffects: Record<string, SideEffect[]> = {};
	let results: Record<string, FindingResult> = {};
	let concurrentCompounds: Record<string, ConcurrentCompound[]> = {};
	let customResults: Record<string, CustomResult[]> = {};

	if (findingIds.length > 0) {
		const { data: phases } = await supabase
			.from('finding_dosing_phases')
			.select('*')
			.in('finding_id', findingIds)
			.order('phase_order', { ascending: true });

		// Group by finding_id
		phases?.forEach((phase) => {
			if (!dosingPhases[phase.finding_id]) {
				dosingPhases[phase.finding_id] = [];
			}
			dosingPhases[phase.finding_id].push(phase);
		});

		const { data: effects } = await supabase
			.from('finding_side_effects')
			.select('*')
			.in('finding_id', findingIds);

		effects?.forEach((effect) => {
			if (!sideEffects[effect.finding_id]) {
				sideEffects[effect.finding_id] = [];
			}
			sideEffects[effect.finding_id].push(effect);
		});

		const { data: resultsData } = await supabase
			.from('finding_results')
			.select('*')
			.in('finding_id', findingIds);

		resultsData?.forEach((result) => {
			results[result.finding_id] = result;
		});

		// Fetch concurrent compounds
		const { data: compoundsData } = await supabase
			.from('finding_concurrent_compounds')
			.select('*')
			.in('finding_id', findingIds);

		compoundsData?.forEach((compound) => {
			if (!concurrentCompounds[compound.finding_id]) {
				concurrentCompounds[compound.finding_id] = [];
			}
			concurrentCompounds[compound.finding_id].push(compound);
		});

		// Fetch custom results
		const { data: customResultsData } = await supabase
			.from('finding_custom_results')
			.select('*')
			.in('finding_id', findingIds);

		customResultsData?.forEach((result) => {
			if (!customResults[result.finding_id]) {
				customResults[result.finding_id] = [];
			}
			customResults[result.finding_id].push(result);
		});
	}

	// Calculate aggregate statistics
	const aggregateStats = calculateAggregateStats(
		findings || [],
		results,
		Object.values(sideEffects).flat(),
		Object.values(dosingPhases).flat(),
		Object.values(concurrentCompounds).flat(),
		Object.values(customResults).flat()
	);

	return {
		peptide,
		findings: findings || [],
		dosingPhases,
		sideEffects,
		results,
		concurrentCompounds,
		customResults,
		aggregateStats
	};
};

function calculateAggregateStats(
	findings: AnonymousFinding[],
	results: Record<string, FindingResult>,
	allSideEffects: SideEffect[],
	allDosingPhases: DosingPhase[],
	allConcurrentCompounds: ConcurrentCompound[],
	allCustomResults: CustomResult[]
) {
	const emptyStats = {
		totalSubmissions: 0,
		avgEffectiveness: 0,
		avgTimeToNotice: 0,
		avgTimeToPeak: 0,
		wouldUseAgainPercentage: 0,
		avgCycleLength: 0,
		administrationMethods: {} as Record<string, number>,
		effectivenessDistribution: Array.from({ length: 10 }, (_, i) => ({ rating: i + 1, count: 0 })),
		// New NPS stats
		npsScore: 0,
		npsDistribution: Array.from({ length: 11 }, (_, i) => ({ score: i, count: 0 })),
		npsBreakdown: { promoters: 0, passives: 0, detractors: 0 },
		// Data confidence
		dataConfidenceDistribution: {} as Record<string, number>,
		highConfidencePercentage: 0,
		// Repeat users
		repeatUserPercentage: 0,
		isRepeatCycleDistribution: {} as Record<string, number>,
		// Effect persistence
		effectPersistenceDistribution: {} as Record<string, number>,
		// Lifestyle factors
		lifestyleStats: {
			training: {} as Record<string, number>,
			sleep: {} as Record<string, number>,
			stress: {} as Record<string, number>,
			diet: {} as Record<string, number>
		},
		// Why stopped
		whyStoppedDistribution: {} as Record<string, number>,
		// Dose response
		doseResponsePercentage: 0,
		// Side effects analysis
		sideEffectsAnalysis: {
			onsetDistribution: {} as Record<string, number>,
			resolutionDistribution: {} as Record<string, number>,
			topSideEffects: [] as { name: string; count: number; avgSeverity: number }[]
		},
		// Dosing patterns
		dosingPatterns: {
			timeOfDayDistribution: {} as Record<string, number>,
			mealTimingDistribution: {} as Record<string, number>,
			loadingDosePercentage: 0
		},
		// Concurrent compounds
		topConcurrentCompounds: [] as { name: string; count: number }[],
		// Custom results
		topCustomEffects: [] as { name: string; count: number; avgRating: number }[]
	};

	if (findings.length === 0) {
		return emptyStats;
	}

	// Get effectiveness ratings from finding_results
	const effectivenessRatings = findings
		.map((f) => (f.id ? results[f.id]?.effectiveness_rating : null))
		.filter((r): r is number => r != null);

	const avgEffectiveness =
		effectivenessRatings.length > 0
			? effectivenessRatings.reduce((sum, r) => sum + r, 0) / effectivenessRatings.length
			: 0;

	// Get time to notice from finding_results
	const timeToNoticeValues = findings
		.map((f) => (f.id ? results[f.id]?.time_to_notice_days : null))
		.filter((t): t is number => t != null);

	const avgTimeToNotice =
		timeToNoticeValues.length > 0
			? timeToNoticeValues.reduce((sum, t) => sum + t, 0) / timeToNoticeValues.length
			: 0;

	// Get time to peak from finding_results
	const timeToPeakValues = Object.values(results)
		.map((r) => r.time_to_peak_days)
		.filter((t): t is number => t != null);

	const avgTimeToPeak =
		timeToPeakValues.length > 0
			? timeToPeakValues.reduce((sum, t) => sum + t, 0) / timeToPeakValues.length
			: 0;

	const wouldUseAgainYes = findings.filter((f) => f.would_use_again === 'yes').length;
	const wouldUseAgainPercentage =
		findings.length > 0 ? (wouldUseAgainYes / findings.length) * 100 : 0;

	const validCycleLength = findings.filter((f) => f.cycle_length_weeks != null);
	const avgCycleLength =
		validCycleLength.length > 0
			? validCycleLength.reduce((sum, f) => sum + (f.cycle_length_weeks || 0), 0) /
				validCycleLength.length
			: 0;

	// Count administration methods
	const administrationMethods: Record<string, number> = {};
	findings.forEach((f) => {
		if (f.administration_method) {
			administrationMethods[f.administration_method] =
				(administrationMethods[f.administration_method] || 0) + 1;
		}
	});

	// Effectiveness distribution (1-10)
	const effectivenessDistribution = Array.from({ length: 10 }, (_, i) => ({
		rating: i + 1,
		count: effectivenessRatings.filter((r) => r === i + 1).length
	}));

	// NPS Score calculation
	const recommendScores = findings
		.map((f) => f.recommend_score)
		.filter((s): s is number => s != null);

	const promoters = recommendScores.filter((s) => s >= 9).length;
	const passives = recommendScores.filter((s) => s >= 7 && s <= 8).length;
	const detractors = recommendScores.filter((s) => s <= 6).length;
	const npsScore =
		recommendScores.length > 0
			? Math.round(((promoters - detractors) / recommendScores.length) * 100)
			: 0;

	const npsDistribution = Array.from({ length: 11 }, (_, i) => ({
		score: i,
		count: recommendScores.filter((s) => s === i).length
	}));

	// Data confidence distribution
	const dataConfidenceDistribution: Record<string, number> = {};
	findings.forEach((f) => {
		if (f.data_confidence) {
			dataConfidenceDistribution[f.data_confidence] =
				(dataConfidenceDistribution[f.data_confidence] || 0) + 1;
		}
	});

	const highConfidenceCount =
		(dataConfidenceDistribution['very_confident'] || 0) +
		(dataConfidenceDistribution['somewhat_confident'] || 0);
	const totalWithConfidence = Object.values(dataConfidenceDistribution).reduce((a, b) => a + b, 0);
	const highConfidencePercentage =
		totalWithConfidence > 0 ? Math.round((highConfidenceCount / totalWithConfidence) * 100) : 0;

	// Repeat user stats
	const isRepeatCycleDistribution: Record<string, number> = {};
	findings.forEach((f) => {
		if (f.is_repeat_cycle) {
			isRepeatCycleDistribution[f.is_repeat_cycle] =
				(isRepeatCycleDistribution[f.is_repeat_cycle] || 0) + 1;
		}
	});

	const repeatUsers = findings.filter(
		(f) => f.is_repeat_cycle && f.is_repeat_cycle !== 'first_time'
	).length;
	const totalWithRepeatInfo = findings.filter((f) => f.is_repeat_cycle).length;
	const repeatUserPercentage =
		totalWithRepeatInfo > 0 ? Math.round((repeatUsers / totalWithRepeatInfo) * 100) : 0;

	// Effect persistence distribution
	const effectPersistenceDistribution: Record<string, number> = {};
	Object.values(results).forEach((r) => {
		if (r.effect_persistence) {
			effectPersistenceDistribution[r.effect_persistence] =
				(effectPersistenceDistribution[r.effect_persistence] || 0) + 1;
		}
	});

	// Lifestyle stats
	const lifestyleStats = {
		training: {} as Record<string, number>,
		sleep: {} as Record<string, number>,
		stress: {} as Record<string, number>,
		diet: {} as Record<string, number>
	};

	findings.forEach((f) => {
		if (f.training_intensity) {
			lifestyleStats.training[f.training_intensity] =
				(lifestyleStats.training[f.training_intensity] || 0) + 1;
		}
		if (f.sleep_quality) {
			lifestyleStats.sleep[f.sleep_quality] = (lifestyleStats.sleep[f.sleep_quality] || 0) + 1;
		}
		if (f.stress_level) {
			lifestyleStats.stress[f.stress_level] = (lifestyleStats.stress[f.stress_level] || 0) + 1;
		}
		if (f.diet_adherence) {
			lifestyleStats.diet[f.diet_adherence] = (lifestyleStats.diet[f.diet_adherence] || 0) + 1;
		}
	});

	// Why stopped distribution (for completed cycles)
	const whyStoppedDistribution: Record<string, number> = {};
	findings
		.filter((f) => !f.currently_on_cycle && f.why_stopped)
		.forEach((f) => {
			whyStoppedDistribution[f.why_stopped!] =
				(whyStoppedDistribution[f.why_stopped!] || 0) + 1;
		});

	// Dose response percentage
	const doseResponseCount = findings.filter((f) => f.dose_response_noticed === true).length;
	const totalWithDoseResponse = findings.filter((f) => f.dose_response_noticed != null).length;
	const doseResponsePercentage =
		totalWithDoseResponse > 0 ? Math.round((doseResponseCount / totalWithDoseResponse) * 100) : 0;

	// Side effects analysis
	const onsetDistribution: Record<string, number> = {};
	const resolutionDistribution: Record<string, number> = {};
	const sideEffectCounts: Record<string, { count: number; totalSeverity: number }> = {};

	allSideEffects.forEach((effect) => {
		if (effect.onset_timing) {
			onsetDistribution[effect.onset_timing] = (onsetDistribution[effect.onset_timing] || 0) + 1;
		}
		if (effect.resolved) {
			resolutionDistribution[effect.resolved] = (resolutionDistribution[effect.resolved] || 0) + 1;
		}
		const name = effect.side_effect_name;
		if (!sideEffectCounts[name]) {
			sideEffectCounts[name] = { count: 0, totalSeverity: 0 };
		}
		sideEffectCounts[name].count++;
		sideEffectCounts[name].totalSeverity += effect.severity || 0;
	});

	const topSideEffects = Object.entries(sideEffectCounts)
		.map(([name, data]) => ({
			name,
			count: data.count,
			avgSeverity: data.count > 0 ? Math.round((data.totalSeverity / data.count) * 10) / 10 : 0
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	// Dosing patterns
	const timeOfDayDistribution: Record<string, number> = {};
	const mealTimingDistribution: Record<string, number> = {};
	let loadingDoseCount = 0;
	let totalPhasesWithLoadingInfo = 0;

	allDosingPhases.forEach((phase) => {
		if (phase.time_of_day) {
			timeOfDayDistribution[phase.time_of_day] =
				(timeOfDayDistribution[phase.time_of_day] || 0) + 1;
		}
		if (phase.meal_timing) {
			mealTimingDistribution[phase.meal_timing] =
				(mealTimingDistribution[phase.meal_timing] || 0) + 1;
		}
		if (phase.is_loading_dose != null) {
			totalPhasesWithLoadingInfo++;
			if (phase.is_loading_dose) {
				loadingDoseCount++;
			}
		}
	});

	const loadingDosePercentage =
		totalPhasesWithLoadingInfo > 0
			? Math.round((loadingDoseCount / totalPhasesWithLoadingInfo) * 100)
			: 0;

	// Concurrent compounds
	const compoundCounts: Record<string, number> = {};
	allConcurrentCompounds.forEach((c) => {
		const name = c.compound_name.toLowerCase().trim();
		compoundCounts[name] = (compoundCounts[name] || 0) + 1;
	});

	const topConcurrentCompounds = Object.entries(compoundCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	// Custom results aggregation
	const customEffectStats: Record<string, { count: number; totalRating: number }> = {};
	allCustomResults.forEach((r) => {
		const name = r.effect_name.toLowerCase().trim();
		if (!customEffectStats[name]) {
			customEffectStats[name] = { count: 0, totalRating: 0 };
		}
		customEffectStats[name].count++;
		customEffectStats[name].totalRating += r.rating;
	});

	const topCustomEffects = Object.entries(customEffectStats)
		.map(([name, data]) => ({
			name,
			count: data.count,
			avgRating: data.count > 0 ? Math.round((data.totalRating / data.count) * 10) / 10 : 0
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	return {
		totalSubmissions: findings.length,
		avgEffectiveness: Math.round(avgEffectiveness * 10) / 10,
		avgTimeToNotice: Math.round(avgTimeToNotice),
		avgTimeToPeak: Math.round(avgTimeToPeak),
		wouldUseAgainPercentage: Math.round(wouldUseAgainPercentage),
		avgCycleLength: Math.round(avgCycleLength * 10) / 10,
		administrationMethods,
		effectivenessDistribution,
		// NPS
		npsScore,
		npsDistribution,
		npsBreakdown: { promoters, passives, detractors },
		// Data confidence
		dataConfidenceDistribution,
		highConfidencePercentage,
		// Repeat users
		repeatUserPercentage,
		isRepeatCycleDistribution,
		// Effect persistence
		effectPersistenceDistribution,
		// Lifestyle
		lifestyleStats,
		// Why stopped
		whyStoppedDistribution,
		// Dose response
		doseResponsePercentage,
		// Side effects
		sideEffectsAnalysis: {
			onsetDistribution,
			resolutionDistribution,
			topSideEffects
		},
		// Dosing patterns
		dosingPatterns: {
			timeOfDayDistribution,
			mealTimingDistribution,
			loadingDosePercentage
		},
		// Concurrent compounds
		topConcurrentCompounds,
		// Custom effects
		topCustomEffects
	};
}
