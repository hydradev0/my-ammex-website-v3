const { Sequelize } = require('sequelize');
const fs = require('fs');
require('dotenv').config();

async function runModelUpdate() {
  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ammex_db', {
    logging: console.log,
    dialectOptions: {
      ssl: false
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully');

    console.log('📖 Reading SQL script...');
    const sqlScript = fs.readFileSync('scripts/update_bulk_customer_model_numbers.sql', 'utf8');

    console.log('⚡ Executing SQL script to show all model numbers...');
    await sequelize.query(sqlScript, { raw: true });
    console.log('✅ Model numbers display updated!');

    console.log('🔍 Verifying changes...');
    const [results] = await sequelize.query('SELECT * FROM v_top_customers_monthly_live ORDER BY month_start DESC, bulk_orders_amount DESC LIMIT 5', { raw: true });
    console.log('📊 Top bulk customers with all model numbers:', results);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runModelUpdate();
