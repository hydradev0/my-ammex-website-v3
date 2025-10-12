const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// cd my-ammex-website/backend
// node scripts/viewMonthlyBulkSummary.js

class MonthlyBulkSummaryViewer {
    constructor() {
        // Use DATABASE_URL if available, otherwise fall back to individual parameters
        if (process.env.DATABASE_URL) {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
        } else {
            this.pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'ammex_db',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password'
            });
        }
    }

    async viewMonthlySummary() {
        try {
            console.log(`📊 Monthly Bulk Orders Summary`);
            console.log(`================================`);
            
            const client = await this.pool.connect();
            
            try {
                // Get monthly summary
                const result = await client.query(`
                    SELECT 
                        month_start,
                        bulk_orders_count,
                        bulk_orders_amount
                    FROM customer_bulk_monthly 
                    ORDER BY month_start
                `);
                
                if (result.rows.length === 0) {
                    console.log('❌ No monthly summary data found');
                    return;
                }
                
                console.log('\n📅 Monthly Summary:');
                console.log('Month'.padEnd(12) + 'Orders'.padEnd(8) + 'Amount');
                console.log('-'.repeat(35));
                
                let totalOrders = 0;
                let totalAmount = 0;
                
                result.rows.forEach(row => {
                    const month = row.month_start.toISOString().substring(0, 7);
                    const orders = row.bulk_orders_count.toString().padEnd(8);
                    const amount = `$${parseFloat(row.bulk_orders_amount).toLocaleString()}`;
                    
                    console.log(`${month}`.padEnd(12) + `${orders}${amount}`);
                    
                    totalOrders += parseInt(row.bulk_orders_count);
                    totalAmount += parseFloat(row.bulk_orders_amount);
                });
                
                console.log('-'.repeat(35));
                console.log(`TOTAL`.padEnd(12) + `${totalOrders}`.padEnd(8) + `$${totalAmount.toLocaleString()}`);
                
                console.log(`\n📈 Statistics:`);
                console.log(`• Total months: ${result.rows.length}`);
                console.log(`• Total orders: ${totalOrders}`);
                console.log(`• Total amount: $${totalAmount.toLocaleString()}`);
                console.log(`• Average per month: $${(totalAmount / result.rows.length).toLocaleString()}`);
                console.log(`• Average order value: $${(totalAmount / totalOrders).toLocaleString()}`);
                
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('❌ Error viewing monthly summary:', error.message);
        } finally {
            await this.pool.end();
        }
    }
}

// CLI usage
async function main() {
    const viewer = new MonthlyBulkSummaryViewer();
    await viewer.viewMonthlySummary();
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { MonthlyBulkSummaryViewer };


