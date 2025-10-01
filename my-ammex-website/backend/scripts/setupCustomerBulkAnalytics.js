const { connectDB, getSequelize, closeDB } = require('../config/db');

async function setupCustomerBulkAnalytics() {
  try {
    console.log('🚀 Setting up customer bulk analytics (using Invoice source)...');
    await connectDB();
    const sequelize = getSequelize();

    const queries = [
      // 1) Create calculation view
      `CREATE OR REPLACE VIEW v_customer_bulk_monthly AS
       SELECT
         date_trunc('month', i.invoice_date)::date AS month_start,
         COUNT(*) AS bulk_orders_count,
         SUM(i.total_amount)::numeric(12,2) AS bulk_orders_amount
       FROM "Invoice" i
       WHERE i.total_amount >= 100000
       GROUP BY 1
       ORDER BY 1;`,

      // 2) Create fact table
      `CREATE TABLE IF NOT EXISTS customer_fact_monthly (
         month_start date PRIMARY KEY,
         bulk_orders_count integer NOT NULL,
         bulk_orders_amount numeric(12,2) NOT NULL
       );`,

      // 3) Helpful index (redundant with PK but future-proof if PK changes)
      `CREATE INDEX IF NOT EXISTS idx_customer_fact_monthly_month ON customer_fact_monthly(month_start);`,

      // 4) Backfill from view (idempotent)
      `INSERT INTO customer_fact_monthly AS f (month_start, bulk_orders_count, bulk_orders_amount)
       SELECT month_start, bulk_orders_count, bulk_orders_amount
       FROM v_customer_bulk_monthly
       ON CONFLICT (month_start) DO UPDATE
       SET bulk_orders_count  = EXCLUDED.bulk_orders_count,
           bulk_orders_amount = EXCLUDED.bulk_orders_amount;`
    ];

    for (const sql of queries) {
      await sequelize.query(sql);
    }

    // Small report
    const [rows] = await sequelize.query(
      `SELECT month_start, bulk_orders_count, bulk_orders_amount
       FROM customer_fact_monthly
       ORDER BY month_start DESC
       LIMIT 6;`
    );

    console.log('✅ Customer bulk analytics initialized. Recent rows:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Error setting up customer bulk analytics:', error.message);
  } finally {
    await closeDB();
  }
}

setupCustomerBulkAnalytics();


