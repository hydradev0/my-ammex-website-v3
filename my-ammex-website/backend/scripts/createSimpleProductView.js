const { connectDB, getSequelize, closeDB } = require('../config/db');

async function createSimpleProductView() {
  try {
    console.log('👁️  Creating simple product analytics view...');
    await connectDB();
    const sequelize = getSequelize();

    // First, let's see what data we have
    const [sampleData] = await sequelize.query(`
      SELECT 
        i.invoice_date,
        ii.item_id,
        item.item_name,
        ii.category_id,
        ii.subcategory_id,
        c.name as category_name,
        ii.quantity,
        ii.total_price
      FROM "Invoice" i
      JOIN "InvoiceItem" ii ON i.id = ii.invoice_id
      JOIN "Item" item ON ii.item_id = item.id
      LEFT JOIN "Category" c ON ii.category_id = c.id
      LIMIT 5;
    `);

    console.log('\n📊 Sample Invoice Data:');
    console.table(sampleData);

    // Create a simple view without ranking first
    const createViewSQL = `
      CREATE OR REPLACE VIEW v_product_monthly AS
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
      ORDER BY month_start, revenue DESC;
    `;

    await sequelize.query(createViewSQL);
    console.log('✅ Simple view created successfully!');

    // Test the simple view
    const [viewData] = await sequelize.query(`
      SELECT month_start, item_name, category_name, revenue, units_sold
      FROM v_product_monthly
      ORDER BY month_start DESC, revenue DESC
      LIMIT 10;
    `);

    console.log('\n📊 View Data:');
    console.table(viewData);

    // Now create the top 10 view
    const createTop10ViewSQL = `
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
      FROM v_product_monthly
      WHERE ranking <= 10;
    `;

    await sequelize.query(createTop10ViewSQL);
    console.log('✅ Top 10 view created successfully!');

    // Test the top 10 view
    const [top10Data] = await sequelize.query(`
      SELECT month_start, item_name, category_name, revenue, ranking
      FROM v_top_products_monthly
      ORDER BY month_start DESC, ranking ASC
      LIMIT 10;
    `);

    console.log('\n🏆 Top 10 Products by Month:');
    console.table(top10Data);

  } catch (error) {
    console.error('❌ Error creating view:', error.message);
  } finally {
    await closeDB();
  }
}

createSimpleProductView();
