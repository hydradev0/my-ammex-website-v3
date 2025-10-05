const { connectDB, getSequelize, closeDB } = require('../config/db');

async function seedUpdatedProductFacts() {
  try {
    console.log('🌱 Seeding updated product facts with sample data (2023-2025)...');
    await connectDB();
    const sequelize = getSequelize();

    // Clear existing data
    await sequelize.query('DELETE FROM sales_fact_monthly_by_product;');

    // Sample products with realistic model numbers
    const sampleProducts = [
      { id: 101, model_no: 'PW-2024-A', category: 'Electronics', category_id: 1 },
      { id: 102, model_no: 'SW-2024-B', category: 'Electronics', category_id: 1 },
      { id: 103, model_no: 'BW-2024-C', category: 'Electronics', category_id: 1 },
      { id: 201, model_no: 'DT-2024-X', category: 'Tools', category_id: 2 },
      { id: 202, model_no: 'PT-2024-Y', category: 'Tools', category_id: 2 },
      { id: 203, model_no: 'HT-2024-Z', category: 'Tools', category_id: 2 },
      { id: 301, model_no: 'SD-2024-1', category: 'Gadgets', category_id: 3 },
      { id: 302, model_no: 'SD-2024-2', category: 'Gadgets', category_id: 3 },
      { id: 303, model_no: 'SD-2024-3', category: 'Gadgets', category_id: 3 },
      { id: 401, model_no: 'IP-2024-A', category: 'Industrial', category_id: 4 }
    ];

    // Generate data for each month from 2023-2025
    const months = [];
    for (let year = 2023; year <= 2025; year++) {
      for (let month = 1; month <= 12; month++) {
        months.push(`${year}-${month.toString().padStart(2, '0')}-01`);
      }
    }

    console.log(`📅 Generating data for ${months.length} months...`);

    // Insert sample data for each month
    for (const monthStart of months) {
      const values = [];
      
      // Generate top 10 products for this month
      for (let rank = 1; rank <= 10; rank++) {
        const product = sampleProducts[rank - 1];
        
        // Add seasonal and growth variations
        const year = parseInt(monthStart.split('-')[0]);
        const month = parseInt(monthStart.split('-')[1]);
        
        // Update model numbers with year
        const updatedModelNo = product.model_no.replace('2024', year.toString());
        
        values.push(`(
          '${monthStart}',
          ${product.id},
          '${updatedModelNo}',
          '${product.category}',
          ${product.category_id},
          ${Math.random() > 0.5 ? product.category_id + 10 : 'NULL'},
          ${rank}
        )`);
      }
      
      // Insert for this month
      await sequelize.query(`
        INSERT INTO sales_fact_monthly_by_product (
          month_start, item_id, model_no, category_name, category_id, subcategory_id, ranking
        ) VALUES ${values.join(', ')};
      `);
    }

    console.log('✅ Sample data inserted successfully!');

    // Show summary statistics
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT month_start) as months_covered,
        MIN(month_start) as earliest_month,
        MAX(month_start) as latest_month,
        COUNT(DISTINCT item_id) as unique_products,
        COUNT(DISTINCT category_id) as unique_categories
      FROM sales_fact_monthly_by_product;
    `);

    console.log('\n📊 Database Statistics:');
    console.table(stats);

    // Show top products for latest month
    const [topProducts] = await sequelize.query(`
      SELECT month_start, model_no, category_name, category_id, ranking
      FROM sales_fact_monthly_by_product
      WHERE month_start = (SELECT MAX(month_start) FROM sales_fact_monthly_by_product)
      ORDER BY ranking ASC
      LIMIT 10;
    `);

    console.log('\n🏆 Top Products (Latest Month):');
    console.table(topProducts);

    // Show ranking distribution
    const [rankings] = await sequelize.query(`
      SELECT 
        ranking,
        COUNT(*) as product_count,
        COUNT(DISTINCT month_start) as months_present
      FROM sales_fact_monthly_by_product
      GROUP BY ranking
      ORDER BY ranking;
    `);

    console.log('\n📈 Ranking Distribution:');
    console.table(rankings);

    // Show category performance by ranking
    const [categoryRankings] = await sequelize.query(`
      SELECT 
        category_name,
        ranking,
        COUNT(*) as count
      FROM sales_fact_monthly_by_product
      GROUP BY category_name, ranking
      ORDER BY category_name, ranking;
    `);

    console.log('\n🎯 Category Performance by Ranking:');
    console.table(categoryRankings);

  } catch (error) {
    console.error('❌ Error seeding updated product facts:', error.message);
  } finally {
    await closeDB();
  }
}

seedUpdatedProductFacts();
