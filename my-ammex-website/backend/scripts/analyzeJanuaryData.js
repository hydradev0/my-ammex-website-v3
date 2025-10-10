const fs = require('fs');

/**
 * Quick analysis script to understand the January 2022 data structure
 */

function analyzeJanuaryData() {
    try {
        const content = fs.readFileSync('C:\\Users\\Mike\\Downloads\\AMMEX FILE.xlsx - SALES 2022.csv', 'utf8');
        const lines = content.trim().split('\n');
        
        console.log('🔍 Analyzing January 2022 data...');
        
        let inJanuary = false;
        let totalAmount = 0;
        let dayTotals = new Map();
        let processedRows = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const rowNumber = i + 1;
            
            // Check if we're entering January
            if (line.includes('MONTH OF JANUARY 2022')) {
                inJanuary = true;
                console.log(`📅 Found January header at row ${rowNumber}`);
                continue;
            }
            
            // Check if we're leaving January (next month)
            if (inJanuary && line.includes('MONTH OF FEBRUARY 2022')) {
                console.log(`📅 Found February header at row ${rowNumber} - ending January analysis`);
                break;
            }
            
            if (!inJanuary) continue;
            
            // Skip header row
            if (line.includes('DATE,SI#,COMPANY,LOCAL SALES,STOCK,TOTAL AMOUNT')) {
                console.log(`📋 Found header row at ${rowNumber}`);
                continue;
            }
            
            // Parse CSV line
            const values = parseCSVLine(line);
            if (values.length < 6) continue;
            
            const date = values[0];
            const totalAmountValue = values[5];
            
            // Skip empty rows
            if (!date && !totalAmountValue) continue;
            
            // Parse amount
            const amount = parseAmount(totalAmountValue);
            if (amount === null || amount === 0) continue;
            
            // Parse day
            const day = parseInt(date);
            if (isNaN(day) || day < 1 || day > 31) continue;
            
            processedRows++;
            totalAmount += amount;
            
            // Track by day
            if (!dayTotals.has(day)) {
                dayTotals.set(day, { count: 0, total: 0, amounts: [] });
            }
            
            const dayData = dayTotals.get(day);
            dayData.count++;
            dayData.total += amount;
            dayData.amounts.push(amount);
            
            console.log(`Row ${rowNumber}: Day ${day} - $${amount.toLocaleString()} (Total: $${totalAmount.toLocaleString()})`);
        }
        
        console.log('\n📊 JANUARY 2022 ANALYSIS SUMMARY:');
        console.log('==================================');
        console.log(`✅ Processed ${processedRows} valid rows`);
        console.log(`💰 Total Amount: $${totalAmount.toLocaleString()}`);
        console.log(`📅 Days with sales: ${dayTotals.size}`);
        
        console.log('\n📅 Daily Breakdown:');
        const sortedDays = Array.from(dayTotals.entries()).sort((a, b) => a[0] - b[0]);
        for (const [day, data] of sortedDays) {
            console.log(`   Day ${day}: ${data.count} transactions, $${data.total.toLocaleString()}`);
        }
        
        // Compare with our script result
        console.log('\n🔍 COMPARISON:');
        console.log(`Our script result: $1,389,024.19`);
        console.log(`Your expected: $2,229,298.06`);
        console.log(`This analysis: $${totalAmount.toLocaleString()}`);
        console.log(`Difference: $${(2229298.06 - totalAmount).toLocaleString()}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
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

function parseAmount(amountValue) {
    if (!amountValue || amountValue.trim() === '') {
        return null;
    }
    
    try {
        let str = amountValue.toString().trim();
        str = str.replace(/[$€£¥₹,]/g, '');
        str = str.replace(/\s/g, '');
        str = str.replace(/\(([^)]+)\)/g, '-$1');
        
        const amount = parseFloat(str);
        
        if (isNaN(amount)) {
            return null;
        }
        
        return Math.round(amount * 100) / 100;
    } catch (error) {
        return null;
    }
}

analyzeJanuaryData();
