const { connectDB, getSequelize, closeDB } = require('../config/db');

async function updateProductAnalyticsSchema() {
  try {
    console.log('🚀 Updating sales_fact_monthly_by_product schema...');
    await connectDB();
    const sequelize = getSequelize();

    // Check if table exists
    const [tableCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_fact_monthly_by_product'
      );
    `);

    if (!tableCheck[0].exists) {
      console.log('❌ Table sales_fact_monthly_by_product does not exist. Please run setupProductAnalytics.js first.');
      return;
    }

    // Step 1: Check if ranking column exists
    const [columnCheck] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_fact_monthly_by_product' 
      AND column_name = 'ranking';
    `);

    if (columnCheck.length > 0) {
      console.log('\n🗑️  Removing ranking column...');
      
      // Drop unique constraint that includes ranking
      await sequelize.query(`
        ALTER TABLE sales_fact_monthly_by_product 
        DROP CONSTRAINT IF EXISTS sales_fact_monthly_by_product_month_start_ranking_key;
      `).catch(err => console.log('⚠️  Constraint already removed or does not exist'));

      // Drop index that includes ranking
      await sequelize.query(`
        DROP INDEX IF EXISTS idx_sales_fact_product_month_rank;
      `).catch(err => console.log('⚠️  Index already removed'));

      // Drop ranking column
      await sequelize.query(`
        ALTER TABLE sales_fact_monthly_by_product 
        DROP COLUMN IF EXISTS ranking;
      `);
      
      console.log('✅ Ranking column removed successfully');
    } else {
      console.log('ℹ️  Ranking column does not exist (already removed)');
    }

    // Step 2: Add units_sold column if it doesn't exist
    console.log('\n🔧 Adding units_sold column...');
    const [unitsSoldCheck] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_fact_monthly_by_product' 
      AND column_name = 'units_sold';
    `);

    if (unitsSoldCheck.length === 0) {
      await sequelize.query(`
        ALTER TABLE sales_fact_monthly_by_product 
        ADD COLUMN units_sold INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('✅ units_sold column added successfully');
    } else {
      console.log('ℹ️  units_sold column already exists');
    }

    // Step 2a: Add new unique constraint on month_start and item_id
    console.log('\n🔧 Adding new unique constraint...');
    await sequelize.query(`
      ALTER TABLE sales_fact_monthly_by_product 
      ADD CONSTRAINT sales_fact_monthly_by_product_month_item_key 
      UNIQUE (month_start, item_id);
    `).catch(() => {
      console.log('⚠️  Unique constraint already exists');
    });

    // Step 3: Drop and recreate view to remove ranking
    console.log('\n🔄 Dropping and recreating v_top_products_monthly view...');
    await sequelize.query(`
      DROP VIEW IF EXISTS v_top_products_monthly CASCADE;
    `);
    
    await sequelize.query(`
      CREATE VIEW v_top_products_monthly AS
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
        unique_customers
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
      ) products
      ORDER BY month_start DESC, revenue DESC, units_sold DESC;
    `);
    console.log('✅ View updated successfully');

    // Step 4: Add mock units_sold data if needed
    console.log('\n📊 Checking units_sold data...');
    const [nullCheck] = await sequelize.query(`
      SELECT COUNT(*) as null_count
      FROM sales_fact_monthly_by_product
      WHERE units_sold IS NULL OR units_sold = 0;
    `);

    if (nullCheck[0].null_count > 0) {
      console.log(`\n🔧 Adding mock data for ${nullCheck[0].null_count} records with missing units_sold...`);
      
      // Generate mock units_sold with realistic random values
      // Range: 50-5000 units depending on category popularity
      await sequelize.query(`
        UPDATE sales_fact_monthly_by_product
        SET units_sold = CASE 
          WHEN units_sold IS NULL OR units_sold = 0 THEN
            -- Generate random units sold between 50-5000
            FLOOR(50 + RANDOM() * 4950)::integer
          ELSE units_sold
        END
        WHERE units_sold IS NULL OR units_sold = 0;
      `);
      
      console.log('✅ Mock units_sold data added successfully');
    } else {
      console.log('ℹ️  All records already have units_sold data');
    }

    // Step 5: Verify the changes
    console.log('\n🔍 Verifying changes...');
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales_fact_monthly_by_product'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Current table schema:');
    console.table(columns);

    const [sampleData] = await sequelize.query(`
      SELECT 
        month_start, 
        model_no, 
        category_name,
        units_sold
      FROM sales_fact_monthly_by_product
      ORDER BY month_start DESC, units_sold DESC
      LIMIT 10;
    `);

    console.log('\n📊 Sample data (Top 10 by revenue):');
    console.table(sampleData);

    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT month_start) as months_covered,
        MIN(month_start) as earliest_month,
        MAX(month_start) as latest_month,
        SUM(units_sold) as total_units_sold,
        AVG(units_sold) as avg_units_sold
      FROM sales_fact_monthly_by_product;
    `);

    console.log('\n📈 Summary Statistics:');
    console.table(stats);

    console.log('\n✅ Schema update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating schema:', error.message);
    console.error(error);
  } finally {
    await closeDB();
  }
}

updateProductAnalyticsSchema();

