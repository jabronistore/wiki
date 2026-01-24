-- =====================================================
-- Add Quantitative Frequency Fields
-- =====================================================
-- Convert text-based frequency to numeric doses_per_week
-- for better data analysis and aggregation

-- Add doses_per_week to dosing phases (e.g., 7 = daily, 14 = twice daily, 3.5 = EOD)
ALTER TABLE public.finding_dosing_phases
ADD COLUMN doses_per_week NUMERIC(5,2);

-- Add hours between doses for multi-dose protocols (e.g., 8 hours apart for twice daily)
ALTER TABLE public.finding_dosing_phases
ADD COLUMN hours_between_doses NUMERIC(4,1);

-- Add injection frequency to findings for reconstitution section
ALTER TABLE public.findings
ADD COLUMN injection_doses_per_week NUMERIC(5,2);

-- Update the anonymous view to include the new field
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
  f.cycle_length_weeks,
  f.currently_on_cycle,
  f.total_breaks_taken,
  f.would_use_again,
  f.notes,
  f.created_at,
  f.published_at,
  p.location as user_location,
  encode(sha256(f.user_id::text::bytea), 'hex')::text as anonymous_id
FROM findings f
JOIN profiles p ON f.user_id = p.id;

-- Add comment for documentation
COMMENT ON COLUMN finding_dosing_phases.doses_per_week IS 'Numeric frequency: 14=twice daily, 7=daily, 3.5=EOD, 2=twice weekly, 1=weekly';
COMMENT ON COLUMN finding_dosing_phases.hours_between_doses IS 'Hours between doses for multi-dose protocols (e.g., 8 for twice daily 8 hours apart)';
COMMENT ON COLUMN findings.injection_doses_per_week IS 'Injection frequency for reconstituted peptides as doses per week';
