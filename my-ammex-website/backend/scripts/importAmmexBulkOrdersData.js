const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// cd my-ammex-website/backend
// node scripts/importAmmexBulkOrdersData.js 2021-bulk-orders-cleaned-final.csv

class AmmexBulkOrdersDataImporter {
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
     * Main function to import bulk orders data
     * @param {string} csvFilePath - Path to cleaned CSV file
     */
    async importBulkOrdersData(csvFilePath) {
        try {
            console.log(`📦 Starting bulk orders data import...`);
            console.log(`📁 CSV file: ${csvFilePath}`);
            
            // Read CSV file
            const records = this.readCSVFile(csvFilePath);
            console.log(`📊 Found ${records.length} records to import`);
            
            if (records.length === 0) {
                throw new Error('No records found in CSV file');
            }
            
            // Create bulk orders table if it doesn't exist
            await this.createBulkOrdersTable();
            
            // Aggregate records by customer and month
            console.log('📊 Aggregating data by customer and month...');
            console.log(`📝 Sample record:`, records[0]);
            const aggregatedData = this.aggregateDataByCustomerAndMonth(records);
            console.log(`📈 Aggregated into ${aggregatedData.length} customer-month records`);
            console.log(`📝 Sample aggregated record:`, aggregatedData[0]);
            
            // Import aggregated records
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < aggregatedData.length; i++) {
                const record = aggregatedData[i];
                
                try {
                    await this.importRecord(record, i + 1);
                    successCount++;
                    
                    if (successCount % 5 === 0) {
                        console.log(`✅ Imported ${successCount}/${aggregatedData.length} customer-month records...`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Error importing record ${i + 1}: ${error.message}`);
                    console.error(`   Record: ${JSON.stringify(record)}`);
                }
            }
            
            console.log(`\n📊 Import Summary:`);
            console.log(`✅ Successful imports: ${successCount}`);
            console.log(`❌ Failed imports: ${errorCount}`);
            console.log(`📈 Success rate: ${((successCount / records.length) * 100).toFixed(1)}%`);
            
            return {
                success: true,
                totalRecords: records.length,
                successCount,
                errorCount
            };
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
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
     * Create customer_bulk_monthly_by_name table if it doesn't exist
     */
    async createBulkOrdersTable() {
        const client = await this.pool.connect();
        
        try {
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS customer_bulk_monthly_by_name (
                    id SERIAL PRIMARY KEY,
                    month_start DATE NOT NULL,
                    customer_name VARCHAR(255) NOT NULL,
                    bulk_orders_count INTEGER NOT NULL DEFAULT 0,
                    bulk_orders_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
                    average_bulk_order_value NUMERIC(15,2) NOT NULL DEFAULT 0,
                    model_no VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(month_start, customer_name)
                );
                
                CREATE INDEX IF NOT EXISTS idx_customer_bulk_monthly_by_name_month_start 
                ON customer_bulk_monthly_by_name (month_start);
                
                CREATE INDEX IF NOT EXISTS idx_customer_bulk_monthly_by_name_amount
                ON customer_bulk_monthly_by_name (bulk_orders_amount);
                
                CREATE INDEX IF NOT EXISTS idx_customer_bulk_monthly_by_name_customer_name
                ON customer_bulk_monthly_by_name (customer_name);
            `;
            
            await client.query(createTableQuery);
            console.log('✅ customer_bulk_monthly_by_name table created/verified');
            
        } catch (error) {
            console.error('❌ Error creating customer_bulk_monthly_by_name table:', error.message);
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
     * Aggregate data by customer and month
     */
    aggregateDataByCustomerAndMonth(records) {
        const aggregated = new Map();
        
        for (const record of records) {
            const key = `${record.customer_name}|${record.month_start}`;
            
            if (!aggregated.has(key)) {
                aggregated.set(key, {
                    month_start: record.month_start,
                    customer_name: record.customer_name,
                    bulk_orders_count: 0,
                    bulk_orders_amount: 0,
                    model_numbers: new Set(),
                    total_amount: 0
                });
            }
            
            const agg = aggregated.get(key);
            agg.bulk_orders_count++;
            agg.total_amount += parseFloat(record.bulk_orders_amount);
            
            if (record.model_no && record.model_no.trim()) {
                agg.model_numbers.add(record.model_no.trim());
            }
        }
        
        // Convert to final format
        const result = [];
        for (const [key, agg] of aggregated) {
            result.push({
                month_start: agg.month_start,
                customer_name: agg.customer_name,
                bulk_orders_count: agg.bulk_orders_count,
                bulk_orders_amount: agg.total_amount,
                average_bulk_order_value: agg.total_amount / agg.bulk_orders_count,
                model_no: Array.from(agg.model_numbers).join(', ') || null
            });
        }
        
        // Sort by month_start, then by customer_name
        result.sort((a, b) => {
            const dateCompare = new Date(a.month_start) - new Date(b.month_start);
            if (dateCompare !== 0) return dateCompare;
            return a.customer_name.localeCompare(b.customer_name);
        });
        
        return result;
    }

    /**
     * Import individual record using UPSERT
     */
    async importRecord(record, recordNumber) {
        const client = await this.pool.connect();
        
        try {
            // Validate and convert data
            const monthStart = new Date(record.month_start);
            const customerName = record.customer_name?.trim();
            const bulkOrdersCount = parseInt(record.bulk_orders_count);
            const bulkOrdersAmount = parseFloat(record.bulk_orders_amount);
            const averageBulkOrderValue = parseFloat(record.average_bulk_order_value);
            const modelNo = record.model_no?.trim() || null;
            
            // Validate data
            if (isNaN(monthStart.getTime())) {
                throw new Error(`Invalid month_start: ${record.month_start}`);
            }
            
            if (!customerName) {
                throw new Error('Customer name is required');
            }
            
            if (isNaN(bulkOrdersCount) || bulkOrdersCount <= 0) {
                throw new Error(`Invalid bulk_orders_count: ${record.bulk_orders_count}`);
            }
            
            if (isNaN(bulkOrdersAmount) || bulkOrdersAmount <= 0) {
                throw new Error(`Invalid bulk_orders_amount: ${record.bulk_orders_amount}`);
            }
            
            if (isNaN(averageBulkOrderValue) || averageBulkOrderValue <= 0) {
                throw new Error(`Invalid average_bulk_order_value: ${record.average_bulk_order_value}`);
            }
            
            // UPSERT query - insert or update on conflict
            const query = `
                INSERT INTO customer_bulk_monthly_by_name (
                    month_start,
                    customer_name,
                    bulk_orders_count,
                    bulk_orders_amount,
                    average_bulk_order_value,
                    model_no,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (month_start, customer_name) 
                DO UPDATE SET
                    bulk_orders_count = EXCLUDED.bulk_orders_count,
                    bulk_orders_amount = EXCLUDED.bulk_orders_amount,
                    average_bulk_order_value = EXCLUDED.average_bulk_order_value,
                    model_no = EXCLUDED.model_no,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING month_start, customer_name, bulk_orders_amount;
            `;
            
            const values = [
                monthStart,
                customerName,
                bulkOrdersCount,
                bulkOrdersAmount,
                averageBulkOrderValue,
                modelNo
            ];
            
            const result = await client.query(query, values);
            
            if (recordNumber % 5 === 0) {
                console.log(`   📝 Imported: ${customerName} - ${bulkOrdersCount} orders, $${bulkOrdersAmount.toLocaleString()} (${modelNo})`);
            }
            
            return result.rows[0];
            
        } catch (error) {
            throw new Error(`Record ${recordNumber}: ${error.message}`);
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
            console.log('\n🔍 Verifying import...');
            
            // Check total count
            const countResult = await client.query('SELECT COUNT(*) as total FROM customer_bulk_monthly_by_name');
            console.log(`📊 Total customer-month records: ${countResult.rows[0].total}`);
            
            // Check by month
            const monthlyResult = await client.query(`
                SELECT 
                    month_start,
                    SUM(bulk_orders_count) as total_orders,
                    SUM(bulk_orders_amount) as total_amount,
                    COUNT(DISTINCT customer_name) as unique_customers
                FROM customer_bulk_monthly_by_name 
                GROUP BY month_start 
                ORDER BY month_start
            `);
            
            console.log('\n📅 Monthly Summary:');
            console.log('Month'.padEnd(12) + 'Orders'.padEnd(8) + 'Amount'.padEnd(15) + 'Customers');
            console.log('-'.repeat(50));
            
            monthlyResult.rows.forEach(row => {
                const month = row.month_start.toISOString().substring(0, 7);
                const orders = row.total_orders.toString().padEnd(8);
                const amount = `$${parseFloat(row.total_amount).toLocaleString()}`.padEnd(15);
                const customers = row.unique_customers.toString();
                
                console.log(`${month}`.padEnd(12) + `${orders}${amount}${customers}`);
            });
            
            // Check top customers
            const topCustomersResult = await client.query(`
                SELECT 
                    customer_name,
                    SUM(bulk_orders_count) as total_orders,
                    SUM(bulk_orders_amount) as total_amount
                FROM customer_bulk_monthly_by_name 
                GROUP BY customer_name 
                ORDER BY total_amount DESC 
                LIMIT 5
            `);
            
            console.log('\n🏆 Top Customers by Total Amount:');
            topCustomersResult.rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.customer_name}: $${parseFloat(row.total_amount).toLocaleString()} (${row.total_orders} orders)`);
            });
            
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
   node importAmmexBulkOrdersData.js <cleaned_csv_file>

📝 EXAMPLES:
   node importAmmexBulkOrdersData.js 2021-bulk-orders-cleaned-final.csv
   node importAmmexBulkOrdersData.js "C:\\path\\to\\cleaned_bulk_orders_data.csv"

🔧 WHAT THIS SCRIPT DOES:
   - Connects to your PostgreSQL database
   - Aggregates individual bulk orders by customer and month
   - Imports aggregated data into customer_bulk_monthly_by_name table
   - Creates table and indexes if they don't exist
   - Uses UPSERT to handle duplicate entries safely

📋 EXPECTED CSV FORMAT:
   - Headers: customer_name,bulk_orders_amount,model_no,month_start
   - Data: "ACSI",475000,"GARNET","2021-01-01"
   - Script will aggregate multiple orders per customer per month
        `);
        process.exit(1);
    }
    
    const csvFile = args[0];
    const importer = new AmmexBulkOrdersDataImporter();
    
    const result = await importer.importBulkOrdersData(csvFile);
    
    if (result.success) {
        console.log('\n🎉 Import completed successfully!');
        
        // Note: Verification is commented out since pool is closed
        // You can run verification separately if needed
        console.log('\n💡 To verify the import, you can run a database query:');
        console.log('   SELECT COUNT(*) FROM bulk_orders;');
        
        process.exit(0);
    } else {
        console.log('\n❌ Import failed!');
        if (result.error) {
            console.log(`Error: ${result.error}`);
        }
        process.exit(1);
    }
}

// Export for use as module
module.exports = { AmmexBulkOrdersDataImporter };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
