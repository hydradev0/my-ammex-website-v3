const fs = require('fs');
const path = require('path');

// cd my-ammex-website/backend
// node scripts/cleanAmmexItemsData.js "C:\Users\Mike\Downloads\2023-DATA-ITEMS-FOR-FORECASTING - Sheet1.csv"

class AmmexItemsDataCleaner {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.cleanedData = [];
        this.currentMonth = null;
        this.currentYear = null;
        this.monthlyProducts = new Map(); // Map to store products by month
    }

    /**
     * Main function to clean Ammex items CSV data
     * @param {string} inputFilePath - Path to CSV file
     * @param {string} outputFilePath - Path for cleaned CSV output
     */
    async cleanCSVData(inputFilePath, outputFilePath) {
        try {
            console.log(`🧹 Starting items data cleaning...`);
            console.log(`📁 Input file: ${inputFilePath}`);
            console.log(`📁 Output file: ${outputFilePath}`);
            
            // Read and process the file
            const content = fs.readFileSync(inputFilePath, 'utf8');
            const lines = content.split('\n');
            
            // Detect year from filename or content
            this.detectYear(inputFilePath, content);
            
            console.log(`📅 Detected year: ${this.currentYear}`);
            
            let lineNumber = 0;
            let inDataSection = false;
            
            for (const line of lines) {
                lineNumber++;
                const trimmedLine = line.trim();
                
                // Skip empty lines
                if (!trimmedLine) {
                    continue;
                }
                
                // Check if this is a month header
                if (this.isMonthHeader(trimmedLine)) {
                    this.currentMonth = this.parseMonthHeader(trimmedLine);
                    inDataSection = false;
                    console.log(`📅 Processing ${this.currentMonth} ${this.currentYear}`);
                    continue;
                }
                
                // Check if this is a column header row
                if (this.isColumnHeader(trimmedLine)) {
                    inDataSection = true;
                    continue;
                }
                
                // Process data rows
                if (inDataSection && this.currentMonth) {
                    this.processItemRow(trimmedLine, lineNumber);
                }
            }
            
            // Generate cleaned data
            this.generateCleanedData();
            
            // Write cleaned data to output file
            this.writeCleanedData(outputFilePath);
            
            // Print summary
            this.printSummary();
            
            return {
                success: true,
                errors: this.errors,
                warnings: this.warnings,
                recordsProcessed: this.cleanedData.length
            };
            
        } catch (error) {
            console.error('❌ Error during data cleaning:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Detect year from filename or content
     */
    detectYear(inputFilePath, content) {
        // Try to extract year from filename first
        const filename = path.basename(inputFilePath);
        const yearMatch = filename.match(/(\d{4})/);
        if (yearMatch) {
            this.currentYear = parseInt(yearMatch[1]);
            return;
        }
        
        // Try to extract from content
        const contentYearMatch = content.match(/(\d{4})/);
        if (contentYearMatch) {
            this.currentYear = parseInt(contentYearMatch[1]);
            return;
        }
        
        // Default to current year if not found
        this.currentYear = new Date().getFullYear();
        console.log(`⚠️  Could not detect year, defaulting to ${this.currentYear}`);
    }

    /**
     * Check if line is a month header
     */
    isMonthHeader(line) {
        const monthNames = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        
        const upperLine = line.toUpperCase();
        return monthNames.some(month => upperLine === month || upperLine.startsWith(month));
    }

    /**
     * Parse month header to get month name
     */
    parseMonthHeader(line) {
        const monthNames = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        
        const upperLine = line.toUpperCase();
        for (const month of monthNames) {
            if (upperLine === month || upperLine.startsWith(month)) {
                return month;
            }
        }
        
        return 'UNKNOWN';
    }

    /**
     * Check if line is a column header
     */
    isColumnHeader(line) {
        const upperLine = line.toUpperCase();
        return upperLine.includes('MODEL NO') && upperLine.includes('CATEGORY');
    }

    /**
     * Parse CSV line into values
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
     * Process individual item row
     */
    processItemRow(line, lineNumber) {
        try {
            const values = this.parseCSVLine(line);
            
            if (values.length < 2) {
                this.warnings.push(`Line ${lineNumber}: Insufficient columns (${values.length}), expected 2`);
                return;
            }
            
            const modelNo = values[0]?.trim();
            const categoryName = values[1]?.trim();
            
            // Skip empty rows
            if (!modelNo && !categoryName) {
                return;
            }
            
            // Clean model number
            const cleanedModelNo = this.cleanModelNumber(modelNo);
            if (!cleanedModelNo) {
                this.warnings.push(`Line ${lineNumber}: Empty model number`);
                return;
            }
            
            // Clean category name
            const cleanedCategoryName = this.cleanCategoryName(categoryName);
            if (!cleanedCategoryName) {
                this.warnings.push(`Line ${lineNumber}: Empty category name`);
                return;
            }
            
            // Store the item data
            const monthKey = `${this.currentMonth}_${this.currentYear}`;
            if (!this.monthlyProducts.has(monthKey)) {
                this.monthlyProducts.set(monthKey, []);
            }
            
            this.monthlyProducts.get(monthKey).push({
                model_no: cleanedModelNo,
                category_name: cleanedCategoryName,
                month: this.currentMonth,
                year: this.currentYear,
                line_number: lineNumber
            });
            
        } catch (error) {
            this.errors.push(`Line ${lineNumber}: ${error.message}`);
        }
    }

    /**
     * Clean model number
     */
    cleanModelNumber(modelNo) {
        if (!modelNo) return '';
        
        return modelNo.trim().replace(/\s+/g, ' ').toUpperCase();
    }

    /**
     * Clean category name
     */
    cleanCategoryName(categoryName) {
        if (!categoryName) return '';
        
        return categoryName.trim().replace(/\s+/g, ' ');
    }

    /**
     * Generate cleaned data with individual product records
     */
    generateCleanedData() {
        console.log(`📊 Generating cleaned data...`);
        
        for (const [monthKey, products] of this.monthlyProducts) {
            const [month, year] = monthKey.split('_');
            
            // Get month start date (first day of month)
            const monthIndex = this.getMonthIndex(month);
            const monthStart = new Date(parseInt(year), monthIndex, 1);
            
            // Format date as YYYY-MM-DD (first day of month)
            const monthStartStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
            
            // Add each individual product to cleaned data
            for (const product of products) {
                this.cleanedData.push({
                    month_start: monthStartStr,
                    model_no: product.model_no,
                    category_name: product.category_name,
                    month_name: month,
                    year: parseInt(year)
                });
            }
        }
        
        // Sort by month start date, then by model number
        this.cleanedData.sort((a, b) => {
            const dateCompare = new Date(a.month_start) - new Date(b.month_start);
            if (dateCompare !== 0) return dateCompare;
            return a.model_no.localeCompare(b.model_no);
        });
    }

    /**
     * Get month index (0-based)
     */
    getMonthIndex(monthName) {
        const months = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        return months.indexOf(monthName);
    }

    /**
     * Write cleaned data to CSV file
     */
    writeCleanedData(outputFilePath) {
        const headers = [
            'month_start',
            'model_no',
            'category_name'
        ];
        
        const csvContent = [
            headers.join(','),
            ...this.cleanedData.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' ? `"${value}"` : value;
                }).join(',')
            )
        ].join('\n');
        
        fs.writeFileSync(outputFilePath, csvContent, 'utf8');
        console.log(`💾 Cleaned data written to: ${outputFilePath}`);
    }

    /**
     * Print cleaning summary
     */
    printSummary() {
        console.log('\n📋 ITEMS DATA CLEANING SUMMARY');
        console.log('================================');
        
        console.log(`\n📊 Monthly Summary:`);
        console.log('Month'.padEnd(12) + 'Products');
        console.log('-'.repeat(20));
        
        let grandTotalProducts = 0;
        
        for (const [monthKey, products] of this.monthlyProducts) {
            const [month, year] = monthKey.split('_');
            const monthDisplay = month.substring(0, 3).padEnd(12);
            const productsDisplay = products.length.toString();
            
            console.log(`${monthDisplay}${productsDisplay}`);
            
            grandTotalProducts += products.length;
        }
        
        console.log('-'.repeat(20));
        console.log(`TOTAL`.padEnd(12) + `${grandTotalProducts}`);
        
        // Count unique products and categories
        const uniqueModels = new Set(this.cleanedData.map(item => item.model_no)).size;
        const uniqueCategories = new Set(this.cleanedData.map(item => item.category_name)).size;
        
        console.log(`\n📈 Statistics:`);
        console.log(`• Total months processed: ${this.monthlyProducts.size}`);
        console.log(`• Total product records: ${grandTotalProducts}`);
        console.log(`• Unique model numbers: ${uniqueModels}`);
        console.log(`• Unique categories: ${uniqueCategories}`);
        
        if (this.errors.length > 0) {
            console.log(`\n❌ Errors (${this.errors.length}):`);
            this.errors.forEach(error => console.log(`   • ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
            this.warnings.slice(0, 10).forEach(warning => console.log(`   • ${warning}`));
            if (this.warnings.length > 10) {
                console.log(`   ... and ${this.warnings.length - 10} more warnings`);
            }
        }
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('\n✅ No errors or warnings found!');
        }
        
        console.log(`\n💾 Output file contains ${this.cleanedData.length} records ready for import.`);
    }
}

// CLI usage
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log(`
📖 USAGE:
   node cleanAmmexItemsData.js <input_csv_file> [output_csv_file]

📝 EXAMPLES:
   node cleanAmmexItemsData.js "2023-DATA-ITEMS-FOR-FORECASTING - Sheet1.csv"
   node cleanAmmexItemsData.js "2023-DATA-ITEMS-FOR-FORECASTING - Sheet1.csv" cleaned_items_data.csv

📋 EXPECTED CSV FORMAT:
   - Month headers: "JANUARY", "FEBRUARY", etc.
   - Column headers: "Model No.,Category"
   - Data rows: Model numbers and categories
   
🔧 WHAT THIS SCRIPT DOES:
   - Processes items data by month
   - Converts to month_start, model_no, category_name format
   - Ready for import to sales_fact_monthly_by_product table
        `);
        process.exit(1);
    }
    
    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.[^/.]+$/, '_cleaned.csv');
    
    const cleaner = new AmmexItemsDataCleaner();
    const result = await cleaner.cleanCSVData(inputFile, outputFile);
    
    if (result.success) {
        console.log('\n🎉 Items data cleaning completed successfully!');
        if (result.errors.length === 0) {
            console.log('✅ No errors found. Data is ready for import.');
        } else {
            console.log('⚠️  Please review and fix errors before importing.');
        }
    } else {
        console.log('\n❌ Data cleaning failed!');
        console.log(`Error: ${result.error}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { AmmexItemsDataCleaner };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
