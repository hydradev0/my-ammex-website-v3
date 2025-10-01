/*
  Quick inspector for the sales_fact_monthly table.
  - Prints row count
  - Shows min/max month_start
  - Outputs the most recent 12 rows
*/

const { connectDB, closeDB, getSequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');

async function run() {
  await connectDB();
  const sequelize = getSequelize();
  try {
    console.log('Connecting to database...');

    const [{ count }] = await sequelize.query(
      'SELECT COUNT(*)::int AS count FROM sales_fact_monthly',
      { type: QueryTypes.SELECT }
    );

    console.log(`Rows in sales_fact_monthly: ${count}`);

    const [range] = await sequelize.query(
      'SELECT MIN(month_start) AS min_month, MAX(month_start) AS max_month FROM sales_fact_monthly',
      { type: QueryTypes.SELECT }
    );

    console.log('Date range:', range);

    const recent = await sequelize.query(
      `SELECT 
        month_start, total_revenue, total_orders, total_units, avg_order_value, new_customers,
        created_at, updated_at
       FROM sales_fact_monthly
       ORDER BY month_start DESC
       LIMIT 12`,
      { type: QueryTypes.SELECT }
    );

    console.log('Most recent 12 rows (descending by month_start):');
    console.table(recent);

    // Verify columns match what the API expects
    const columns = await sequelize.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'sales_fact_monthly'
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );
    console.log('Table columns:');
    console.table(columns);

  } catch (err) {
    console.error('Inspection error:', err.message);
    process.exitCode = 1;
  } finally {
    try { await closeDB(); } catch (_) {}
  }
}

run();


