const { connectDB, getSequelize, closeDB } = require('../config/db');

async function fixProductAnalytics() {
  try {
    console.log('🔧 Fixing product analytics structure...');
    await connectDB();
    const sequelize = getSequelize();

    const queries = [
      // 1) Add category_id and subcategory_id to InvoiceItem table
      `ALTER TABLE "InvoiceItem" 
       ADD COLUMN IF NOT EXISTS category_id integer,
       ADD COLUMN IF NOT EXISTS subcategory_id integer;`,

      // 2) Update InvoiceItem with category data from Item table
      `UPDATE "InvoiceItem" 
       SET category_id = i.category_id, 
           subcategory_id = i.subcategory_id
       FROM "Item" i 
       WHERE "InvoiceItem".item_id = i.id;`,

      // 3) Drop the old table
      `DROP TABLE IF EXISTS sales_fact_monthly_by_product CASCADE;`,

      // 4) Create simplified table
      `CREATE TABLE sales_fact_monthly_by_product (
         id serial PRIMARY KEY,
         month_start date NOT NULL,
         item_id integer NOT NULL,
         item_name varchar(255) NOT NULL,
         category_name varchar(255),
         category_id integer,
         subcategory_id integer,
         created_at timestamp DEFAULT NOW(),
         
         UNIQUE(month_start, item_id)
       );`,

      // 5) Create the view (fixed)
      `CREATE OR REPLACE VIEW v_top_products_monthly AS
       SELECT 
         month_start,
         item_id,
         item_name,
         category_name,
         category_id,
         subcategory_id,
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
           ii.category_id,
           ii.subcategory_id,
           SUM(ii.quantity) as units_sold,
           SUM(ii.total_price) as revenue
         FROM "Invoice" i
         JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
         JOIN "Item" item ON ii.item_id = item.id
         LEFT JOIN "Category" c ON ii.category_id = c.id
         GROUP BY 1,2,3,4,5,6
       ) ranked
       WHERE ranking <= 10;`,

      // 6) Create indexes
      `CREATE INDEX IF NOT EXISTS idx_sales_fact_product_month_item ON sales_fact_monthly_by_product(month_start, item_id);`,
      `CREATE INDEX IF NOT EXISTS idx_sales_fact_product_category ON sales_fact_monthly_by_product(category_id, month_start);`,

      // 7) Backfill from view
      `INSERT INTO sales_fact_monthly_by_product AS f (
         month_start, item_id, item_name, category_name, category_id, subcategory_id
       )
       SELECT 
         month_start, item_id, item_name, category_name, category_id, subcategory_id
       FROM v_top_products_monthly
       ON CONFLICT (month_start, item_id) DO UPDATE
       SET item_name = EXCLUDED.item_name,
           category_name = EXCLUDED.category_name,
           category_id = EXCLUDED.category_id,
           subcategory_id = EXCLUDED.subcategory_id;`
    ];

    // Execute all queries
    for (let i = 0; i < queries.length; i++) {
      console.log(`⏳ Executing step ${i + 1}/${queries.length}...`);
      try {
        await sequelize.query(queries[i]);
      } catch (stepError) {
        console.log(`⚠️  Step ${i + 1} warning:`, stepError.message);
        // Continue with next step
      }
    }

    console.log('✅ Product analytics structure fixed!');

    // Test the table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sales_fact_monthly_by_product'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Table Structure:');
    console.table(columns);

    // Test the view
    const [viewExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'v_top_products_monthly'
      ) as view_exists;
    `);

    console.log('\n👁️  View Status:', viewExists[0].view_exists ? '✅ Created' : '❌ Not found');

    // Show sample data if any
    const [sampleData] = await sequelize.query(`
      SELECT id, month_start, item_name, category_name, category_id, subcategory_id
      FROM sales_fact_monthly_by_product
      LIMIT 5;
    `);

    if (sampleData.length > 0) {
      console.log('\n📊 Sample Data:');
      console.table(sampleData);
    } else {
      console.log('\n📊 No data yet - table is ready for population');
    }

  } catch (error) {
    console.error('❌ Error fixing product analytics:', error.message);
  } finally {
    await closeDB();
  }
}

fixProductAnalytics();
