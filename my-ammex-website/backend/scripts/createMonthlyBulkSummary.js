const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// cd my-ammex-website/backend
// node scripts/createMonthlyBulkSummary.js ammex_bulk_2023_cleaned.csv

class MonthlyBulkSummaryCreator {
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

    /**
     * Main function to create monthly bulk summary
     * @param {string} csvFilePath - Path to cleaned CSV file
     */
    async createMonthlySummary(csvFilePath) {
        try {
            console.log(`📊 Creating monthly bulk orders summary...`);
            console.log(`📁 CSV file: ${csvFilePath}`);
            
            // Read CSV file
            const records = this.readCSVFile(csvFilePath);
            console.log(`📊 Found ${records.length} individual orders to summarize`);
            
            if (records.length === 0) {
                throw new Error('No records found in CSV file');
            }
            
            // Create monthly summary table if it doesn't exist
            await this.createMonthlySummaryTable();
            
            // Generate monthly summary data
            console.log('📈 Generating monthly summary data...');
            const monthlySummary = this.generateMonthlySummary(records);
            console.log(`📅 Created summary for ${monthlySummary.length} months`);
            
            // Import monthly summary
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < monthlySummary.length; i++) {
                const record = monthlySummary[i];
                
                try {
                    await this.importMonthlyRecord(record, i + 1);
                    successCount++;
                    
                    console.log(`✅ Imported: ${record.month_start} - ${record.bulk_orders_count} orders, $${record.bulk_orders_amount.toLocaleString()}`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Error importing month ${record.month_start}: ${error.message}`);
                }
            }
            
            console.log(`\n📊 Monthly Summary Import Results:`);
            console.log(`✅ Successful imports: ${successCount}`);
            console.log(`❌ Failed imports: ${errorCount}`);
            console.log(`📈 Success rate: ${((successCount / monthlySummary.length) * 100).toFixed(1)}%`);
            
            return {
                success: true,
                totalMonths: monthlySummary.length,
                successCount,
                errorCount
            };
            
        } catch (error) {
            console.error('❌ Monthly summary creation failed:', error.message);
            console.error('❌ Error stack:', error.stack);
            return {
                success: false,
                error: error.message
            };
        } finally {
            await this.pool.end();
        }
    }

    /**
     * Create customer_bulk_monthly table if it doesn't exist
     */
    async createMonthlySummaryTable() {
        const client = await this.pool.connect();
        
        try {
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS customer_bulk_monthly (
                    id SERIAL PRIMARY KEY,
                    month_start DATE NOT NULL UNIQUE,
                    bulk_orders_count INTEGER NOT NULL DEFAULT 0,
                    bulk_orders_amount NUMERIC(15,2) NOT NULL DEFAULT 0
                );
                
                CREATE INDEX IF NOT EXISTS idx_customer_bulk_monthly_month_start 
                ON customer_bulk_monthly (month_start);
                
                CREATE INDEX IF NOT EXISTS idx_customer_bulk_monthly_amount
                ON customer_bulk_monthly (bulk_orders_amount);
            `;
            
            await client.query(createTableQuery);
            console.log('✅ customer_bulk_monthly table created/verified');
            
        } catch (error) {
            console.error('❌ Error creating customer_bulk_monthly table:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Read CSV file and parse records
     */
    readCSVFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                throw new Error('CSV file must have at least a header and one data row');
            }
            
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            const records = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                
                if (values.length !== headers.length) {
                    console.warn(`⚠️  Line ${i + 1}: Expected ${headers.length} columns, found ${values.length}`);
                    continue;
                }
                
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index]?.replace(/"/g, '').trim() || '';
                });
                
                records.push(record);
            }
            
            return records;
            
        } catch (error) {
            throw new Error(`Failed to read CSV file: ${error.message}`);
        }
    }

    /**
     * Parse CSV line handling quoted values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    /**
     * Generate monthly summary from individual orders
     */
    generateMonthlySummary(records) {
        const monthlyData = new Map();
        
        // Aggregate by month
        for (const record of records) {
            const monthStart = record.month_start;
            const orderAmount = parseFloat(record.bulk_orders_amount);
            
            if (!monthlyData.has(monthStart)) {
                monthlyData.set(monthStart, {
                    month_start: monthStart,
                    bulk_orders_count: 0,
                    bulk_orders_amount: 0
                });
            }
            
            const monthData = monthlyData.get(monthStart);
            monthData.bulk_orders_count++;
            monthData.bulk_orders_amount += orderAmount;
        }
        
        // Convert to array and sort by month
        const result = Array.from(monthlyData.values()).sort((a, b) => 
            new Date(a.month_start) - new Date(b.month_start)
        );
        
        return result;
    }

    /**
     * Import monthly summary record using UPSERT
     */
    async importMonthlyRecord(record, recordNumber) {
        const client = await this.pool.connect();
        
        try {
            // Validate and convert data
            const monthStart = new Date(record.month_start);
            const bulkOrdersCount = parseInt(record.bulk_orders_count);
            const bulkOrdersAmount = parseFloat(record.bulk_orders_amount);
            
            // Validate data
            if (isNaN(monthStart.getTime())) {
                throw new Error(`Invalid month_start: ${record.month_start}`);
            }
            
            if (isNaN(bulkOrdersCount) || bulkOrdersCount <= 0) {
                throw new Error(`Invalid bulk_orders_count: ${record.bulk_orders_count}`);
            }
            
            if (isNaN(bulkOrdersAmount) || bulkOrdersAmount <= 0) {
                throw new Error(`Invalid bulk_orders_amount: ${record.bulk_orders_amount}`);
            }
            
            // UPSERT query - insert or update on conflict
            const query = `
                INSERT INTO customer_bulk_monthly (
                    month_start,
                    bulk_orders_count,
                    bulk_orders_amount
                ) VALUES ($1, $2, $3)
                ON CONFLICT (month_start) 
                DO UPDATE SET
                    bulk_orders_count = EXCLUDED.bulk_orders_count,
                    bulk_orders_amount = EXCLUDED.bulk_orders_amount
                RETURNING month_start, bulk_orders_count, bulk_orders_amount;
            `;
            
            const values = [
                monthStart,
                bulkOrdersCount,
                bulkOrdersAmount
            ];
            
            const result = await client.query(query, values);
            
            return result.rows[0];
            
        } catch (error) {
            throw new Error(`Month ${record.month_start}: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Verify import by checking record counts
     */
    async verifyImport() {
        const client = await this.pool.connect();
        
        try {
            console.log('\n🔍 Verifying monthly summary import...');
            
            // Check total count
            const countResult = await client.query('SELECT COUNT(*) as total FROM customer_bulk_monthly');
            console.log(`📊 Total monthly records: ${countResult.rows[0].total}`);
            
            // Check summary by month
            const monthlyResult = await client.query(`
                SELECT 
                    month_start,
                    bulk_orders_count,
                    bulk_orders_amount
                FROM customer_bulk_monthly 
                ORDER BY month_start
            `);
            
            console.log('\n📅 Monthly Summary:');
            console.log('Month'.padEnd(12) + 'Orders'.padEnd(8) + 'Amount');
            console.log('-'.repeat(35));
            
            let totalOrders = 0;
            let totalAmount = 0;
            
            monthlyResult.rows.forEach(row => {
                const month = row.month_start.toISOString().substring(0, 7);
                const orders = row.bulk_orders_count.toString().padEnd(8);
                const amount = `$${parseFloat(row.bulk_orders_amount).toLocaleString()}`;
                
                console.log(`${month}`.padEnd(12) + `${orders}${amount}`);
                
                totalOrders += parseInt(row.bulk_orders_count);
                totalAmount += parseFloat(row.bulk_orders_amount);
            });
            
            console.log('-'.repeat(35));
            console.log(`TOTAL`.padEnd(12) + `${totalOrders}`.padEnd(8) + `$${totalAmount.toLocaleString()}`);
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
        }
    }
}

// CLI usage
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log(`
📖 USAGE:
   node createMonthlyBulkSummary.js <cleaned_csv_file>

📝 EXAMPLES:
   node createMonthlyBulkSummary.js ammex_bulk_2023_cleaned.csv
   node createMonthlyBulkSummary.js "C:\\path\\to\\cleaned_bulk_orders_data.csv"

🔧 WHAT THIS SCRIPT DOES:
   - Connects to your PostgreSQL database
   - Aggregates individual bulk orders by month
   - Creates monthly summary in customer_bulk_monthly table
   - Shows total orders and amounts per month

📋 EXPECTED CSV FORMAT:
   - Headers: customer_name,bulk_orders_amount,model_no,month_start
   - Data: "AMSTEEL",950000,"S390","2023-01-01"
        `);
        process.exit(1);
    }
    
    const csvFile = args[0];
    const summaryCreator = new MonthlyBulkSummaryCreator();
    
    const result = await summaryCreator.createMonthlySummary(csvFile);
    
    if (result.success) {
        console.log('\n🎉 Monthly summary creation completed successfully!');
        
        // Note: Verification is commented out since pool is closed
        console.log('\n💡 To verify the import, you can run:');
        console.log('   SELECT * FROM customer_bulk_monthly ORDER BY month_start;');
        
        process.exit(0);
    } else {
        console.log('\n❌ Monthly summary creation failed!');
        if (result.error) {
            console.log(`Error: ${result.error}`);
        }
        process.exit(1);
    }
}

// Export for use as module
module.exports = { MonthlyBulkSummaryCreator };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
