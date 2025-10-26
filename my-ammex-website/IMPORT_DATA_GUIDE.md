# Import Data Feature - Complete Guide

## Overview
This feature allows administrators to import historical sales and bulk order data from CSV files into the database for analytics and forecasting.

## 📊 Database Tables

### 1. **sales_fact_monthly**
Aggregated monthly sales data
- `month_start` (DATE, PRIMARY KEY)
- `total_revenue` (DECIMAL)
- `total_orders` (INTEGER)
- `total_units` (INTEGER)
- `avg_order_value` (DECIMAL)
- `new_customers` (INTEGER)

### 2. **sales_fact_monthly_by_product**
Monthly sales data broken down by product/model
- `month_start` (DATE)
- `model_no` (VARCHAR)
- `category_name` (VARCHAR)
- **UNIQUE CONSTRAINT**: (month_start, model_no)

### 3. **customer_bulk_monthly_by_name**
Customer bulk orders by product and month
- `customer_name` (VARCHAR)
- `bulk_orders_amount` (DECIMAL)
- `model_no` (VARCHAR)
- `month_start` (DATE)
- **UNIQUE CONSTRAINT**: (customer_name, model_no, month_start)

### 4. **customer_bulk_monthly** (Auto-generated)
Summarized bulk orders by month
- `month_start` (DATE, PRIMARY KEY)
- `bulk_orders_count` (INTEGER) - Number of bulk orders
- `bulk_orders_amount` (DECIMAL) - Total amount of bulk orders
- **Note**: This table is automatically updated when bulk data is imported

## 📁 CSV File Formats

### 1. Monthly Sales Data
**File Example**: `ammex_sales_2022_cleaned_corrected.csv`

```csv
month_start,total_revenue,total_orders,total_units,avg_order_value,new_customers
2022-01-01,2229298.06,0,0,0,0
2022-02-01,3786477.23,0,0,0,0
```

**Required Columns**:
- `month_start` - Date in YYYY-MM-DD format
- `total_revenue` - Total revenue for the month
- `total_orders` - Number of orders
- `total_units` - Total units sold
- `avg_order_value` - Average order value
- `new_customers` - Number of new customers

**Target Table**: `sales_fact_monthly`

---

### 2. Sales by Product
**File Example**: `2023-DATA-ITEMS-FOR-FORECASTING - Sheet1_cleaned.csv`

```csv
month_start,model_no,category_name
2023-01-01,ALUOX 100,Shot Blasting
2023-01-01,G25,Steel Grits
```

**Required Columns**:
- `month_start` - Date in YYYY-MM-DD format
- `model_no` - Product/model number
- `category_name` - Product category

**Target Table**: `sales_fact_monthly_by_product`

---

### 3. Customer Bulk Orders
**File Example**: `ammex_bulk_2023_cleaned.csv`

```csv
customer_name,bulk_orders_amount,model_no,month_start
AMSTEEL,950000,S390,2023-01-01
EEI,285000,S390,2023-01-01
```

**Required Columns**:
- `customer_name` - Customer name
- `bulk_orders_amount` - Order amount
- `model_no` - Product/model number
- `month_start` - Date in YYYY-MM-DD format

**Target Tables**: 
- `customer_bulk_monthly_by_name` (detailed records)
- `customer_bulk_monthly` (auto-generated summary)

## 🚀 How to Use

### 1. Access Import Feature
1. Log in as **Admin** user
2. Click the **menu icon** (☰) in the top-right corner
3. Select **Import Data** from the dropdown

### 2. Select Import Type
Choose one of three import types:
- **Monthly Sales Data** - Aggregated monthly sales
- **Sales by Product** - Monthly sales by model
- **Customer Bulk Orders** - Customer bulk orders by name

### 3. Upload CSV File
- Drag and drop your CSV file, or
- Click **Browse Files** to select from your computer
- File must be in CSV format
- Maximum file size: 10MB

### 4. Import Data
1. Click **Import Data** button
2. Wait for processing (progress indicator will show)
3. Review import results:
   - Total rows processed
   - Successfully imported
   - Failed rows (if any)
   - Error details

### 5. Handle Errors
If errors occur:
- Review the error messages
- Fix the CSV file
- Re-import the corrected file

## ⚙️ Setup Instructions

### Install Required Packages
```bash
cd backend
npm install csv-parser multer
```

### Database Tables
The tables should already exist in your database. If not, create them with the proper structure and constraints:

```sql
-- sales_fact_monthly table
CREATE TABLE IF NOT EXISTS sales_fact_monthly (
    month_start DATE PRIMARY KEY,
    total_revenue DECIMAL(12, 2),
    total_orders INTEGER,
    total_units INTEGER,
    avg_order_value DECIMAL(10, 2),
    new_customers INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- sales_fact_monthly_by_product table
CREATE TABLE IF NOT EXISTS sales_fact_monthly_by_product (
    id SERIAL PRIMARY KEY,
    month_start DATE NOT NULL,
    model_no VARCHAR(100) NOT NULL,
    category_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (month_start, model_no)
);

-- customer_bulk_monthly_by_name table
CREATE TABLE IF NOT EXISTS customer_bulk_monthly_by_name (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    bulk_orders_amount DECIMAL(12, 2),
    model_no VARCHAR(100) NOT NULL,
    month_start DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (customer_name, model_no, month_start)
);

-- customer_bulk_monthly table (summary)
CREATE TABLE IF NOT EXISTS customer_bulk_monthly (
    month_start DATE PRIMARY KEY,
    bulk_orders_count INTEGER,
    bulk_orders_amount DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔒 Features

### ✅ Duplicate Handling
- Uses `ON CONFLICT` to update existing records
- Prevents duplicate entries
- Updates records if they already exist

### ✅ Data Validation
- Validates required fields
- Checks data types
- Reports specific errors for each row

### ✅ Auto-summarization
- When importing bulk orders, automatically updates `customer_bulk_monthly` summary table
- Aggregates data by customer and month

### ✅ Error Reporting
- Shows which rows failed
- Provides specific error messages
- Displays up to 50 errors per import

### ✅ Security
- Admin-only access
- File type validation (CSV only)
- File size limits (10MB max)
- Automatic file cleanup

## 📝 Import Tips

1. **Date Format**: Always use YYYY-MM-DD format for `month_start`
2. **Quotes**: Use quotes around text fields if they contain commas
3. **Encoding**: UTF-8 encoding recommended
4. **Headers**: First row must contain column headers
5. **Duplicates**: Existing records will be updated with new values
6. **Empty Values**: Empty numeric fields default to 0

## 🔍 Troubleshooting

### "Missing required field" error
- Check that all required columns are present
- Verify column names match exactly (case-sensitive)
- Ensure no empty values in required fields

### "Invalid date format" error
- Use YYYY-MM-DD format for dates
- Example: 2023-01-01

### "Duplicate key violation" error
- This should not occur due to ON CONFLICT handling
- If it does, check your database constraints

### "File too large" error
- Split large files into smaller batches
- Default limit is 10MB

### Import shows 0 rows imported
- Check CSV file format
- Verify data is valid
- Review error messages

## 📊 What to Import

Your data files:

1. **Sales Data** (multiple years):
   - `ammex_sales_2023_cleaned_corrected.csv`
   - `ammex_sales_2024_cleaned_corrected.csv`
   - `ammex_sales_2025_cleaned_corrected.csv`
   - Import Type: **Monthly Sales Data**

2. **Sales by Product**:
   - `2023-DATA-ITEMS-FOR-FORECASTING - Sheet1_cleaned.csv`
   - Import Type: **Sales by Product**

3. **Bulk Orders** (multiple years):
   - `ammex_bulk_2023_cleaned.csv`
   - `ammex_bulk_2024_cleaned.csv`
   - `ammex_bulk_2025_cleaned.csv`
   - Import Type: **Customer Bulk Orders**

## 🎯 After Import

Once data is imported:
- Analytics pages will show historical data
- Forecasting models can use this data
- Reports will include imported data
- Dashboard metrics will reflect complete history

## 📞 Support

For issues or questions:
1. Check error messages in the import results
2. Verify CSV file format matches examples
3. Review this documentation
4. Check backend logs for detailed errors

---

**Note**: This is a one-time import feature for historical data. Regular operations should use the standard order and sales entry features.

