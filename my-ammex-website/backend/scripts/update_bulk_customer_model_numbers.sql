-- ========================================
-- Update Bulk Customer Model Numbers Display
-- ========================================
-- This script modifies v_top_customers_monthly_live to show ALL model numbers
-- that contributed to bulk orders (>=₱95,000) for each customer, not just the top one
-- ========================================

-- Update v_top_customers_monthly_live to show top 2 model numbers per customer instead of just top 1
CREATE OR REPLACE VIEW v_top_customers_monthly_live AS
WITH customer_monthly_totals AS (
  SELECT
    date_trunc('month', i.invoice_date)::date as month_start,
    c.customer_name,
    COUNT(i.id)::integer as bulk_orders_count,
    SUM(i.total_amount)::numeric(12,2) as bulk_orders_amount,
    AVG(i.total_amount)::numeric(12,2) as average_bulk_order_value
  FROM "Invoice" i
  JOIN "Customer" c ON i.customer_id = c.id
  WHERE i.invoice_date >= '2023-01-01'
    AND i.total_amount >= 95000  -- Bulk order threshold: ₱95,000
  GROUP BY date_trunc('month', i.invoice_date)::date, c.customer_name
),
customer_top_products AS (
  SELECT
    date_trunc('month', i.invoice_date)::date as month_start,
    c.customer_name,
    item.model_no,
    ROW_NUMBER() OVER (
      PARTITION BY date_trunc('month', i.invoice_date)::date, c.customer_name
      ORDER BY SUM(ii.total_price) DESC
    ) as product_rank
  FROM "Invoice" i
  JOIN "Customer" c ON i.customer_id = c.id
  JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
  JOIN "Item" item ON ii.item_id = item.id
  WHERE i.invoice_date >= '2023-01-01'
    AND i.total_amount >= 95000  -- Bulk order threshold: ₱95,000
  GROUP BY date_trunc('month', i.invoice_date)::date, c.customer_name, item.model_no
),
ranked_customers AS (
  SELECT
    cmt.month_start,
    cmt.customer_name,
    cmt.bulk_orders_count,
    cmt.bulk_orders_amount,
    cmt.average_bulk_order_value,
    -- Show ALL model numbers that contributed to bulk orders (>=₱95,000)
    CAST(COALESCE(
      (SELECT STRING_AGG(ctp.model_no::VARCHAR(100), ', ' ORDER BY ctp.model_no)
       FROM (SELECT DISTINCT model_no, month_start, customer_name FROM customer_top_products) ctp
       WHERE ctp.month_start = cmt.month_start
         AND ctp.customer_name = cmt.customer_name),
      'N/A'
    ) AS VARCHAR(255)) as model_no,
    ROW_NUMBER() OVER (
      PARTITION BY cmt.month_start
      ORDER BY cmt.bulk_orders_amount DESC
    ) as ranking
  FROM customer_monthly_totals cmt
)
SELECT
  month_start,
  customer_name,
  bulk_orders_count,
  bulk_orders_amount,
  average_bulk_order_value,
  model_no
FROM ranked_customers
WHERE ranking <= 10;

COMMENT ON VIEW v_top_customers_monthly_live IS 'Live view: top 10 bulk customers per month (≥₱95,000) with ALL qualifying model numbers';

-- ========================================
-- Verification Query (optional - run after applying changes)
-- ========================================
-- SELECT
--   month_start,
--   customer_name,
--   bulk_orders_count,
--   bulk_orders_amount,
--   model_no
-- FROM v_top_customers_monthly_live
-- ORDER BY month_start DESC, bulk_orders_amount DESC
-- LIMIT 5;
