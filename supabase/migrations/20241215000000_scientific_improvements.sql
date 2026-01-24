-- =====================================================
-- Scientific Improvements Migration
-- =====================================================
-- Adds comprehensive fields for better data quality and analysis
-- Based on scientific review of the submit-findings questionnaire

-- =====================================================
-- STEP 1: DOSING SCHEDULE IMPROVEMENTS
-- =====================================================

-- Time of day preference for dosing
ALTER TABLE public.finding_dosing_phases
ADD COLUMN time_of_day VARCHAR(20) CHECK (time_of_day IN ('morning', 'midday', 'evening', 'bedtime', 'split'));

-- Meal timing relative to dose
ALTER TABLE public.finding_dosing_phases
ADD COLUMN meal_timing VARCHAR(20) CHECK (meal_timing IN ('fasted', 'with_food', 'before_food', 'after_food'));

-- Loading/saturation dose indicator
ALTER TABLE public.finding_dosing_phases
ADD COLUMN is_loading_dose BOOLEAN DEFAULT false;

-- =====================================================
-- STEP 2: ADMINISTRATION IMPROVEMENTS
-- =====================================================

-- Injection site for injectable peptides
ALTER TABLE public.findings
ADD COLUMN injection_site VARCHAR(30) CHECK (injection_site IN ('abdomen', 'love_handles', 'thigh', 'deltoid', 'gluteal', 'vastus_lateralis', 'rotated'));

-- Needle gauge used
ALTER TABLE public.findings
ADD COLUMN needle_gauge VARCHAR(20) CHECK (needle_gauge IN ('27g', '29g', '30g', '31g', 'insulin_syringe'));

-- Storage conditions
ALTER TABLE public.findings
ADD COLUMN storage_condition VARCHAR(20) CHECK (storage_condition IN ('refrigerated', 'room_temp'));

-- Days since reconstitution when used
ALTER TABLE public.findings
ADD COLUMN days_since_reconstitution INTEGER;

-- Source type (sensitive but valuable)
ALTER TABLE public.findings
ADD COLUMN source_type VARCHAR(30) CHECK (source_type IN ('compounding_pharmacy', 'research_supplier', 'other', 'prefer_not_say'));

-- Source verification
ALTER TABLE public.findings
ADD COLUMN source_verified VARCHAR(20) CHECK (source_verified IN ('yes', 'no', 'prefer_not_say'));

-- Batch consistency throughout cycle
ALTER TABLE public.findings
ADD COLUMN same_batch VARCHAR(20) CHECK (same_batch IN ('yes', 'no', 'multiple_batches'));

-- =====================================================
-- STEP 3: RESULTS IMPROVEMENTS
-- =====================================================

-- Time to peak/stable effect (separate from first noticed)
ALTER TABLE public.finding_results
ADD COLUMN time_to_peak_days INTEGER;

-- Effect persistence after stopping
ALTER TABLE public.finding_results
ADD COLUMN effect_persistence VARCHAR(20) CHECK (effect_persistence IN ('ongoing', 'less_than_week', '1_to_4_weeks', '1_to_3_months', 'more_than_3_months'));

-- Dose-response observations
ALTER TABLE public.findings
ADD COLUMN dose_response_noticed BOOLEAN;

-- Dose-response description
ALTER TABLE public.findings
ADD COLUMN dose_response_notes TEXT;

-- =====================================================
-- STEP 4: SIDE EFFECTS IMPROVEMENTS
-- =====================================================

-- Note: onset_timing and resolved columns already exist in initial schema
-- We need to alter their types to support the new values

-- Drop the old resolved column (was BOOLEAN) and recreate with proper type
ALTER TABLE public.finding_side_effects
DROP COLUMN IF EXISTS resolved;

ALTER TABLE public.finding_side_effects
ADD COLUMN resolved VARCHAR(30) CHECK (resolved IN ('yes_while_continuing', 'yes_after_stopping', 'no_ongoing', 'not_applicable'));

-- Management strategy for significant side effects
ALTER TABLE public.finding_side_effects
ADD COLUMN management_strategy TEXT;

-- =====================================================
-- STEP 5: CYCLE INFO IMPROVEMENTS
-- =====================================================

-- Why did you stop (for completed cycles)
ALTER TABLE public.findings
ADD COLUMN why_stopped VARCHAR(30) CHECK (why_stopped IN ('achieved_goals', 'side_effects', 'cost', 'availability', 'planned_end', 'other'));

-- Lifestyle factors during cycle
ALTER TABLE public.findings
ADD COLUMN training_intensity VARCHAR(20) CHECK (training_intensity IN ('none', 'light', 'moderate', 'intense'));

ALTER TABLE public.findings
ADD COLUMN sleep_quality VARCHAR(20) CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent'));

ALTER TABLE public.findings
ADD COLUMN stress_level VARCHAR(20) CHECK (stress_level IN ('low', 'moderate', 'high'));

ALTER TABLE public.findings
ADD COLUMN diet_adherence VARCHAR(20) CHECK (diet_adherence IN ('poor', 'fair', 'good', 'strict'));

-- Is this a repeat cycle
ALTER TABLE public.findings
ADD COLUMN is_repeat_cycle VARCHAR(30) CHECK (is_repeat_cycle IN ('first_time', 'repeat_positive', 'repeat_different_protocol'));

-- Net Promoter Score style recommendation (0-10)
ALTER TABLE public.findings
ADD COLUMN recommend_score INTEGER CHECK (recommend_score >= 0 AND recommend_score <= 10);

-- =====================================================
-- STEP 6: DATA QUALITY & REVIEW
-- =====================================================

-- Self-assessed data confidence
ALTER TABLE public.findings
ADD COLUMN data_confidence VARCHAR(30) CHECK (data_confidence IN ('very_confident', 'somewhat_confident', 'some_uncertainty', 'significant_guessing'));

-- Follow-up consent
ALTER TABLE public.findings
ADD COLUMN follow_up_consent BOOLEAN DEFAULT false;

-- Pre-existing conditions context (optional free text)
ALTER TABLE public.findings
ADD COLUMN pre_existing_conditions TEXT;

-- =====================================================
-- CONCURRENT COMPOUNDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.finding_concurrent_compounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
    compound_name VARCHAR(100) NOT NULL,
    dose VARCHAR(50),
    duration_context VARCHAR(30) CHECK (duration_context IN ('entire_cycle', 'partial_cycle')),
    started_timing VARCHAR(30) CHECK (started_timing IN ('before_peptide', 'during_peptide', 'after_peptide')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_finding_concurrent_compounds_finding_id
ON public.finding_concurrent_compounds(finding_id);

-- Enable RLS
ALTER TABLE public.finding_concurrent_compounds ENABLE ROW LEVEL SECURITY;

-- RLS policies for concurrent compounds
CREATE POLICY "Users can view their own concurrent compounds"
ON public.finding_concurrent_compounds FOR SELECT
USING (
    finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert their own concurrent compounds"
ON public.finding_concurrent_compounds FOR INSERT
WITH CHECK (
    finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own concurrent compounds"
ON public.finding_concurrent_compounds FOR UPDATE
USING (
    finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own concurrent compounds"
ON public.finding_concurrent_compounds FOR DELETE
USING (
    finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid())
);

-- =====================================================
-- CUSTOM RESULTS TABLE (for peptides without categories)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.finding_custom_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
    effect_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    time_to_notice_days INTEGER,
    confidence_attribution INTEGER CHECK (confidence_attribution >= 1 AND confidence_attribution <= 5),
    was_expected BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_finding_custom_results_finding_id
ON public.finding_custom_results(finding_id);

-- Enable RLS
ALTER TABLE public.finding_custom_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom results
CREATE POLICY "Users can view their own custom results"
ON public.finding_custom_results FOR SELECT
USING (
    finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert their own custom results"
ON public.finding_custom_results FOR INSERT
WITH CHECK (
    finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own custom results"
ON public.finding_custom_results FOR UPDATE
USING (
    finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own custom results"
ON public.finding_custom_results FOR DELETE
USING (
    finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid())
);

-- =====================================================
-- UPDATE ANONYMOUS VIEW
-- =====================================================

DROP VIEW IF EXISTS public.findings_anonymous;

CREATE VIEW public.findings_anonymous AS
SELECT
  f.id,
  f.peptide_id,
  f.status,
  f.administration_method,
  f.reconstitution_solution,
  f.vial_size_mg,
  f.diluent_volume_ml,
  f.injection_frequency,
  f.injection_doses_per_week,
  f.injection_site,
  f.needle_gauge,
  f.storage_condition,
  f.days_since_reconstitution,
  f.source_type,
  f.source_verified,
  f.same_batch,
  f.cycle_length_weeks,
  f.currently_on_cycle,
  f.total_breaks_taken,
  f.would_use_again,
  f.why_stopped,
  f.training_intensity,
  f.sleep_quality,
  f.stress_level,
  f.diet_adherence,
  f.is_repeat_cycle,
  f.recommend_score,
  f.dose_response_noticed,
  f.dose_response_notes,
  f.data_confidence,
  f.follow_up_consent,
  f.notes,
  f.created_at,
  f.published_at,
  p.location as user_location,
  encode(sha256(f.user_id::text::bytea), 'hex')::text as anonymous_id
FROM findings f
JOIN profiles p ON f.user_id = p.id;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN finding_dosing_phases.time_of_day IS 'Time of day preference: morning, midday, evening, bedtime, split';
COMMENT ON COLUMN finding_dosing_phases.meal_timing IS 'Relation to meals: fasted, with_food, before_food (30min), after_food';
COMMENT ON COLUMN finding_dosing_phases.is_loading_dose IS 'Whether this phase is a loading/saturation dose';

COMMENT ON COLUMN findings.injection_site IS 'Injection site for subcutaneous/intramuscular';
COMMENT ON COLUMN findings.needle_gauge IS 'Needle gauge used for injection';
COMMENT ON COLUMN findings.storage_condition IS 'How peptide was stored';
COMMENT ON COLUMN findings.days_since_reconstitution IS 'Days since reconstitution when peptide was used';
COMMENT ON COLUMN findings.source_type IS 'Type of source for peptide';
COMMENT ON COLUMN findings.source_verified IS 'Whether source was verified';
COMMENT ON COLUMN findings.same_batch IS 'Whether same batch was used throughout cycle';

COMMENT ON COLUMN finding_results.time_to_peak_days IS 'Days until peak/stable effect (vs first noticed)';
COMMENT ON COLUMN finding_results.effect_persistence IS 'How long effects lasted after stopping';

COMMENT ON COLUMN finding_side_effects.onset_timing IS 'When side effect started: immediate (same day), early (first week), delayed (>1 week)';
COMMENT ON COLUMN finding_side_effects.resolved IS 'Whether side effect resolved and when';
COMMENT ON COLUMN finding_side_effects.management_strategy IS 'How user managed the side effect';

COMMENT ON COLUMN findings.why_stopped IS 'Reason for stopping cycle (if completed)';
COMMENT ON COLUMN findings.training_intensity IS 'Exercise intensity during cycle';
COMMENT ON COLUMN findings.sleep_quality IS 'Sleep quality during cycle';
COMMENT ON COLUMN findings.stress_level IS 'Stress level during cycle';
COMMENT ON COLUMN findings.diet_adherence IS 'Diet adherence during cycle';
COMMENT ON COLUMN findings.is_repeat_cycle IS 'Whether this is first time or repeat use';
COMMENT ON COLUMN findings.recommend_score IS 'NPS-style recommendation score 0-10';
COMMENT ON COLUMN findings.data_confidence IS 'Self-assessed confidence in data accuracy';
COMMENT ON COLUMN findings.follow_up_consent IS 'Consent to provide follow-up report';
COMMENT ON COLUMN findings.pre_existing_conditions IS 'Relevant pre-existing conditions (optional)';

COMMENT ON TABLE finding_concurrent_compounds IS 'Other compounds used concurrently with the peptide';
COMMENT ON TABLE finding_custom_results IS 'Custom observed effects for peptides without predefined categories';
