-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles (onboarding_completed);
