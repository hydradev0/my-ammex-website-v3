-- ========================================
-- Migration: Create Unified Views
-- Combines historical fact table data with live Invoice data
-- ========================================

-- ========================================
-- CLEANUP: Drop all existing views first
-- ========================================

DROP VIEW IF EXISTS v_sales_monthly_live CASCADE;
DROP VIEW IF EXISTS v_top_products_monthly_live CASCADE;
DROP VIEW IF EXISTS v_customer_bulk_monthly_live CASCADE;
DROP VIEW IF EXISTS v_top_customers_monthly_live CASCADE;
DROP VIEW IF EXISTS u_sales_fact_monthly CASCADE;
DROP VIEW IF EXISTS u_sales_fact_monthly_by_product CASCADE;
DROP VIEW IF EXISTS u_customer_bulk_monthly CASCADE;
DROP VIEW IF EXISTS u_customer_bulk_monthly_by_name CASCADE;

-- ========================================
-- 4 LIVE VIEWS: Query new transactions from Invoice tables
-- ========================================

-- Live View 1: Sales Monthly
CREATE OR REPLACE VIEW v_sales_monthly_live AS
WITH invoice_items_agg AS (
  -- Aggregate invoice items separately to avoid duplicates
  SELECT 
    invoice_id,
    COALESCE(SUM(quantity), 0) AS total_quantity
  FROM "InvoiceItem"
  GROUP BY invoice_id
)
WITH invoice_items_agg AS (
  -- Aggregate invoice items separately to avoid duplicates
  SELECT 
    invoice_id,
  COALESCE(SUM(iia.total_quantity), 0)::bigint AS total_units,y
  FROM "InvoiceItem"
  GROUP BY invoice_id
)
    THEN c.id 
  END) AS new_customers
FROM "Invoice" i
LEFT JOIN invoice_items_agg iia ON i.id = iia.invoice_id
  COALESCE(SUM(iia.total_quantity), 0) AS total_units,
WHERE i.invoice_date >= '2023-01-01'
GROUP BY date_trunc('month', i.invoice_date);

COMMENT ON VIEW v_sales_monthly_live IS 'Live view: sales aggregations from Invoice tables (restructured to prevent duplicates)';

-- Live View 2: Top Products Monthly (Top 10 per month)
LEFT JOIN invoice_items_agg iia ON i.id = iia.invoice_id
WITH ranked_products AS (
  SELECT 
    date_trunc('month', i.invoice_date)::date as month_start,
    item.id as item_id,
COMMENT ON VIEW v_sales_monthly_live IS 'Live view: sales aggregations from Invoice tables (restructured to prevent duplicates)';
    COALESCE(c.name, c_item.name) as category_name,
    COALESCE(ii.category_id, item.category_id) as category_id,
    COALESCE(ii.subcategory_id, item.subcategory_id) as subcategory_id,
    COUNT(DISTINCT i.id) as order_count,
    ROW_NUMBER() OVER (PARTITION BY date_trunc('month', i.invoice_date)::date ORDER BY COUNT(DISTINCT i.id) DESC) as rank
  FROM "Invoice" i
  JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
  JOIN "Item" item ON ii.item_id = item.id
  LEFT JOIN "Category" c ON ii.category_id = c.id
  LEFT JOIN "Category" c_item ON item.category_id = c_item.id
  WHERE i.invoice_date >= '2023-01-01'
  GROUP BY 1, 2, 3, 4, 5, 6
)
SELECT 
  month_start,
  item_id,
  model_no,
  category_name,
  category_id,
  subcategory_id,
  order_count
FROM ranked_products
WHERE rank <= 10;

COMMENT ON VIEW v_top_products_monthly_live IS 'Live view: top 10 products per month (with fallback to Item category if InvoiceItem category is missing)';

-- Live View 3: Customer Bulk Monthly (Total summary per month)
CREATE OR REPLACE VIEW v_customer_bulk_monthly_live AS
SELECT 
  date_trunc('month', i.invoice_date)::date as month_start,
  COUNT(DISTINCT i.id)::integer as bulk_orders_count,
  SUM(i.total_amount)::numeric(12,2) as bulk_orders_amount
FROM "Invoice" i
WHERE i.invoice_date >= '2023-01-01'
  AND i.total_amount > 0
GROUP BY date_trunc('month', i.invoice_date)::date;

COMMENT ON VIEW v_customer_bulk_monthly_live IS 'Live view: total bulk orders per month (aggregated across all customers)';

-- Live View 4: Top Customers Monthly (Top 10 per month)
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
    AND i.total_amount > 0
  GROUP BY date_trunc('month', i.invoice_date)::date, c.customer_name
),
customer_top_products AS (
  SELECT 
    date_trunc('month', i.invoice_date)::date as month_start,
    c.customer_name,
    item.model_no,
    ROW_NUMBER() OVER (
      PARTITION BY date_trunc('month', i.invoice_date)::date, c.customer_name
      ORDER BY COUNT(ii.id) DESC, SUM(ii.total_price) DESC
    ) as product_rank
  FROM "Invoice" i
  JOIN "Customer" c ON i.customer_id = c.id
  JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
  JOIN "Item" item ON ii.item_id = item.id
  WHERE i.invoice_date >= '2023-01-01'
    AND i.total_amount > 0
  GROUP BY date_trunc('month', i.invoice_date)::date, c.customer_name, item.model_no
),
ranked_customers AS (
  SELECT 
    cmt.month_start,
    cmt.customer_name,
    cmt.bulk_orders_count,
    cmt.bulk_orders_amount,
    cmt.average_bulk_order_value,
    COALESCE(ctp.model_no, CAST('N/A' AS VARCHAR(255))) as model_no,
    ROW_NUMBER() OVER (
      PARTITION BY cmt.month_start
      ORDER BY cmt.bulk_orders_amount DESC
    ) as ranking
  FROM customer_monthly_totals cmt
  LEFT JOIN customer_top_products ctp ON cmt.month_start = ctp.month_start 
    AND cmt.customer_name = ctp.customer_name 
    AND ctp.product_rank = 1
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

COMMENT ON VIEW v_top_customers_monthly_live IS 'Live view: top 10 customers per month with their top product (model_no)';

-- ========================================
-- 4 UNIFIED VIEWS: Combine historical + live data
-- ========================================

-- Unified View 1: Sales Fact Monthly
CREATE OR REPLACE VIEW u_sales_fact_monthly AS
SELECT 
  month_start,
  total_revenue,
  total_orders,
  total_units,
  avg_order_value,
  new_customers
FROM sales_fact_monthly
UNION ALL
SELECT 
  month_start,
  total_revenue,
  total_orders,
  total_units,
  avg_order_value,
  new_customers
FROM v_sales_monthly_live
WHERE month_start NOT IN (SELECT month_start FROM sales_fact_monthly)
ORDER BY month_start;

COMMENT ON VIEW u_sales_fact_monthly IS 'Unified view: historical + live sales data';

-- Unified View 2: Products Fact Monthly (Top 10 products per month)
CREATE OR REPLACE VIEW u_sales_fact_monthly_by_product AS
WITH historical_ranked AS (
  SELECT 
    month_start,
    item_id,
    model_no,
    category_name,
    category_id,
    subcategory_id,
    order_count,
    ROW_NUMBER() OVER (PARTITION BY month_start ORDER BY order_count DESC) as rank
  FROM sales_fact_monthly_by_product
),
live_ranked AS (
  SELECT 
    month_start,
    item_id,
    model_no,
    category_name,
    category_id,
    subcategory_id,
    order_count,
    ROW_NUMBER() OVER (PARTITION BY month_start ORDER BY order_count DESC) as rank
  FROM v_top_products_monthly_live
  WHERE month_start NOT IN (SELECT DISTINCT month_start FROM sales_fact_monthly_by_product)
)
SELECT 
  month_start,
  item_id,
  model_no,
  category_name,
  category_id,
  subcategory_id,
  order_count
FROM historical_ranked
WHERE rank <= 10
UNION ALL
SELECT 
  month_start,
  item_id,
  model_no,
  category_name,
  category_id,
  subcategory_id,
  order_count
FROM live_ranked
WHERE rank <= 10
ORDER BY month_start DESC, order_count DESC;

COMMENT ON VIEW u_sales_fact_monthly_by_product IS 'Unified view: historical + live product data (top 10 products per month)';

-- Unified View 3: Customer Bulk Monthly by Name (Top 10 customers per month)
CREATE OR REPLACE VIEW u_customer_bulk_monthly_by_name AS
WITH historical_ranked AS (
  SELECT 
    month_start,
    customer_name,
    bulk_orders_count,
    bulk_orders_amount,
    average_bulk_order_value,
    model_no,
    ROW_NUMBER() OVER (PARTITION BY month_start ORDER BY bulk_orders_amount DESC) as rank
  FROM customer_bulk_monthly_by_name
),
live_ranked AS (
  SELECT 
    month_start,
    customer_name,
    bulk_orders_count,
    bulk_orders_amount,
    average_bulk_order_value,
    model_no,
    ROW_NUMBER() OVER (PARTITION BY month_start ORDER BY bulk_orders_amount DESC) as rank
  FROM v_top_customers_monthly_live
  WHERE month_start NOT IN (SELECT DISTINCT month_start FROM customer_bulk_monthly_by_name)
)
SELECT 
  month_start,
  customer_name,
  bulk_orders_count,
  bulk_orders_amount,
  average_bulk_order_value,
  model_no
FROM historical_ranked
WHERE rank <= 10
UNION ALL
SELECT 
  month_start,
  customer_name,
  bulk_orders_count,
  bulk_orders_amount,
  average_bulk_order_value,
  model_no
FROM live_ranked
WHERE rank <= 10
ORDER BY month_start DESC, bulk_orders_amount DESC;

COMMENT ON VIEW u_customer_bulk_monthly_by_name IS 'Unified view: historical + live customer bulk data (top 10 customers per month)';

-- Unified View 4: Customer Bulk Monthly Summary (uses v_customer_bulk_monthly_live)
CREATE OR REPLACE VIEW u_customer_bulk_monthly AS
SELECT 
  month_start,
  bulk_orders_count,
  bulk_orders_amount
FROM customer_bulk_monthly
UNION ALL
SELECT 
  month_start,
  bulk_orders_count,
  bulk_orders_amount
FROM v_customer_bulk_monthly_live
WHERE month_start NOT IN (SELECT DISTINCT month_start FROM customer_bulk_monthly)
ORDER BY month_start;

COMMENT ON VIEW u_customer_bulk_monthly IS 'Unified view: historical + live bulk order summary (total per month)';


-- ========================================
-- 5. Create indexes on fact tables for better UNION performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_sales_fact_monthly_month ON sales_fact_monthly(month_start);
CREATE INDEX IF NOT EXISTS idx_sales_fact_product_month ON sales_fact_monthly_by_product(month_start);
CREATE INDEX IF NOT EXISTS idx_customer_bulk_name_month ON customer_bulk_monthly_by_name(month_start);
CREATE INDEX IF NOT EXISTS idx_customer_bulk_monthly_month ON customer_bulk_monthly(month_start);

-- Index Invoice tables for better live view performance
CREATE INDEX IF NOT EXISTS idx_invoice_date_amount ON "Invoice"(invoice_date, total_amount);
CREATE INDEX IF NOT EXISTS idx_invoice_item_totals ON "InvoiceItem"(invoice_id, quantity, total_price);

-- ========================================
-- VERIFICATION QUERIES (run separately to test)
-- ========================================

-- Test 1: Check unified sales data
-- SELECT COUNT(*) as total_records, MIN(month_start) as earliest, MAX(month_start) as latest FROM u_sales_fact_monthly;

-- Test 2: Check unified products data
-- SELECT COUNT(*) as total_records, COUNT(DISTINCT month_start) as unique_months FROM u_sales_fact_monthly_by_product;

-- Test 3: Check unified bulk customers data
-- SELECT COUNT(*) as total_records, COUNT(DISTINCT month_start) as unique_months FROM u_customer_bulk_monthly_by_name;

-- Test 4: Check unified bulk summary
-- SELECT * FROM u_customer_bulk_monthly ORDER BY month_start DESC LIMIT 12;

-- Test 5: Compare historical vs live split
-- SELECT 
--   'Historical' as source, COUNT(*) as records, MIN(month_start) as earliest, MAX(month_start) as latest 
-- FROM sales_fact_monthly
-- UNION ALL
-- SELECT 
--   'Live' as source, COUNT(*) as records, MIN(month_start) as earliest, MAX(month_start) as latest 
-- FROM v_sales_monthly_live 
-- WHERE month_start NOT IN (SELECT month_start FROM sales_fact_monthly);


