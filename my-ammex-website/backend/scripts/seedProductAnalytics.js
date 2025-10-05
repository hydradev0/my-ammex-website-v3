const { connectDB, getSequelize, closeDB } = require('../config/db');

async function seedProductAnalytics() {
  try {
    console.log('🌱 Seeding product analytics with sample data (2023-2025)...');
    await connectDB();
    const sequelize = getSequelize();

    // Sample products data
    const sampleProducts = [
      { id: 101, name: 'Premium Widget A', category: 'Electronics' },
      { id: 102, name: 'Standard Widget B', category: 'Electronics' },
      { id: 103, name: 'Basic Widget C', category: 'Electronics' },
      { id: 201, name: 'Deluxe Tool X', category: 'Tools' },
      { id: 202, name: 'Pro Tool Y', category: 'Tools' },
      { id: 203, name: 'Heavy Tool Z', category: 'Tools' },
      { id: 301, name: 'Smart Device 1', category: 'Gadgets' },
      { id: 302, name: 'Smart Device 2', category: 'Gadgets' },
      { id: 303, name: 'Smart Device 3', category: 'Gadgets' },
      { id: 401, name: 'Industrial Part A', category: 'Industrial' }
    ];

    // Generate data for each month from 2023-2025
    const months = [];
    for (let year = 2023; year <= 2025; year++) {
      for (let month = 1; month <= 12; month++) {
        months.push(`${year}-${month.toString().padStart(2, '0')}-01`);
      }
    }

    console.log(`📅 Generating data for ${months.length} months...`);

    // Clear existing data
    await sequelize.query('DELETE FROM sales_fact_monthly_by_product;');

    // Insert sample data for each month
    for (const monthStart of months) {
      const values = [];
      
      // Generate top 10 products for this month with realistic variations
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
        const unitsSold = Math.round(revenue / (200 + rank * 10)); // Varying unit prices
        const avgUnitPrice = Math.round(revenue / unitsSold);
        const orderCount = Math.round(unitsSold / (3 + rank)); // Varying order sizes
        const uniqueCustomers = Math.round(orderCount * (0.7 + Math.random() * 0.2)); // 70-90% retention
        
        values.push(`(
          '${monthStart}',
          ${product.id},
          '${product.name}',
          '${product.category}',
          ${unitsSold},
          ${revenue},
          ${avgUnitPrice},
          ${orderCount},
          ${uniqueCustomers},
          ${rank}
        )`);
      }
      
      // Insert for this month
      await sequelize.query(`
        INSERT INTO sales_fact_monthly_by_product (
          month_start, item_id, item_name, category_name, units_sold, 
          revenue, avg_unit_price, order_count, unique_customers, ranking
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
        ROUND(AVG(revenue), 2) as avg_revenue,
        ROUND(SUM(revenue), 2) as total_revenue
      FROM sales_fact_monthly_by_product;
    `);

    console.log('\n📊 Database Statistics:');
    console.table(stats);

    // Show top products for latest month
    const [topProducts] = await sequelize.query(`
      SELECT month_start, item_name, revenue, units_sold, ranking
      FROM sales_fact_monthly_by_product
      WHERE month_start = (SELECT MAX(month_start) FROM sales_fact_monthly_by_product)
      ORDER BY ranking ASC;
    `);

    console.log('\n🏆 Top Products (Latest Month):');
    console.table(topProducts);

    // Show year-over-year growth
    const [growth] = await sequelize.query(`
      SELECT 
        EXTRACT(YEAR FROM month_start) as year,
        COUNT(*) as months,
        ROUND(SUM(revenue), 2) as total_revenue,
        ROUND(AVG(revenue), 2) as avg_monthly_revenue
      FROM sales_fact_monthly_by_product
      GROUP BY EXTRACT(YEAR FROM month_start)
      ORDER BY year;
    `);

    console.log('\n📈 Year-over-Year Growth:');
    console.table(growth);

  } catch (error) {
    console.error('❌ Error seeding product analytics:', error.message);
  } finally {
    await closeDB();
  }
}

seedProductAnalytics();
