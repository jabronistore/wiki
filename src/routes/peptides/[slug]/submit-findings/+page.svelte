<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		FlaskConical,
		Syringe,
		ClipboardList,
		AlertTriangle,
		Calendar,
		CheckCircle2,
		ChevronRight,
		ChevronLeft,
		Save,
		Send,
		Plus,
		X,
		Info
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Peptide } from '$lib/types';
	import type {
		DosingPhaseInput,
		AdministrationMethod,
		ReconstitutionSolution,
		SideEffectInput,
		CustomSideEffectInput,
		CustomResultInput,
		ConcurrentCompoundInput,
		SourceInfo,
		LifestyleFactors,
		WhyStopped,
		RepeatCycleStatus,
		DataConfidence
	} from '$lib/types/community';
	import { FREQUENCY_PRESETS } from '$lib/types/community';

	// Categorical options for form fields
	const INJURY_TYPE_OPTIONS = [
		{ value: 'tendinitis', label: 'Tendinitis' },
		{ value: 'muscle_strain', label: 'Muscle strain' },
		{ value: 'ligament_sprain', label: 'Ligament sprain' },
		{ value: 'rotator_cuff', label: 'Rotator cuff injury' },
		{ value: 'tennis_elbow', label: 'Tennis/golfer\'s elbow' },
		{ value: 'plantar_fasciitis', label: 'Plantar fasciitis' },
		{ value: 'joint_pain', label: 'Joint pain/arthritis' },
		{ value: 'back_injury', label: 'Back injury' },
		{ value: 'knee_injury', label: 'Knee injury' },
		{ value: 'shoulder_injury', label: 'Shoulder injury' },
		{ value: 'hip_injury', label: 'Hip injury' },
		{ value: 'post_surgery', label: 'Post-surgery recovery' },
		{ value: 'bone_fracture', label: 'Bone fracture' },
		{ value: 'cartilage_damage', label: 'Cartilage damage' },
		{ value: 'other', label: 'Other' }
	];

	const TOPICAL_AREA_OPTIONS = [
		{ value: 'abdomen', label: 'Abdomen' },
		{ value: 'inner_forearm', label: 'Inner forearm' },
		{ value: 'outer_forearm', label: 'Outer forearm' },
		{ value: 'thigh', label: 'Thigh' },
		{ value: 'shoulder', label: 'Shoulder' },
		{ value: 'upper_arm', label: 'Upper arm' },
		{ value: 'scalp', label: 'Scalp' },
		{ value: 'face', label: 'Face' },
		{ value: 'neck', label: 'Neck' },
		{ value: 'back', label: 'Back' },
		{ value: 'chest', label: 'Chest' },
		{ value: 'other', label: 'Other' }
	];

	const OBSERVED_EFFECT_OPTIONS = [
		{ value: 'tan', label: 'Tan/skin darkening' },
		{ value: 'libido_increase', label: 'Libido increase' },
		{ value: 'libido_decrease', label: 'Libido decrease' },
		{ value: 'appetite_suppression', label: 'Appetite suppression' },
		{ value: 'appetite_increase', label: 'Appetite increase' },
		{ value: 'energy_increase', label: 'Energy increase' },
		{ value: 'energy_decrease', label: 'Energy decrease/fatigue' },
		{ value: 'sleep_improvement', label: 'Sleep improvement' },
		{ value: 'sleep_issues', label: 'Sleep issues' },
		{ value: 'mood_improvement', label: 'Mood improvement' },
		{ value: 'anxiety_reduction', label: 'Anxiety reduction' },
		{ value: 'focus_improvement', label: 'Focus/concentration improvement' },
		{ value: 'recovery_speed', label: 'Faster recovery' },
		{ value: 'strength_increase', label: 'Strength increase' },
		{ value: 'endurance_increase', label: 'Endurance increase' },
		{ value: 'muscle_growth', label: 'Muscle growth' },
		{ value: 'fat_loss', label: 'Fat loss' },
		{ value: 'skin_quality', label: 'Skin quality improvement' },
		{ value: 'hair_growth', label: 'Hair growth' },
		{ value: 'nail_growth', label: 'Nail growth' },
		{ value: 'reduced_inflammation', label: 'Reduced inflammation' },
		{ value: 'pain_reduction', label: 'Pain reduction' },
		{ value: 'wound_healing', label: 'Wound/injury healing' },
		{ value: 'joint_health', label: 'Joint health improvement' },
		{ value: 'gut_health', label: 'Gut health improvement' },
		{ value: 'immune_function', label: 'Immune function' },
		{ value: 'erection_quality', label: 'Erection quality' },
		{ value: 'other', label: 'Other' }
	];

	const COMMON_SIDE_EFFECT_OPTIONS = [
		{ value: 'nausea', label: 'Nausea' },
		{ value: 'headache', label: 'Headache' },
		{ value: 'dizziness', label: 'Dizziness' },
		{ value: 'flushing', label: 'Flushing/redness' },
		{ value: 'injection_site_reaction', label: 'Injection site reaction' },
		{ value: 'fatigue', label: 'Fatigue' },
		{ value: 'insomnia', label: 'Insomnia' },
		{ value: 'vivid_dreams', label: 'Vivid dreams' },
		{ value: 'appetite_changes', label: 'Appetite changes' },
		{ value: 'water_retention', label: 'Water retention' },
		{ value: 'joint_pain', label: 'Joint pain' },
		{ value: 'muscle_pain', label: 'Muscle pain' },
		{ value: 'numbness_tingling', label: 'Numbness/tingling' },
		{ value: 'mood_changes', label: 'Mood changes' },
		{ value: 'anxiety', label: 'Anxiety' },
		{ value: 'irritability', label: 'Irritability' },
		{ value: 'heart_palpitations', label: 'Heart palpitations' },
		{ value: 'blood_pressure_changes', label: 'Blood pressure changes' },
		{ value: 'sweating', label: 'Increased sweating' },
		{ value: 'skin_changes', label: 'Skin changes' },
		{ value: 'hair_changes', label: 'Hair changes' },
		{ value: 'gi_issues', label: 'GI issues (bloating, gas, etc.)' },
		{ value: 'dry_mouth', label: 'Dry mouth' },
		{ value: 'other', label: 'Other' }
	];

	const MANAGEMENT_STRATEGY_OPTIONS = [
		{ value: 'reduced_dose', label: 'Reduced dose' },
		{ value: 'took_with_food', label: 'Took with food' },
		{ value: 'changed_timing', label: 'Changed timing' },
		{ value: 'split_doses', label: 'Split doses' },
		{ value: 'added_supplement', label: 'Added supplement' },
		{ value: 'took_medication', label: 'Took medication' },
		{ value: 'hydration', label: 'Increased hydration' },
		{ value: 'rest', label: 'Rest/reduced activity' },
		{ value: 'discontinued_temporarily', label: 'Discontinued temporarily' },
		{ value: 'discontinued_permanently', label: 'Discontinued permanently' },
		{ value: 'no_action', label: 'No action needed - resolved on its own' },
		{ value: 'other', label: 'Other' }
	];

	const COMMON_COMPOUND_OPTIONS = [
		{ value: 'trt', label: 'TRT (Testosterone)' },
		{ value: 'hgh', label: 'HGH (Human Growth Hormone)' },
		{ value: 'hcg', label: 'HCG' },
		{ value: 'bpc-157', label: 'BPC-157' },
		{ value: 'tb-500', label: 'TB-500' },
		{ value: 'mk-677', label: 'MK-677 (Ibutamoren)' },
		{ value: 'cjc-1295', label: 'CJC-1295' },
		{ value: 'ipamorelin', label: 'Ipamorelin' },
		{ value: 'pt-141', label: 'PT-141' },
		{ value: 'melanotan-2', label: 'Melanotan II' },
		{ value: 'tirzepatide', label: 'Tirzepatide' },
		{ value: 'semaglutide', label: 'Semaglutide' },
		{ value: 'retatrutide', label: 'Retatrutide' },
		{ value: 'sermorelin', label: 'Sermorelin' },
		{ value: 'tesamorelin', label: 'Tesamorelin' },
		{ value: 'ghk-cu', label: 'GHK-Cu' },
		{ value: 'thymosin-alpha', label: 'Thymosin Alpha-1' },
		{ value: 'creatine', label: 'Creatine' },
		{ value: 'vitamin_d', label: 'Vitamin D' },
		{ value: 'fish_oil', label: 'Fish oil/Omega-3' },
		{ value: 'magnesium', label: 'Magnesium' },
		{ value: 'zinc', label: 'Zinc' },
		{ value: 'ashwagandha', label: 'Ashwagandha' },
		{ value: 'other', label: 'Other' }
	];

	let { data }: { data: PageData } = $props();
	const peptide = data.peptide as Peptide;

	// Wizard state
	let currentStep = $state(0);
	let isSubmitting = $state(false);
	let error = $state('');

	const steps = [
		{ id: 'dosing', label: 'Dosing Schedule', icon: FlaskConical },
		{ id: 'administration', label: 'Administration', icon: Syringe },
		{ id: 'results', label: 'Results', icon: ClipboardList },
		{ id: 'side-effects', label: 'Side Effects', icon: AlertTriangle },
		{ id: 'cycle', label: 'Cycle Info', icon: Calendar },
		{ id: 'review', label: 'Review', icon: CheckCircle2 }
	];

	// Form data
	let dosingPhases = $state<DosingPhaseInput[]>([
		{
			dose: 250,
			doseUnit: 'mcg',
			dosesPerWeek: 7,
			durationWeeks: 4,
			isBreak: false,
			timeOfDay: 'evening',
			mealTiming: 'fasted',
			isLoadingDose: false
		}
	]);

	let administrationMethod = $state<AdministrationMethod>('subq');
	let reconstitution = $state({
		vialSizeMg: 5,
		diluentType: 'bac_water' as ReconstitutionSolution,
		diluentVolumeMl: 2,
		injectionDosesPerWeek: 7
	});

	// Injectable details (Step 2)
	let injectableDetails = $state({
		injectionSite: 'abdomen' as 'abdomen' | 'love_handles' | 'thigh' | 'deltoid' | 'gluteal' | 'vastus_lateralis' | 'rotated',
		needleGauge: '29g' as '27g' | '29g' | '30g' | '31g' | 'insulin_syringe',
		storageCondition: 'refrigerated' as 'refrigerated' | 'room_temp',
		daysSinceReconstitution: 0
	});

	// Source info (Step 2)
	let sourceInfo = $state<SourceInfo>({
		sourceType: 'research_supplier',
		sourceVerified: 'yes',
		sameBatch: 'yes'
	});

	// Non-injectable administration details
	let nasalDetails = $state({
		concentration: 0,
		sprayVolume: 0.1,
		spraysPerDose: 1,
		nostrilApplication: 'both' as 'one' | 'both' | 'alternating'
	});

	let oralDetails = $state({
		form: 'capsule' as 'capsule' | 'tablet' | 'liquid' | 'powder',
		timing: 'empty_stomach' as 'empty_stomach' | 'with_food' | 'before_food' | 'after_food' | 'any'
	});

	let topicalDetails = $state({
		form: 'cream' as 'cream' | 'gel' | 'solution' | 'patch' | 'spray',
		applicationArea: 'abdomen',
		applicationAreaOther: ''
	});

	let sublingualDetails = $state({
		form: 'tablet' as 'tablet' | 'drops' | 'spray' | 'troche',
		holdDuration: 2
	});

	// Track custom frequency inputs for each phase
	let customFrequencyInputs = $state<Record<number, number>>({});

	// Results - category specific
	let effectivenessRating = $state(7);
	let timeToNoticeDays = $state(14);
	let timeToPeakDays = $state(30);
	let effectPersistence = $state<'ongoing' | 'less_than_week' | '1_to_4_weeks' | '1_to_3_months' | 'more_than_3_months'>('ongoing');
	let doseResponseNoticed = $state(false);
	let doseResponseNotes = $state('');
	let qualitativeNotes = $state('');

	// Category-specific results
	let healingResults = $state({
		injuryType: 'tendinitis',
		injuryTypeOther: '',
		prePainLevel: 5,
		postPainLevel: 2,
		healingTimelineDays: 30,
		mobilityImprovement: 7
	});

	let weightLossResults = $state({
		startingWeightKg: 0,
		endingWeightKg: 0,
		appetiteChange: 5,
		energyLevel: 5
	});

	let cognitiveResults = $state<Record<string, number>>({
		focusImprovement: 5,
		memoryImprovement: 5,
		moodStability: 5,
		anxietyReduction: 5
	});

	// Side effects
	let selectedSideEffects = $state<Record<string, SideEffectInput>>({});
	let customSideEffects = $state<CustomSideEffectInput[]>([]);

	// Cycle info
	let cycleLengthWeeks = $state(8);
	let currentlyOnCycle = $state(true);
	let totalBreaks = $state(0);
	let wouldUseAgain = $state<'yes' | 'no' | 'maybe'>('yes');
	let whyStopped = $state<WhyStopped | ''>('');
	let isRepeatCycle = $state<RepeatCycleStatus>('first_time');
	let recommendScore = $state(7);
	let concurrentCompounds = $state<ConcurrentCompoundInput[]>([]);

	// Lifestyle factors
	let lifestyleFactors = $state<LifestyleFactors>({
		trainingIntensity: 'moderate',
		sleepQuality: 'good',
		stressLevel: 'moderate',
		dietAdherence: 'good'
	});

	// Step 6: Data quality
	let dataConfidence = $state<DataConfidence>('somewhat_confident');
	let followUpConsent = $state(false);
	let preExistingConditions = $state('');

	// Custom results for peptides without predefined categories
	let customResults = $state<CustomResultInput[]>([]);

	// Computed
	let primaryCategory = $derived(peptide.categories?.[0] || 'other');
	// Filter out non-side-effect items (notes like "Generally well-tolerated")
	let knownSideEffects = $derived(
		(peptide.sideEffects?.common || []).filter(
			(effect) =>
				!effect.toLowerCase().includes('generally well-tolerated') &&
				!effect.toLowerCase().includes('well tolerated') &&
				!effect.toLowerCase().includes('limited human data') &&
				!effect.toLowerCase().includes('minimal side effects') &&
				!effect.toLowerCase().includes('no significant') &&
				!effect.toLowerCase().includes('safety profile') &&
				effect.length > 3
		)
	);

	// Get available administration methods based on peptide's delivery methods
	let availableAdministrationMethods = $derived(() => {
		const deliveryTypes = peptide.deliveryMethods?.map((dm) => dm.type) || [];
		const methods: { value: AdministrationMethod; label: string }[] = [];

		// Map peptide delivery types to administration methods
		if (deliveryTypes.includes('injectable') || deliveryTypes.length === 0) {
			methods.push(
				{ value: 'subq', label: 'Subcutaneous (SubQ)' },
				{ value: 'im', label: 'Intramuscular (IM)' },
				{ value: 'iv', label: 'Intravenous (IV)' }
			);
		}
		if (deliveryTypes.includes('nasal')) {
			methods.push({ value: 'nasal', label: 'Nasal Spray' });
		}
		if (deliveryTypes.includes('oral')) {
			methods.push({ value: 'oral', label: 'Oral' });
		}
		if (deliveryTypes.includes('topical')) {
			methods.push({ value: 'topical', label: 'Topical' });
		}
		if (deliveryTypes.includes('sublingual')) {
			methods.push({ value: 'sublingual', label: 'Sublingual' });
		}

		// Always include "Other" option in case data is incomplete
		if (methods.length === 0) {
			// Fallback to all methods if no delivery methods defined
			return allAdministrationMethods;
		}

		return methods;
	});

	// Track if using custom injection frequency
	let customInjectionFrequency = $state(false);
	let customInjectionFrequencyValue = $state(7);

	function addDosingPhase() {
		dosingPhases = [
			...dosingPhases,
			{
				dose: 250,
				doseUnit: 'mcg',
				dosesPerWeek: 7,
				durationWeeks: 4,
				isBreak: false,
				timeOfDay: 'evening',
				mealTiming: 'fasted',
				isLoadingDose: false
			}
		];
	}

	function addCustomSideEffect() {
		customSideEffects = [...customSideEffects, { name: '', severity: 2 }];
	}

	function addCustomResult() {
		customResults = [
			...customResults,
			{
				name: '',
				rating: 7,
				timeToNoticeDays: 14,
				confidenceAttribution: 3,
				wasExpected: true,
				notes: ''
			}
		];
	}

	function removeCustomResult(index: number) {
		customResults = customResults.filter((_, i) => i !== index);
	}

	function addConcurrentCompound() {
		concurrentCompounds = [
			...concurrentCompounds,
			{
				name: '',
				dose: '',
				durationContext: 'entire_cycle',
				startedTiming: 'before_peptide'
			}
		];
	}

	function removeConcurrentCompound(index: number) {
		concurrentCompounds = concurrentCompounds.filter((_, i) => i !== index);
	}

	function removeCustomSideEffect(index: number) {
		customSideEffects = customSideEffects.filter((_, i) => i !== index);
	}

	function updateCustomSideEffectName(index: number, name: string) {
		customSideEffects = customSideEffects.map((effect, i) =>
			i === index ? { ...effect, name } : effect
		);
	}

	function updateCustomSideEffectSeverity(index: number, severity: 1 | 2 | 3 | 4 | 5) {
		customSideEffects = customSideEffects.map((effect, i) =>
			i === index ? { ...effect, severity } : effect
		);
	}

	function getFrequencyLabel(dosesPerWeek: number): string {
		const preset = FREQUENCY_PRESETS.find((p) => p.value === dosesPerWeek);
		if (preset && preset.value !== -1) return preset.label;
		return `${dosesPerWeek} doses/week`;
	}

	function handleFrequencyChange(phaseIndex: number, value: number) {
		if (value === -1) {
			// Custom selected - use custom input value
			customFrequencyInputs[phaseIndex] = customFrequencyInputs[phaseIndex] || 3;
			dosingPhases = dosingPhases.map((phase, i) =>
				i === phaseIndex ? { ...phase, dosesPerWeek: customFrequencyInputs[phaseIndex] } : phase
			);
		} else {
			// Preset selected
			delete customFrequencyInputs[phaseIndex];
			dosingPhases = dosingPhases.map((phase, i) =>
				i === phaseIndex ? { ...phase, dosesPerWeek: value } : phase
			);
		}
	}

	function handleCustomFrequencyInput(phaseIndex: number, value: number) {
		customFrequencyInputs[phaseIndex] = value;
		dosingPhases = dosingPhases.map((phase, i) =>
			i === phaseIndex ? { ...phase, dosesPerWeek: value } : phase
		);
	}

	function isCustomFrequency(phaseIndex: number): boolean {
		return phaseIndex in customFrequencyInputs;
	}

	function getSelectedPresetValue(phase: DosingPhaseInput, phaseIndex: number): number {
		if (isCustomFrequency(phaseIndex)) return -1;
		const preset = FREQUENCY_PRESETS.find((p) => p.value === phase.dosesPerWeek);
		return preset ? preset.value : -1;
	}

	function removeDosingPhase(index: number) {
		dosingPhases = dosingPhases.filter((_, i) => i !== index);
	}

	function toggleSideEffect(effect: string) {
		if (selectedSideEffects[effect]) {
			const { [effect]: _, ...rest } = selectedSideEffects;
			selectedSideEffects = rest;
		} else {
			selectedSideEffects = {
				...selectedSideEffects,
				[effect]: {
					name: effect,
					isKnown: true,
					severity: 2,
					onsetTiming: 'early',
					resolved: 'not_applicable'
				}
			};
		}
	}

	function updateSeverity(effect: string, severity: 1 | 2 | 3 | 4 | 5) {
		if (selectedSideEffects[effect]) {
			selectedSideEffects = {
				...selectedSideEffects,
				[effect]: { ...selectedSideEffects[effect], severity }
			};
		}
	}

	function nextStep() {
		if (currentStep < steps.length - 1) {
			currentStep++;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	async function saveDraft() {
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/findings`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					peptideId: peptide.id,
					status: 'draft',
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
					categoryResults: getCategoryResults(),
					customResults,
					sideEffects: Object.values(selectedSideEffects),
					customSideEffects,
					cycleLengthWeeks,
					currentlyOnCycle,
					totalBreaks,
					wouldUseAgain,
					whyStopped: whyStopped || null,
					isRepeatCycle,
					recommendScore,
					lifestyleFactors,
					concurrentCompounds,
					dataConfidence,
					followUpConsent,
					preExistingConditions
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to save draft');
			}

			goto('/profile/my-submissions?saved=true');
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	async function publishFindings() {
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/findings`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					peptideId: peptide.id,
					status: 'published',
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
					categoryResults: getCategoryResults(),
					customResults,
					sideEffects: Object.values(selectedSideEffects),
					customSideEffects,
					cycleLengthWeeks,
					currentlyOnCycle,
					totalBreaks,
					wouldUseAgain,
					whyStopped: whyStopped || null,
					isRepeatCycle,
					recommendScore,
					lifestyleFactors,
					concurrentCompounds,
					dataConfidence,
					followUpConsent,
					preExistingConditions
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to publish');
			}

			goto(`/peptides/${peptide.id}/results?published=true`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function getCategoryResults() {
		switch (primaryCategory) {
			case 'healing':
				return { category: 'healing', data: healingResults };
			case 'weight-loss':
				return { category: 'weight_loss', data: weightLossResults };
			case 'cognitive':
				return { category: 'cognitive', data: cognitiveResults };
			default:
				return { category: 'other', data: {} };
		}
	}

	const allAdministrationMethods: { value: AdministrationMethod; label: string }[] = [
		{ value: 'subq', label: 'Subcutaneous (SubQ)' },
		{ value: 'im', label: 'Intramuscular (IM)' },
		{ value: 'iv', label: 'Intravenous (IV)' },
		{ value: 'oral', label: 'Oral' },
		{ value: 'nasal', label: 'Nasal Spray' },
		{ value: 'topical', label: 'Topical' },
		{ value: 'sublingual', label: 'Sublingual' }
	];

	// Helper functions to get display labels for categorical values
	function getInjuryTypeLabel(value: string, otherText?: string): string {
		if (value === 'other' && otherText) return otherText;
		const option = INJURY_TYPE_OPTIONS.find(o => o.value === value);
		return option?.label || value;
	}

	function getTopicalAreaLabel(value: string, otherText?: string): string {
		if (value === 'other' && otherText) return otherText;
		const option = TOPICAL_AREA_OPTIONS.find(o => o.value === value);
		return option?.label || value;
	}

	function getEffectLabel(value: string, otherText?: string): string {
		if (value === 'other' && otherText) return otherText;
		const option = OBSERVED_EFFECT_OPTIONS.find(o => o.value === value);
		return option?.label || value;
	}

	function getSideEffectLabel(value: string, otherText?: string): string {
		if (value === 'other' && otherText) return otherText;
		const option = COMMON_SIDE_EFFECT_OPTIONS.find(o => o.value === value);
		return option?.label || value;
	}

	function getCompoundLabel(value: string, otherText?: string): string {
		if (value === 'other' && otherText) return otherText;
		const option = COMMON_COMPOUND_OPTIONS.find(o => o.value === value);
		return option?.label || value;
	}

	function getManagementLabel(value: string, otherText?: string): string {
		if (value === 'other' && otherText) return otherText;
		const option = MANAGEMENT_STRATEGY_OPTIONS.find(o => o.value === value);
		return option?.label || value;
	}
</script>

<svelte:head>
	<title>Submit Research Findings - {peptide.name} | Peptide Database</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<div class="wizard-header">
		<div class="max-w-4xl mx-auto px-4 py-6">
			<div class="flex items-center gap-3 mb-2">
				<a href="/peptides/{peptide.id}" class="text-muted-foreground hover:text-foreground transition-colors">
					← Back to {peptide.name}
				</a>
			</div>
			<h1 class="wizard-title">Submit Research Findings</h1>
			<p class="text-muted-foreground mt-1">
				Share your experience with <span class="text-accent font-medium">{peptide.name}</span> to help the research community
			</p>
		</div>
	</div>

	<!-- Progress indicator -->
	<div class="wizard-progress">
		<div class="max-w-4xl mx-auto px-4">
			<div class="progress-track">
				{#each steps as step, i}
					<button
						class="progress-step"
						class:active={i === currentStep}
						class:completed={i < currentStep}
						onclick={() => (currentStep = i)}
						disabled={i > currentStep + 1}
					>
						<div class="step-icon">
							{#if i < currentStep}
								<CheckCircle2 class="h-5 w-5" />
							{:else}
								<step.icon class="h-5 w-5" />
							{/if}
						</div>
						<span class="step-label">{step.label}</span>
						<div class="step-number">{i + 1}</div>
					</button>
					{#if i < steps.length - 1}
						<div class="progress-connector" class:active={i < currentStep}></div>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- Main content -->
	<div class="max-w-4xl mx-auto px-4 py-8">
		{#if error}
			<div class="error-banner">
				<AlertTriangle class="h-5 w-5" />
				<span>{error}</span>
			</div>
		{/if}

		<div class="wizard-card">
			<!-- Step 1: Dosing Schedule -->
			{#if currentStep === 0}
				<div class="step-content" data-step="dosing">
					<div class="step-header">
						<h2>Dosing Schedule</h2>
						<p>Document your dosing protocol including any titration phases</p>
					</div>

					<div class="dosing-phases">
						{#each dosingPhases as phase, i}
							<div class="phase-card" class:break-phase={phase.isBreak}>
								<div class="phase-header">
									<span class="phase-number">Phase {i + 1}</span>
									{#if dosingPhases.length > 1}
										<button class="phase-remove" onclick={() => removeDosingPhase(i)}>
											<X class="h-4 w-4" />
										</button>
									{/if}
								</div>

								<div class="phase-toggle">
									<label class="toggle-option">
										<input
											type="radio"
											name="phase-type-{i}"
											checked={!phase.isBreak}
											onchange={() => (phase.isBreak = false)}
										/>
										<span>Active Dosing</span>
									</label>
									<label class="toggle-option">
										<input
											type="radio"
											name="phase-type-{i}"
											checked={phase.isBreak}
											onchange={() => (phase.isBreak = true)}
										/>
										<span>Break Period</span>
									</label>
								</div>

								{#if !phase.isBreak}
									<div class="phase-fields">
										<div class="field-group">
											<label for="dose-{i}">Dose</label>
											<div class="dose-input">
												<input
													id="dose-{i}"
													type="number"
													bind:value={phase.dose}
													min="0"
													step="1"
													class="dose-value"
												/>
												<select bind:value={phase.doseUnit} class="dose-unit" aria-label="Dose unit">
													<option value="mcg">mcg</option>
													<option value="mg">mg</option>
													<option value="iu">IU</option>
												</select>
											</div>
										</div>

										<div class="field-group">
											<label for="frequency-{i}">Frequency</label>
											<select
												id="frequency-{i}"
												value={getSelectedPresetValue(phase, i)}
												onchange={(e) => handleFrequencyChange(i, parseFloat((e.target as HTMLSelectElement).value))}
											>
												{#each FREQUENCY_PRESETS as preset}
													<option value={preset.value}>{preset.label}</option>
												{/each}
											</select>
											{#if isCustomFrequency(i)}
												<div class="custom-frequency-input">
													<input
														type="number"
														value={customFrequencyInputs[i]}
														onchange={(e) => handleCustomFrequencyInput(i, parseFloat((e.target as HTMLInputElement).value))}
														min="0.5"
														max="28"
														step="0.5"
														aria-label="Custom doses per week"
													/>
													<span class="frequency-unit">doses/week</span>
												</div>
											{/if}
										</div>

										<div class="field-group">
											<label for="time-of-day-{i}">Time of Day</label>
											<select id="time-of-day-{i}" bind:value={phase.timeOfDay}>
												<option value="morning">Morning</option>
												<option value="midday">Midday</option>
												<option value="evening">Evening</option>
												<option value="bedtime">Bedtime</option>
												<option value="split">Split (multiple times)</option>
											</select>
										</div>

										<div class="field-group">
											<label for="meal-timing-{i}">Relative to Meals</label>
											<select id="meal-timing-{i}" bind:value={phase.mealTiming}>
												<option value="fasted">Fasted (empty stomach)</option>
												<option value="with_food">With food</option>
												<option value="before_food">30 min before food</option>
												<option value="after_food">After food</option>
											</select>
										</div>

										{#if phase.dosesPerWeek > 7}
											<div class="field-group full-width">
												<label for="hours-between-{i}">Hours Between Doses</label>
												<div class="input-with-unit">
													<input
														id="hours-between-{i}"
														type="number"
														bind:value={phase.hoursBetweenDoses}
														min="1"
														max="24"
														step="0.5"
														placeholder="e.g., 8"
													/>
													<span>hours</span>
												</div>
												<p class="field-hint">For multiple daily doses, how many hours apart?</p>
											</div>
										{/if}

										<div class="field-group full-width">
											<label class="checkbox-label">
												<input
													type="checkbox"
													bind:checked={phase.isLoadingDose}
												/>
												<span>This is a loading/saturation dose phase</span>
											</label>
											<p class="field-hint">Check if this phase uses a higher initial dose to reach saturation faster</p>
										</div>
									</div>
								{/if}

								<div class="field-group">
									<label for="duration-{i}">Duration</label>
									<div class="duration-input">
										<input
											id="duration-{i}"
											type="number"
											bind:value={phase.durationWeeks}
											min="1"
											max="52"
										/>
										<span class="duration-unit">weeks</span>
									</div>
								</div>
							</div>
						{/each}

						<button class="add-phase-btn" onclick={addDosingPhase}>
							<Plus class="h-4 w-4" />
							Add Phase
						</button>
					</div>

					<div class="info-callout">
						<Info class="h-5 w-5" />
						<p>Include all phases of your protocol, including titration periods and breaks. This helps us understand dosing patterns and their effects.</p>
					</div>
				</div>
			{/if}

			<!-- Step 2: Administration -->
			{#if currentStep === 1}
				<div class="step-content" data-step="administration">
					<div class="step-header">
						<h2>Administration Method</h2>
						<p>How did you administer {peptide.name}?</p>
					</div>

					<div class="method-grid">
						{#each availableAdministrationMethods() as method}
							<button
								class="method-card"
								class:selected={administrationMethod === method.value}
								onclick={() => (administrationMethod = method.value)}
							>
								<span class="method-label">{method.label}</span>
							</button>
						{/each}
					</div>

					{#if availableAdministrationMethods().length < allAdministrationMethods.length}
						<p class="method-note">
							Showing methods available for {peptide.name}. <button
								class="link-btn"
								onclick={() => {
									/* Show all */
								}}>See all options</button
							>
						</p>
					{/if}

					{#if ['subq', 'im', 'iv'].includes(administrationMethod)}
						<div class="reconstitution-section">
							<h3>Reconstitution Details</h3>

							<div class="recon-grid">
								<div class="field-group">
									<label for="vial-size">Vial Size</label>
									<div class="input-with-unit">
										<input id="vial-size" type="number" bind:value={reconstitution.vialSizeMg} min="0" step="0.5" />
										<span>mg</span>
									</div>
								</div>

								<div class="field-group">
									<label for="diluent-type">Diluent Type</label>
									<select id="diluent-type" bind:value={reconstitution.diluentType}>
										<option value="bac_water">Bacteriostatic Water</option>
										<option value="sterile_water">Sterile Water</option>
										<option value="saline">Saline (0.9%)</option>
										<option value="other">Other</option>
									</select>
								</div>

								<div class="field-group">
									<label for="diluent-volume">Diluent Volume</label>
									<div class="input-with-unit">
										<input id="diluent-volume" type="number" bind:value={reconstitution.diluentVolumeMl} min="0" step="0.1" />
										<span>mL</span>
									</div>
								</div>

								<div class="field-group">
									<label for="injection-frequency">Injection Frequency</label>
									<select
										id="injection-frequency"
										value={customInjectionFrequency ? -1 : reconstitution.injectionDosesPerWeek}
										onchange={(e) => {
											const val = parseFloat((e.target as HTMLSelectElement).value);
											if (val === -1) {
												customInjectionFrequency = true;
												reconstitution.injectionDosesPerWeek = customInjectionFrequencyValue;
											} else {
												customInjectionFrequency = false;
												reconstitution.injectionDosesPerWeek = val;
											}
										}}
									>
										{#each FREQUENCY_PRESETS as preset}
											<option value={preset.value}>{preset.label}</option>
										{/each}
									</select>
									{#if customInjectionFrequency}
										<div class="custom-frequency-input">
											<input
												type="number"
												bind:value={customInjectionFrequencyValue}
												oninput={() => {
													reconstitution.injectionDosesPerWeek = customInjectionFrequencyValue;
												}}
												min="0.5"
												max="28"
												step="0.5"
												aria-label="Custom injections per week"
											/>
											<span class="frequency-unit">injections/week</span>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<div class="admin-details-section">
							<h3>Injection Details</h3>
							<div class="admin-grid">
								<div class="field-group">
									<label for="injection-site">Injection Site</label>
									<select id="injection-site" bind:value={injectableDetails.injectionSite}>
										<option value="abdomen">Abdomen</option>
										<option value="love_handles">Love handles</option>
										<option value="thigh">Thigh</option>
										<option value="deltoid">Deltoid</option>
										<option value="gluteal">Gluteal</option>
										<option value="vastus_lateralis">Vastus lateralis</option>
										<option value="rotated">Rotated sites</option>
									</select>
								</div>
								<div class="field-group">
									<label for="needle-gauge">Needle Gauge</label>
									<select id="needle-gauge" bind:value={injectableDetails.needleGauge}>
										<option value="27g">27 gauge</option>
										<option value="29g">29 gauge</option>
										<option value="30g">30 gauge</option>
										<option value="31g">31 gauge</option>
										<option value="insulin_syringe">Insulin syringe</option>
									</select>
								</div>
								<div class="field-group">
									<label for="storage-condition">Storage Condition</label>
									<select id="storage-condition" bind:value={injectableDetails.storageCondition}>
										<option value="refrigerated">Refrigerated</option>
										<option value="room_temp">Room temperature</option>
									</select>
								</div>
								<div class="field-group">
									<label for="days-since-recon">Days Since Reconstitution</label>
									<div class="input-with-unit">
										<input id="days-since-recon" type="number" bind:value={injectableDetails.daysSinceReconstitution} min="0" max="60" />
										<span>days avg</span>
									</div>
								</div>
							</div>
						</div>
					{:else if administrationMethod === 'nasal'}
						<div class="admin-details-section">
							<h3>Nasal Spray Details</h3>
							<div class="admin-grid">
								<div class="field-group">
									<label for="nasal-concentration">Spray Concentration</label>
									<div class="input-with-unit">
										<input id="nasal-concentration" type="number" bind:value={nasalDetails.concentration} min="0" step="0.1" />
										<span>mg/mL</span>
									</div>
								</div>
								<div class="field-group">
									<label for="nasal-spray-volume">Volume per Spray</label>
									<div class="input-with-unit">
										<input id="nasal-spray-volume" type="number" bind:value={nasalDetails.sprayVolume} min="0" step="0.01" placeholder="0.1" />
										<span>mL</span>
									</div>
								</div>
								<div class="field-group">
									<label for="nasal-sprays">Sprays per Dose</label>
									<input id="nasal-sprays" type="number" bind:value={nasalDetails.spraysPerDose} min="1" max="10" />
								</div>
								<div class="field-group">
									<label for="nasal-nostril">Application</label>
									<select id="nasal-nostril" bind:value={nasalDetails.nostrilApplication}>
										<option value="one">One nostril</option>
										<option value="both">Both nostrils</option>
										<option value="alternating">Alternating nostrils</option>
									</select>
								</div>
							</div>
						</div>
					{:else if administrationMethod === 'oral'}
						<div class="admin-details-section">
							<h3>Oral Administration Details</h3>
							<div class="admin-grid">
								<div class="field-group">
									<label for="oral-form">Form</label>
									<select id="oral-form" bind:value={oralDetails.form}>
										<option value="capsule">Capsule</option>
										<option value="tablet">Tablet</option>
										<option value="liquid">Liquid</option>
										<option value="powder">Powder</option>
									</select>
								</div>
								<div class="field-group">
									<label for="oral-timing">Timing</label>
									<select id="oral-timing" bind:value={oralDetails.timing}>
										<option value="empty_stomach">Empty stomach</option>
										<option value="with_food">With food</option>
										<option value="before_food">Before food</option>
										<option value="after_food">After food</option>
										<option value="any">Any time</option>
									</select>
								</div>
							</div>
						</div>
					{:else if administrationMethod === 'topical'}
						<div class="admin-details-section">
							<h3>Topical Application Details</h3>
							<div class="admin-grid">
								<div class="field-group">
									<label for="topical-form">Form</label>
									<select id="topical-form" bind:value={topicalDetails.form}>
										<option value="cream">Cream</option>
										<option value="gel">Gel</option>
										<option value="solution">Solution</option>
										<option value="patch">Patch</option>
										<option value="spray">Spray</option>
									</select>
								</div>
								<div class="field-group">
									<label for="topical-area">Application Area</label>
									<select id="topical-area" bind:value={topicalDetails.applicationArea}>
										{#each TOPICAL_AREA_OPTIONS as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
									{#if topicalDetails.applicationArea === 'other'}
										<input
											type="text"
											bind:value={topicalDetails.applicationAreaOther}
											placeholder="Please specify the application area"
											class="other-input"
										/>
									{/if}
								</div>
							</div>
						</div>
					{:else if administrationMethod === 'sublingual'}
						<div class="admin-details-section">
							<h3>Sublingual Details</h3>
							<div class="admin-grid">
								<div class="field-group">
									<label for="sublingual-form">Form</label>
									<select id="sublingual-form" bind:value={sublingualDetails.form}>
										<option value="tablet">Tablet</option>
										<option value="drops">Drops</option>
										<option value="spray">Spray</option>
										<option value="troche">Troche</option>
									</select>
								</div>
								<div class="field-group">
									<label for="sublingual-duration">Hold Duration</label>
									<div class="input-with-unit">
										<input id="sublingual-duration" type="number" bind:value={sublingualDetails.holdDuration} min="0" max="30" />
										<span>minutes</span>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Source Info - Always shown -->
					<div class="admin-details-section source-section">
						<h3>Source & Quality</h3>
						<div class="admin-grid">
							<div class="field-group">
								<label for="source-type">Source Type</label>
								<select id="source-type" bind:value={sourceInfo.sourceType}>
									<option value="compounding_pharmacy">Compounding pharmacy</option>
									<option value="research_supplier">Research supplier</option>
									<option value="other">Other</option>
									<option value="prefer_not_say">Prefer not to say</option>
								</select>
							</div>
							<div class="field-group">
								<label for="source-verified">Did you verify your source?</label>
								<select id="source-verified" bind:value={sourceInfo.sourceVerified}>
									<option value="yes">Yes</option>
									<option value="no">No</option>
									<option value="prefer_not_say">Prefer not to say</option>
								</select>
							</div>
							<div class="field-group">
								<label for="same-batch">Same batch throughout cycle?</label>
								<select id="same-batch" bind:value={sourceInfo.sameBatch}>
									<option value="yes">Yes, same batch</option>
									<option value="no">No, different batch</option>
									<option value="multiple_batches">Multiple batches</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 3: Results -->
			{#if currentStep === 2}
				<div class="step-content" data-step="results">
					<div class="step-header">
						<h2>Results & Outcomes</h2>
						<p>Document the effects you observed</p>
					</div>

					<div class="results-section">
						<div class="rating-group">
							<span class="rating-label" id="effectiveness-label">Overall Effectiveness</span>
							<div class="rating-scale" role="group" aria-labelledby="effectiveness-label">
								{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n}
									<button
										class="rating-btn"
										class:selected={effectivenessRating === n}
										onclick={() => (effectivenessRating = n)}
										aria-label="Rate {n} out of 10"
									>
										{n}
									</button>
								{/each}
							</div>
							<div class="rating-labels">
								<span>Not effective</span>
								<span>Extremely effective</span>
							</div>
						</div>

						<div class="results-timing-grid">
							<div class="field-group">
								<label for="time-to-notice">Time to First Notice Effects</label>
								<div class="input-with-unit">
									<input id="time-to-notice" type="number" bind:value={timeToNoticeDays} min="0" />
									<span>days</span>
								</div>
							</div>

							<div class="field-group">
								<label for="time-to-peak">Time to Peak/Stable Effects</label>
								<div class="input-with-unit">
									<input id="time-to-peak" type="number" bind:value={timeToPeakDays} min="0" />
									<span>days</span>
								</div>
							</div>
						</div>

						<div class="field-group">
							<label for="effect-persistence">Effect Persistence After Stopping</label>
							<select id="effect-persistence" bind:value={effectPersistence}>
								<option value="ongoing">Still ongoing (haven't stopped)</option>
								<option value="less_than_week">Less than 1 week</option>
								<option value="1_to_4_weeks">1-4 weeks</option>
								<option value="1_to_3_months">1-3 months</option>
								<option value="more_than_3_months">More than 3 months</option>
							</select>
						</div>

						<div class="field-group">
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={doseResponseNoticed}
								/>
								<span>Did you notice effects change with different doses?</span>
							</label>
							{#if doseResponseNoticed}
								<textarea
									bind:value={doseResponseNotes}
									rows="2"
									placeholder="Describe how effects changed with different doses..."
									class="dose-response-notes"
								></textarea>
							{/if}
						</div>

						<!-- Category-specific questions -->
						{#if primaryCategory === 'healing'}
							<div class="category-questions">
								<h3>Healing-Specific Questions</h3>

								<div class="field-group">
									<label for="injury-type">Type of Injury/Condition</label>
									<select id="injury-type" bind:value={healingResults.injuryType}>
										{#each INJURY_TYPE_OPTIONS as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
									{#if healingResults.injuryType === 'other'}
										<input
											type="text"
											bind:value={healingResults.injuryTypeOther}
											placeholder="Please specify the injury/condition"
											class="other-input"
										/>
									{/if}
								</div>

								<div class="slider-group">
									<label for="pre-pain-level">Pain Level Before Treatment</label>
									<input
										id="pre-pain-level"
										type="range"
										min="0"
										max="10"
										bind:value={healingResults.prePainLevel}
									/>
									<div class="slider-labels">
										<span>No pain (0)</span>
										<span class="slider-value">{healingResults.prePainLevel}</span>
										<span>Severe (10)</span>
									</div>
								</div>

								<div class="slider-group">
									<label for="post-pain-level">Pain Level After Treatment</label>
									<input
										id="post-pain-level"
										type="range"
										min="0"
										max="10"
										bind:value={healingResults.postPainLevel}
									/>
									<div class="slider-labels">
										<span>No pain (0)</span>
										<span class="slider-value">{healingResults.postPainLevel}</span>
										<span>Severe (10)</span>
									</div>
								</div>

								<div class="field-group">
									<label for="healing-timeline">Healing Timeline</label>
									<div class="input-with-unit">
										<input id="healing-timeline" type="number" bind:value={healingResults.healingTimelineDays} min="0" />
										<span>days</span>
									</div>
								</div>

								<div class="slider-group">
									<label for="mobility-improvement">Mobility/Function Improvement</label>
									<input
										id="mobility-improvement"
										type="range"
										min="0"
										max="10"
										bind:value={healingResults.mobilityImprovement}
									/>
									<div class="slider-labels">
										<span>None (0)</span>
										<span class="slider-value">{healingResults.mobilityImprovement}</span>
										<span>Complete (10)</span>
									</div>
								</div>
							</div>
						{:else if primaryCategory === 'weight-loss'}
							<div class="category-questions">
								<h3>Weight Loss Questions</h3>

								<div class="weight-grid">
									<div class="field-group">
										<label for="starting-weight">Starting Weight</label>
										<div class="input-with-unit">
											<input id="starting-weight" type="number" bind:value={weightLossResults.startingWeightKg} min="0" step="0.1" />
											<span>kg</span>
										</div>
									</div>

									<div class="field-group">
										<label for="ending-weight">Current/Ending Weight</label>
										<div class="input-with-unit">
											<input id="ending-weight" type="number" bind:value={weightLossResults.endingWeightKg} min="0" step="0.1" />
											<span>kg</span>
										</div>
									</div>
								</div>

								<div class="slider-group">
									<label for="appetite-change">Appetite Change</label>
									<input
										id="appetite-change"
										type="range"
										min="1"
										max="10"
										bind:value={weightLossResults.appetiteChange}
									/>
									<div class="slider-labels">
										<span>Much less (1)</span>
										<span class="slider-value">{weightLossResults.appetiteChange}</span>
										<span>Much more (10)</span>
									</div>
								</div>

								<div class="slider-group">
									<label for="energy-level">Energy Levels</label>
									<input
										id="energy-level"
										type="range"
										min="1"
										max="10"
										bind:value={weightLossResults.energyLevel}
									/>
									<div class="slider-labels">
										<span>Very low (1)</span>
										<span class="slider-value">{weightLossResults.energyLevel}</span>
										<span>Very high (10)</span>
									</div>
								</div>
							</div>
						{:else if primaryCategory === 'cognitive'}
							<div class="category-questions">
								<h3>Cognitive Effects</h3>

								{#each [
									{ key: 'focusImprovement', label: 'Focus Improvement' },
									{ key: 'memoryImprovement', label: 'Memory Improvement' },
									{ key: 'moodStability', label: 'Mood Stability' },
									{ key: 'anxietyReduction', label: 'Anxiety Reduction' }
								] as item}
									<div class="slider-group">
										<label for="cognitive-{item.key}">{item.label}</label>
										<input
											id="cognitive-{item.key}"
											type="range"
											min="1"
											max="10"
											bind:value={cognitiveResults[item.key]}
										/>
										<div class="slider-labels">
											<span>No change (1)</span>
											<span class="slider-value">{cognitiveResults[item.key]}</span>
											<span>Significant (10)</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Custom Results Section - always show so users can add any effects they noticed -->
						<div class="custom-results-section">
							<h3>Observed Effects</h3>
							<p class="text-sm text-muted-foreground mb-4">Add each effect you noticed from {peptide.name} and rate it individually</p>

							{#if customResults.length > 0}
								<div class="custom-results-list">
									{#each customResults as result, i}
										<div class="custom-result-item">
											<div class="result-header">
												<select
													bind:value={result.name}
													class="result-name-select"
													aria-label="Effect name"
												>
													<option value="">Select an effect...</option>
													{#each OBSERVED_EFFECT_OPTIONS as option}
														<option value={option.value}>{option.label}</option>
													{/each}
												</select>
												{#if result.name === 'other'}
													<input
														type="text"
														bind:value={result.nameOther}
														placeholder="Please specify the effect"
														class="other-input-inline"
														aria-label="Other effect name"
													/>
												{/if}
												<button
													type="button"
													class="remove-result-btn"
													onclick={() => removeCustomResult(i)}
													aria-label="Remove effect"
												>
													<X class="h-4 w-4" />
												</button>
											</div>

											<div class="result-details">
												<div class="result-rating">
													<span class="rating-label-small">Effectiveness:</span>
													<div class="rating-scale-small">
														{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n}
															<button
																type="button"
																class="rating-btn-small"
																class:selected={result.rating === n}
																onclick={() => (result.rating = n)}
															>
																{n}
															</button>
														{/each}
													</div>
												</div>

												<div class="result-time">
													<label for="result-time-{i}">Time to notice:</label>
													<div class="input-with-unit-small">
														<input
															id="result-time-{i}"
															type="number"
															bind:value={result.timeToNoticeDays}
															min="0"
															max="365"
														/>
														<span>days</span>
													</div>
												</div>
											</div>

											<div class="result-meta">
												<div class="confidence-rating">
													<span class="rating-label-small">Confidence this was from the peptide:</span>
													<div class="confidence-scale">
														{#each [1, 2, 3, 4, 5] as n}
															<button
																type="button"
																class="confidence-btn"
																class:selected={result.confidenceAttribution === n}
																onclick={() => (result.confidenceAttribution = n as 1|2|3|4|5)}
															>
																{n}
															</button>
														{/each}
													</div>
													<span class="confidence-labels">Low → High</span>
												</div>

												<label class="checkbox-label-small">
													<input
														type="checkbox"
														bind:checked={result.wasExpected}
													/>
													<span>This was an expected effect based on my research</span>
												</label>
											</div>

											<textarea
												bind:value={result.notes}
												placeholder="Notes about this effect (optional)"
												rows="2"
												class="result-notes"
											></textarea>
										</div>
									{/each}
								</div>
							{/if}

							<button type="button" class="add-result-btn" onclick={addCustomResult}>
								<Plus class="h-4 w-4" />
								Add Effect
							</button>
						</div>

						<div class="field-group">
							<label for="detailed-notes">General Notes</label>
							<textarea
								id="detailed-notes"
								bind:value={qualitativeNotes}
								rows="4"
								placeholder="Any additional notes about your overall experience..."
							></textarea>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 4: Side Effects -->
			{#if currentStep === 3}
				<div class="step-content" data-step="side-effects">
					<div class="step-header">
						<h2>Side Effects</h2>
						<p>Report any side effects you experienced</p>
					</div>

					{#if knownSideEffects.length > 0}
						<div class="side-effects-list">
							<h3>Known Side Effects for {peptide.name}</h3>
							<p class="text-sm text-muted-foreground mb-4">Select any that you experienced and rate their severity</p>

							{#each knownSideEffects as effect}
								<div class="side-effect-item" class:selected={selectedSideEffects[effect]}>
									<label class="effect-toggle">
										<input
											type="checkbox"
											checked={!!selectedSideEffects[effect]}
											onchange={() => toggleSideEffect(effect)}
										/>
										<span>{effect}</span>
									</label>

									{#if selectedSideEffects[effect]}
										<div class="side-effect-details">
											<div class="severity-selector">
												<span class="severity-label">Severity:</span>
												{#each [1, 2, 3, 4, 5] as s (s)}
													<button
														class="severity-btn"
														class:selected={selectedSideEffects[effect]?.severity === s}
														onclick={() => updateSeverity(effect, s as 1 | 2 | 3 | 4 | 5)}
													>
														{s}
													</button>
												{/each}
												<span class="severity-scale">Mild → Severe</span>
											</div>

											<div class="side-effect-meta">
												<div class="field-group-inline">
													<label for="onset-{effect}">Onset:</label>
													<select
														id="onset-{effect}"
														bind:value={selectedSideEffects[effect].onsetTiming}
													>
														<option value="immediate">Immediate (same day)</option>
														<option value="early">Early (first week)</option>
														<option value="delayed">Delayed (>1 week)</option>
													</select>
												</div>

												<div class="field-group-inline">
													<label for="resolved-{effect}">Resolved?</label>
													<select
														id="resolved-{effect}"
														bind:value={selectedSideEffects[effect].resolved}
													>
														<option value="yes_while_continuing">Yes, while continuing</option>
														<option value="yes_after_stopping">Yes, after stopping</option>
														<option value="no_ongoing">No, ongoing</option>
														<option value="not_applicable">N/A</option>
													</select>
												</div>
											</div>

											<div class="management-field">
												<label for="management-{effect}">How did you manage this?</label>
												<select
													id="management-{effect}"
													bind:value={selectedSideEffects[effect].managementStrategy}
													class="management-select"
												>
													<option value="">Select...</option>
													{#each MANAGEMENT_STRATEGY_OPTIONS as option}
														<option value={option.value}>{option.label}</option>
													{/each}
												</select>
												{#if selectedSideEffects[effect].managementStrategy === 'other'}
													<input
														type="text"
														bind:value={selectedSideEffects[effect].managementStrategyOther}
														placeholder="Please specify how you managed this"
														class="other-input"
													/>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					<div class="custom-effects">
						<h3>Other Side Effects</h3>
						<p class="text-sm text-muted-foreground mb-4">Add any side effects you experienced that aren't listed above</p>

						{#if customSideEffects.length > 0}
							<div class="custom-effects-list">
								{#each customSideEffects as effect, i}
									<div class="custom-effect-item">
										<div class="effect-name-row">
											<select
												bind:value={effect.name}
												class="effect-name-select"
												aria-label="Side effect name"
											>
												<option value="">Select a side effect...</option>
												{#each COMMON_SIDE_EFFECT_OPTIONS as option}
													<option value={option.value}>{option.label}</option>
												{/each}
											</select>
											{#if effect.name === 'other'}
												<input
													type="text"
													bind:value={effect.nameOther}
													placeholder="Please specify"
													class="other-input-inline"
													aria-label="Other side effect name"
												/>
											{/if}
										</div>
										<div class="effect-severity">
											<span class="severity-label">Severity:</span>
											{#each [1, 2, 3, 4, 5] as s (s)}
												<button
													type="button"
													class="severity-btn"
													class:selected={effect.severity === s}
													onclick={() => updateCustomSideEffectSeverity(i, s as 1 | 2 | 3 | 4 | 5)}
												>
													{s}
												</button>
											{/each}
										</div>
										<button
											type="button"
											class="remove-effect-btn"
											onclick={() => removeCustomSideEffect(i)}
											aria-label="Remove side effect"
										>
											<X class="h-4 w-4" />
										</button>
									</div>
								{/each}
							</div>
						{/if}

						<button type="button" class="add-effect-btn" onclick={addCustomSideEffect}>
							<Plus class="h-4 w-4" />
							Add Side Effect
						</button>
					</div>
				</div>
			{/if}

			<!-- Step 5: Cycle Info -->
			{#if currentStep === 4}
				<div class="step-content" data-step="cycle">
					<div class="step-header">
						<h2>Cycle Information</h2>
						<p>Details about your overall cycle</p>
					</div>

					<div class="cycle-fields">
						<div class="field-group">
							<label for="cycle-length">Total Cycle Length</label>
							<div class="input-with-unit">
								<input id="cycle-length" type="number" bind:value={cycleLengthWeeks} min="1" max="104" />
								<span>weeks</span>
							</div>
						</div>

						<div class="field-group">
							<span class="field-label" id="current-status-label">Current Status</span>
							<div class="status-toggle" role="group" aria-labelledby="current-status-label">
								<button
									class="status-btn"
									class:selected={currentlyOnCycle}
									onclick={() => (currentlyOnCycle = true)}
								>
									Currently On Cycle
								</button>
								<button
									class="status-btn"
									class:selected={!currentlyOnCycle}
									onclick={() => (currentlyOnCycle = false)}
								>
									Completed / Off Cycle
								</button>
							</div>
						</div>

						{#if !currentlyOnCycle}
							<div class="field-group">
								<label for="why-stopped">Why did you stop?</label>
								<select id="why-stopped" bind:value={whyStopped}>
									<option value="">Select a reason...</option>
									<option value="achieved_goals">Achieved my goals</option>
									<option value="side_effects">Side effects</option>
									<option value="cost">Cost</option>
									<option value="availability">Ran out / availability</option>
									<option value="planned_end">Planned cycle end</option>
									<option value="other">Other</option>
								</select>
							</div>
						{/if}

						<div class="field-group">
							<label for="total-breaks">Number of Breaks Taken</label>
							<input id="total-breaks" type="number" bind:value={totalBreaks} min="0" max="20" />
						</div>

						<div class="field-group">
							<label for="repeat-cycle">Is this a repeat cycle?</label>
							<select id="repeat-cycle" bind:value={isRepeatCycle}>
								<option value="first_time">First time using this peptide</option>
								<option value="repeat_positive">Repeat cycle (previous positive experience)</option>
								<option value="repeat_different_protocol">Repeat cycle (trying different protocol)</option>
							</select>
						</div>

						<div class="field-group">
							<span class="field-label" id="use-again-label">Would you use this peptide again?</span>
							<div class="use-again-options" role="group" aria-labelledby="use-again-label">
								{#each [
									{ value: 'yes' as const, label: 'Yes, definitely' },
									{ value: 'maybe' as const, label: 'Maybe, depends' },
									{ value: 'no' as const, label: 'No' }
								] as option}
									<button
										class="use-again-btn"
										class:selected={wouldUseAgain === option.value}
										onclick={() => (wouldUseAgain = option.value)}
									>
										{option.label}
									</button>
								{/each}
							</div>
						</div>

						<div class="rating-group">
							<span class="rating-label" id="recommend-label">How likely are you to recommend this peptide? (0-10)</span>
							<div class="rating-scale" role="group" aria-labelledby="recommend-label">
								{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n}
									<button
										class="rating-btn"
										class:selected={recommendScore === n}
										onclick={() => (recommendScore = n)}
									>
										{n}
									</button>
								{/each}
							</div>
							<div class="rating-labels">
								<span>Not at all likely</span>
								<span>Extremely likely</span>
							</div>
						</div>

						<!-- Lifestyle Factors -->
						<div class="lifestyle-section">
							<h3>Lifestyle During Cycle</h3>
							<p class="text-sm text-muted-foreground mb-4">These factors can significantly affect peptide results</p>

							<div class="lifestyle-grid">
								<div class="field-group">
									<label for="training-intensity">Training Intensity</label>
									<select id="training-intensity" bind:value={lifestyleFactors.trainingIntensity}>
										<option value="none">None</option>
										<option value="light">Light</option>
										<option value="moderate">Moderate</option>
										<option value="intense">Intense</option>
									</select>
								</div>
								<div class="field-group">
									<label for="sleep-quality">Sleep Quality</label>
									<select id="sleep-quality" bind:value={lifestyleFactors.sleepQuality}>
										<option value="poor">Poor</option>
										<option value="fair">Fair</option>
										<option value="good">Good</option>
										<option value="excellent">Excellent</option>
									</select>
								</div>
								<div class="field-group">
									<label for="stress-level">Stress Level</label>
									<select id="stress-level" bind:value={lifestyleFactors.stressLevel}>
										<option value="low">Low</option>
										<option value="moderate">Moderate</option>
										<option value="high">High</option>
									</select>
								</div>
								<div class="field-group">
									<label for="diet-adherence">Diet Adherence</label>
									<select id="diet-adherence" bind:value={lifestyleFactors.dietAdherence}>
										<option value="poor">Poor</option>
										<option value="fair">Fair</option>
										<option value="good">Good</option>
										<option value="strict">Strict</option>
									</select>
								</div>
							</div>
						</div>

						<!-- Concurrent Compounds -->
						<div class="concurrent-compounds-section">
							<h3>Concurrent Compounds</h3>
							<p class="text-sm text-muted-foreground mb-4">Were you taking any other peptides or compounds during this cycle? (e.g., TRT, other peptides, supplements)</p>

							{#if concurrentCompounds.length > 0}
								<div class="compounds-list">
									{#each concurrentCompounds as compound, i}
										<div class="compound-item-expanded">
											<div class="compound-row">
												<select
													bind:value={compound.name}
													class="compound-name-select"
													aria-label="Compound name"
												>
													<option value="">Select a compound...</option>
													{#each COMMON_COMPOUND_OPTIONS as option}
														<option value={option.value}>{option.label}</option>
													{/each}
												</select>
												{#if compound.name === 'other'}
													<input
														type="text"
														bind:value={compound.nameOther}
														placeholder="Please specify"
														class="other-input-inline"
														aria-label="Other compound name"
													/>
												{/if}
												<input
													type="text"
													bind:value={compound.dose}
													placeholder="Dose (e.g., 200mg/week)"
													class="compound-dose-input"
													aria-label="Compound dose"
												/>
												<button
													type="button"
													class="remove-compound-btn"
													onclick={() => removeConcurrentCompound(i)}
													aria-label="Remove compound"
												>
													<X class="h-4 w-4" />
												</button>
											</div>
											<div class="compound-details">
												<select bind:value={compound.durationContext} aria-label="Duration">
													<option value="entire_cycle">Used entire cycle</option>
													<option value="partial_cycle">Used part of cycle</option>
												</select>
												<select bind:value={compound.startedTiming} aria-label="Start timing">
													<option value="before_peptide">Started before peptide</option>
													<option value="during_peptide">Started during peptide use</option>
													<option value="after_peptide">Started after peptide</option>
												</select>
											</div>
										</div>
									{/each}
								</div>
							{/if}

							<button type="button" class="add-compound-btn" onclick={addConcurrentCompound}>
								<Plus class="h-4 w-4" />
								Add Compound
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 6: Review -->
			{#if currentStep === 5}
				<div class="step-content" data-step="review">
					<div class="step-header">
						<h2>Review Your Submission</h2>
						<p>Please review your findings before submitting</p>
					</div>

					<div class="review-sections">
						<div class="review-section">
							<h3>Dosing Schedule</h3>
							<div class="review-content">
								{#each dosingPhases as phase, i}
									<p>
										<strong>Phase {i + 1}:</strong>
										{#if phase.isBreak}
											Break period - {phase.durationWeeks} weeks
										{:else}
											{phase.dose} {phase.doseUnit}, {getFrequencyLabel(phase.dosesPerWeek)}{#if phase.hoursBetweenDoses}, {phase.hoursBetweenDoses}h apart{/if} for {phase.durationWeeks} weeks
										{/if}
									</p>
								{/each}
							</div>
						</div>

						<div class="review-section">
							<h3>Administration</h3>
							<div class="review-content">
								<p><strong>Method:</strong> {allAdministrationMethods.find((m) => m.value === administrationMethod)?.label}</p>
								{#if ['subq', 'im', 'iv'].includes(administrationMethod)}
									<p><strong>Vial:</strong> {reconstitution.vialSizeMg}mg in {reconstitution.diluentVolumeMl}mL {reconstitution.diluentType.replace('_', ' ')}</p>
									<p><strong>Injection frequency:</strong> {getFrequencyLabel(reconstitution.injectionDosesPerWeek || 7)}</p>
								{/if}
							</div>
						</div>

						<div class="review-section">
							<h3>Results</h3>
							<div class="review-content">
								<p><strong>Overall Effectiveness:</strong> {effectivenessRating}/10</p>
								<p><strong>Time to notice:</strong> {timeToNoticeDays} days</p>
								{#if customResults.length > 0}
									<div class="review-effects">
										<strong>Observed Effects:</strong>
										{#each customResults.filter((r) => r.name) as result}
											<p class="review-effect-item">• {getEffectLabel(result.name, result.nameOther)}: {result.rating}/10 ({result.timeToNoticeDays} days to notice)</p>
										{/each}
									</div>
								{/if}
								{#if qualitativeNotes}
									<p><strong>Notes:</strong> {qualitativeNotes.slice(0, 200)}{qualitativeNotes.length > 200 ? '...' : ''}</p>
								{/if}
							</div>
						</div>

						<div class="review-section">
							<h3>Side Effects</h3>
							<div class="review-content">
								{#if Object.keys(selectedSideEffects).length > 0 || customSideEffects.length > 0}
									{#each Object.values(selectedSideEffects) as effect}
										<p>{effect.name} (severity: {effect.severity}/5)</p>
									{/each}
									{#each customSideEffects.filter((e) => e.name) as effect}
										<p>{getSideEffectLabel(effect.name, effect.nameOther)} (severity: {effect.severity}/5) <span class="text-muted-foreground text-xs">- custom</span></p>
									{/each}
								{:else}
									<p class="text-muted-foreground">No side effects reported</p>
								{/if}
							</div>
						</div>

						<div class="review-section">
							<h3>Cycle Info</h3>
							<div class="review-content">
								<p><strong>Duration:</strong> {cycleLengthWeeks} weeks</p>
								<p><strong>Status:</strong> {currentlyOnCycle ? 'Currently on cycle' : 'Completed'}</p>
								<p><strong>Would use again:</strong> {wouldUseAgain}</p>
								<p><strong>Recommend score:</strong> {recommendScore}/10</p>
								{#if concurrentCompounds.length > 0}
									<div class="review-compounds">
										<strong>Concurrent compounds:</strong>
										{#each concurrentCompounds.filter((c) => c.name) as compound}
											<p class="review-compound-item">• {getCompoundLabel(compound.name, compound.nameOther)}{compound.dose ? ` (${compound.dose})` : ''}</p>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Data Quality Section -->
					<div class="data-quality-section">
						<h3>Data Quality</h3>
						<div class="quality-fields">
							<div class="field-group">
								<label for="data-confidence">How confident are you in the accuracy of your reported data?</label>
								<select id="data-confidence" bind:value={dataConfidence}>
									<option value="very_confident">Very confident - I kept detailed notes</option>
									<option value="somewhat_confident">Somewhat confident - I remember most details</option>
									<option value="some_uncertainty">Some uncertainty - A few details may be approximate</option>
									<option value="significant_guessing">Significant guessing - Many details are estimates</option>
								</select>
							</div>

							<div class="field-group">
								<label for="pre-existing">Pre-existing conditions (optional)</label>
								<textarea
									id="pre-existing"
									bind:value={preExistingConditions}
									rows="2"
									placeholder="Any relevant pre-existing conditions that may affect results..."
								></textarea>
							</div>

							<div class="field-group">
								<label class="checkbox-label">
									<input
										type="checkbox"
										bind:checked={followUpConsent}
									/>
									<span>I would be willing to provide a follow-up report in the future</span>
								</label>
							</div>
						</div>
					</div>

					<div class="submit-actions">
						<button class="btn-draft" onclick={saveDraft} disabled={isSubmitting}>
							<Save class="h-4 w-4" />
							Save as Draft
						</button>
						<button class="btn-publish" onclick={publishFindings} disabled={isSubmitting}>
							<Send class="h-4 w-4" />
							{isSubmitting ? 'Publishing...' : 'Publish Findings'}
						</button>
					</div>

					<p class="submit-note">
						Your findings will be anonymized. Your username will not be shown publicly.
					</p>
				</div>
			{/if}
		</div>

		<!-- Navigation -->
		<div class="wizard-nav">
			<button class="nav-btn prev" onclick={prevStep} disabled={currentStep === 0}>
				<ChevronLeft class="h-5 w-5" />
				Previous
			</button>

			{#if currentStep < steps.length - 1}
				<button class="nav-btn next" onclick={nextStep}>
					Next
					<ChevronRight class="h-5 w-5" />
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Scientific-editorial aesthetic with warm tones */
	.wizard-header {
		background: linear-gradient(
			180deg,
			hsl(var(--muted)) 0%,
			hsl(var(--background)) 100%
		);
		border-bottom: 1px solid hsl(var(--border));
	}

	.wizard-title {
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: 2rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: hsl(var(--foreground));
	}

	/* Progress indicator - molecular chain inspired */
	.wizard-progress {
		background: hsl(var(--background));
		border-bottom: 1px solid hsl(var(--border));
		padding: 1.5rem 0;
		position: sticky;
		top: 64px;
		z-index: 40;
	}

	.progress-track {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		overflow-x: auto;
		padding: 0.5rem 0;
	}

	.progress-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.5;
		transition: all 0.3s ease;
		position: relative;
	}

	.progress-step:hover:not(:disabled) {
		opacity: 0.8;
	}

	.progress-step.active {
		opacity: 1;
	}

	.progress-step.completed {
		opacity: 1;
	}

	.progress-step:disabled {
		cursor: not-allowed;
	}

	.step-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		transition: all 0.3s ease;
	}

	.progress-step.active .step-icon {
		background: hsl(var(--accent));
		color: white;
		box-shadow: 0 0 0 4px hsl(var(--accent) / 0.2);
	}

	.progress-step.completed .step-icon {
		background: hsl(142 76% 36%);
		color: white;
	}

	.step-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	.progress-step.active .step-label {
		color: hsl(var(--foreground));
	}

	.step-number {
		display: none;
	}

	.progress-connector {
		width: 40px;
		height: 2px;
		background: hsl(var(--border));
		flex-shrink: 0;
	}

	.progress-connector.active {
		background: hsl(142 76% 36%);
	}

	/* Wizard card */
	.wizard-card {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		overflow: hidden;
	}

	.step-content {
		padding: 2rem;
	}

	.step-header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.step-header h2 {
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.step-header p {
		color: hsl(var(--muted-foreground));
	}

	/* Form elements */
	.field-group {
		margin-bottom: 1.5rem;
	}

	.field-group label,
	.field-group .field-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: hsl(var(--foreground));
	}

	.field-group input[type='text'],
	.field-group input[type='number'],
	.field-group select,
	.field-group textarea {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.field-group input:focus,
	.field-group select:focus,
	.field-group textarea:focus {
		outline: none;
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 3px hsl(var(--accent) / 0.1);
	}

	.input-with-unit {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.input-with-unit input {
		flex: 1;
		max-width: 150px;
	}

	.input-with-unit span {
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	/* Dosing phases */
	.dosing-phases {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.phase-card {
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		border-radius: 10px;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.phase-card:hover {
		border-color: hsl(var(--accent) / 0.5);
	}

	.phase-card.break-phase {
		background: hsl(var(--muted) / 0.5);
		border-style: dashed;
	}

	.phase-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.phase-number {
		font-weight: 600;
		color: hsl(var(--accent));
	}

	.phase-remove {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: none;
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.phase-remove:hover {
		background: hsl(var(--destructive));
		color: white;
	}

	.phase-toggle {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.toggle-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.toggle-option input {
		accent-color: hsl(var(--accent));
	}

	.phase-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.dose-input {
		display: flex;
		gap: 0.5rem;
	}

	.dose-input input.dose-value {
		flex: 1;
		min-width: 80px;
		width: auto;
	}

	.dose-input select.dose-unit {
		width: 80px;
		flex-shrink: 0;
	}

	.duration-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.duration-input input {
		width: 80px;
	}

	.duration-unit {
		color: hsl(var(--muted-foreground));
	}

	.add-phase-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 2px dashed hsl(var(--border));
		border-radius: 10px;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-phase-btn:hover {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.05);
	}

	/* Info callout */
	.info-callout {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--accent) / 0.1);
		border-radius: 8px;
		margin-top: 1.5rem;
	}

	.info-callout p {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
	}

	/* Method grid */
	.method-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.method-card {
		padding: 1rem;
		border: 2px solid hsl(var(--border));
		border-radius: 10px;
		background: hsl(var(--background));
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.method-card:hover {
		border-color: hsl(var(--accent) / 0.5);
	}

	.method-card.selected {
		border-color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.1);
	}

	.method-label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Reconstitution section */
	.reconstitution-section,
	.admin-details-section {
		background: hsl(var(--muted) / 0.3);
		border-radius: 10px;
		padding: 1.5rem;
		margin-top: 1.5rem;
	}

	.reconstitution-section h3,
	.admin-details-section h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.recon-grid,
	.admin-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	/* Rating scale */
	.rating-group {
		margin-bottom: 2rem;
	}

	.rating-group .rating-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
	}

	.rating-scale {
		display: flex;
		gap: 0.5rem;
	}

	.rating-btn {
		width: 40px;
		height: 40px;
		border: 2px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.rating-btn:hover {
		border-color: hsl(var(--accent));
	}

	.rating-btn.selected {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
		color: white;
	}

	.rating-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	/* Category questions */
	.category-questions {
		background: hsl(var(--muted) / 0.3);
		border-radius: 10px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.category-questions h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: hsl(var(--accent));
	}

	.weight-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	/* Slider group */
	.slider-group {
		margin-bottom: 1.5rem;
	}

	.slider-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.slider-group input[type='range'] {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: hsl(var(--border));
		appearance: none;
		cursor: pointer;
	}

	.slider-group input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: hsl(var(--accent));
		cursor: pointer;
		box-shadow: 0 2px 6px hsl(var(--accent) / 0.3);
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.slider-value {
		font-weight: 600;
		color: hsl(var(--accent));
		font-size: 1rem;
	}

	/* Side effects */
	.side-effects-list {
		margin-bottom: 2rem;
	}

	.side-effects-list h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.side-effect-item {
		padding: 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		margin-bottom: 0.5rem;
		transition: all 0.2s;
	}

	.side-effect-item.selected {
		border-color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.05);
	}

	.effect-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
	}

	.effect-toggle input {
		accent-color: hsl(var(--accent));
		width: 18px;
		height: 18px;
	}

	.severity-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--border));
	}

	.severity-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.severity-btn {
		width: 28px;
		height: 28px;
		border: 1px solid hsl(var(--border));
		border-radius: 4px;
		background: hsl(var(--background));
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.severity-btn.selected {
		background: hsl(var(--destructive));
		border-color: hsl(var(--destructive));
		color: white;
	}

	.severity-scale {
		font-size: 0.7rem;
		color: hsl(var(--muted-foreground));
		margin-left: auto;
	}

	.custom-effects h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.custom-effects-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.custom-effect-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
	}

	.effect-severity {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.remove-effect-btn {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: none;
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.remove-effect-btn:hover {
		background: hsl(var(--destructive));
		color: white;
	}

	.add-effect-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 2px dashed hsl(var(--border));
		border-radius: 8px;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.add-effect-btn:hover {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.05);
	}

	/* Categorical select + Other input styles */
	.other-input {
		margin-top: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
		font-size: 0.875rem;
	}

	.other-input:focus {
		outline: none;
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 2px hsl(var(--accent) / 0.1);
	}

	.other-input-inline {
		flex: 1;
		min-width: 150px;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
		font-size: 0.875rem;
	}

	.other-input-inline:focus {
		outline: none;
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 2px hsl(var(--accent) / 0.1);
	}

	.effect-name-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		flex: 1;
	}

	.effect-name-select,
	.result-name-select,
	.compound-name-select {
		flex: 1;
		min-width: 180px;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
		font-size: 0.875rem;
	}

	.effect-name-select:focus,
	.result-name-select:focus,
	.compound-name-select:focus {
		outline: none;
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 2px hsl(var(--accent) / 0.1);
	}

	.management-field {
		margin-top: 0.75rem;
	}

	.management-field label {
		display: block;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.25rem;
	}

	.management-select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
		font-size: 0.875rem;
	}

	.management-select:focus {
		outline: none;
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 2px hsl(var(--accent) / 0.1);
	}

	/* Custom frequency input */
	.custom-frequency-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.custom-frequency-input input {
		width: 80px;
		padding: 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
	}

	.custom-frequency-input input:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.frequency-unit {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.field-hint {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-top: 0.25rem;
	}

	.phase-fields .full-width {
		grid-column: 1 / -1;
	}

	/* Method note */
	.method-note {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 0.5rem;
	}

	.link-btn {
		background: none;
		border: none;
		color: hsl(var(--accent));
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
	}

	.link-btn:hover {
		color: hsl(var(--accent) / 0.8);
	}

	/* Cycle fields */
	.cycle-fields {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.status-toggle {
		display: flex;
		gap: 0.75rem;
	}

	.status-btn {
		flex: 1;
		padding: 1rem;
		border: 2px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.status-btn.selected {
		border-color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.1);
		color: hsl(var(--accent));
	}

	.use-again-options {
		display: flex;
		gap: 0.75rem;
	}

	.use-again-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 2px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		cursor: pointer;
		transition: all 0.2s;
	}

	.use-again-btn.selected {
		border-color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.1);
	}

	/* Custom Results Section */
	.custom-results-section {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid hsl(var(--border));
	}

	.custom-results-section h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.custom-results-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.custom-result-item {
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		border-radius: 10px;
		padding: 1rem;
	}

	.result-header {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.remove-result-btn {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		border: none;
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.remove-result-btn:hover {
		background: hsl(var(--destructive));
		color: white;
	}

	.result-details {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 1rem;
	}

	.result-rating {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.rating-label-small {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.rating-scale-small {
		display: flex;
		gap: 0.25rem;
	}

	.rating-btn-small {
		width: 28px;
		height: 28px;
		border: 1px solid hsl(var(--border));
		border-radius: 4px;
		background: hsl(var(--background));
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.rating-btn-small:hover {
		border-color: hsl(var(--accent));
	}

	.rating-btn-small.selected {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
		color: white;
	}

	.result-time {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.result-time label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.input-with-unit-small {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.input-with-unit-small input {
		width: 70px;
		padding: 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
		font-size: 0.875rem;
	}

	.input-with-unit-small input:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.input-with-unit-small span {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.result-notes {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		font-size: 0.875rem;
		resize: vertical;
	}

	.result-notes:focus {
		outline: none;
		border-color: hsl(var(--accent));
	}

	.add-result-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 2px dashed hsl(var(--border));
		border-radius: 8px;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.add-result-btn:hover {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.05);
	}

	/* Concurrent Compounds Section */
	.concurrent-compounds-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid hsl(var(--border));
	}

	.concurrent-compounds-section h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.compounds-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.compound-dose-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		font-size: 0.875rem;
	}

	.compound-dose-input:focus {
		outline: none;
		border-color: hsl(var(--accent));
		box-shadow: 0 0 0 2px hsl(var(--accent) / 0.1);
	}

	.remove-compound-btn {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		border: none;
		background: hsl(var(--destructive) / 0.1);
		color: hsl(var(--destructive));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.remove-compound-btn:hover {
		background: hsl(var(--destructive));
		color: white;
	}

	.add-compound-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 2px dashed hsl(var(--border));
		border-radius: 8px;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.add-compound-btn:hover {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
		background: hsl(var(--accent) / 0.05);
	}

	/* Review sections */
	.review-sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.review-section {
		padding: 1rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 8px;
	}

	.review-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--accent));
		margin-bottom: 0.75rem;
	}

	.review-content p {
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
	}

	.review-content strong {
		color: hsl(var(--foreground));
	}

	/* Submit actions */
	.submit-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid hsl(var(--border));
	}

	.btn-draft,
	.btn-publish {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-draft {
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		color: hsl(var(--foreground));
	}

	.btn-draft:hover:not(:disabled) {
		background: hsl(var(--muted) / 0.8);
	}

	.btn-publish {
		background: hsl(var(--accent));
		border: none;
		color: white;
	}

	.btn-publish:hover:not(:disabled) {
		background: hsl(var(--accent) / 0.9);
	}

	.btn-draft:disabled,
	.btn-publish:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.submit-note {
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 1rem;
	}

	/* Navigation */
	.wizard-nav {
		display: flex;
		justify-content: space-between;
		margin-top: 1.5rem;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.nav-btn:hover:not(:disabled) {
		border-color: hsl(var(--accent));
		color: hsl(var(--accent));
	}

	.nav-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.nav-btn.next {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
		color: white;
	}

	.nav-btn.next:hover:not(:disabled) {
		background: hsl(var(--accent) / 0.9);
	}

	/* Error banner */
	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--destructive) / 0.1);
		border: 1px solid hsl(var(--destructive) / 0.3);
		border-radius: 8px;
		color: hsl(var(--destructive));
		margin-bottom: 1.5rem;
	}

	/* Checkbox label */
	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
	}

	.checkbox-label input {
		accent-color: hsl(var(--accent));
		width: 18px;
		height: 18px;
		margin-top: 2px;
	}

	.checkbox-label-small {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.checkbox-label-small input {
		accent-color: hsl(var(--accent));
	}

	/* Results timing grid */
	.results-timing-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.dose-response-notes {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--background));
		font-size: 0.875rem;
		resize: vertical;
	}

	/* Confidence scale for custom results */
	.result-meta {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.confidence-rating {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.confidence-scale {
		display: flex;
		gap: 0.25rem;
	}

	.confidence-btn {
		width: 28px;
		height: 28px;
		border: 1px solid hsl(var(--border));
		border-radius: 4px;
		background: hsl(var(--background));
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.confidence-btn:hover {
		border-color: hsl(var(--accent));
	}

	.confidence-btn.selected {
		background: hsl(var(--accent));
		border-color: hsl(var(--accent));
		color: white;
	}

	.confidence-labels {
		font-size: 0.7rem;
		color: hsl(var(--muted-foreground));
	}

	/* Side effect details expansion */
	.side-effect-details {
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--border));
		margin-top: 0.75rem;
	}

	.side-effect-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
	}

	.field-group-inline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.field-group-inline label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	.field-group-inline select {
		padding: 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
		font-size: 0.875rem;
	}

	/* Lifestyle section */
	.lifestyle-section {
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 10px;
	}

	.lifestyle-section h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.lifestyle-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	/* Compound item expanded */
	.compound-item-expanded {
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.compound-row {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.compound-details {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.compound-details select {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
		font-size: 0.875rem;
	}

	/* Data quality section */
	.data-quality-section {
		margin-top: 2rem;
		padding: 1.5rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 10px;
	}

	.data-quality-section h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: hsl(var(--accent));
	}

	.quality-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Source section */
	.source-section {
		margin-top: 1.5rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.wizard-title {
			font-size: 1.5rem;
		}

		.progress-track {
			justify-content: flex-start;
			padding: 0 1rem;
		}

		.step-label {
			display: none;
		}

		.step-number {
			display: block;
			font-size: 0.75rem;
			color: hsl(var(--muted-foreground));
		}

		.phase-fields {
			grid-template-columns: 1fr;
		}

		.method-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.recon-grid,
		.admin-grid {
			grid-template-columns: 1fr;
		}

		.rating-scale {
			flex-wrap: wrap;
		}

		.weight-grid,
		.lifestyle-grid,
		.results-timing-grid {
			grid-template-columns: 1fr;
		}

		.status-toggle,
		.use-again-options {
			flex-direction: column;
		}

		.submit-actions {
			flex-direction: column;
		}

		.side-effect-meta {
			flex-direction: column;
		}

		.compound-details {
			flex-direction: column;
		}
	}
</style>
