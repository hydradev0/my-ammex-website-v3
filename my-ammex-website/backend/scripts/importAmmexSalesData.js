const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// cd my-ammex-website/backend
// node scripts/importAmmexSalesData.js ammex_sales_2022_cleaned_corrected.csv

class AmmexSalesDataImporter {
    constructor() {
        // Use DATABASE_URL if available, otherwise fall back to individual parameters
        if (process.env.DATABASE_URL) {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
        } else {
            this.dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'ammex_website',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password'
            };
            this.pool = new Pool(this.dbConfig);
        }
        
        this.importedCount = 0;
        this.skippedCount = 0;
        this.errorCount = 0;
        this.errors = [];
    }

    /**
     * Main function to import sales data
     * @param {string} csvFilePath - Path to cleaned CSV file
     */
    async importSalesData(csvFilePath) {
        try {
            console.log('🚀 Starting Ammex sales data import...');
            console.log(`📁 CSV file: ${csvFilePath}`);
            
            // Read and parse CSV data
            const salesData = this.readCSVFile(csvFilePath);
            console.log(`📊 Found ${salesData.length} records to import`);
            
            // Test database connection
            await this.testConnection();
            
            // Import each record
            for (const record of salesData) {
                try {
                    await this.importRecord(record);
                } catch (error) {
                    this.errorCount++;
                    this.errors.push(`Failed to import ${record.month_start}: ${error.message}`);
                    console.error(`❌ Error importing ${record.month_start}:`, error.message);
                }
            }
            
            // Print summary
            this.printSummary();
            
            return {
                success: this.errorCount === 0,
                imported: this.importedCount,
                skipped: this.skippedCount,
                errors: this.errorCount,
                errorDetails: this.errors
            };
            
        } catch (error) {
            console.error('❌ Import failed:', error.message);
            return {
                success: false,
                error: error.message,
                imported: this.importedCount,
                skipped: this.skippedCount,
                errors: this.errorCount,
                errorDetails: this.errors
            };
        } finally {
            // Close database connection
            await this.pool.end();
        }
    }

    /**
     * Test database connection
     */
    async testConnection() {
        try {
            console.log('🔌 Testing database connection...');
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW() as current_time');
            console.log(`✅ Connected to database: ${result.rows[0].current_time}`);
            client.release();
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * Read and parse CSV file
     */
    readCSVFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`CSV file not found: ${filePath}`);
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n');
            
            if (lines.length < 2) {
                throw new Error('CSV file must have at least a header and one data row');
            }
            
            // Parse header
            const headers = lines[0].split(',');
            
            // Parse data rows
            const data = lines.slice(1).map((line, index) => {
                const values = line.split(',');
                if (values.length !== headers.length) {
                    throw new Error(`Row ${index + 2}: Column count mismatch`);
                }
                
                const record = {};
                headers.forEach((header, i) => {
                    record[header] = values[i];
                });
                
                // Validate required fields
                if (!record.month_start || !record.total_revenue) {
                    throw new Error(`Row ${index + 2}: Missing required fields (month_start, total_revenue)`);
                }
                
                return record;
            });
            
            return data;
        } catch (error) {
            throw new Error(`Failed to read CSV file: ${error.message}`);
        }
    }

    /**
     * Import individual record using UPSERT
     */
    async importRecord(record) {
        const client = await this.pool.connect();
        
        try {
            // Validate and convert data
            const monthStart = new Date(record.month_start);
            const totalRevenue = parseFloat(record.total_revenue);
            const totalOrders = parseInt(record.total_orders) || 0;
            const totalUnits = parseInt(record.total_units) || 0;
            const avgOrderValue = parseFloat(record.avg_order_value) || 0;
            const newCustomers = parseInt(record.new_customers) || 0;
            
            // Validate data
            if (isNaN(monthStart.getTime())) {
                throw new Error(`Invalid date: ${record.month_start}`);
            }
            
            if (isNaN(totalRevenue) || totalRevenue < 0) {
                throw new Error(`Invalid total_revenue: ${record.total_revenue}`);
            }
            
            // UPSERT query - insert or update on conflict
            const query = `
                INSERT INTO sales_fact_monthly (
                    month_start,
                    total_revenue,
                    total_orders,
                    total_units,
                    avg_order_value,
                    new_customers,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (month_start) 
                DO UPDATE SET
                    total_revenue = EXCLUDED.total_revenue,
                    total_orders = EXCLUDED.total_orders,
                    total_units = EXCLUDED.total_units,
                    avg_order_value = EXCLUDED.avg_order_value,
                    new_customers = EXCLUDED.new_customers,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING month_start, total_revenue;
            `;
            
            const values = [
                monthStart,
                totalRevenue,
                totalOrders,
                totalUnits,
                avgOrderValue,
                newCustomers
            ];
            
            const result = await client.query(query, values);
            
            if (result.rows.length > 0) {
                this.importedCount++;
                console.log(`✅ Imported/Updated: ${record.month_start} - $${totalRevenue.toLocaleString()}`);
            } else {
                this.skippedCount++;
                console.log(`⏭️  Skipped: ${record.month_start}`);
            }
            
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Print import summary
     */
    printSummary() {
        console.log('\n📋 IMPORT SUMMARY');
        console.log('==================');
        console.log(`✅ Successfully imported/updated: ${this.importedCount} records`);
        console.log(`⏭️  Skipped: ${this.skippedCount} records`);
        console.log(`❌ Errors: ${this.errorCount} records`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERROR DETAILS:');
            this.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (this.errorCount === 0) {
            console.log('\n🎉 Import completed successfully!');
            console.log('📊 Your sales_fact_monthly table has been updated with the new data.');
        } else {
            console.log('\n⚠️  Import completed with errors. Please review and fix the errors above.');
        }
    }

    /**
     * Verify import by querying the database
     */
    async verifyImport() {
        try {
            console.log('\n🔍 Verifying import...');
            const client = await this.pool.connect();
            
            // Get count of records
            const countResult = await client.query('SELECT COUNT(*) as count FROM sales_fact_monthly');
            const totalCount = parseInt(countResult.rows[0].count);
            
            // Get recent records
            const recentResult = await client.query(`
                SELECT month_start, total_revenue, updated_at 
                FROM sales_fact_monthly 
                ORDER BY month_start DESC 
                LIMIT 5
            `);
            
            console.log(`📊 Total records in sales_fact_monthly: ${totalCount}`);
            console.log('\n📅 Recent records:');
            recentResult.rows.forEach(row => {
                console.log(`   ${row.month_start}: $${parseFloat(row.total_revenue).toLocaleString()} (updated: ${row.updated_at})`);
            });
            
            client.release();
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
   node importAmmexSalesData.js <cleaned_csv_file>

📝 EXAMPLES:
   node importAmmexSalesData.js ammex_sales_2022_cleaned.csv
   node importAmmexSalesData.js "C:\\path\\to\\cleaned_sales_data.csv"

🔧 WHAT THIS SCRIPT DOES:
   - Connects to your PostgreSQL database
   - Imports cleaned sales data into sales_fact_monthly table
   - Uses UPSERT to handle duplicate entries safely
   - Verifies the import was successful

📋 EXPECTED CSV FORMAT:
   - Headers: month_start,total_revenue,total_orders,total_units,avg_order_value,new_customers
   - Data: 2022-01-01,1389024.19,0,0,0,0
        `);
        process.exit(1);
    }
    
    const csvFile = args[0];
    const importer = new AmmexSalesDataImporter();
    
    const result = await importer.importSalesData(csvFile);
    
    if (result.success) {
        console.log('\n🎉 Import completed successfully!');
        
        // Verify import
        await importer.verifyImport();
        
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
module.exports = { AmmexSalesDataImporter };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
