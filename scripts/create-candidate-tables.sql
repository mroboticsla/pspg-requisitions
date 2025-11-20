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

-- RLS Policies for candidate_profiles

-- Users can view their own profile
CREATE POLICY "Users can view own candidate profile" ON public.candidate_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own candidate profile" ON public.candidate_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own candidate profile" ON public.candidate_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins and Partners can view all candidate profiles
CREATE POLICY "Admins and Partners can view all candidate profiles" ON public.candidate_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

-- RLS Policies for child tables (experience, education, skills, languages)
-- We can use a common pattern for these

-- Experience
CREATE POLICY "Users can manage own experience" ON public.candidate_experience
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Admins and Partners can view all experience" ON public.candidate_experience
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

-- Education
CREATE POLICY "Users can manage own education" ON public.candidate_education
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Admins and Partners can view all education" ON public.candidate_education
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

-- Skills
CREATE POLICY "Users can manage own skills" ON public.candidate_skills
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Admins and Partners can view all skills" ON public.candidate_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

-- Languages
CREATE POLICY "Users can manage own languages" ON public.candidate_languages
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Admins and Partners can view all languages" ON public.candidate_languages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );

-- Storage Bucket Setup for Resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow authenticated users to upload their own resume
CREATE POLICY "Users can upload own resume" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'user-' || auth.uid()::text);

-- Allow users to update their own resume
CREATE POLICY "Users can update own resume" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'user-' || auth.uid()::text);

-- Allow users to read their own resume
CREATE POLICY "Users can read own resume" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'user-' || auth.uid()::text);

-- Allow users to delete their own resume
CREATE POLICY "Users can delete own resume" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = 'user-' || auth.uid()::text);

-- Allow admins/partners to read all resumes
CREATE POLICY "Admins and Partners can read all resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
      )
    )
  );
