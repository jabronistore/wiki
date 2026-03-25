import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const supabase = locals.supabase;

	if (!supabase) {
		return json({ error: 'Service not available' }, { status: 503 });
	}

	// Check authentication using getUser() for secure server-side auth
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const {
		peptideId,
		status,
		dosingPhases,
		administrationMethod,
		reconstitution,
		injectableDetails,
		sourceInfo,
		effectivenessRating,
		timeToNoticeDays,
		timeToPeakDays,
		effectPersistence,
		doseResponseNoticed,
		doseResponseNotes,
		qualitativeNotes,
		categoryResults,
		customResults,
		sideEffects,
		customSideEffects,
		cycleLengthWeeks,
		currentlyOnCycle,
		totalBreaks,
		wouldUseAgain,
		whyStopped,
		isRepeatCycle,
		recommendScore,
		lifestyleFactors,
		concurrentCompounds,
		dataConfidence,
		followUpConsent,
		preExistingConditions
	} = body;

	// Validate required fields
	if (!peptideId) {
		return json({ error: 'Peptide ID is required' }, { status: 400 });
	}

	try {
		// Create the main finding record with all new fields
		const { data: finding, error: findingError } = await supabase
			.from('findings')
			.insert({
				user_id: user.id,
				peptide_id: peptideId,
				status: status || 'draft',
				administration_method: administrationMethod,
				reconstitution_solution: reconstitution?.diluentType,
				vial_size_mg: reconstitution?.vialSizeMg,
				diluent_volume_ml: reconstitution?.diluentVolumeMl,
				injection_frequency: null, // Deprecated - use injection_doses_per_week
				injection_doses_per_week: reconstitution?.injectionDosesPerWeek,
				// New injection details
				injection_site: injectableDetails?.injectionSite || null,
				needle_gauge: injectableDetails?.needleGauge || null,
				storage_condition: injectableDetails?.storageCondition || null,
				days_since_reconstitution: injectableDetails?.daysSinceReconstitution || null,
				// Source info
				source_type: sourceInfo?.sourceType || null,
				source_verified: sourceInfo?.sourceVerified || null,
				same_batch: sourceInfo?.sameBatch || null,
				// Cycle info
				cycle_length_weeks: cycleLengthWeeks,
				currently_on_cycle: currentlyOnCycle,
				total_breaks_taken: totalBreaks,
				would_use_again: wouldUseAgain,
				why_stopped: whyStopped || null,
				is_repeat_cycle: isRepeatCycle || null,
				recommend_score: recommendScore,
				// Lifestyle factors
				training_intensity: lifestyleFactors?.trainingIntensity || null,
				sleep_quality: lifestyleFactors?.sleepQuality || null,
				stress_level: lifestyleFactors?.stressLevel || null,
				diet_adherence: lifestyleFactors?.dietAdherence || null,
				// Dose response
				dose_response_noticed: doseResponseNoticed || false,
				dose_response_notes: doseResponseNotes || null,
				// Data quality
				data_confidence: dataConfidence || null,
				follow_up_consent: followUpConsent || false,
				pre_existing_conditions: preExistingConditions || null,
				notes: qualitativeNotes
			})
			.select()
			.single();

		if (findingError) {
			console.error('Finding insert error:', findingError);
			return json({ error: 'Failed to create finding' }, { status: 500 });
		}

		// Insert dosing phases with new fields
		if (dosingPhases && dosingPhases.length > 0) {
			const phasesData = dosingPhases.map(
				(
					phase: {
						dose: number;
						doseUnit: string;
						dosesPerWeek: number;
						hoursBetweenDoses?: number;
						durationWeeks: number;
						isBreak: boolean;
						timeOfDay: string;
						mealTiming: string;
						isLoadingDose: boolean;
						notes?: string;
					},
					index: number
				) => ({
					finding_id: finding.id,
					phase_order: index + 1,
					dose: phase.isBreak ? 0 : phase.dose,
					dose_unit: phase.doseUnit,
					duration_weeks: phase.durationWeeks,
					frequency: `${phase.dosesPerWeek}/week`, // Legacy field - keep for backwards compat
					doses_per_week: phase.dosesPerWeek,
					hours_between_doses: phase.hoursBetweenDoses || null,
					is_break: phase.isBreak,
					time_of_day: phase.timeOfDay || null,
					meal_timing: phase.mealTiming || null,
					is_loading_dose: phase.isLoadingDose || false,
					notes: phase.notes
				})
			);

			const { error: phasesError } = await supabase
				.from('finding_dosing_phases')
				.insert(phasesData);

			if (phasesError) {
				console.error('Phases insert error:', phasesError);
			}
		}

		// Insert side effects with new fields
		if (sideEffects && sideEffects.length > 0) {
			const effectsData = sideEffects.map(
				(effect: {
					name: string;
					isKnown: boolean;
					severity: number;
					onsetTiming?: string;
					resolved?: string;
					managementStrategy?: string;
					notes?: string;
				}) => ({
					finding_id: finding.id,
					side_effect_name: effect.name,
					is_known_side_effect: effect.isKnown,
					severity: effect.severity,
					onset_timing: effect.onsetTiming || null,
					resolved: effect.resolved || null,
					management_strategy: effect.managementStrategy || null,
					notes: effect.notes
				})
			);

			const { error: effectsError } = await supabase
				.from('finding_side_effects')
				.insert(effectsData);

			if (effectsError) {
				console.error('Effects insert error:', effectsError);
			}
		}

		// Insert custom side effects as individual entries
		if (customSideEffects && Array.isArray(customSideEffects) && customSideEffects.length > 0) {
			const customEffectsData = customSideEffects
				.filter((effect: { name: string; severity: number }) => effect.name && effect.name.trim())
				.map((effect: { name: string; severity: number }) => ({
					finding_id: finding.id,
					side_effect_name: effect.name.trim(),
					is_known_side_effect: false,
					severity: effect.severity
				}));

			if (customEffectsData.length > 0) {
				const { error: customEffectsError } = await supabase
					.from('finding_side_effects')
					.insert(customEffectsData);

				if (customEffectsError) {
					console.error('Custom effects insert error:', customEffectsError);
				}
			}
		}

		// Insert category-specific results with new fields
		if (categoryResults) {
			const { error: resultsError } = await supabase.from('finding_results').insert({
				finding_id: finding.id,
				category: categoryResults.category,
				effectiveness_rating: effectivenessRating,
				time_to_notice_days: timeToNoticeDays,
				time_to_peak_days: timeToPeakDays || null,
				effect_persistence: effectPersistence || null,
				data: categoryResults.data
			});

			if (resultsError) {
				console.error('Results insert error:', resultsError);
			}
		}

		// Insert custom results (observed effects)
		if (customResults && Array.isArray(customResults) && customResults.length > 0) {
			const customResultsData = customResults
				.filter((result: { name: string; rating: number }) => result.name && result.name.trim())
				.map(
					(result: {
						name: string;
						rating: number;
						timeToNoticeDays?: number;
						confidenceAttribution?: number;
						wasExpected?: boolean;
						notes?: string;
					}) => ({
						finding_id: finding.id,
						effect_name: result.name.trim(),
						rating: result.rating,
						time_to_notice_days: result.timeToNoticeDays || null,
						confidence_attribution: result.confidenceAttribution || null,
						was_expected: result.wasExpected ?? null,
						notes: result.notes || null
					})
				);

			if (customResultsData.length > 0) {
				const { error: customResultsError } = await supabase
					.from('finding_custom_results')
					.insert(customResultsData);

				if (customResultsError) {
					console.error('Custom results insert error:', customResultsError);
				}
			}
		}

		// Insert concurrent compounds
		if (
			concurrentCompounds &&
			Array.isArray(concurrentCompounds) &&
			concurrentCompounds.length > 0
		) {
			const compoundsData = concurrentCompounds
				.filter((compound: { name: string }) => compound.name && compound.name.trim())
				.map(
					(compound: {
						name: string;
						dose?: string;
						durationContext?: string;
						startedTiming?: string;
					}) => ({
						finding_id: finding.id,
						compound_name: compound.name.trim(),
						dose: compound.dose || null,
						duration_context: compound.durationContext || null,
						started_timing: compound.startedTiming || null
					})
				);

			if (compoundsData.length > 0) {
				const { error: compoundsError } = await supabase
					.from('finding_concurrent_compounds')
					.insert(compoundsData);

				if (compoundsError) {
					console.error('Concurrent compounds insert error:', compoundsError);
				}
			}
		}

		return json({
			success: true,
			findingId: finding.id,
			status: finding.status
		});
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
};
