const { connectDB, getSequelize, closeDB } = require('../config/db');

async function seedProductFacts() {
  try {
    console.log('🌱 Seeding product facts with sample data (2023-2025)...');
    await connectDB();
    const sequelize = getSequelize();

    // Clear existing data
    await sequelize.query('DELETE FROM sales_fact_monthly_by_product;');

    // Sample products with realistic data
    const sampleProducts = [
      { id: 101, name: 'Premium Widget A', category: 'Electronics', category_id: 1 },
      { id: 102, name: 'Standard Widget B', category: 'Electronics', category_id: 1 },
      { id: 103, name: 'Basic Widget C', category: 'Electronics', category_id: 1 },
      { id: 201, name: 'Deluxe Tool X', category: 'Tools', category_id: 2 },
      { id: 202, name: 'Pro Tool Y', category: 'Tools', category_id: 2 },
      { id: 203, name: 'Heavy Tool Z', category: 'Tools', category_id: 2 },
      { id: 301, name: 'Smart Device 1', category: 'Gadgets', category_id: 3 },
      { id: 302, name: 'Smart Device 2', category: 'Gadgets', category_id: 3 },
      { id: 303, name: 'Smart Device 3', category: 'Gadgets', category_id: 3 },
      { id: 401, name: 'Industrial Part A', category: 'Industrial', category_id: 4 }
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
        
        // Base revenue with growth (5% per year) and seasonal patterns
        const baseRevenue = [45000, 35000, 25000, 22000, 20000, 18000, 16000, 15000, 14000, 12000][rank - 1];
        const growthFactor = Math.pow(1.05, year - 2023); // 5% growth per year
        const seasonalFactor = 1 + 0.2 * Math.sin((month - 1) * Math.PI / 6); // Seasonal variation
        const randomFactor = 0.8 + Math.random() * 0.4; // Random variation
        
        const revenue = Math.round(baseRevenue * growthFactor * seasonalFactor * randomFactor);
        
        values.push(`(
          '${monthStart}',
          ${product.id},
          '${product.name}',
          '${product.category}',
          ${product.category_id},
          ${Math.random() > 0.5 ? product.category_id + 10 : 'NULL'}
        )`);
      }
      
      // Insert for this month
      await sequelize.query(`
        INSERT INTO sales_fact_monthly_by_product (
          month_start, item_id, item_name, category_name, category_id, subcategory_id
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
      SELECT month_start, item_name, category_name, category_id, subcategory_id
      FROM sales_fact_monthly_by_product
      WHERE month_start = (SELECT MAX(month_start) FROM sales_fact_monthly_by_product)
      ORDER BY id ASC
      LIMIT 10;
    `);

    console.log('\n🏆 Top Products (Latest Month):');
    console.table(topProducts);

    // Show category distribution
    const [categories] = await sequelize.query(`
      SELECT 
        category_name,
        COUNT(*) as product_count,
        COUNT(DISTINCT month_start) as months_present
      FROM sales_fact_monthly_by_product
      GROUP BY category_name
      ORDER BY product_count DESC;
    `);

    console.log('\n📈 Category Distribution:');
    console.table(categories);

  } catch (error) {
    console.error('❌ Error seeding product facts:', error.message);
  } finally {
    await closeDB();
  }
}

seedProductFacts();
