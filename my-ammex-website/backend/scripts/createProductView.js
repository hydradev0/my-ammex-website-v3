const { connectDB, getSequelize, closeDB } = require('../config/db');

async function createProductView() {
  try {
    console.log('👁️  Creating product analytics view...');
    await connectDB();
    const sequelize = getSequelize();

    // Create the view with proper structure
    const createViewSQL = `
      CREATE OR REPLACE VIEW v_top_products_monthly AS
      SELECT 
        month_start,
        item_id,
        item_name,
        category_name,
        category_id,
        subcategory_id,
        units_sold,
        revenue,
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
      WHERE ranking <= 10;
    `;

    await sequelize.query(createViewSQL);
    console.log('✅ View created successfully!');

    // Test the view
    const [viewTest] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'v_top_products_monthly'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 View Structure:');
    console.table(viewTest);

    // Test if view returns data
    try {
      const [sampleData] = await sequelize.query(`
        SELECT month_start, item_name, category_name, revenue, ranking
        FROM v_top_products_monthly
        LIMIT 5;
      `);

      if (sampleData.length > 0) {
        console.log('\n📊 Sample View Data:');
        console.table(sampleData);
      } else {
        console.log('\n📊 View created but no invoice data found');
      }
    } catch (viewError) {
      console.log('⚠️  View created but no data available yet');
    }

  } catch (error) {
    console.error('❌ Error creating view:', error.message);
  } finally {
    await closeDB();
  }
}

createProductView();
