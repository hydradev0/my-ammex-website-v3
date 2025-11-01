-- Website Analytics: Events table and materialized views (monthly-friendly)

-- 1) Event table (singular, snake_case columns)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM ('page_view','product_click','add_to_cart','purchase');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Event" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type event_type NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id text NULL,
  session_id text NULL,
  product_id text NULL,
  product_name text NULL,
  model_no text NULL,
  category text NULL,
  value_cents integer NULL,
  currency text NOT NULL DEFAULT 'USD',
  page_path text NULL,
  referrer text NULL,
  user_agent text NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_occurred_at_idx ON "Event" (occurred_at);
CREATE INDEX IF NOT EXISTS event_type_occurred_at_idx ON "Event" (event_type, occurred_at);
CREATE INDEX IF NOT EXISTS event_category_idx ON "Event" (category);
CREATE INDEX IF NOT EXISTS event_model_no_idx ON "Event" (model_no);
CREATE INDEX IF NOT EXISTS event_properties_gin_idx ON "Event" USING GIN (properties);

-- 2) Materialized views (daily aggregates)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_traffic_daily AS
SELECT
  date_trunc('day', occurred_at)::date AS event_date,
  COALESCE(category, 'Uncategorized') AS category,
  COUNT(*)::bigint AS clicks
FROM "Event"
WHERE event_type = 'product_click'
GROUP BY 1,2;

CREATE INDEX IF NOT EXISTS mv_ctd_date_cat_idx ON mv_category_traffic_daily (event_date, category);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_clicked_items_daily AS
SELECT
  date_trunc('day', occurred_at)::date AS event_date,
  COALESCE(product_name, 'Unknown') AS product_name,
  COALESCE(model_no, 'N/A') AS model_no,
  COUNT(*)::bigint AS clicks
FROM "Event"
WHERE event_type = 'product_click'
GROUP BY 1,2,3;

CREATE INDEX IF NOT EXISTS mv_tcid_date_item_idx ON mv_top_clicked_items_daily (event_date, product_name);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_cart_additions_daily AS
SELECT
  date_trunc('day', occurred_at)::date AS event_date,
  COALESCE(product_name, 'Unknown') AS product_name,
  COALESCE(model_no, 'N/A') AS model_no,
  COUNT(*)::bigint AS additions,
  COALESCE(SUM(value_cents), 0)::bigint AS value_cents_total
FROM "Event"
WHERE event_type = 'add_to_cart'
GROUP BY 1,2,3;

CREATE INDEX IF NOT EXISTS mv_cad_date_item_idx ON mv_cart_additions_daily (event_date, product_name);

-- Optional helper function: refresh all views
CREATE OR REPLACE FUNCTION refresh_website_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_category_traffic_daily;
  REFRESH MATERIALIZED VIEW mv_top_clicked_items_daily;
  REFRESH MATERIALIZED VIEW mv_cart_additions_daily;
END;
$$ LANGUAGE plpgsql;


