-- Add job_profile column to candidate_profiles table
ALTER TABLE public.candidate_profiles
ADD COLUMN IF NOT EXISTS job_profile JSONB DEFAULT '{}'::jsonb;
