-- =====================================================
-- Storage self-hosted: buckets + policies + rewrite URLs
-- =====================================================
-- Run this in the SQL Editor of the SELF-HOSTED instance.
-- Creating buckets via INSERT is a fallback; prefer also running
-- scripts/migrate-storage-from-cloud.js so file bytes are copied.
-- =====================================================

-- 1. Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Avatar policies
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = concat('user-', (select auth.uid())::text)
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = concat('user-', (select auth.uid())::text)
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = concat('user-', (select auth.uid())::text)
);

-- 3. Resume policies
DROP POLICY IF EXISTS "Users can upload own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resume" ON storage.objects;
DROP POLICY IF EXISTS "Admins and Partners can read all resumes" ON storage.objects;

CREATE POLICY "Users can upload own resume"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = concat('user-', (select auth.uid())::text)
);

CREATE POLICY "Users can update own resume"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = concat('user-', (select auth.uid())::text)
);

CREATE POLICY "Users can read own resume"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = concat('user-', (select auth.uid())::text)
);

CREATE POLICY "Users can delete own resume"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = concat('user-', (select auth.uid())::text)
);

CREATE POLICY "Admins and Partners can read all resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role_id IN (
      SELECT id FROM public.roles WHERE name IN ('admin', 'superadmin', 'partner')
    )
  )
);

-- 4. Point stored URLs at the current self-hosted host
UPDATE public.user_metadata
SET avatar_url = replace(
  avatar_url,
  'https://rokqodsedwjkjltvsnol.supabase.co',
  'https://sb-pspg-rrhh.mroboticsla.com'
)
WHERE avatar_url LIKE '%rokqodsedwjkjltvsnol.supabase.co%';

UPDATE public.candidate_profiles
SET resume_url = replace(
  resume_url,
  'https://rokqodsedwjkjltvsnol.supabase.co',
  'https://sb-pspg-rrhh.mroboticsla.com'
)
WHERE resume_url LIKE '%rokqodsedwjkjltvsnol.supabase.co%';
