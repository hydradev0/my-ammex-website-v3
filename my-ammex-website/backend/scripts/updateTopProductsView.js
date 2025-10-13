require('dotenv').config();
const { connectDB, getSequelize, closeDB } = require('../config/db');

async function updateTopProductsView() {
    try {
        console.log('🔄 Updating v_top_products_monthly view...');
        await connectDB();
        const sequelize = getSequelize();

        // First, let's check the current table structure
        console.log('📋 Checking current sales_fact_monthly_by_product table structure...');
        const [columns] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'sales_fact_monthly_by_product'
            ORDER BY ordinal_position;
        `);

        console.log('Current table structure:');
        console.table(columns);

        // Check current data
        const [dataCheck] = await sequelize.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT month_start) as unique_months,
                COUNT(DISTINCT model_no) as unique_models,
                COUNT(DISTINCT category_name) as unique_categories
            FROM sales_fact_monthly_by_product;
        `);

        console.log('\n📊 Current data summary:');
        console.table(dataCheck);

        // Drop the existing view
        console.log('\n🗑️ Dropping existing view...');
        await sequelize.query(`DROP VIEW IF EXISTS v_top_products_monthly CASCADE;`);

        // Create updated view based on existing sales_fact_monthly_by_product data
        console.log('🔧 Creating updated view from sales_fact_monthly_by_product table...');
        const createViewSQL = `
            CREATE OR REPLACE VIEW v_top_products_monthly AS
            SELECT 
                month_start,
                item_id,
                model_no,
                category_name,
                category_id,
                subcategory_id,
                order_count
            FROM sales_fact_monthly_by_product
            ORDER BY month_start DESC, order_count DESC;
        `;

        await sequelize.query(createViewSQL);
        console.log('✅ View created successfully!');

        // Test the view
        console.log('\n🧪 Testing the updated view...');
        const [viewTest] = await sequelize.query(`
            SELECT 
                month_start,
                item_id,
                model_no,
                category_name,
                category_id,
                subcategory_id,
                order_count
            FROM v_top_products_monthly
            WHERE month_start >= '2023-01-01'
            ORDER BY month_start DESC, order_count DESC
            LIMIT 20;
        `);

        console.log('\n📋 Sample data from updated view:');
        console.table(viewTest);

        // Get summary statistics
        const [viewStats] = await sequelize.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT month_start) as unique_months,
                COUNT(DISTINCT model_no) as unique_models,
                COUNT(DISTINCT category_name) as unique_categories,
                MIN(month_start) as earliest_month,
                MAX(month_start) as latest_month
            FROM v_top_products_monthly;
        `);

        console.log('\n📈 View statistics:');
        console.table(viewStats);

        // Test with specific months
        console.log('\n📅 Testing specific months...');
        const [monthlyTest] = await sequelize.query(`
            SELECT 
                month_start,
                COUNT(*) as products_in_month,
                SUM(order_count) as total_orders
            FROM v_top_products_monthly
            GROUP BY month_start
            ORDER BY month_start DESC
            LIMIT 10;
        `);

        console.log('\n📊 Top products by month (top 5):');
        console.table(monthlyTest);

        console.log('\n🎉 v_top_products_monthly view updated successfully!');
        console.log('✅ View now works with the current sales_fact_monthly_by_product table structure');

    } catch (error) {
        console.error('❌ Error updating view:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await closeDB();
    }
}

// Run the function
if (require.main === module) {
    updateTopProductsView();
}

module.exports = { updateTopProductsView };
