const fs = require('fs');
const path = require('path');

// cd my-ammex-website/backend
// node scripts/cleanAmmexBulkOrdersData.js 

class AmmexBulkOrdersDataCleaner {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.cleanedData = [];
        this.monthlyTotals = new Map(); // Map to store monthly aggregations
        this.currentMonth = null;
        this.currentYear = null;
        this.customerOrders = new Map(); // Map to store customer orders by month
    }

    /**
     * Main function to clean Ammex bulk orders CSV data
     * @param {string} inputFilePath - Path to CSV file
     * @param {string} outputFilePath - Path for cleaned CSV output
     */
    async cleanCSVData(inputFilePath, outputFilePath) {
        try {
            console.log(`🧹 Starting bulk orders data cleaning...`);
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
                    this.processBulkOrderRow(trimmedLine, lineNumber);
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
        return upperLine.includes('CUSTOMER NAME') && 
               upperLine.includes('ORDER AMOUNT') && 
               upperLine.includes('MODEL NO');
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
     * Process individual bulk order row
     */
    processBulkOrderRow(line, lineNumber) {
        try {
            const values = this.parseCSVLine(line);
            
            if (values.length < 3) {
                this.warnings.push(`Line ${lineNumber}: Insufficient columns (${values.length}), expected 3`);
                return;
            }
            
            const customerName = values[0]?.trim();
            const orderAmountStr = values[1]?.trim();
            const modelNo = values[2]?.trim();
            
            // Skip empty rows
            if (!customerName && !orderAmountStr && !modelNo) {
                return;
            }
            
            // Parse and validate order amount
            const orderAmount = this.parseAmount(orderAmountStr, lineNumber);
            if (orderAmount === null || orderAmount <= 0) {
                return;
            }
            
            // Clean customer name
            const cleanedCustomerName = this.cleanCustomerName(customerName);
            if (!cleanedCustomerName) {
                this.warnings.push(`Line ${lineNumber}: Empty customer name`);
                return;
            }
            
            // Clean model number
            const cleanedModelNo = this.cleanModelNumber(modelNo);
            
            // Store the order data
            const monthKey = `${this.currentMonth}_${this.currentYear}`;
            if (!this.customerOrders.has(monthKey)) {
                this.customerOrders.set(monthKey, []);
            }
            
            this.customerOrders.get(monthKey).push({
                customer_name: cleanedCustomerName,
                order_amount: orderAmount,
                model_no: cleanedModelNo,
                month: this.currentMonth,
                year: this.currentYear,
                line_number: lineNumber
            });
            
        } catch (error) {
            this.errors.push(`Line ${lineNumber}: ${error.message}`);
        }
    }

    /**
     * Parse order amount from string
     */
    parseAmount(amountStr, lineNumber) {
        if (!amountStr) {
            return null;
        }
        
        try {
            // Remove quotes, commas, and extra spaces
            let cleanedAmount = amountStr.replace(/["',]/g, '').trim();
            
            // Handle empty or invalid amounts
            if (!cleanedAmount || cleanedAmount === '' || cleanedAmount === '-') {
                return null;
            }
            
            const amount = parseFloat(cleanedAmount);
            if (isNaN(amount) || amount <= 0) {
                this.warnings.push(`Line ${lineNumber}: Invalid amount "${amountStr}" -> ${amount}`);
                return null;
            }
            
            return amount;
            
        } catch (error) {
            this.errors.push(`Line ${lineNumber}: Error parsing amount "${amountStr}": ${error.message}`);
            return null;
        }
    }

    /**
     * Clean customer name
     */
    cleanCustomerName(customerName) {
        if (!customerName) return '';
        
        return customerName.trim().replace(/\s+/g, ' ').toUpperCase();
    }

    /**
     * Clean model number
     */
    cleanModelNumber(modelNo) {
        if (!modelNo) return '';
        
        return modelNo.trim().replace(/\s+/g, ' ').toUpperCase();
    }

    /**
     * Generate cleaned data with individual customer records
     */
    generateCleanedData() {
        console.log(`📊 Generating cleaned data...`);
        
        for (const [monthKey, orders] of this.customerOrders) {
            const [month, year] = monthKey.split('_');
            
            // Get month start date (first day of month)
            const monthIndex = this.getMonthIndex(month);
            const monthStart = new Date(parseInt(year), monthIndex, 1);
            
            // Format date as YYYY-MM-DD (first day of month)
            const monthStartStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
            
            // Add each individual order to cleaned data
            for (const order of orders) {
                this.cleanedData.push({
                    customer_name: order.customer_name,
                    bulk_orders_amount: order.order_amount,
                    model_no: order.model_no,
                    month_start: monthStartStr,
                    month_name: month,
                    year: parseInt(year)
                });
            }
            
            // Calculate monthly totals for summary
            const totalAmount = orders.reduce((sum, order) => sum + order.order_amount, 0);
            const totalOrders = orders.length;
            const uniqueCustomers = new Set(orders.map(order => order.customer_name)).size;
            
            this.monthlyTotals.set(monthKey, {
                totalAmount,
                totalOrders,
                uniqueCustomers
            });
        }
        
        // Sort by month start date, then by customer name
        this.cleanedData.sort((a, b) => {
            const dateCompare = new Date(a.month_start) - new Date(b.month_start);
            if (dateCompare !== 0) return dateCompare;
            return a.customer_name.localeCompare(b.customer_name);
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
            'customer_name',
            'bulk_orders_amount',
            'model_no',
            'month_start'
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
        console.log('\n📋 BULK ORDERS DATA CLEANING SUMMARY');
        console.log('=====================================');
        
        console.log(`\n📊 Monthly Summary:`);
        console.log('Month'.padEnd(12) + 'Orders'.padEnd(8) + 'Amount'.padEnd(15) + 'Customers');
        console.log('-'.repeat(50));
        
        let grandTotalOrders = 0;
        let grandTotalAmount = 0;
        
        for (const [monthKey, totals] of this.monthlyTotals) {
            const [month, year] = monthKey.split('_');
            const monthDisplay = month.substring(0, 3).padEnd(12);
            const ordersDisplay = totals.totalOrders.toString().padEnd(8);
            const amountDisplay = `$${totals.totalAmount.toLocaleString()}`.padEnd(15);
            const customersDisplay = totals.uniqueCustomers.toString();
            
            console.log(`${monthDisplay}${ordersDisplay}${amountDisplay}${customersDisplay}`);
            
            grandTotalOrders += totals.totalOrders;
            grandTotalAmount += totals.totalAmount;
        }
        
        console.log('-'.repeat(50));
        console.log(`TOTAL`.padEnd(12) + `${grandTotalOrders}`.padEnd(8) + `$${grandTotalAmount.toLocaleString()}`.padEnd(15));
        
        console.log(`\n📈 Statistics:`);
        console.log(`• Total months processed: ${this.monthlyTotals.size}`);
        console.log(`• Total orders: ${grandTotalOrders}`);
        console.log(`• Total amount: $${grandTotalAmount.toLocaleString()}`);
        console.log(`• Average order value: $${grandTotalAmount > 0 ? (grandTotalAmount / grandTotalOrders).toLocaleString() : '0'}`);
        
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
   node cleanAmmexBulkOrdersData.js <input_csv_file> [output_csv_file]

📝 EXAMPLES:
   node cleanAmmexBulkOrdersData.js "2021-DATA-BULK-ORDERS - Sheet1.csv"
   node cleanAmmexBulkOrdersData.js "2021-DATA-BULK-ORDERS - Sheet1.csv" cleaned_bulk_orders_data.csv

📋 EXPECTED CSV FORMAT:
   - Month headers: "JANUARY", "FEBRUARY", etc.
   - Column headers: "Customer Name,Order Amount,Model No."
   - Data rows: Customer names, quoted amounts, model numbers
   
🔧 WHAT THIS SCRIPT DOES:
   - Processes individual bulk orders by customer
   - Converts to customer_name, bulk_orders_amount, model_no, month_start format
   - Ready for import to bulk_orders table
        `);
        process.exit(1);
    }
    
    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.[^/.]+$/, '_cleaned.csv');
    
    const cleaner = new AmmexBulkOrdersDataCleaner();
    const result = await cleaner.cleanCSVData(inputFile, outputFile);
    
    if (result.success) {
        console.log('\n🎉 Bulk orders data cleaning completed successfully!');
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
module.exports = { AmmexBulkOrdersDataCleaner };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
