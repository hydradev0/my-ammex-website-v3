const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkCustomerBulkData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🔍 Checking customer_bulk_monthly_by_name data...');
        
        const client = await pool.connect();
        
        try {
            // Check all data in customer_bulk_monthly_by_name
            const result = await client.query(`
                SELECT 
                    month_start,
                    customer_name,
                    bulk_orders_count,
                    bulk_orders_amount,
                    average_bulk_order_value,
                    model_no
                FROM customer_bulk_monthly_by_name 
                ORDER BY month_start, customer_name
            `);
            
            console.log(`\n📊 Total records in customer_bulk_monthly_by_name: ${result.rows.length}`);
            
            // Group by month to show summary
            const monthlySummary = {};
            result.rows.forEach(row => {
                const month = row.month_start.toISOString().substring(0, 7);
                if (!monthlySummary[month]) {
                    monthlySummary[month] = {
                        customers: 0,
                        totalOrders: 0,
                        totalAmount: 0
                    };
                }
                monthlySummary[month].customers++;
                monthlySummary[month].totalOrders += parseInt(row.bulk_orders_count);
                monthlySummary[month].totalAmount += parseFloat(row.bulk_orders_amount);
            });
            
            console.log('\n📅 Monthly Summary (from customer_bulk_monthly_by_name):');
            console.log('Month'.padEnd(12) + 'Customers'.padEnd(10) + 'Orders'.padEnd(8) + 'Amount');
            console.log('-'.repeat(50));
            
            Object.keys(monthlySummary).sort().forEach(month => {
                const data = monthlySummary[month];
                const customers = data.customers.toString().padEnd(10);
                const orders = data.totalOrders.toString().padEnd(8);
                const amount = `$${data.totalAmount.toLocaleString()}`;
                
                console.log(`${month}`.padEnd(12) + `${customers}${orders}${amount}`);
            });
            
            // Show detailed data for each month
            console.log('\n📋 Detailed Data by Month:');
            let currentMonth = null;
            
            result.rows.forEach(row => {
                const month = row.month_start.toISOString().substring(0, 7);
                
                if (month !== currentMonth) {
                    console.log(`\n📅 ${month}:`);
                    console.log('Customer'.padEnd(25) + 'Orders'.padEnd(8) + 'Amount'.padEnd(15) + 'Model');
                    console.log('-'.repeat(60));
                    currentMonth = month;
                }
                
                const customer = row.customer_name.substring(0, 24).padEnd(25);
                const orders = row.bulk_orders_count.toString().padEnd(8);
                const amount = `$${parseFloat(row.bulk_orders_amount).toLocaleString()}`.padEnd(15);
                const model = row.model_no ? row.model_no.substring(0, 10) : 'N/A';
                
                console.log(`${customer}${orders}${amount}${model}`);
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error checking customer bulk data:', error.message);
    } finally {
        await pool.end();
    }
}

checkCustomerBulkData().catch(console.error);
