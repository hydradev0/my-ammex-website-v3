const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkBulkData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🔍 Checking all bulk data in database...');
        
        const client = await pool.connect();
        
        try {
            // Check monthly summary
            const monthlyResult = await client.query(`
                SELECT 
                    month_start,
                    bulk_orders_count,
                    bulk_orders_amount
                FROM customer_bulk_monthly 
                ORDER BY month_start
            `);
            
            console.log('\n📅 All Monthly Summary Data:');
            console.log('Month'.padEnd(12) + 'Orders'.padEnd(8) + 'Amount');
            console.log('-'.repeat(40));
            
            monthlyResult.rows.forEach(row => {
                const month = row.month_start ? row.month_start.toISOString().substring(0, 7) : 'NULL';
                const orders = row.bulk_orders_count ? row.bulk_orders_count.toString().padEnd(8) : 'NULL'.padEnd(8);
                const amount = row.bulk_orders_amount ? `$${parseFloat(row.bulk_orders_amount).toLocaleString()}` : 'NULL';
                
                console.log(`${month}`.padEnd(12) + `${orders}${amount}`);
            });
            
            console.log(`\n📊 Total records: ${monthlyResult.rows.length}`);
            
            // Check customer-monthly data
            const customerResult = await client.query(`
                SELECT 
                    month_start,
                    COUNT(*) as customer_count
                FROM customer_bulk_monthly_by_name 
                GROUP BY month_start
                ORDER BY month_start
            `);
            
            console.log('\n👥 Customer-Monthly Data by Month:');
            console.log('Month'.padEnd(12) + 'Customers');
            console.log('-'.repeat(20));
            
            customerResult.rows.forEach(row => {
                const month = row.month_start ? row.month_start.toISOString().substring(0, 7) : 'NULL';
                const customers = row.customer_count.toString();
                
                console.log(`${month}`.padEnd(12) + `${customers}`);
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error checking bulk data:', error.message);
    } finally {
        await pool.end();
    }
}

checkBulkData().catch(console.error);
