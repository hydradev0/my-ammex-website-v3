-- ============================================
-- Setup Automatic Refresh for Website Analytics
-- ============================================
-- This script sets up automatic scheduled refresh
-- of website analytics materialized views using pg_cron

-- Step 1: Enable pg_cron extension (requires superuser)
-- If you get permission error, ask your DBA to run this
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: First, let's make the refresh more efficient with CONCURRENTLY
-- This requires unique indexes on the materialized views

-- Add unique indexes (required for REFRESH CONCURRENTLY)
DROP INDEX IF EXISTS mv_ctd_unique_idx;
CREATE UNIQUE INDEX mv_ctd_unique_idx 
ON mv_category_traffic_daily (event_date, category);

DROP INDEX IF EXISTS mv_tcid_unique_idx;
CREATE UNIQUE INDEX mv_tcid_unique_idx 
ON mv_top_clicked_items_daily (event_date, product_name, model_no);

DROP INDEX IF EXISTS mv_cad_unique_idx;
CREATE UNIQUE INDEX mv_cad_unique_idx 
ON mv_cart_additions_daily (event_date, product_name, model_no);

-- Step 3: Update refresh function to use CONCURRENTLY
-- This allows queries while refreshing (no downtime)
CREATE OR REPLACE FUNCTION refresh_website_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_traffic_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_clicked_items_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cart_additions_daily;
  
  -- Optional: Log the refresh
  RAISE NOTICE 'Website analytics refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 4: Schedule automatic refresh
-- Choose ONE of the following options:

-- Option A: Every hour at minute 0 (RECOMMENDED)
SELECT cron.schedule(
  'refresh-website-analytics-hourly',
  '0 * * * *',
  $$SELECT refresh_website_analytics()$$
);

-- Option B: Every 30 minutes (more frequent)
-- SELECT cron.schedule(
--   'refresh-website-analytics-30min',
--   '*/30 * * * *',
--   $$SELECT refresh_website_analytics()$$
-- );

-- Option C: Every 4 hours (less frequent)
-- SELECT cron.schedule(
--   'refresh-website-analytics-4hours',
--   '0 */4 * * *',
--   $$SELECT refresh_website_analytics()$$
-- );

-- Option D: Daily at 2 AM (minimal frequency)
-- SELECT cron.schedule(
--   'refresh-website-analytics-daily',
--   '0 2 * * *',
--   $$SELECT refresh_website_analytics()$$
-- );

-- Step 5: Verify the scheduled job was created
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname LIKE '%website-analytics%';

-- Step 6: Check materialized view status
SELECT 
  schemaname,
  matviewname,
  last_refresh,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE matviewname LIKE 'mv_%'
ORDER BY matviewname;

-- ============================================
-- Management Commands (for future reference)
-- ============================================

-- View all cron jobs:
-- SELECT * FROM cron.job;

-- View cron job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Unschedule a job (if needed):
-- SELECT cron.unschedule('refresh-website-analytics-hourly');

-- Manually trigger refresh (for testing):
-- SELECT refresh_website_analytics();

-- Check if pg_cron is running:
-- SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Grant permissions (if needed):
-- GRANT USAGE ON SCHEMA cron TO your_app_user;
-- GRANT EXECUTE ON FUNCTION refresh_website_analytics() TO your_app_user;

-- ============================================
-- Notes:
-- ============================================
-- 1. pg_cron runs in the database specified by cron.database_name
-- 2. Cron schedule format: minute hour day month weekday
-- 3. CONCURRENTLY allows queries during refresh (no downtime)
-- 4. Monitor cron.job_run_details for failures
-- 5. Adjust schedule based on your data volume and update frequency

COMMENT ON FUNCTION refresh_website_analytics() IS 
  'Refreshes all website analytics materialized views. 
   Scheduled to run automatically via pg_cron.';

