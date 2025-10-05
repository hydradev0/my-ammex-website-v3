const { connectDB, getSequelize, closeDB } = require('../config/db');

async function updateProductStructure() {
  try {
    console.log('🔧 Updating product analytics structure...');
    await connectDB();
    const sequelize = getSequelize();

    const queries = [
      // 1) Drop the v_product_monthly view
      `DROP VIEW IF EXISTS v_product_monthly CASCADE;`,

      // 2) Drop the existing table and view
      `DROP TABLE IF EXISTS sales_fact_monthly_by_product CASCADE;`,
      `DROP VIEW IF EXISTS v_top_products_monthly CASCADE;`,

      // 3) Create updated table with model_no and ranking
      `CREATE TABLE sales_fact_monthly_by_product (
         id serial PRIMARY KEY,
         month_start date NOT NULL,
         item_id integer NOT NULL,
         model_no varchar(255) NOT NULL,
         category_name varchar(255),
         category_id integer,
         subcategory_id integer,
         ranking integer NOT NULL,
         created_at timestamp DEFAULT NOW(),
         
         UNIQUE(month_start, item_id)
       );`,

      // 4) Create updated view with model_no and ranking
      `CREATE OR REPLACE VIEW v_top_products_monthly AS
       SELECT 
         month_start,
         item_id,
         model_no,
         category_name,
         category_id,
         subcategory_id,
         units_sold,
         revenue,
         ranking
       FROM (
         SELECT 
           date_trunc('month', i.invoice_date)::date as month_start,
           item.id as item_id,
           item.model_no,
           c.name as category_name,
           ii.category_id,
           ii.subcategory_id,
           SUM(ii.quantity) as units_sold,
           SUM(ii.total_price) as revenue,
           ROW_NUMBER() OVER (
             PARTITION BY date_trunc('month', i.invoice_date)::date 
             ORDER BY SUM(ii.total_price) DESC, SUM(ii.quantity) DESC
           ) as ranking
         FROM "Invoice" i
         JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
         JOIN "Item" item ON ii.item_id = item.id
         LEFT JOIN "Category" c ON ii.category_id = c.id
         GROUP BY 1,2,3,4,5,6
       ) ranked
       WHERE ranking <= 10;`,

      // 5) Create indexes
      `CREATE INDEX IF NOT EXISTS idx_sales_fact_product_month_item ON sales_fact_monthly_by_product(month_start, item_id);`,
      `CREATE INDEX IF NOT EXISTS idx_sales_fact_product_category ON sales_fact_monthly_by_product(category_id, month_start);`,
      `CREATE INDEX IF NOT EXISTS idx_sales_fact_product_ranking ON sales_fact_monthly_by_product(month_start, ranking);`,

      // 6) Populate from view
      `INSERT INTO sales_fact_monthly_by_product AS f (
         month_start, item_id, model_no, category_name, category_id, subcategory_id, ranking
       )
       SELECT 
         month_start, item_id, model_no, category_name, category_id, subcategory_id, ranking
       FROM v_top_products_monthly
       ON CONFLICT (month_start, item_id) DO UPDATE
       SET model_no = EXCLUDED.model_no,
           category_name = EXCLUDED.category_name,
           category_id = EXCLUDED.category_id,
           subcategory_id = EXCLUDED.subcategory_id,
           ranking = EXCLUDED.ranking;`
    ];

    // Execute all queries
    for (let i = 0; i < queries.length; i++) {
      console.log(`⏳ Executing step ${i + 1}/${queries.length}...`);
      try {
        await sequelize.query(queries[i]);
      } catch (stepError) {
        console.log(`⚠️  Step ${i + 1} warning:`, stepError.message);
      }
    }

    console.log('✅ Product analytics structure updated!');

    // Check the new table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sales_fact_monthly_by_product'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Updated Table Structure:');
    console.table(columns);

    // Check the view structure
    const [viewColumns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'v_top_products_monthly'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Updated View Structure:');
    console.table(viewColumns);

    // Show sample data if any
    const [sampleData] = await sequelize.query(`
      SELECT id, month_start, model_no, category_name, ranking
      FROM sales_fact_monthly_by_product
      ORDER BY month_start DESC, ranking ASC
      LIMIT 10;
    `);

    if (sampleData.length > 0) {
      console.log('\n📊 Sample Data:');
      console.table(sampleData);
    } else {
      console.log('\n📊 Table updated - ready for data population');
    }

  } catch (error) {
    console.error('❌ Error updating product structure:', error.message);
  } finally {
    await closeDB();
  }
}

updateProductStructure();
