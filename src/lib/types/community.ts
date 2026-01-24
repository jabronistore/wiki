// Community Platform Types
import type { Database } from './database';

// Database table types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Finding = Database['public']['Tables']['findings']['Row'];
export type FindingDosingPhase = Database['public']['Tables']['finding_dosing_phases']['Row'];
export type FindingSideEffect = Database['public']['Tables']['finding_side_effects']['Row'];
export type FindingResult = Database['public']['Tables']['finding_results']['Row'];
export type Discussion = Database['public']['Tables']['discussions']['Row'];
export type DiscussionUpvote = Database['public']['Tables']['discussion_upvotes']['Row'];
export type UserFavoritePeptide = Database['public']['Tables']['user_favorite_peptides']['Row'];

// Enums from database
export type SubmissionStatus = Database['public']['Enums']['submission_status'];
export type AdministrationMethod = Database['public']['Enums']['administration_method'];
export type ReconstitutionSolution = Database['public']['Enums']['reconstitution_solution'];
export type ResultCategory = Database['public']['Enums']['result_category'];

// Extended types for UI
export interface ProfileWithStats extends Profile {
	submissionCount?: number;
	discussionCount?: number;
}

export interface DiscussionWithAuthor extends Discussion {
	author: Pick<Profile, 'username'>;
	userHasUpvoted?: boolean;
	replies?: DiscussionWithAuthor[];
}

export interface FindingWithDetails extends Finding {
	dosing_phases: FindingDosingPhase[];
	side_effects: FindingSideEffect[];
	results: FindingResult[];
	anonymous_id?: string;
	user_location?: string;
}

// Form types for submit-findings wizard
export interface DosingPhaseInput {
	dose: number;
	doseUnit: 'mcg' | 'mg' | 'iu';
	dosesPerWeek: number;
	hoursBetweenDoses?: number;
	durationWeeks: number;
	isBreak: boolean;
	timeOfDay: 'morning' | 'midday' | 'evening' | 'bedtime' | 'split';
	mealTiming: 'fasted' | 'with_food' | 'before_food' | 'after_food';
	isLoadingDose: boolean;
	notes?: string;
}

export interface ReconstitutionInput {
	vialSizeMg: number;
	diluentType: ReconstitutionSolution;
	diluentVolumeMl: number;
	injectionDosesPerWeek?: number;
}

// Custom side effect for "other" effects not in the known list
export interface CustomSideEffectInput {
	name: string;
	nameOther?: string; // If name is 'other', this contains the custom text
	severity: 1 | 2 | 3 | 4 | 5;
}

// Frequency presets for the form
export const FREQUENCY_PRESETS = [
	{ value: 14, label: 'Twice daily (14/week)' },
	{ value: 7, label: 'Daily (7/week)' },
	{ value: 3.5, label: 'Every other day (3.5/week)' },
	{ value: 2.33, label: 'Every 3 days (~2.3/week)' },
	{ value: 2, label: 'Twice weekly' },
	{ value: 1, label: 'Weekly' },
	{ value: 0.5, label: 'Every 2 weeks' },
	{ value: -1, label: 'Custom' }
] as const;

export interface SideEffectInput {
	name: string;
	isKnown: boolean;
	severity: 1 | 2 | 3 | 4 | 5;
	onsetTiming: 'immediate' | 'early' | 'delayed';
	resolved: 'yes_while_continuing' | 'yes_after_stopping' | 'no_ongoing' | 'not_applicable';
	managementStrategy?: string;
	managementStrategyOther?: string; // If managementStrategy is 'other', this contains the custom text
	notes?: string;
}

// Custom result for observed effects (for peptides without predefined categories)
export interface CustomResultInput {
	name: string;
	nameOther?: string; // If name is 'other', this contains the custom text
	rating: number; // 1-10
	timeToNoticeDays: number;
	confidenceAttribution: 1 | 2 | 3 | 4 | 5; // How confident this effect was from the peptide
	wasExpected: boolean;
	notes?: string;
}

// Concurrent compound used during cycle
export interface ConcurrentCompoundInput {
	name: string;
	nameOther?: string; // If name is 'other', this contains the custom text
	dose: string;
	durationContext: 'entire_cycle' | 'partial_cycle';
	startedTiming: 'before_peptide' | 'during_peptide' | 'after_peptide';
}

// Administration details by method
export interface InjectableDetails {
	injectionSite: 'abdomen' | 'love_handles' | 'thigh' | 'deltoid' | 'gluteal' | 'vastus_lateralis' | 'rotated';
	needleGauge: '27g' | '29g' | '30g' | '31g' | 'insulin_syringe';
	storageCondition: 'refrigerated' | 'room_temp';
	daysSinceReconstitution: number;
}

export interface NasalDetails {
	concentration: number;
	sprayVolume: number;
	spraysPerDose: number;
	nostrilApplication: 'one' | 'both' | 'alternating';
}

export interface OralDetails {
	form: 'capsule' | 'tablet' | 'liquid' | 'powder';
	timing: 'empty_stomach' | 'with_food' | 'before_meal' | 'after_meal';
}

export interface TopicalDetails {
	form: 'cream' | 'gel' | 'patch' | 'spray';
	applicationArea: string;
}

export interface SublingualDetails {
	form: 'tablet' | 'drop' | 'film';
	holdDuration: number; // minutes
}

// Source and quality info
export interface SourceInfo {
	sourceType: 'compounding_pharmacy' | 'research_supplier' | 'other' | 'prefer_not_say';
	sourceVerified: 'yes' | 'no' | 'prefer_not_say';
	sameBatch: 'yes' | 'no' | 'multiple_batches';
}

// Lifestyle factors during cycle
export interface LifestyleFactors {
	trainingIntensity: 'none' | 'light' | 'moderate' | 'intense';
	sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
	stressLevel: 'low' | 'moderate' | 'high';
	dietAdherence: 'poor' | 'fair' | 'good' | 'strict';
}

// Cycle completion info
export type WhyStopped = 'achieved_goals' | 'side_effects' | 'cost' | 'availability' | 'planned_end' | 'other';
export type RepeatCycleStatus = 'first_time' | 'repeat_positive' | 'repeat_different_protocol';
export type DataConfidence = 'very_confident' | 'somewhat_confident' | 'some_uncertainty' | 'significant_guessing';

// Results metadata
export interface ResultsMetadata {
	timeToPeakDays?: number;
	effectPersistence: 'ongoing' | 'less_than_week' | '1_to_4_weeks' | '1_to_3_months' | 'more_than_3_months';
	doseResponseNoticed: boolean;
	doseResponseNotes?: string;
}

// Category-specific result data schemas
export interface WeightLossResults {
	startingWeightKg?: number;
	endingWeightKg?: number;
	appetiteChange?: number; // 1-10 scale
	energyLevel?: number; // 1-10 scale
	cravingsReduced?: boolean;
}

export interface HealingResults {
	injuryType?: string;
	injuryLocation?: string;
	prePainLevel?: number; // 1-10
	postPainLevel?: number; // 1-10
	healingTimelineDays?: number;
	mobilityImprovement?: number; // 1-10
}

export interface GrowthHormoneResults {
	sleepQualityChange?: number; // 1-10
	recoveryChange?: 'faster' | 'same' | 'slower';
	leanMassChangeKg?: number;
	fatLossKg?: number;
	skinQualityImprovement?: number; // 1-10
	energyLevelChange?: number; // 1-10
}

export interface CognitiveResults {
	focusImprovement?: number; // 1-10
	memoryImprovement?: number; // 1-10
	moodStability?: number; // 1-10
	anxietyReduction?: number; // 1-10
	mentalClarity?: number; // 1-10
	motivationChange?: number; // 1-10
}

export interface SexualHealthResults {
	effectivenessRating?: number; // 1-10
	onsetTimeMinutes?: number;
	durationHours?: number;
	libidoChange?: number; // 1-10
}

export interface SkinResults {
	textureImprovement?: number; // 1-10
	wrinkleReduction?: number; // 1-10
	hydrationImprovement?: number; // 1-10
	hairGrowthChange?: number; // 1-10
}

export type CategoryResults =
	| WeightLossResults
	| HealingResults
	| GrowthHormoneResults
	| CognitiveResults
	| SexualHealthResults
	| SkinResults;

// Aggregated stats for results page
export interface AggregatedStats {
	totalSubmissions: number;
	averageCycleWeeks: number;
	methodBreakdown: Record<AdministrationMethod, number>;
	averageEffectiveness?: number;
	categorySpecific: Record<string, number | string>;
	sideEffectFrequency: Array<{
		name: string;
		count: number;
		avgSeverity: number;
	}>;
}

// Auth session type
export interface AuthUser {
	id: string;
	email: string;
	profile?: Profile;
}

export interface AuthSession {
	user: AuthUser | null;
	isAuthenticated: boolean;
}
