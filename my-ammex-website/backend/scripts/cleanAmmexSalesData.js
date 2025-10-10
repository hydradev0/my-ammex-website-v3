const fs = require('fs');
const path = require('path');

/**
 * Specialized CSV Data Cleaning Script for Ammex Sales Data
 * 
 * This script is designed specifically for the Ammex sales CSV format:
 * - DATE column contains day numbers (1-31)
 * - TOTAL AMOUNT column contains daily sales amounts
 * - Data needs to be aggregated by month to create monthly totals
 * 
 * Output: month_start and total_revenue columns for sales_fact_monthly table
 */

class AmmexSalesDataCleaner {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.cleanedData = [];
        this.monthlyTotals = new Map(); // Map to store monthly aggregations
        this.currentMonth = null;
        this.currentYear = null;
        this.currentDay = null; // Track current day for rows without dates
    }

    /**
     * Main function to clean Ammex sales CSV data
     * @param {string} inputFilePath - Path to CSV file
     * @param {string} outputFilePath - Path for cleaned CSV output
     */
    async cleanCSVData(inputFilePath, outputFilePath = null) {
        try {
            console.log('🧹 Starting Ammex sales data cleaning process...');
            
            // Read CSV file
            const rawData = this.readCSVFile(inputFilePath);
            console.log(`📊 Found ${rawData.length} rows in CSV file`);
            
            // Process each row and aggregate by month
            rawData.forEach((row, index) => {
                try {
                    this.processRow(row, index + 2); // +2 because CSV rows start from 1 and we skip header
                } catch (error) {
                    this.errors.push(`Row ${index + 2}: ${error.message}`);
                }
            });
            
            // Convert monthly totals to cleaned data format
            this.convertMonthlyTotalsToCleanedData();
            
            // Validate cleaned data
            this.validateCleanedData();
            
            // Generate output
            if (outputFilePath) {
                this.generateCleanedCSV(outputFilePath);
            }
            
            this.printSummary();
            
            return {
                success: true,
                cleanedData: this.cleanedData,
                errors: this.errors,
                warnings: this.warnings
            };
            
        } catch (error) {
            console.error('❌ Error during cleaning process:', error.message);
            return {
                success: false,
                error: error.message,
                errors: this.errors,
                warnings: this.warnings
            };
        }
    }

    /**
     * Read CSV file and convert to array of objects
     */
    readCSVFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n');
            
            if (lines.length < 3) {
                throw new Error('CSV file must have at least a header row and one data row');
            }
            
            // Skip the first line (month header) and parse from the second line (column headers)
            const headerLine = lines[1];
            const headers = this.parseCSVLine(headerLine);
            
            // Parse data rows starting from line 3
            const data = lines.slice(2).map((line, index) => {
                const values = this.parseCSVLine(line);
                if (values.length !== headers.length) {
                    console.warn(`Row ${index + 3}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
                }
                
                const row = {};
                headers.forEach((header, i) => {
                    row[header] = values[i] || '';
                });
                return row;
            });
            
            return data;
        } catch (error) {
            throw new Error(`Failed to read CSV file: ${error.message}`);
        }
    }

    /**
     * Parse CSV line (handle quoted values)
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add last field
        values.push(current.trim());
        
        return values;
    }

    /**
     * Process individual data row
     */
    processRow(row, rowNumber) {
        // Check if this is a month header row
        const dateValue = row['DATE'];
        const totalAmountValue = row['TOTAL AMOUNT'];
        
        // Check if this is a month header (like "SALES MONTH OF FEBRUARY 2022")
        if (dateValue && dateValue.includes('MONTH OF')) {
            this.parseMonthHeader(dateValue, rowNumber);
            return;
        }
        
        // Skip empty rows
        if (!dateValue && !totalAmountValue) {
            return;
        }
        
        // Skip header rows
        if (dateValue === 'DATE' || totalAmountValue === 'TOTAL AMOUNT') {
            return;
        }
        
        // Parse amount first
        const amount = this.parseAmount(totalAmountValue, rowNumber);
        if (amount === null || amount === 0) {
            return; // Skip zero or invalid amounts
        }
        
        // Check if this is a summary/total row (very large amounts that are likely monthly totals)
        // These rows typically have no company name and very large amounts
        const companyName = row['COMPANY'];
        if (!companyName || companyName.trim() === '') {
            // This is likely a summary row - skip it
            console.log(`⏭️  Skipping summary row at ${rowNumber}: $${amount.toLocaleString()}`);
            return;
        }
        
        // Determine day number - use current day if no date provided
        let dayNumber;
        if (dateValue && dateValue.trim() !== '') {
            // Parse date (day number)
            dayNumber = this.parseDayNumber(dateValue, rowNumber);
            if (dayNumber === null) {
                return; // Skip invalid dates
            }
            // Update current day for subsequent rows without dates
            this.currentDay = dayNumber;
        } else {
            // No date provided, use the current day (from previous row)
            if (this.currentDay === null) {
                this.warnings.push(`Row ${rowNumber}: No date provided and no previous day to inherit from`);
                return;
            }
            dayNumber = this.currentDay;
        }
        
        // Create date for this row
        const date = new Date(this.currentYear, this.currentMonth, dayNumber);
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        
        // Add to monthly total
        if (!this.monthlyTotals.has(monthKey)) {
            this.monthlyTotals.set(monthKey, {
                year: this.currentYear,
                month: this.currentMonth,
                totalAmount: 0,
                dayCount: 0,
                days: []
            });
        }
        
        const monthData = this.monthlyTotals.get(monthKey);
        monthData.totalAmount += amount;
        monthData.dayCount += 1;
        monthData.days.push({ day: dayNumber, amount: amount });
        
        console.log(`📅 Day ${dayNumber}: $${amount.toLocaleString()} -> Month ${monthKey}`);
    }

    /**
     * Parse month header to update current month and year
     */
    parseMonthHeader(headerText, rowNumber) {
        const monthMatch = headerText.match(/MONTH OF (\w+)\.? (\d{4})/i);
        
        if (monthMatch) {
            const monthName = monthMatch[1].toLowerCase().replace('.', ''); // Remove trailing dot
            const year = parseInt(monthMatch[2]);
            
            const monthMap = {
                'january': 0, 'jan': 0,
                'february': 1, 'feb': 1,
                'march': 2, 'mar': 2,
                'april': 3, 'apr': 3,
                'may': 4,
                'june': 5, 'jun': 5,
                'july': 6, 'jul': 6,
                'august': 7, 'aug': 7,
                'september': 8, 'sep': 8, 'sept': 8,
                'october': 9, 'oct': 9,
                'november': 10, 'nov': 10,
                'december': 11, 'dec': 11
            };
            
            const month = monthMap[monthName];
            if (month !== undefined) {
                this.currentMonth = month;
                this.currentYear = year;
                this.currentDay = null; // Reset current day for new month
                console.log(`\n📅 Processing: ${monthName.toUpperCase()} ${year}`);
                return;
            }
        }
        
        this.warnings.push(`Could not parse month header in row ${rowNumber}: ${headerText}`);
    }

    /**
     * Parse day number from DATE column
     */
    parseDayNumber(dateValue, rowNumber) {
        if (!dateValue || dateValue.trim() === '') {
            return null;
        }
        
        const day = parseInt(dateValue.trim());
        
        if (isNaN(day) || day < 1 || day > 31) {
            this.warnings.push(`Invalid day number in row ${rowNumber}: ${dateValue}`);
            return null;
        }
        
        return day;
    }

    /**
     * Parse amount from TOTAL AMOUNT column
     */
    parseAmount(amountValue, rowNumber) {
        if (!amountValue || amountValue.trim() === '') {
            return null;
        }
        
        try {
            let str = amountValue.toString().trim();
            
            // Remove common currency symbols and formatting
            str = str.replace(/[$€£¥₹,]/g, ''); // Remove currency symbols and commas
            str = str.replace(/\s/g, ''); // Remove spaces
            str = str.replace(/\(([^)]+)\)/g, '-$1'); // Convert (100) to -100
            
            const amount = parseFloat(str);
            
            if (isNaN(amount)) {
                this.warnings.push(`Invalid amount in row ${rowNumber}: ${amountValue}`);
                return null;
            }
            
            return Math.round(amount * 100) / 100; // Round to 2 decimal places
            
        } catch (error) {
            this.warnings.push(`Error parsing amount in row ${rowNumber}: ${amountValue}`);
            return null;
        }
    }

    /**
     * Convert monthly totals to cleaned data format
     */
    convertMonthlyTotalsToCleanedData() {
        console.log('\n📊 Converting monthly totals to cleaned data...');
        
        for (const [monthKey, monthData] of this.monthlyTotals.entries()) {
            // Create month_start date (first day of month)
            const monthStart = new Date(monthData.year, monthData.month, 1);
            const monthStartStr = monthStart.getFullYear() + '-' + 
                                 String(monthStart.getMonth() + 1).padStart(2, '0') + '-' + 
                                 String(monthStart.getDate()).padStart(2, '0');
            
            const cleanedRow = {
                month_start: monthStartStr,
                total_revenue: Math.round(monthData.totalAmount * 100) / 100, // Round to 2 decimal places
                total_orders: 0, // Not available in source data
                total_units: 0, // Not available in source data
                avg_order_value: 0, // Not available in source data
                new_customers: 0 // Not available in source data
            };
            
            this.cleanedData.push(cleanedRow);
            
            console.log(`✅ ${monthKey}: $${monthData.totalAmount.toLocaleString()} (${monthData.dayCount} days)`);
        }
        
        // Sort by month_start
        this.cleanedData.sort((a, b) => new Date(a.month_start) - new Date(b.month_start));
    }

    /**
     * Detect month and year from the CSV content
     */
    detectMonthAndYear(content) {
        // Look for month header like "SALES MONTH OF JANUARY 2022"
        const monthMatch = content.match(/MONTH OF (\w+) (\d{4})/i);
        
        if (monthMatch) {
            const monthName = monthMatch[1].toLowerCase();
            const year = parseInt(monthMatch[2]);
            
            const monthMap = {
                'january': 0, 'jan': 0,
                'february': 1, 'feb': 1,
                'march': 2, 'mar': 2,
                'april': 3, 'apr': 3,
                'may': 4,
                'june': 5, 'jun': 5,
                'july': 6, 'jul': 6,
                'august': 7, 'aug': 7,
                'september': 8, 'sep': 8,
                'october': 9, 'oct': 9,
                'november': 10, 'nov': 10,
                'december': 11, 'dec': 11
            };
            
            const month = monthMap[monthName];
            if (month !== undefined) {
                this.currentMonth = month;
                this.currentYear = year;
                console.log(`📅 Detected: ${monthName.toUpperCase()} ${year}`);
                return;
            }
        }
        
        // If no month detected, use current date as fallback
        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();
        this.warnings.push('Could not detect month/year from CSV, using current date as fallback');
        console.log(`⚠️  Using fallback: ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
    }

    /**
     * Validate cleaned data
     */
    validateCleanedData() {
        console.log('\n🔍 Validating cleaned data...');
        
        const monthStarts = new Set();
        
        this.cleanedData.forEach((row, index) => {
            // Check for duplicate month_start
            if (monthStarts.has(row.month_start)) {
                this.errors.push(`Duplicate month_start found: ${row.month_start}`);
            } else {
                monthStarts.add(row.month_start);
            }
            
            // Validate month_start format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(row.month_start)) {
                this.errors.push(`Invalid month_start format: ${row.month_start}`);
            }
            
            // Validate total_revenue
            if (typeof row.total_revenue !== 'number' || isNaN(row.total_revenue) || row.total_revenue < 0) {
                this.errors.push(`Invalid total_revenue: ${row.total_revenue}`);
            }
        });
        
        console.log(`✅ Validation complete. Found ${this.errors.length} errors and ${this.warnings.length} warnings.`);
    }

    /**
     * Generate cleaned CSV file
     */
    generateCleanedCSV(outputFilePath) {
        try {
            const csvContent = this.arrayToCSV(this.cleanedData);
            fs.writeFileSync(outputFilePath, csvContent, 'utf8');
            console.log(`📄 Cleaned data saved to: ${outputFilePath}`);
        } catch (error) {
            throw new Error(`Failed to generate CSV: ${error.message}`);
        }
    }

    /**
     * Convert array of objects to CSV format
     */
    arrayToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Escape commas and quotes in values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    /**
     * Print cleaning summary
     */
    printSummary() {
        console.log('\n📋 CLEANING SUMMARY');
        console.log('==================');
        console.log(`✅ Successfully cleaned: ${this.cleanedData.length} months`);
        console.log(`📊 Total monthly records: ${this.monthlyTotals.size}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        console.log(`❌ Errors: ${this.errors.length}`);
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (this.cleanedData.length > 0) {
            console.log('\n📊 CLEANED DATA:');
            console.table(this.cleanedData);
        }
    }
}

// CLI usage
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log(`
📖 USAGE:
   node cleanAmmexSalesData.js <input_csv_file> [output_csv_file]

📝 EXAMPLES:
   node cleanAmmexSalesData.js "AMMEX FILE.xlsx - SALES 2022.csv"
   node cleanAmmexSalesData.js "AMMEX FILE.xlsx - SALES 2022.csv" cleaned_sales_data.csv

📋 EXPECTED CSV FORMAT:
   - First line: "MONTH OF JANUARY 2022" (month/year detection)
   - Second line: Column headers including "DATE" and "TOTAL AMOUNT"
   - Data rows: Day numbers in DATE column, amounts in TOTAL AMOUNT column
   
🔧 WHAT THIS SCRIPT DOES:
   - Aggregates daily sales by month
   - Converts to month_start (first day of month) and total_revenue format
   - Ready for import to sales_fact_monthly table
        `);
        process.exit(1);
    }
    
    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.[^/.]+$/, '_cleaned.csv');
    
    const cleaner = new AmmexSalesDataCleaner();
    
    // Detect month and year from file content
    const content = fs.readFileSync(inputFile, 'utf8');
    cleaner.detectMonthAndYear(content);
    
    const result = await cleaner.cleanCSVData(inputFile, outputFile);
    
    if (result.success) {
        console.log('\n🎉 Data cleaning completed successfully!');
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
module.exports = { AmmexSalesDataCleaner };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
