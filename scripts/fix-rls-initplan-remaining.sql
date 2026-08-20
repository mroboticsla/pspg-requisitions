-- =====================================================
-- Remaining auth_rls_initplan warnings
-- =====================================================
-- Run in the Supabase SQL Editor after fix-rls-performance.sql.
--
-- Cause: LANGUAGE sql helpers (and (select auth.uid())) get inlined
-- back to auth.uid()/current_setting() in the stored policy text.
-- Fix: plpgsql helpers (cannot be inlined) + rewrite these policies
-- so the advisor never sees auth.*() or current_setting().
--
-- Access rules stay the same. Re-run is safe.
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.current_uid()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = (SELECT auth.uid())
      AND r.name IN ('admin', 'superadmin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = (SELECT auth.uid())
      AND r.name IN ('admin', 'superadmin', 'partner')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.current_uid() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO authenticated;

-- -----------------------------------------------------
-- user_metadata
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own metadata" ON public.user_metadata;
DROP POLICY IF EXISTS "Users can insert their own metadata" ON public.user_metadata;
DROP POLICY IF EXISTS "Users can update their own metadata" ON public.user_metadata;

CREATE POLICY "Users can view their own metadata"
ON public.user_metadata FOR SELECT TO authenticated
USING (user_id = (select public.current_uid()));

CREATE POLICY "Users can insert their own metadata"
ON public.user_metadata FOR INSERT TO authenticated
WITH CHECK (user_id = (select public.current_uid()));

CREATE POLICY "Users can update their own metadata"
ON public.user_metadata FOR UPDATE TO authenticated
USING (user_id = (select public.current_uid()))
WITH CHECK (user_id = (select public.current_uid()));

-- -----------------------------------------------------
-- candidate_profiles
-- -----------------------------------------------------
DROP POLICY IF EXISTS "candidate_profiles_select" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Users can update own candidate profile" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Users can insert own candidate profile" ON public.candidate_profiles;

CREATE POLICY "candidate_profiles_select"
ON public.candidate_profiles FOR SELECT TO authenticated
USING (
  id = (select public.current_uid())
  OR (select public.current_user_is_staff())
);

CREATE POLICY "Users can update own candidate profile"
ON public.candidate_profiles FOR UPDATE TO authenticated
USING (id = (select public.current_uid()))
WITH CHECK (id = (select public.current_uid()));

CREATE POLICY "Users can insert own candidate profile"
ON public.candidate_profiles FOR INSERT TO authenticated
WITH CHECK (id = (select public.current_uid()));

-- -----------------------------------------------------
-- candidate child tables
-- -----------------------------------------------------
DROP POLICY IF EXISTS "candidate_education_select" ON public.candidate_education;
DROP POLICY IF EXISTS "Users can manage own education (insert)" ON public.candidate_education;
DROP POLICY IF EXISTS "Users can manage own education (update)" ON public.candidate_education;
DROP POLICY IF EXISTS "Users can manage own education (delete)" ON public.candidate_education;

CREATE POLICY "candidate_education_select"
ON public.candidate_education FOR SELECT TO authenticated
USING (
  profile_id = (select public.current_uid())
  OR (select public.current_user_is_staff())
);
CREATE POLICY "Users can manage own education (insert)"
ON public.candidate_education FOR INSERT TO authenticated
WITH CHECK (profile_id = (select public.current_uid()));
CREATE POLICY "Users can manage own education (update)"
ON public.candidate_education FOR UPDATE TO authenticated
USING (profile_id = (select public.current_uid()))
WITH CHECK (profile_id = (select public.current_uid()));
CREATE POLICY "Users can manage own education (delete)"
ON public.candidate_education FOR DELETE TO authenticated
USING (profile_id = (select public.current_uid()));

DROP POLICY IF EXISTS "candidate_experience_select" ON public.candidate_experience;
DROP POLICY IF EXISTS "Users can manage own experience (insert)" ON public.candidate_experience;
DROP POLICY IF EXISTS "Users can manage own experience (update)" ON public.candidate_experience;
DROP POLICY IF EXISTS "Users can manage own experience (delete)" ON public.candidate_experience;

CREATE POLICY "candidate_experience_select"
ON public.candidate_experience FOR SELECT TO authenticated
USING (
  profile_id = (select public.current_uid())
  OR (select public.current_user_is_staff())
);
CREATE POLICY "Users can manage own experience (insert)"
ON public.candidate_experience FOR INSERT TO authenticated
WITH CHECK (profile_id = (select public.current_uid()));
CREATE POLICY "Users can manage own experience (update)"
ON public.candidate_experience FOR UPDATE TO authenticated
USING (profile_id = (select public.current_uid()))
WITH CHECK (profile_id = (select public.current_uid()));
CREATE POLICY "Users can manage own experience (delete)"
ON public.candidate_experience FOR DELETE TO authenticated
USING (profile_id = (select public.current_uid()));

DROP POLICY IF EXISTS "candidate_languages_select" ON public.candidate_languages;
DROP POLICY IF EXISTS "Users can manage own languages (insert)" ON public.candidate_languages;
DROP POLICY IF EXISTS "Users can manage own languages (update)" ON public.candidate_languages;
DROP POLICY IF EXISTS "Users can manage own languages (delete)" ON public.candidate_languages;

CREATE POLICY "candidate_languages_select"
ON public.candidate_languages FOR SELECT TO authenticated
USING (
  profile_id = (select public.current_uid())
  OR (select public.current_user_is_staff())
);
CREATE POLICY "Users can manage own languages (insert)"
ON public.candidate_languages FOR INSERT TO authenticated
WITH CHECK (profile_id = (select public.current_uid()));
CREATE POLICY "Users can manage own languages (update)"
ON public.candidate_languages FOR UPDATE TO authenticated
USING (profile_id = (select public.current_uid()))
WITH CHECK (profile_id = (select public.current_uid()));
CREATE POLICY "Users can manage own languages (delete)"
ON public.candidate_languages FOR DELETE TO authenticated
USING (profile_id = (select public.current_uid()));

DROP POLICY IF EXISTS "candidate_skills_select" ON public.candidate_skills;
DROP POLICY IF EXISTS "Users can manage own skills (insert)" ON public.candidate_skills;
DROP POLICY IF EXISTS "Users can manage own skills (update)" ON public.candidate_skills;
DROP POLICY IF EXISTS "Users can manage own skills (delete)" ON public.candidate_skills;

CREATE POLICY "candidate_skills_select"
ON public.candidate_skills FOR SELECT TO authenticated
USING (
  profile_id = (select public.current_uid())
  OR (select public.current_user_is_staff())
);
CREATE POLICY "Users can manage own skills (insert)"
ON public.candidate_skills FOR INSERT TO authenticated
WITH CHECK (profile_id = (select public.current_uid()));
CREATE POLICY "Users can manage own skills (update)"
ON public.candidate_skills FOR UPDATE TO authenticated
USING (profile_id = (select public.current_uid()))
WITH CHECK (profile_id = (select public.current_uid()));
CREATE POLICY "Users can manage own skills (delete)"
ON public.candidate_skills FOR DELETE TO authenticated
USING (profile_id = (select public.current_uid()));

-- -----------------------------------------------------
-- profiles
-- -----------------------------------------------------
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = (select public.current_uid())
  OR (select public.current_user_is_admin())
);

CREATE POLICY "profiles_update"
ON public.profiles FOR UPDATE TO authenticated
USING (
  id = (select public.current_uid())
  OR (select public.current_user_is_admin())
)
WITH CHECK (
  id = (select public.current_uid())
  OR (select public.current_user_is_admin())
);

-- -----------------------------------------------------
-- companies / company_users
-- -----------------------------------------------------
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "company_users_select" ON public.company_users;

CREATE POLICY "companies_select"
ON public.companies FOR SELECT TO authenticated
USING (
  (select public.current_user_is_admin())
  OR EXISTS (
    SELECT 1
    FROM public.company_users cu
    WHERE cu.company_id = companies.id
      AND cu.user_id = (select public.current_uid())
      AND cu.is_active = true
  )
);

CREATE POLICY "company_users_select"
ON public.company_users FOR SELECT TO authenticated
USING (
  (select public.current_user_is_admin())
  OR user_id = (select public.current_uid())
);

-- -----------------------------------------------------
-- form templates / sections / fields
-- -----------------------------------------------------
DROP POLICY IF EXISTS "form_templates_select" ON public.form_templates;
DROP POLICY IF EXISTS "form_sections_select" ON public.form_sections;
DROP POLICY IF EXISTS "form_fields_select" ON public.form_fields;

CREATE POLICY "form_templates_select"
ON public.form_templates FOR SELECT TO authenticated
USING (
  (select public.current_user_is_admin())
  OR public.user_has_company_access(company_id)
);

CREATE POLICY "form_sections_select"
ON public.form_sections FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.form_templates ft
    WHERE ft.id = form_sections.template_id
      AND (
        (select public.current_user_is_admin())
        OR public.user_has_company_access(ft.company_id)
      )
  )
);

CREATE POLICY "form_fields_select"
ON public.form_fields FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.form_sections fs
    JOIN public.form_templates ft ON ft.id = fs.template_id
    WHERE fs.id = form_fields.section_id
      AND (
        (select public.current_user_is_admin())
        OR public.user_has_company_access(ft.company_id)
      )
  )
);

-- -----------------------------------------------------
-- job ads
-- -----------------------------------------------------
DROP POLICY IF EXISTS "job_ads_select" ON public.job_ads;

CREATE POLICY "job_ads_select"
ON public.job_ads FOR SELECT TO anon, authenticated
USING (
  status = 'published'
  OR (select public.current_user_is_admin())
);

-- -----------------------------------------------------
-- requisitions
-- -----------------------------------------------------
DROP POLICY IF EXISTS "requisitions_select" ON public.requisitions;
DROP POLICY IF EXISTS "requisitions_insert_owner" ON public.requisitions;
DROP POLICY IF EXISTS "Users can create requisitions for assigned companies" ON public.requisitions;
DROP POLICY IF EXISTS "requisitions_update" ON public.requisitions;
DROP POLICY IF EXISTS "requisitions_delete" ON public.requisitions;

CREATE POLICY "requisitions_select"
ON public.requisitions FOR SELECT TO authenticated
USING (
  (select public.current_user_is_admin())
  OR public.user_has_company_access(company_id)
);

CREATE POLICY "requisitions_insert_owner"
ON public.requisitions FOR INSERT TO authenticated
WITH CHECK (
  created_by = (select public.current_uid())
  AND public.user_has_company_access(company_id)
);

CREATE POLICY "requisitions_update"
ON public.requisitions FOR UPDATE TO authenticated
USING (
  (select public.current_user_is_admin())
  OR (created_by = (select public.current_uid()) AND status = 'draft')
)
WITH CHECK (
  (select public.current_user_is_admin())
  OR (created_by = (select public.current_uid()) AND status = 'draft')
);

CREATE POLICY "requisitions_delete"
ON public.requisitions FOR DELETE TO authenticated
USING (
  (select public.current_user_is_admin())
  OR (created_by = (select public.current_uid()) AND status = 'draft')
);

-- -----------------------------------------------------
-- requisition_responses
-- -----------------------------------------------------
DROP POLICY IF EXISTS "requisition_responses_select" ON public.requisition_responses;
DROP POLICY IF EXISTS "Users can insert responses for their requisitions" ON public.requisition_responses;
DROP POLICY IF EXISTS "Users can update responses for their draft requisitions" ON public.requisition_responses;
DROP POLICY IF EXISTS "Users can delete responses for their draft requisitions" ON public.requisition_responses;

CREATE POLICY "requisition_responses_select"
ON public.requisition_responses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.requisitions r
    WHERE r.id = requisition_responses.requisition_id
      AND (
        r.created_by = (select public.current_uid())
        OR (select public.current_user_is_admin())
        OR public.user_has_company_access(r.company_id)
      )
  )
);

CREATE POLICY "Users can insert responses for their requisitions"
ON public.requisition_responses FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.requisitions r
    WHERE r.id = requisition_responses.requisition_id
      AND r.created_by = (select public.current_uid())
  )
);

CREATE POLICY "Users can update responses for their draft requisitions"
ON public.requisition_responses FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.requisitions r
    WHERE r.id = requisition_responses.requisition_id
      AND r.created_by = (select public.current_uid())
      AND r.status = 'draft'
  )
);

CREATE POLICY "Users can delete responses for their draft requisitions"
ON public.requisition_responses FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.requisitions r
    WHERE r.id = requisition_responses.requisition_id
      AND r.created_by = (select public.current_uid())
      AND r.status = 'draft'
  )
);

COMMIT;

-- Lint 0003 predicate. Should be 0 rows.
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual like '%auth.uid()%' and lower(qual) not like '%select auth.uid()%')
    or (qual like '%auth.jwt()%' and lower(qual) not like '%select auth.jwt()%')
    or (qual like '%auth.role()%' and lower(qual) not like '%select auth.role()%')
    or (qual like '%auth.email()%' and lower(qual) not like '%select auth.email()%')
    or (qual like '%current\_setting(%)%' and lower(qual) not like '%select current\_setting(%)%')
    or (with_check like '%auth.uid()%' and lower(with_check) not like '%select auth.uid()%')
    or (with_check like '%auth.jwt()%' and lower(with_check) not like '%select auth.jwt()%')
    or (with_check like '%auth.role()%' and lower(with_check) not like '%select auth.role()%')
    or (with_check like '%auth.email()%' and lower(with_check) not like '%select auth.email()%')
    or (with_check like '%current\_setting(%)%' and lower(with_check) not like '%select current\_setting(%)%')
  )
ORDER BY tablename, policyname;
