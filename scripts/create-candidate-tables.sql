-- Create candidate_profiles table
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_url TEXT,
  summary TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create candidate_experience table
CREATE TABLE IF NOT EXISTS public.candidate_experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create candidate_education table
CREATE TABLE IF NOT EXISTS public.candidate_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create candidate_skills table
CREATE TABLE IF NOT EXISTS public.candidate_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create candidate_languages table
CREATE TABLE IF NOT EXISTS public.candidate_languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  language TEXT NOT NULL,
  proficiency TEXT CHECK (proficiency IN ('basic', 'intermediate', 'advanced', 'native')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_languages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- auth.uid() is wrapped in (select ...) so Postgres evaluates it once per query
-- (Supabase lint 0003_auth_rls_initplan). SELECT rules are merged into one
-- policy per table (lint 0006_multiple_permissive_policies).

DROP POLICY IF EXISTS "Users can view own candidate profile" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Admins and Partners can view all candidate profiles" ON public.candidate_profiles;
DROP POLICY IF EXISTS "candidate_profiles_select" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Users can update own candidate profile" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Users can insert own candidate profile" ON public.candidate_profiles;

CREATE POLICY "candidate_profiles_select" ON public.candidate_profiles
  FOR SELECT TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

CREATE POLICY "Users can update own candidate profile" ON public.candidate_profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert own candidate profile" ON public.candidate_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- Child tables: one SELECT (own or staff) + write policies for the owner

DROP POLICY IF EXISTS "Users can manage own experience" ON public.candidate_experience;
DROP POLICY IF EXISTS "Admins and Partners can view all experience" ON public.candidate_experience;
DROP POLICY IF EXISTS "candidate_experience_select" ON public.candidate_experience;
DROP POLICY IF EXISTS "Users can manage own experience (insert)" ON public.candidate_experience;
DROP POLICY IF EXISTS "Users can manage own experience (update)" ON public.candidate_experience;
DROP POLICY IF EXISTS "Users can manage own experience (delete)" ON public.candidate_experience;

CREATE POLICY "candidate_experience_select" ON public.candidate_experience
  FOR SELECT TO authenticated
  USING (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

CREATE POLICY "Users can manage own experience (insert)" ON public.candidate_experience
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can manage own experience (update)" ON public.candidate_experience
  FOR UPDATE TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can manage own experience (delete)" ON public.candidate_experience
  FOR DELETE TO authenticated
  USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage own education" ON public.candidate_education;
DROP POLICY IF EXISTS "Admins and Partners can view all education" ON public.candidate_education;
DROP POLICY IF EXISTS "candidate_education_select" ON public.candidate_education;
DROP POLICY IF EXISTS "Users can manage own education (insert)" ON public.candidate_education;
DROP POLICY IF EXISTS "Users can manage own education (update)" ON public.candidate_education;
DROP POLICY IF EXISTS "Users can manage own education (delete)" ON public.candidate_education;

CREATE POLICY "candidate_education_select" ON public.candidate_education
  FOR SELECT TO authenticated
  USING (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

CREATE POLICY "Users can manage own education (insert)" ON public.candidate_education
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can manage own education (update)" ON public.candidate_education
  FOR UPDATE TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can manage own education (delete)" ON public.candidate_education
  FOR DELETE TO authenticated
  USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage own skills" ON public.candidate_skills;
DROP POLICY IF EXISTS "Admins and Partners can view all skills" ON public.candidate_skills;
DROP POLICY IF EXISTS "candidate_skills_select" ON public.candidate_skills;
DROP POLICY IF EXISTS "Users can manage own skills (insert)" ON public.candidate_skills;
DROP POLICY IF EXISTS "Users can manage own skills (update)" ON public.candidate_skills;
DROP POLICY IF EXISTS "Users can manage own skills (delete)" ON public.candidate_skills;

CREATE POLICY "candidate_skills_select" ON public.candidate_skills
  FOR SELECT TO authenticated
  USING (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

CREATE POLICY "Users can manage own skills (insert)" ON public.candidate_skills
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can manage own skills (update)" ON public.candidate_skills
  FOR UPDATE TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can manage own skills (delete)" ON public.candidate_skills
  FOR DELETE TO authenticated
  USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage own languages" ON public.candidate_languages;
DROP POLICY IF EXISTS "Admins and Partners can view all languages" ON public.candidate_languages;
DROP POLICY IF EXISTS "candidate_languages_select" ON public.candidate_languages;
DROP POLICY IF EXISTS "Users can manage own languages (insert)" ON public.candidate_languages;
DROP POLICY IF EXISTS "Users can manage own languages (update)" ON public.candidate_languages;
DROP POLICY IF EXISTS "Users can manage own languages (delete)" ON public.candidate_languages;

CREATE POLICY "candidate_languages_select" ON public.candidate_languages
  FOR SELECT TO authenticated
  USING (
    profile_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

CREATE POLICY "Users can manage own languages (insert)" ON public.candidate_languages
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can manage own languages (update)" ON public.candidate_languages
  FOR UPDATE TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can manage own languages (delete)" ON public.candidate_languages
  FOR DELETE TO authenticated
  USING (profile_id = (select auth.uid()));

-- Storage Bucket Setup for Resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow authenticated users to upload their own resume
CREATE POLICY "Users can upload own resume" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'user-' || (select auth.uid())::text);

-- Allow users to update their own resume
CREATE POLICY "Users can update own resume" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'user-' || (select auth.uid())::text);

-- Allow users to read their own resume
CREATE POLICY "Users can read own resume" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'user-' || (select auth.uid())::text);

-- Allow users to delete their own resume
CREATE POLICY "Users can delete own resume" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'user-' || (select auth.uid())::text);

-- Allow admins/partners to read all resumes
CREATE POLICY "Admins and Partners can read all resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );
