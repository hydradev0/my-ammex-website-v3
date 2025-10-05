const { connectDB, getSequelize, closeDB } = require('../config/db');

async function testProductTable() {
  try {
    console.log('🧪 Testing product table creation...');
    await connectDB();
    const sequelize = getSequelize();

    // Create table only
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sales_fact_monthly_by_product (
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
      );
    `);

    console.log('✅ Table created successfully!');

    // Test inserting sample data
    await sequelize.query(`
      INSERT INTO sales_fact_monthly_by_product (
        month_start, item_id, item_name, category_name, units_sold, 
        revenue, avg_unit_price, order_count, unique_customers, ranking
      ) VALUES 
      ('2024-01-01', 101, 'Test Widget A', 'Electronics', 100, 25000.00, 250.00, 25, 20, 1),
      ('2024-01-01', 102, 'Test Widget B', 'Electronics', 80, 20000.00, 250.00, 20, 18, 2)
      ON CONFLICT (month_start, ranking) DO UPDATE
      SET item_name = EXCLUDED.item_name,
          revenue = EXCLUDED.revenue;
    `);

    console.log('✅ Sample data inserted!');

    // Check data
    const [rows] = await sequelize.query(`
      SELECT month_start, item_name, revenue, ranking
      FROM sales_fact_monthly_by_product
      ORDER BY month_start DESC, ranking ASC;
    `);

    console.log('📊 Current data:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closeDB();
  }
}

testProductTable();
