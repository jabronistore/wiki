-- =====================================================
-- Peptide Research Community Platform - Initial Schema
-- =====================================================

-- =============
-- CUSTOM TYPES
-- =============

CREATE TYPE submission_status AS ENUM ('draft', 'published');
CREATE TYPE administration_method AS ENUM ('subq', 'nasal', 'oral', 'im', 'iv', 'topical', 'sublingual');
CREATE TYPE reconstitution_solution AS ENUM ('bac_water', 'sterile_water', 'saline', 'other');
CREATE TYPE result_category AS ENUM (
  'weight_loss',
  'healing',
  'growth_hormone',
  'cognitive',
  'sexual_health',
  'skin',
  'sleep',
  'immune',
  'metabolic',
  'longevity',
  'other'
);

-- ==============
-- PROFILES TABLE
-- ==============
-- Extends auth.users with public profile data

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  location TEXT,
  newsletter_opt_in BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

CREATE UNIQUE INDEX idx_profiles_username_lower ON profiles (lower(username));
CREATE INDEX idx_profiles_created_at ON profiles (created_at);

-- ========================
-- USER FAVORITE PEPTIDES
-- ========================

CREATE TABLE public.user_favorite_peptides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  peptide_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_peptide UNIQUE (user_id, peptide_id)
);

CREATE INDEX idx_favorites_user ON user_favorite_peptides (user_id);
CREATE INDEX idx_favorites_peptide ON user_favorite_peptides (peptide_id);

-- =================
-- FINDINGS TABLE
-- =================
-- Main research submission record

CREATE TABLE public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  peptide_id TEXT NOT NULL,
  status submission_status NOT NULL DEFAULT 'draft',

  -- Administration details
  administration_method administration_method,
  reconstitution_solution reconstitution_solution,
  reconstitution_solution_other TEXT,
  vial_size_mg NUMERIC(10,2),
  diluent_volume_ml NUMERIC(6,2),
  injection_frequency TEXT,

  -- Cycle information
  cycle_length_weeks INTEGER,
  currently_on_cycle BOOLEAN,
  total_breaks_taken INTEGER DEFAULT 0,
  would_use_again TEXT CHECK (would_use_again IN ('yes', 'no', 'maybe')),

  -- Qualitative notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_findings_user ON findings (user_id);
CREATE INDEX idx_findings_peptide ON findings (peptide_id);
CREATE INDEX idx_findings_status ON findings (status);
CREATE INDEX idx_findings_published ON findings (published_at) WHERE status = 'published';

-- ========================
-- FINDING DOSING PHASES
-- ========================
-- Titration/dosing schedule phases

CREATE TABLE public.finding_dosing_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  phase_order INTEGER NOT NULL,
  dose NUMERIC(10,3) NOT NULL,
  dose_unit TEXT NOT NULL DEFAULT 'mcg' CHECK (dose_unit IN ('mcg', 'mg', 'iu')),
  duration_weeks INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  is_break BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,

  CONSTRAINT unique_phase_order UNIQUE (finding_id, phase_order)
);

CREATE INDEX idx_dosing_phases_finding ON finding_dosing_phases (finding_id);

-- ========================
-- FINDING SIDE EFFECTS
-- ========================

CREATE TABLE public.finding_side_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  side_effect_name TEXT NOT NULL,
  is_known_side_effect BOOLEAN NOT NULL DEFAULT true,
  severity INTEGER CHECK (severity >= 1 AND severity <= 5),
  onset_timing TEXT,
  resolved BOOLEAN,
  notes TEXT
);

CREATE INDEX idx_side_effects_finding ON finding_side_effects (finding_id);
CREATE INDEX idx_side_effects_name ON finding_side_effects (side_effect_name);

-- ===================
-- FINDING RESULTS
-- ===================
-- Category-specific quantitative data

CREATE TABLE public.finding_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  category result_category NOT NULL,

  -- Common fields
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
  time_to_notice_days INTEGER,

  -- Category-specific data stored as JSONB
  data JSONB NOT NULL DEFAULT '{}',

  notes TEXT,

  CONSTRAINT unique_finding_category UNIQUE (finding_id, category)
);

CREATE INDEX idx_results_finding ON finding_results (finding_id);
CREATE INDEX idx_results_category ON finding_results (category);
CREATE INDEX idx_results_data ON finding_results USING gin (data);

-- ===================
-- DISCUSSIONS TABLE
-- ===================
-- Reddit-style threaded discussions

CREATE TABLE public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  peptide_id TEXT NOT NULL,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  -- Denormalized counts for performance
  upvote_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,

  -- Threading depth limit
  depth INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
  CONSTRAINT max_depth CHECK (depth <= 10)
);

CREATE INDEX idx_discussions_peptide ON discussions (peptide_id);
CREATE INDEX idx_discussions_parent ON discussions (parent_id);
CREATE INDEX idx_discussions_user ON discussions (user_id);
CREATE INDEX idx_discussions_created ON discussions (created_at DESC);
CREATE INDEX idx_discussions_upvotes ON discussions (upvote_count DESC);
CREATE INDEX idx_discussions_peptide_toplevel ON discussions (peptide_id, created_at DESC) WHERE parent_id IS NULL;

-- ======================
-- DISCUSSION UPVOTES
-- ======================

CREATE TABLE public.discussion_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_upvote UNIQUE (user_id, discussion_id)
);

CREATE INDEX idx_upvotes_discussion ON discussion_upvotes (discussion_id);
CREATE INDEX idx_upvotes_user ON discussion_upvotes (user_id);

-- ====================
-- TRIGGER FUNCTIONS
-- ====================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, location, newsletter_opt_in)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'location',
    COALESCE((NEW.raw_user_meta_data->>'newsletter_opt_in')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update reply count and set depth when adding reply
CREATE OR REPLACE FUNCTION public.handle_new_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_depth INTEGER;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT depth INTO parent_depth FROM discussions WHERE id = NEW.parent_id;
    NEW.depth := COALESCE(parent_depth, 0) + 1;

    IF NEW.depth > 10 THEN
      RAISE EXCEPTION 'Maximum reply depth exceeded';
    END IF;

    UPDATE discussions
    SET reply_count = reply_count + 1,
        updated_at = now()
    WHERE id = NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_discussion_insert
  BEFORE INSERT ON discussions
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_reply();

-- Decrement reply count on delete
CREATE OR REPLACE FUNCTION public.handle_reply_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.parent_id IS NOT NULL THEN
    UPDATE discussions
    SET reply_count = GREATEST(reply_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.parent_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_discussion_delete
  AFTER DELETE ON discussions
  FOR EACH ROW EXECUTE FUNCTION public.handle_reply_delete();

-- Update upvote count atomically
CREATE OR REPLACE FUNCTION public.handle_upvote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussions
    SET upvote_count = upvote_count + 1
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussions
    SET upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_upvote_change
  AFTER INSERT OR DELETE ON discussion_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_upvote();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_findings_updated_at
  BEFORE UPDATE ON findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Set published_at when status changes to published
CREATE OR REPLACE FUNCTION public.handle_finding_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status = 'draft' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_finding_publish
  BEFORE UPDATE ON findings
  FOR EACH ROW EXECUTE FUNCTION public.handle_finding_publish();

-- ============================
-- ROW LEVEL SECURITY POLICIES
-- ============================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Favorite Peptides
ALTER TABLE user_favorite_peptides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON user_favorite_peptides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorite_peptides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorite_peptides FOR DELETE
  USING (auth.uid() = user_id);

-- Findings
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published findings are viewable by all"
  ON findings FOR SELECT
  USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own findings"
  ON findings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own findings"
  ON findings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own findings"
  ON findings FOR DELETE
  USING (auth.uid() = user_id);

-- Finding Dosing Phases
ALTER TABLE finding_dosing_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dosing phases follow parent visibility"
  ON finding_dosing_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = finding_dosing_phases.finding_id
      AND (findings.status = 'published' OR findings.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own dosing phases"
  ON finding_dosing_phases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = finding_dosing_phases.finding_id
      AND findings.user_id = auth.uid()
    )
  );

-- Finding Side Effects
ALTER TABLE finding_side_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Side effects follow parent visibility"
  ON finding_side_effects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = finding_side_effects.finding_id
      AND (findings.status = 'published' OR findings.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own side effects"
  ON finding_side_effects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = finding_side_effects.finding_id
      AND findings.user_id = auth.uid()
    )
  );

-- Finding Results
ALTER TABLE finding_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Results follow parent visibility"
  ON finding_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = finding_results.finding_id
      AND (findings.status = 'published' OR findings.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own results"
  ON finding_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = finding_results.finding_id
      AND findings.user_id = auth.uid()
    )
  );

-- Discussions
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussions are viewable by everyone"
  ON discussions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can post"
  ON discussions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON discussions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON discussions FOR DELETE
  USING (auth.uid() = user_id);

-- Discussion Upvotes
ALTER TABLE discussion_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes"
  ON discussion_upvotes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upvote"
  ON discussion_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own upvotes"
  ON discussion_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================
-- ANONYMIZED FINDINGS VIEW
-- ============================

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
