const { connectDB, getSequelize, closeDB } = require('../config/db');

async function fixTop10View() {
  try {
    console.log('🔧 Fixing top 10 products view...');
    await connectDB();
    const sequelize = getSequelize();

    // Create the top 10 view with proper syntax
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
        ranking
      FROM (
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
      ) ranked
      WHERE ranking <= 10;
    `;

    await sequelize.query(createTop10ViewSQL);
    console.log('✅ Top 10 view created successfully!');

    // Test the top 10 view
    const [top10Data] = await sequelize.query(`
      SELECT month_start, item_name, category_name, revenue, ranking
      FROM v_top_products_monthly
      ORDER BY month_start DESC, ranking ASC
      LIMIT 15;
    `);

    console.log('\n🏆 Top 10 Products by Month:');
    console.table(top10Data);

    // Now populate the fact table
    const [populateResult] = await sequelize.query(`
      INSERT INTO sales_fact_monthly_by_product AS f (
        month_start, item_id, item_name, category_name, category_id, subcategory_id
      )
      SELECT 
        month_start, item_id, item_name, category_name, category_id, subcategory_id
      FROM v_top_products_monthly
      ON CONFLICT (month_start, item_id) DO UPDATE
      SET item_name = EXCLUDED.item_name,
          category_name = EXCLUDED.category_name,
          category_id = EXCLUDED.category_id,
          subcategory_id = EXCLUDED.subcategory_id;
    `);

    console.log('✅ Fact table populated!');

    // Show final result
    const [finalData] = await sequelize.query(`
      SELECT id, month_start, item_name, category_name, category_id, subcategory_id
      FROM sales_fact_monthly_by_product
      ORDER BY month_start DESC, id ASC
      LIMIT 10;
    `);

    console.log('\n📊 Final Fact Table Data:');
    console.table(finalData);

  } catch (error) {
    console.error('❌ Error fixing view:', error.message);
  } finally {
    await closeDB();
  }
}

fixTop10View();
