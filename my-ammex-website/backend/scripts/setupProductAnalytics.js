const { connectDB, getSequelize, closeDB } = require('../config/db');

async function setupProductAnalytics() {
  try {
    console.log('🚀 Setting up product analytics (using Invoice/InvoiceItem source)...');
    await connectDB();
    const sequelize = getSequelize();

    const queries = [
      // 1) Create calculation view for top 10 products per month
      `CREATE OR REPLACE VIEW v_top_products_monthly AS
       SELECT 
         month_start,
         item_id,
         item_name,
         category_name,
         subcategory_name,
         units_sold,
         revenue,
         avg_unit_price,
         order_count,
         unique_customers,
         ROW_NUMBER() OVER (
           PARTITION BY month_start 
           ORDER BY revenue DESC, units_sold DESC
         ) as ranking
       FROM (
         SELECT 
           date_trunc('month', i.invoice_date)::date as month_start,
           item.id as item_id,
           item.item_name,
           c.name as category_name,
           sc.name as subcategory_name,
           SUM(ii.quantity) as units_sold,
           SUM(ii.total_price) as revenue,
           AVG(ii.unit_price) as avg_unit_price,
           COUNT(DISTINCT i.id) as order_count,
           COUNT(DISTINCT i.customer_id) as unique_customers
         FROM "Invoice" i
         JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
         JOIN "Item" item ON ii.item_id = item.id
         LEFT JOIN "Category" c ON item.category_id = c.id
         LEFT JOIN "Category" sc ON item.subcategory_id = sc.id
         GROUP BY 1,2,3,4,5
       ) ranked
       WHERE ranking <= 10;`,

      // 2) Create fact table for top 10 products
      `CREATE TABLE IF NOT EXISTS sales_fact_monthly_by_product (
         id serial PRIMARY KEY,
         month_start date NOT NULL,
         item_id integer NOT NULL,
         item_name varchar(255) NOT NULL,
         category_name varchar(255),
         subcategory_name varchar(255),
         units_sold integer NOT NULL,
         revenue numeric(12,2) NOT NULL,
         avg_unit_price numeric(12,2) NOT NULL,
         order_count integer NOT NULL,
         unique_customers integer NOT NULL,
         ranking integer NOT NULL,
         created_at timestamp DEFAULT NOW(),
         
         UNIQUE(month_start, ranking)
       );`,

      // 3) Create indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_sales_fact_product_month_rank ON sales_fact_monthly_by_product(month_start, ranking);`,
      `CREATE INDEX IF NOT EXISTS idx_sales_fact_product_revenue ON sales_fact_monthly_by_product(revenue DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_sales_fact_product_category ON sales_fact_monthly_by_product(category_name, month_start);`,

      // 4) Backfill from view (idempotent)
      `INSERT INTO sales_fact_monthly_by_product AS f (
         month_start, item_id, item_name, category_name, subcategory_name,
         units_sold, revenue, avg_unit_price, order_count, unique_customers, ranking
       )
       SELECT 
         month_start, item_id, item_name, category_name, subcategory_name,
         units_sold, revenue, avg_unit_price, order_count, unique_customers, ranking
       FROM v_top_products_monthly
       ON CONFLICT (month_start, ranking) DO UPDATE
       SET item_id = EXCLUDED.item_id,
           item_name = EXCLUDED.item_name,
           category_name = EXCLUDED.category_name,
           subcategory_name = EXCLUDED.subcategory_name,
           units_sold = EXCLUDED.units_sold,
           revenue = EXCLUDED.revenue,
           avg_unit_price = EXCLUDED.avg_unit_price,
           order_count = EXCLUDED.order_count,
           unique_customers = EXCLUDED.unique_customers,
           ranking = EXCLUDED.ranking;`
    ];

    // Execute table and view creation first
    for (let i = 0; i < 3; i++) {
      await sequelize.query(queries[i]);
    }

    // Then try to backfill data (might be empty if no Invoice data exists)
    try {
      await sequelize.query(queries[3]);
    } catch (backfillError) {
      console.log('⚠️  No invoice data found for backfill. Table created but empty.');
    }

    // Check if table was created successfully
    try {
      const [rows] = await sequelize.query(
        `SELECT month_start, item_name, revenue, units_sold, ranking
         FROM sales_fact_monthly_by_product
         ORDER BY month_start DESC, ranking ASC
         LIMIT 20;`
      );

      console.log('✅ Product analytics initialized. Recent top products:');
      console.table(rows);

      // Show summary stats
      const [stats] = await sequelize.query(
        `SELECT 
           COUNT(*) as total_records,
           COUNT(DISTINCT month_start) as months_covered,
           MIN(month_start) as earliest_month,
           MAX(month_start) as latest_month
         FROM sales_fact_monthly_by_product;`
      );

      console.log('\n📊 Summary Statistics:');
      console.table(stats);
    } catch (reportError) {
      console.log('⚠️  Table created but no data to report yet.');
    }

  } catch (error) {
    console.error('❌ Error setting up product analytics:', error.message);
  } finally {
    await closeDB();
  }
}

setupProductAnalytics();
