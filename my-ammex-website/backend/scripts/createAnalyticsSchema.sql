-- Analytics Schema Setup for AI Forecasting
-- Run this script to prepare the database structure for AI forecasting

-- 1. Create monthly sales fact table (ready for future data)
CREATE TABLE IF NOT EXISTS sales_fact_monthly (
  month_start date PRIMARY KEY,
  total_revenue numeric(12,2) NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  total_units integer NOT NULL DEFAULT 0,
  avg_order_value numeric(12,2) NOT NULL DEFAULT 0,
  new_customers integer DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create monthly aggregation view (will work when you have real data)
CREATE OR REPLACE VIEW v_sales_monthly AS
SELECT 
  date_trunc('month', i.invoice_date)::date AS month_start,
  COALESCE(SUM(i.total_amount), 0) AS total_revenue,
  COUNT(i.id) AS total_orders,
  COALESCE(SUM(ii.quantity), 0) AS total_units,
  COALESCE(AVG(i.total_amount), 0) AS avg_order_value,
  COUNT(DISTINCT CASE 
    WHEN DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', i.invoice_date) 
    THEN c.id 
  END) AS new_customers
FROM "Invoice" i
LEFT JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
LEFT JOIN "Customer" c ON i.customer_id = c.id
WHERE i.invoice_date >= '2022-01-01'  -- 3 years back
GROUP BY date_trunc('month', i.invoice_date)
ORDER BY month_start;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_fact_monthly_date ON sales_fact_monthly(month_start);
CREATE INDEX IF NOT EXISTS idx_invoice_date ON "Invoice"(invoice_date);
CREATE INDEX IF NOT EXISTS idx_customer_created ON "Customer"(created_at);

-- 4. Insert some sample data for testing (you can remove this later)
INSERT INTO sales_fact_monthly (month_start, total_revenue, total_orders, total_units, avg_order_value, new_customers)
VALUES 
  ('2023-10-01', 420000, 120, 850, 3500, 45),
  ('2023-11-01', 480000, 135, 920, 3556, 52),
  ('2023-12-01', 620000, 180, 1200, 3444, 68),
  ('2024-01-01', 380000, 95, 650, 4000, 35),
  ('2024-02-01', 450000, 115, 780, 3913, 42),
  ('2024-03-01', 520000, 140, 950, 3714, 48),
  ('2024-04-01', 490000, 125, 820, 3920, 45),
  ('2024-05-01', 580000, 155, 1100, 3742, 55),
  ('2024-06-01', 640000, 170, 1250, 3765, 62),
  ('2024-07-01', 695000, 185, 1350, 3757, 68),
  ('2024-08-01', 720000, 195, 1400, 3692, 72),
  ('2024-09-01', 750000, 205, 1450, 3659, 75)
ON CONFLICT (month_start) DO UPDATE SET
  total_revenue = EXCLUDED.total_revenue,
  total_orders = EXCLUDED.total_orders,
  total_units = EXCLUDED.total_units,
  avg_order_value = EXCLUDED.avg_order_value,
  new_customers = EXCLUDED.new_customers,
  updated_at = CURRENT_TIMESTAMP;

-- 5. Create function to refresh fact table (for future use)
CREATE OR REPLACE FUNCTION refresh_sales_fact_monthly()
RETURNS void AS $$
BEGIN
  INSERT INTO sales_fact_monthly (
    month_start, total_revenue, total_orders, total_units, avg_order_value, new_customers
  )
  SELECT 
    month_start,
    total_revenue,
    total_orders,
    total_units,
    avg_order_value,
    new_customers
  FROM v_sales_monthly
  WHERE month_start >= CURRENT_DATE - INTERVAL '6 months'
  ON CONFLICT (month_start) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_orders = EXCLUDED.total_orders,
    total_units = EXCLUDED.total_units,
    avg_order_value = EXCLUDED.avg_order_value,
    new_customers = EXCLUDED.new_customers,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON sales_fact_monthly TO your_app_user;
-- GRANT SELECT ON v_sales_monthly TO your_app_user;
-- GRANT EXECUTE ON FUNCTION refresh_sales_fact_monthly() TO your_app_user;

COMMENT ON TABLE sales_fact_monthly IS 'Monthly aggregated sales data for AI forecasting and dashboard analytics';
COMMENT ON VIEW v_sales_monthly IS 'Real-time view of monthly sales aggregations';
COMMENT ON FUNCTION refresh_sales_fact_monthly() IS 'Function to refresh sales fact table with recent data';
