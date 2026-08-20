-- =====================================================
-- Fix Supabase advisors: auth_rls_initplan + multiple_permissive_policies
-- =====================================================
-- Run this in the Supabase SQL Editor as a single script.
--
-- 1) Replaces auth.uid() with (select public.current_uid()) so the call
--    is an InitPlan AND the advisor no longer sees a bare auth.uid()
--    (Postgres deparses (select auth.uid()) as (SELECT auth.uid() AS uid),
--    which still trips lint 0003).
-- 2) Wraps auth.jwt()/auth.role()/auth.email()/current_setting().
-- 3) Admin-only policies use (select public.current_user_is_admin()) so
--    the profiles/roles lookup runs once per query, not per row.
-- 4) Merges overlapping permissive policies / splits FOR ALL + SELECT.
--
-- Access rules stay the same. Re-run is safe (idempotent).
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- Permanent helpers (InitPlan-friendly; used by RLS policies)
-- -----------------------------------------------------

-- plpgsql so Postgres cannot inline these into policy expressions
-- (LANGUAGE sql helpers get inlined back to auth.uid()/current_setting(),
-- which is what lint 0003 still flags).
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

CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
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
      AND r.name = 'superadmin'
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
REVOKE ALL ON FUNCTION public.current_user_is_superadmin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_staff() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO authenticated;

-- Keep company-access checks from calling bare auth.uid() per row.
-- Replace the existing signature only (do not add an overload; that would
-- make user_has_company_access(uuid) ambiguous).
DO $fix_company_access$
BEGIN
  IF to_regprocedure('public.user_has_company_access(uuid, uuid)') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.user_has_company_access(
        p_company_id uuid,
        p_user_id uuid DEFAULT NULL
      )
      RETURNS boolean
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      DECLARE
        v_uid uuid;
      BEGIN
        v_uid := COALESCE(p_user_id, (SELECT auth.uid()));
        RETURN EXISTS (
          SELECT 1
          FROM public.company_users cu
          WHERE cu.company_id = p_company_id
            AND cu.user_id = v_uid
            AND cu.is_active = true
        )
        OR EXISTS (
          SELECT 1
          FROM public.profiles p
          JOIN public.roles r ON p.role_id = r.id
          WHERE p.id = v_uid
            AND r.name IN ('superadmin', 'admin')
        );
      END;
      $body$;
    $sql$;
    REVOKE ALL ON FUNCTION public.user_has_company_access(uuid, uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.user_has_company_access(uuid, uuid) TO authenticated;
  END IF;

  IF to_regprocedure('public.user_has_company_access(uuid)') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.user_has_company_access(p_company_id uuid)
      RETURNS boolean
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      DECLARE
        v_uid uuid;
      BEGIN
        v_uid := (SELECT auth.uid());
        RETURN EXISTS (
          SELECT 1
          FROM public.company_users cu
          WHERE cu.company_id = p_company_id
            AND cu.user_id = v_uid
            AND cu.is_active = true
        )
        OR EXISTS (
          SELECT 1
          FROM public.profiles p
          JOIN public.roles r ON p.role_id = r.id
          WHERE p.id = v_uid
            AND r.name IN ('superadmin', 'admin')
        );
      END;
      $body$;
    $sql$;
    REVOKE ALL ON FUNCTION public.user_has_company_access(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.user_has_company_access(uuid) TO authenticated;
  END IF;
END;
$fix_company_access$;

-- -----------------------------------------------------
-- Session helpers (disappear when the connection ends)
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.wrap_auth_calls(expr text)
RETURNS text
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF expr IS NULL THEN
    RETURN NULL;
  END IF;

  -- Unwrap previous forms so the script is idempotent, including the
  -- "AS uid" alias Postgres adds when it pretty-prints scalar subqueries.
  expr := regexp_replace(expr, '\(\s*select\s+(public\.)?current_uid\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'auth.uid()', 'gi');
  expr := regexp_replace(expr, '(public\.)current_uid\s*\(\s*\)', 'auth.uid()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+auth\.uid\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'auth.uid()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+auth\.jwt\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'auth.jwt()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+auth\.role\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'auth.role()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+auth\.email\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'auth.email()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+(current_setting\s*\([^)]*\))\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', '\1', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+(public\.)?current_user_role\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'current_user_role()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+(public\.)?current_user_is_admin\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'public.current_user_is_admin()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+(public\.)?current_user_is_superadmin\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'public.current_user_is_superadmin()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+(public\.)?current_user_is_staff\s*\(\s*\)\s*(as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\)', 'public.current_user_is_staff()', 'gi');

  expr := replace(expr, 'auth.uid()', '(select public.current_uid())');
  expr := replace(expr, 'auth.jwt()', '(select auth.jwt())');
  expr := replace(expr, 'auth.role()', '(select auth.role())');
  expr := replace(expr, 'auth.email()', '(select auth.email())');
  expr := regexp_replace(expr, 'current_setting\s*\(([^)]*)\)', '(select current_setting(\1))', 'gi');
  expr := regexp_replace(expr, '(public\.)?current_user_role\s*\(\s*\)', '(select current_user_role())', 'gi');
  expr := regexp_replace(expr, '(public\.)?current_user_is_admin\s*\(\s*\)', '(select public.current_user_is_admin())', 'gi');
  expr := regexp_replace(expr, '(public\.)?current_user_is_superadmin\s*\(\s*\)', '(select public.current_user_is_superadmin())', 'gi');
  expr := regexp_replace(expr, '(public\.)?current_user_is_staff\s*\(\s*\)', '(select public.current_user_is_staff())', 'gi');

  RETURN expr;
END;
$fn$;

CREATE OR REPLACE FUNCTION pg_temp.roles_sql(roles name[])
RETURNS text
LANGUAGE sql
AS $fn$
  SELECT string_agg(
    CASE WHEN r = 'public' THEN 'PUBLIC' ELSE quote_ident(r) END,
    ', '
  )
  FROM unnest(roles) AS r;
$fn$;

CREATE OR REPLACE FUNCTION pg_temp.recreate_policy(
  p_schema text,
  p_table text,
  p_name text,
  p_permissive text,
  p_cmd text,
  p_roles name[],
  p_qual text,
  p_with_check text
)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  sql text;
  cmd_kw text;
  perm_kw text;
BEGIN
  cmd_kw := CASE WHEN p_cmd IN ('*', 'ALL') THEN 'ALL' ELSE p_cmd END;
  perm_kw := CASE WHEN upper(p_permissive) = 'RESTRICTIVE' THEN 'RESTRICTIVE' ELSE 'PERMISSIVE' END;

  EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p_name, p_schema, p_table);

  sql := format(
    'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
    p_name,
    p_schema,
    p_table,
    perm_kw,
    cmd_kw,
    pg_temp.roles_sql(p_roles)
  );

  IF p_qual IS NOT NULL THEN
    sql := sql || ' USING (' || p_qual || ')';
  END IF;

  IF p_with_check IS NOT NULL THEN
    sql := sql || ' WITH CHECK (' || p_with_check || ')';
  END IF;

  EXECUTE sql;
END;
$fn$;

CREATE OR REPLACE FUNCTION pg_temp.or_exprs(exprs text[])
RETURNS text
LANGUAGE sql
AS $fn$
  SELECT string_agg('(' || e || ')', ' OR ')
  FROM unnest(exprs) AS e
  WHERE e IS NOT NULL AND length(btrim(e)) > 0;
$fn$;

CREATE OR REPLACE FUNCTION pg_temp.drop_policies(
  p_schema text,
  p_table text,
  p_names text[]
)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = p_schema
      AND tablename = p_table
      AND policyname = ANY (p_names)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, p_schema, p_table);
  END LOOP;
END;
$fn$;

CREATE OR REPLACE FUNCTION pg_temp.merge_cmd_policies(
  p_schema text,
  p_table text,
  p_cmd text,
  p_old_names text[],
  p_new_name text,
  p_roles name[]
)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  quals text[];
  checks text[];
  merged_qual text;
  merged_check text;
  n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = p_schema
    AND tablename = p_table
    AND policyname = ANY (p_old_names);

  IF n < 2 THEN
    RETURN;
  END IF;

  SELECT coalesce(array_agg(qual ORDER BY policyname), ARRAY[]::text[])
  INTO quals
  FROM pg_policies
  WHERE schemaname = p_schema
    AND tablename = p_table
    AND policyname = ANY (p_old_names);

  SELECT coalesce(array_agg(coalesce(with_check, qual) ORDER BY policyname), ARRAY[]::text[])
  INTO checks
  FROM pg_policies
  WHERE schemaname = p_schema
    AND tablename = p_table
    AND policyname = ANY (p_old_names);

  merged_qual := pg_temp.or_exprs(quals);
  merged_check := pg_temp.or_exprs(checks);

  IF p_cmd = 'INSERT' THEN
    merged_qual := NULL;
  ELSIF p_cmd IN ('SELECT', 'DELETE') THEN
    merged_check := NULL;
  END IF;

  PERFORM pg_temp.drop_policies(p_schema, p_table, p_old_names);

  PERFORM pg_temp.recreate_policy(
    p_schema,
    p_table,
    p_new_name,
    'PERMISSIVE',
    p_cmd,
    p_roles,
    merged_qual,
    merged_check
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION pg_temp.split_all_and_merge_select(
  p_schema text,
  p_table text,
  p_all_policy text,
  p_select_policies text[],
  p_new_select_name text,
  p_select_roles name[],
  p_write_roles name[]
)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  all_rec pg_policies%ROWTYPE;
  select_quals text[];
  all_names text[];
  n int;
BEGIN
  all_names := p_select_policies || p_all_policy;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = p_schema
    AND tablename = p_table
    AND policyname = ANY (all_names);

  IF n < 2 THEN
    RETURN;
  END IF;

  SELECT * INTO all_rec
  FROM pg_policies
  WHERE schemaname = p_schema
    AND tablename = p_table
    AND policyname = p_all_policy;

  SELECT coalesce(array_agg(qual), ARRAY[]::text[])
  INTO select_quals
  FROM pg_policies
  WHERE schemaname = p_schema
    AND tablename = p_table
    AND policyname = ANY (p_select_policies);

  IF all_rec.qual IS NOT NULL THEN
    select_quals := select_quals || all_rec.qual;
  END IF;

  PERFORM pg_temp.drop_policies(p_schema, p_table, all_names);

  PERFORM pg_temp.recreate_policy(
    p_schema,
    p_table,
    p_new_select_name,
    'PERMISSIVE',
    'SELECT',
    p_select_roles,
    pg_temp.or_exprs(select_quals),
    NULL
  );

  IF all_rec.policyname IS NOT NULL THEN
    PERFORM pg_temp.recreate_policy(
      p_schema, p_table, p_all_policy || ' (insert)',
      'PERMISSIVE', 'INSERT', p_write_roles,
      NULL, coalesce(all_rec.with_check, all_rec.qual)
    );
    PERFORM pg_temp.recreate_policy(
      p_schema, p_table, p_all_policy || ' (update)',
      'PERMISSIVE', 'UPDATE', p_write_roles,
      all_rec.qual, coalesce(all_rec.with_check, all_rec.qual)
    );
    PERFORM pg_temp.recreate_policy(
      p_schema, p_table, p_all_policy || ' (delete)',
      'PERMISSIVE', 'DELETE', p_write_roles,
      all_rec.qual, NULL
    );
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION pg_temp.wrap_all_public_policies()
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  r record;
  new_qual text;
  new_check text;
BEGIN
  DROP TABLE IF EXISTS pg_temp.policies_to_wrap;
  CREATE TEMP TABLE policies_to_wrap AS
  SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public';

  FOR r IN SELECT * FROM policies_to_wrap
  LOOP
    new_qual := pg_temp.wrap_auth_calls(r.qual);
    new_check := pg_temp.wrap_auth_calls(r.with_check);

    IF new_qual IS DISTINCT FROM r.qual OR new_check IS DISTINCT FROM r.with_check THEN
      PERFORM pg_temp.recreate_policy(
        r.schemaname,
        r.tablename,
        r.policyname,
        r.permissive,
        r.cmd,
        r.roles,
        new_qual,
        new_check
      );
    END IF;
  END LOOP;
END;
$fn$;

CREATE OR REPLACE FUNCTION pg_temp.force_helper_policy(
  p_schema text,
  p_table text,
  p_name text,
  p_helper text
)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  rec pg_policies%ROWTYPE;
  helper_expr text;
  new_qual text;
  new_check text;
BEGIN
  SELECT * INTO rec
  FROM pg_policies
  WHERE schemaname = p_schema
    AND tablename = p_table
    AND policyname = p_name;

  IF rec.policyname IS NULL THEN
    RETURN;
  END IF;

  helper_expr := '(select public.' || p_helper || '())';

  IF rec.cmd = 'INSERT' THEN
    new_qual := NULL;
    new_check := helper_expr;
  ELSIF rec.cmd IN ('SELECT', 'DELETE') THEN
    new_qual := helper_expr;
    new_check := NULL;
  ELSE
    -- UPDATE or ALL
    new_qual := helper_expr;
    new_check := helper_expr;
  END IF;

  PERFORM pg_temp.recreate_policy(
    rec.schemaname,
    rec.tablename,
    rec.policyname,
    rec.permissive,
    rec.cmd,
    rec.roles,
    new_qual,
    new_check
  );
END;
$fn$;

-- -----------------------------------------------------
-- 1) Wrap auth.*() / current_setting() in every public RLS policy
-- -----------------------------------------------------

DO $$ BEGIN PERFORM pg_temp.wrap_all_public_policies(); END $$;

-- Row-independent admin checks: one InitPlan instead of EXISTS per row
DO $admin$
DECLARE
  admin_names text[] := ARRAY[
    'Admins can manage assignments',
    'Only admins can assign users to companies',
    'Only admins can create companies',
    'Only admins can delete fields',
    'Only admins can delete sections',
    'Only admins can delete templates',
    'Only admins can insert fields',
    'Only admins can insert sections',
    'Only admins can manage templates',
    'Only admins can remove company assignments',
    'Only admins can update companies',
    'Only admins can update company assignments',
    'Only admins can update fields',
    'Only admins can update sections',
    'Only admins can update templates',
    'Permitir lectura a admins',
    'Permitir update a admins',
    'Admins can manage job ads (insert)',
    'Admins can manage job ads (update)',
    'Admins can manage job ads (delete)'
  ];
  super_names text[] := ARRAY[
    'Only superadmins can delete companies',
    'Superadmins can delete profiles.'
  ];
  rec record;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = ANY (admin_names)
  LOOP
    PERFORM pg_temp.force_helper_policy(
      rec.schemaname, rec.tablename, rec.policyname, 'current_user_is_admin'
    );
  END LOOP;

  FOR rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = ANY (super_names)
  LOOP
    PERFORM pg_temp.force_helper_policy(
      rec.schemaname, rec.tablename, rec.policyname, 'current_user_is_superadmin'
    );
  END LOOP;
END;
$admin$;

-- -----------------------------------------------------
-- 2) Merge overlapping permissive policies
-- -----------------------------------------------------

DO $merge$
BEGIN
  -- candidate_profiles: two SELECT policies
  PERFORM pg_temp.merge_cmd_policies(
    'public', 'candidate_profiles', 'SELECT',
    ARRAY[
      'Users can view own candidate profile',
      'Admins and Partners can view all candidate profiles'
    ],
    'candidate_profiles_select',
    ARRAY['authenticated']::name[]
  );

  -- Child candidate tables: FOR ALL (includes SELECT) + staff SELECT
  PERFORM pg_temp.split_all_and_merge_select(
    'public', 'candidate_education',
    'Users can manage own education',
    ARRAY['Admins and Partners can view all education'],
    'candidate_education_select',
    ARRAY['authenticated']::name[],
    ARRAY['authenticated']::name[]
  );

  PERFORM pg_temp.split_all_and_merge_select(
    'public', 'candidate_experience',
    'Users can manage own experience',
    ARRAY['Admins and Partners can view all experience'],
    'candidate_experience_select',
    ARRAY['authenticated']::name[],
    ARRAY['authenticated']::name[]
  );

  PERFORM pg_temp.split_all_and_merge_select(
    'public', 'candidate_languages',
    'Users can manage own languages',
    ARRAY['Admins and Partners can view all languages'],
    'candidate_languages_select',
    ARRAY['authenticated']::name[],
    ARRAY['authenticated']::name[]
  );

  PERFORM pg_temp.split_all_and_merge_select(
    'public', 'candidate_skills',
    'Users can manage own skills',
    ARRAY['Admins and Partners can view all skills'],
    'candidate_skills_select',
    ARRAY['authenticated']::name[],
    ARRAY['authenticated']::name[]
  );

  -- companies / company_users
  PERFORM pg_temp.merge_cmd_policies(
    'public', 'companies', 'SELECT',
    ARRAY[
      'Admins can view all companies',
      'Partners can view their assigned companies'
    ],
    'companies_select',
    ARRAY['authenticated']::name[]
  );

  PERFORM pg_temp.merge_cmd_policies(
    'public', 'company_users', 'SELECT',
    ARRAY[
      'Admins can view all company assignments',
      'Users can view their own company assignments'
    ],
    'company_users_select',
    ARRAY['authenticated']::name[]
  );

  -- form_templates
  PERFORM pg_temp.merge_cmd_policies(
    'public', 'form_templates', 'SELECT',
    ARRAY[
      'form_templates_select_admin',
      'form_templates_select_partner',
      'Admins can view all templates',
      'Partners can view their company templates'
    ],
    'form_templates_select',
    ARRAY['authenticated']::name[]
  );

  -- job_ads: FOR ALL (admin) + public SELECT
  PERFORM pg_temp.split_all_and_merge_select(
    'public', 'job_ads',
    'Admins can manage job ads',
    ARRAY['Public can view published job ads'],
    'job_ads_select',
    ARRAY['anon', 'authenticated']::name[],
    ARRAY['authenticated']::name[]
  );

  -- profiles
  PERFORM pg_temp.merge_cmd_policies(
    'public', 'profiles', 'SELECT',
    ARRAY[
      'Admins can view all profiles, users can view their own.',
      'Users can view own profile'
    ],
    'profiles_select',
    ARRAY['authenticated']::name[]
  );

  PERFORM pg_temp.merge_cmd_policies(
    'public', 'profiles', 'UPDATE',
    ARRAY[
      'Admins can update any profile.',
      'Users can update their own profile.',
      'Users can update own profile'
    ],
    'profiles_update',
    ARRAY['authenticated']::name[]
  );

  -- requisitions (legacy names + current snake_case names)
  PERFORM pg_temp.merge_cmd_policies(
    'public', 'requisitions', 'SELECT',
    ARRAY[
      'requisitions_select_admin',
      'requisitions_select_partner',
      'Admins can view all requisitions',
      'Partners can view their company requisitions'
    ],
    'requisitions_select',
    ARRAY['authenticated']::name[]
  );

  PERFORM pg_temp.merge_cmd_policies(
    'public', 'requisitions', 'UPDATE',
    ARRAY[
      'requisitions_update_admin',
      'requisitions_update_owner_draft',
      'Admins can update any requisition',
      'Users can update their own draft requisitions'
    ],
    'requisitions_update',
    ARRAY['authenticated']::name[]
  );

  PERFORM pg_temp.merge_cmd_policies(
    'public', 'requisitions', 'DELETE',
    ARRAY[
      'Admins can delete any requisition',
      'requisitions_delete_admin',
      'requisitions_delete_owner_draft',
      'Users can delete their own draft requisitions'
    ],
    'requisitions_delete',
    ARRAY['authenticated']::name[]
  );
END;
$merge$;

-- Wrap again in case merge rebuilt expressions from older forms
DO $$ BEGIN PERFORM pg_temp.wrap_all_public_policies(); END $$;

COMMIT;

-- -----------------------------------------------------
-- Verification (run after COMMIT; does not change data)
-- -----------------------------------------------------

-- Same predicate the Supabase advisor uses (lint 0003). Should be 0 rows.
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
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

-- Remaining multiple permissive policies for authenticated (should be 0 for the tables we merged)
SELECT
  tablename,
  cmd,
  array_agg(policyname ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND 'authenticated' = ANY (roles)
GROUP BY tablename, cmd
HAVING count(*) > 1
ORDER BY tablename, cmd;
