require('dotenv').config();
const { connectDB, getSequelize, closeDB } = require('../config/db');

async function checkViewSources() {
    try {
        console.log('🔍 Checking sources of all views...');
        await connectDB();
        const sequelize = getSequelize();

        const views = [
            'v_top_customers_monthly',
            'v_customer_bulk_monthly', 
            'v_sales_monthly',
            'v_top_products_monthly'
        ];

        for (const viewName of views) {
            console.log(`\n📋 View: ${viewName}`);
            console.log('='.repeat(50));

            try {
                // Get view definition
                const [viewDef] = await sequelize.query(`
                    SELECT definition 
                    FROM pg_views 
                    WHERE viewname = '${viewName}';
                `);

                if (viewDef.length > 0) {
                    console.log('✅ View exists');
                    console.log('📝 Definition:');
                    console.log(viewDef[0].definition);
                } else {
                    console.log('❌ View does not exist');
                }

                // Check if view has data
                try {
                    const [viewData] = await sequelize.query(`
                        SELECT COUNT(*) as record_count 
                        FROM ${viewName};
                    `);
                    console.log(`📊 Records in view: ${viewData[0].record_count}`);
                } catch (error) {
                    console.log('❌ Cannot access view data:', error.message);
                }

                // Get column information
                try {
                    const [columns] = await sequelize.query(`
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns 
                        WHERE table_name = '${viewName}'
                        ORDER BY ordinal_position;
                    `);
                    
                    if (columns.length > 0) {
                        console.log('\n📋 View columns:');
                        console.table(columns);
                    }
                } catch (error) {
                    console.log('❌ Cannot get column info:', error.message);
                }

            } catch (error) {
                console.log('❌ Error checking view:', error.message);
            }
        }

        console.log('\n🎯 Summary of view sources:');
        console.log('='.repeat(50));

        // Check what tables exist that might be sources
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('\n📋 Available tables in database:');
        console.table(tables.map(t => ({ table: t.table_name })));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await closeDB();
    }
}

// Run the function
if (require.main === module) {
    checkViewSources();
}

module.exports = { checkViewSources };