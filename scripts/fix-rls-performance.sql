-- =====================================================
-- Fix Supabase advisors: auth_rls_initplan + multiple_permissive_policies
-- =====================================================
-- Run this in the Supabase SQL Editor as a single script.
--
-- 1) Wraps auth.uid()/auth.jwt()/auth.role()/auth.email() in
--    (select auth.fn()) so Postgres evaluates them once per query.
-- 2) Merges overlapping permissive policies for the same role+action.
-- 3) Splits FOR ALL policies that were also providing SELECT.
--
-- Access rules stay the same. Re-run is safe (idempotent).
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- Helpers (session-scoped; disappear when the connection ends)
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.wrap_auth_calls(expr text)
RETURNS text
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF expr IS NULL THEN
    RETURN NULL;
  END IF;

  -- Unwrap first so the script is idempotent
  expr := regexp_replace(expr, '\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)', 'auth.uid()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+auth\.jwt\s*\(\s*\)\s*\)', 'auth.jwt()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+auth\.role\s*\(\s*\)\s*\)', 'auth.role()', 'gi');
  expr := regexp_replace(expr, '\(\s*select\s+auth\.email\s*\(\s*\)\s*\)', 'auth.email()', 'gi');

  expr := replace(expr, 'auth.uid()', '(select auth.uid())');
  expr := replace(expr, 'auth.jwt()', '(select auth.jwt())');
  expr := replace(expr, 'auth.role()', '(select auth.role())');
  expr := replace(expr, 'auth.email()', '(select auth.email())');

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

-- -----------------------------------------------------
-- 1) Wrap auth.*() in every public RLS policy
-- -----------------------------------------------------

CREATE TEMP TABLE policies_to_wrap ON COMMIT DROP AS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    coalesce(qual, '') ~ 'auth\.(uid|jwt|role|email)\('
    OR coalesce(with_check, '') ~ 'auth\.(uid|jwt|role|email)\('
  );

DO $wrap$
DECLARE
  r record;
  new_qual text;
  new_check text;
BEGIN
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
$wrap$;

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

COMMIT;

-- -----------------------------------------------------
-- Verification (run after COMMIT; does not change data)
-- -----------------------------------------------------

-- Remaining bare auth.*() calls (should be 0)
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    regexp_replace(coalesce(qual, ''), '\(\s*select\s+auth\.(uid|jwt|role|email)\s*\(\s*\)\s*\)', '', 'gi')
      ~ 'auth\.(uid|jwt|role|email)\('
    OR regexp_replace(coalesce(with_check, ''), '\(\s*select\s+auth\.(uid|jwt|role|email)\s*\(\s*\)\s*\)', '', 'gi')
      ~ 'auth\.(uid|jwt|role|email)\('
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
