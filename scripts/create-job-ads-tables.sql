-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Job Ads Table
CREATE TABLE IF NOT EXISTS job_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT, -- Rich text content
  location TEXT,
  employment_type TEXT, -- 'full_time', 'part_time', 'contract', 'temporary', 'internship'
  salary_range TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ NOT NULL,
  company_snapshot JSONB DEFAULT '{}'::jsonb, -- Snapshot of company details at publication
  custom_fields JSONB DEFAULT '{"fields": []}'::jsonb, -- Flexible schema for extra sections
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Job Ad <-> Requisition Assignment Table
CREATE TABLE IF NOT EXISTS job_ad_requisition_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_ad_id UUID REFERENCES job_ads(id) ON DELETE CASCADE,
  requisition_id UUID REFERENCES requisitions(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  note TEXT,
  UNIQUE(job_ad_id, requisition_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_job_ads_status_slug ON job_ads(status, slug);
CREATE INDEX IF NOT EXISTS idx_job_ads_company ON job_ads(company_id);
-- Full text search index for title and description
CREATE INDEX IF NOT EXISTS idx_job_ads_search ON job_ads USING GIN (to_tsvector('spanish', title || ' ' || coalesce(description, '')));

-- 4. Updated_at Trigger
-- Assuming update_updated_at_column function already exists in the database from previous migrations
-- If not, uncomment the following block:
/*
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
*/

DROP TRIGGER IF EXISTS update_job_ads_updated_at ON job_ads;
CREATE TRIGGER update_job_ads_updated_at
    BEFORE UPDATE ON job_ads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS Policies

-- Enable RLS
ALTER TABLE job_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_ad_requisition_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for job_ads

-- Public can view published ads
CREATE POLICY "Public can view published job ads"
ON job_ads FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Admins and Superadmins have full access
-- Using a subquery to check role based on the project's RBAC structure
CREATE POLICY "Admins can manage job ads"
ON job_ads FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    JOIN roles ON profiles.role_id = roles.id
    WHERE profiles.id = auth.uid()
    AND roles.name IN ('admin', 'superadmin')
  )
);

-- Policies for assignments
CREATE POLICY "Admins can manage assignments"
ON job_ad_requisition_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    JOIN roles ON profiles.role_id = roles.id
    WHERE profiles.id = auth.uid()
    AND roles.name IN ('admin', 'superadmin')
  )
);
