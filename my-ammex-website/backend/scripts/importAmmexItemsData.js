const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// cd my-ammex-website/backend
// node scripts/importAmmexItemsData.js "2023-DATA-ITEMS-FOR-FORECASTING - Sheet1_cleaned.csv"

class AmmexItemsDataImporter {
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
     * Main function to import items data
     * @param {string} csvFilePath - Path to cleaned CSV file
     */
    async importItemsData(csvFilePath) {
        try {
            console.log(`📦 Starting items data import...`);
            console.log(`📁 CSV file: ${csvFilePath}`);
            
            // Read CSV file
            const records = this.readCSVFile(csvFilePath);
            console.log(`📊 Found ${records.length} records to import`);
            
            if (records.length === 0) {
                throw new Error('No records found in CSV file');
            }
            
            // Create sales_fact_monthly_by_product table if it doesn't exist
            await this.createItemsTable();
            
            // Import records
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                
                try {
                    await this.importRecord(record, i + 1);
                    successCount++;
                    
                    if (successCount % 10 === 0) {
                        console.log(`✅ Imported ${successCount}/${records.length} records...`);
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
            return {
                success: false,
                error: error.message
            };
        } finally {
            await this.pool.end();
        }
    }

    /**
     * Create sales_fact_monthly_by_product table if it doesn't exist
     */
    async createItemsTable() {
        const client = await this.pool.connect();
        
        try {
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS sales_fact_monthly_by_product (
                    id SERIAL PRIMARY KEY,
                    month_start DATE NOT NULL,
                    model_no VARCHAR(255) NOT NULL,
                    category_name VARCHAR(255) NOT NULL,
                    UNIQUE(month_start, model_no)
                );
                
                CREATE INDEX IF NOT EXISTS idx_sales_fact_monthly_by_product_month_start 
                ON sales_fact_monthly_by_product (month_start);
                
                CREATE INDEX IF NOT EXISTS idx_sales_fact_monthly_by_product_model_no
                ON sales_fact_monthly_by_product (model_no);
                
                CREATE INDEX IF NOT EXISTS idx_sales_fact_monthly_by_product_category_name
                ON sales_fact_monthly_by_product (category_name);
            `;
            
            await client.query(createTableQuery);
            console.log('✅ sales_fact_monthly_by_product table created/verified');
            
        } catch (error) {
            console.error('❌ Error creating sales_fact_monthly_by_product table:', error.message);
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
     * Import individual record using UPSERT
     */
    async importRecord(record, recordNumber) {
        const client = await this.pool.connect();
        
        try {
            // Validate and convert data
            const monthStart = new Date(record.month_start);
            const modelNo = record.model_no?.trim();
            const categoryName = record.category_name?.trim();
            
            // Validate data
            if (isNaN(monthStart.getTime())) {
                throw new Error(`Invalid month_start: ${record.month_start}`);
            }
            
            if (!modelNo) {
                throw new Error('Model number is required');
            }
            
            if (!categoryName) {
                throw new Error('Category name is required');
            }
            
            // INSERT query
            const query = `
                INSERT INTO sales_fact_monthly_by_product (
                    month_start,
                    model_no,
                    category_name
                ) VALUES ($1, $2, $3)
                RETURNING month_start, model_no, category_name;
            `;
            
            const values = [
                monthStart,
                modelNo,
                categoryName
            ];
            
            const result = await client.query(query, values);
            
            if (recordNumber % 20 === 0) {
                console.log(`   📝 Imported: ${modelNo} - ${categoryName} (${monthStart.toISOString().substring(0, 7)})`);
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
            const countResult = await client.query('SELECT COUNT(*) as total FROM sales_fact_monthly_by_product');
            console.log(`📊 Total product records: ${countResult.rows[0].total}`);
            
            // Check by month
            const monthlyResult = await client.query(`
                SELECT 
                    month_start,
                    COUNT(*) as product_count,
                    COUNT(DISTINCT model_no) as unique_models,
                    COUNT(DISTINCT category_name) as unique_categories
                FROM sales_fact_monthly_by_product 
                GROUP BY month_start 
                ORDER BY month_start
            `);
            
            console.log('\n📅 Monthly Summary:');
            console.log('Month'.padEnd(12) + 'Products'.padEnd(10) + 'Models'.padEnd(8) + 'Categories');
            console.log('-'.repeat(45));
            
            monthlyResult.rows.forEach(row => {
                const month = row.month_start.toISOString().substring(0, 7);
                const products = row.product_count.toString().padEnd(10);
                const models = row.unique_models.toString().padEnd(8);
                const categories = row.unique_categories.toString();
                
                console.log(`${month}`.padEnd(12) + `${products}${models}${categories}`);
            });
            
            // Check categories
            const categoryResult = await client.query(`
                SELECT 
                    category_name,
                    COUNT(*) as product_count,
                    COUNT(DISTINCT model_no) as unique_models
                FROM sales_fact_monthly_by_product 
                GROUP BY category_name 
                ORDER BY product_count DESC
            `);
            
            console.log('\n🏷️  Categories Summary:');
            categoryResult.rows.forEach(row => {
                console.log(`• ${row.category_name}: ${row.product_count} records, ${row.unique_models} unique models`);
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
   node importAmmexItemsData.js <cleaned_csv_file>

📝 EXAMPLES:
   node importAmmexItemsData.js "2023-DATA-ITEMS-FOR-FORECASTING - Sheet1_cleaned.csv"
   node importAmmexItemsData.js "C:\\path\\to\\cleaned_items_data.csv"

🔧 WHAT THIS SCRIPT DOES:
   - Connects to your PostgreSQL database
   - Imports cleaned items data into sales_fact_monthly_by_product table
   - Creates table and indexes if they don't exist
   - Uses UPSERT to handle duplicate entries safely

📋 EXPECTED CSV FORMAT:
   - Headers: month_start,model_no,category_name
   - Data: "2023-01-01","G25","Steel Grits"
        `);
        process.exit(1);
    }
    
    const csvFile = args[0];
    const importer = new AmmexItemsDataImporter();
    
    const result = await importer.importItemsData(csvFile);
    
    if (result.success) {
        console.log('\n🎉 Import completed successfully!');
        
        // Note: Verification is commented out since pool is closed
        console.log('\n💡 To verify the import, you can run:');
        console.log('   SELECT COUNT(*) FROM sales_fact_monthly_by_product;');
        
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
module.exports = { AmmexItemsDataImporter };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
