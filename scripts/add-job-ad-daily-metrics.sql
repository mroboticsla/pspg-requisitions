-- Create daily metrics table
CREATE TABLE IF NOT EXISTS job_ad_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_ad_id UUID REFERENCES job_ads(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  UNIQUE(job_ad_id, date)
);

-- Update RPC function to increment views
CREATE OR REPLACE FUNCTION increment_job_ad_view(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update total
  UPDATE job_ads
  SET views_count = views_count + 1
  WHERE id = ad_id;

  -- Update daily metric
  INSERT INTO job_ad_daily_metrics (job_ad_id, date, views_count)
  VALUES (ad_id, CURRENT_DATE, 1)
  ON CONFLICT (job_ad_id, date)
  DO UPDATE SET views_count = job_ad_daily_metrics.views_count + 1;
END;
$$;

-- Update RPC function to increment applications
CREATE OR REPLACE FUNCTION increment_job_ad_application(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update total
  UPDATE job_ads
  SET applications_count = applications_count + 1
  WHERE id = ad_id;

  -- Update daily metric
  INSERT INTO job_ad_daily_metrics (job_ad_id, date, applications_count)
  VALUES (ad_id, CURRENT_DATE, 1)
  ON CONFLICT (job_ad_id, date)
  DO UPDATE SET applications_count = job_ad_daily_metrics.applications_count + 1;
END;
$$;
