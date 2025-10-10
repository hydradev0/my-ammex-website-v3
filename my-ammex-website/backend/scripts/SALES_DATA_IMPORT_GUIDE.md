# Sales Data Import Guide

This guide will help you clean and import your Excel sales data into the `sales_fact_monthly` table.

## 📋 Prerequisites

1. **Install required packages** (if not already installed):
   ```bash
   npm install xlsx
   ```

2. **Prepare your Excel file** with the following structure:
   - **Date column**: Contains month/year information
   - **Amount column**: Contains total sales amounts (can use "#" for zero values)

## 📊 Expected Excel Format

Your Excel file should have columns like:

| Date | Total Amount | # | Revenue | Sales |
|------|-------------|---|---------|-------|
| 2023-01 | 150000 | | | |
| 2023-02 | # | | | |
| Jan 2023 | | 180000 | | |
| 02/2023 | | | 200000 | |

**Supported column names:**
- **Date**: `date`, `month`, `period`
- **Amount**: `total_amount`, `amount`, `#`, `revenue`, `sales`, `total`

### 🔧 Handling "#" Symbols

If your Excel file has "#" symbols (representing the total amount for that month), the script will:

1. **Detect the "#" symbol** as representing the total amount
2. **Sum all numeric values** in that row (excluding the "#" itself)
3. **Use the calculated sum** as the total revenue for that month
4. **Report the calculation** in the warnings

**Example:**
```
Original Excel:
Date     | Total Amount | Revenue | Sales | Other
2023-01  | 150000       |         |       |
2023-02  | #            | 120000  | 60000 | 0     <- "#" = sum of 120000 + 60000 + 0 = 180000
2023-03  | #            | 80000   | 40000 | 20000 <- "#" = sum of 80000 + 40000 + 20000 = 140000

Cleaned Output:
month_start  | total_revenue
2023-01-01   | 150000.00
2023-02-01   | 180000.00    (sum: 120000 + 60000 + 0)
2023-03-01   | 140000.00    (sum: 80000 + 40000 + 20000)
```

## 🧹 Step 1: Clean Your Excel Data

Run the cleaning script to prepare your data:

```bash
# Navigate to backend directory
cd my-ammex-website/backend

# Clean Excel file (generates cleaned CSV)
node scripts/cleanSalesExcelData.js path/to/your/sales_data.xlsx

# Or specify output file
node scripts/cleanSalesExcelData.js path/to/your/sales_data.xlsx cleaned_sales_data.csv
```

### What the cleaning script does:

1. **Reads Excel file** and converts to standardized format
2. **Handles corrupted "#" symbols** - when "#" appears (due to CSV conversion corruption), looks for the actual total amount in other columns of the same row
3. **Standardizes dates** - converts all date formats to `month_start` (first day of month)
4. **Cleans amounts** - removes currency symbols, handles negative values
5. **Validates data** - checks for duplicates, invalid formats
6. **Generates cleaned CSV** - ready for database import with only 2 columns: `month_start` and `total_revenue`

### Example cleaning output:

```
🧹 Starting Excel data cleaning process...
📊 Found 12 rows in Excel file
🔍 Validating cleaned data...
✅ Validation complete. Found 0 errors and 2 warnings.

📋 CLEANING SUMMARY
==================
✅ Successfully cleaned: 12 rows
⚠️  Warnings: 2
❌ Errors: 0

⚠️  WARNINGS:
   - Summed amounts for '#' in row 3: 120000 from 'Revenue' + 60000 from 'Sales' = 180000
   - Using 'period' as date column (row 2)

📊 SAMPLE CLEANED DATA:
┌─────────────┬──────────────┐
│ month_start │ total_revenue│
├─────────────┼──────────────┤
│ 2023-01-01  │    150000.00 │
│ 2023-02-01  │    180000.00 │
│ 2023-03-01  │    200000.00 │
└─────────────┴──────────────┘

📄 Cleaned data saved to: sales_data_cleaned.csv

🎉 Data cleaning completed successfully!
✅ No errors found. Data is ready for import.
```

## 📥 Step 2: Import to Database

Import the cleaned CSV data to your database:

```bash
# Import cleaned CSV to database
node scripts/importSalesData.js cleaned_sales_data.csv
```

### Example import output:

```
📥 Starting sales data import...
📊 Found 12 rows to import
✅ Inserted: 2023-01-01 - $150,000
🔄 Updated: 2023-02-01 - $0
✅ Inserted: 2023-03-01 - $180,000

📋 IMPORT SUMMARY
=================
✅ Inserted: 10 rows
🔄 Updated: 2 rows
❌ Errors: 0

🎉 Successfully processed 12 rows!

🎉 Import completed successfully!
```

## 🔍 Step 3: Verify Import

Check that your data was imported correctly:

```bash
# Inspect the sales_fact_monthly table
node scripts/inspectSalesFacts.js
```

## 📝 Data Format Requirements

### Date Formats Supported:
- `2023-01` (YYYY-MM)
- `01/2023` (MM/YYYY)
- `Jan 2023` (Month YYYY)
- `2023-01-15` (Full date - will use first day of month)
- `15/01/2023` (DD/MM/YYYY - will use first day of month)

### Amount Formats Supported:
- `150000` (Plain number)
- `$150,000` (Currency with symbols)
- `150000.50` (Decimal)
- `#` (Will be converted to 0)
- `(50000)` (Negative amount in parentheses)

## ⚠️ Common Issues & Solutions

### Issue: "No valid date found"
**Solution**: Make sure your Excel has a column with date information. Supported column names: `date`, `month`, `period`

### Issue: "No valid amount found"
**Solution**: Make sure your Excel has a column with amount information. Supported column names: `total_amount`, `amount`, `#`, `revenue`, `sales`, `total`

### Issue: "Duplicate month_start found"
**Solution**: The cleaning script found duplicate months in your data. Remove duplicates from Excel or the script will skip them.

### Issue: "Invalid date format"
**Solution**: Check that your dates are in a recognizable format. The script supports most common date formats.

### Issue: "Cannot convert to number"
**Solution**: Make sure your amount column contains only numbers, currency symbols, or "#" symbols.

## 🔧 Advanced Usage

### Custom Column Mapping

If your Excel has different column names, you can modify the `cleanHeader` function in `cleanSalesExcelData.js`:

```javascript
const headerMap = {
    'your_date_column': 'date',
    'your_amount_column': 'total_amount',
    // Add more mappings as needed
};
```

### Batch Processing

To process multiple Excel files:

```bash
# Process multiple files
for file in sales_data_*.xlsx; do
    echo "Processing $file..."
    node scripts/cleanSalesExcelData.js "$file" "${file%.xlsx}_cleaned.csv"
    node scripts/importSalesData.js "${file%.xlsx}_cleaned.csv"
done
```

## 📊 Database Schema

The cleaned data will be imported to the `sales_fact_monthly` table with this structure:

```sql
CREATE TABLE sales_fact_monthly (
  month_start date PRIMARY KEY,
  total_revenue numeric(12,2) NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  total_units integer NOT NULL DEFAULT 0,
  avg_order_value numeric(12,2) NOT NULL DEFAULT 0,
  new_customers integer DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Next Steps

After successful import:

1. **Verify data** in your dashboard
2. **Update analytics** views if needed
3. **Set up regular imports** for future data
4. **Monitor data quality** and adjust cleaning rules as needed

## 🆘 Troubleshooting

If you encounter issues:

1. **Check Excel format** - ensure columns are named correctly
2. **Review error messages** - they provide specific guidance
3. **Test with small dataset** - start with 2-3 rows to verify process
4. **Check database connection** - ensure your database is running
5. **Verify file paths** - use absolute paths if relative paths fail

For additional help, check the script logs and error messages for specific guidance.
