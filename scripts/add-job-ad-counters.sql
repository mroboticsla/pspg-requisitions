-- Add counters to job_ads table
ALTER TABLE job_ads 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

-- Create RPC function to increment views
CREATE OR REPLACE FUNCTION increment_job_ad_view(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE job_ads
  SET views_count = views_count + 1
  WHERE id = ad_id;
END;
$$;

-- Create RPC function to increment applications
CREATE OR REPLACE FUNCTION increment_job_ad_application(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE job_ads
  SET applications_count = applications_count + 1
  WHERE id = ad_id;
END;
$$;
