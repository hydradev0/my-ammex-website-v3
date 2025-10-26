# Unified Views Migration Guide

## Overview

This migration creates **unified views** that combine historical imported data with live transactional data from the Invoice system. This allows seamless access to both old and new data through a single view.

## Architecture

### Before Migration
- **Fact Tables**: Contain historical imported data (2022-2023)
- **Views**: Read from fact tables (not live data)
- **Problem**: New Invoice transactions are not included in analytics

### After Migration
- **Fact Tables**: Still contain historical data (preserved)
- **Live Views**: Query Invoice/InvoiceItem for new transactions
- **Unified Views**: UNION of historical + live data
- **Analytics**: Queries unified views for complete data coverage

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED VIEW ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────┘

Historical Data (2022-2023)                Live Data (2024+)
┌──────────────────────┐                  ┌──────────────────┐
│  Fact Tables         │                  │  Invoice Tables  │
│  ─────────────       │                  │  ──────────────  │
│  sales_fact_monthly  │                  │  Invoice         │
│  ...by_product       │                  │  InvoiceItem     │
│  customer_bulk...    │                  │  Customer        │
└──────────┬───────────┘                  └────────┬─────────┘
           │                                       │
           │         ┌─────────────────────────────┘
           │         │
           ▼         ▼
    ┌──────────────────────┐
    │   UNIFIED VIEW       │ ◄─── Analytics Controller queries this
    │   (UNION ALL)        │
    └──────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │  AI Forecasting      │
    │  Dashboards          │
    │  Reports             │
    └──────────────────────┘
```

## Created Views

### 1. **v_sales_fact_monthly**
- **Purpose**: Unified sales data (historical + live)
- **Replaces**: Direct queries to `sales_fact_monthly` table
- **Columns**: `month_start`, `total_revenue`, `total_orders`, `total_units`, `avg_order_value`, `new_customers`

### 2. **v_top_products_monthly_live**
- **Purpose**: Live view of top products from Invoice data
- **Source**: Invoice + InvoiceItem + Item tables
- **Columns**: `month_start`, `item_id`, `model_no`, `category_name`, `category_id`, `subcategory_id`, `order_count`, etc.

### 3. **v_sales_fact_monthly_by_product**
- **Purpose**: Unified products data (historical + live)
- **Replaces**: Direct queries to `sales_fact_monthly_by_product` table
- **Columns**: `month_start`, `item_id`, `model_no`, `category_name`, `order_count`, etc.

### 4. **v_customer_bulk_monthly_live**
- **Purpose**: Live view of bulk customers from Invoice data
- **Source**: Invoice + Customer tables
- **Columns**: `month_start`, `customer_name`, `bulk_orders_count`, `bulk_orders_amount`, `model_no`, etc.

### 5. **v_customer_bulk_monthly_by_name_unified**
- **Purpose**: Unified bulk customer data (historical + live)
- **Replaces**: Direct queries to `customer_bulk_monthly_by_name` table
- **Columns**: `month_start`, `customer_name`, `bulk_orders_amount`, `model_no`, etc.

### 6. **v_customer_bulk_monthly_by_name_ranked**
- **Purpose**: Ranked bulk customers with dynamic ranking per month
- **Use Case**: Top N bulk customers queries
- **Columns**: All from unified + `ranking` (dynamically calculated)

### 7. **v_customer_bulk_monthly**
- **Purpose**: Unified bulk order summary (historical + live)
- **Replaces**: Direct queries to `customer_bulk_monthly` table
- **Columns**: `month_start`, `bulk_orders_count`, `bulk_orders_amount`

## Migration Steps

### Step 1: Run the Migration Script

```bash
cd my-ammex-website/backend
node scripts/runMigrateToUnifiedViews.js
```

This script will:
- ✅ Create all live views from Invoice data
- ✅ Create unified views with UNION
- ✅ Add performance indexes
- ✅ Run verification tests
- ✅ Show data source split

### Step 2: Verify the Migration

```bash
node scripts/testUnifiedViews.js
```

This will run comprehensive tests to ensure:
- ✅ No data overlap between historical and live sources
- ✅ All views return correct data
- ✅ Analytics controller queries work correctly
- ✅ Data integrity is maintained

### Step 3: Test Your Application

1. Start your backend server
2. Test the forecasting endpoints:
   - `POST /api/analytics/forecast/sales`
   - `POST /api/analytics/forecast/customer-bulk`
3. Check dashboard metrics:
   - `GET /api/analytics/historical-sales`
   - `GET /api/analytics/top-products`
   - `GET /api/analytics/top-bulk-customers`

## What Changed in analyticsController.js

All fact table queries have been updated to use unified views:

| Old Query Target | New Query Target |
|------------------|------------------|
| `sales_fact_monthly` | `v_sales_fact_monthly` |
| `sales_fact_monthly_by_product` | `v_sales_fact_monthly_by_product` |
| `customer_bulk_monthly_by_name` | `v_customer_bulk_monthly_by_name_ranked` (for ranked) |
| `customer_bulk_monthly_by_name` | `v_customer_bulk_monthly_by_name_unified` (for all data) |
| `customer_bulk_monthly` | `v_customer_bulk_monthly` |

**No application code logic changes** - only view names were updated!

## Data Integrity

### No Overlap
The UNION queries use `WHERE month_start NOT IN (SELECT month_start FROM fact_table)` to ensure:
- Historical months come ONLY from fact tables
- Live months come ONLY from Invoice system
- No duplicate data

### Example:
```
Historical Table: Jan 2022 - Dec 2023
Live Invoice Data: Jan 2024 - Present
Unified View: Jan 2022 - Present (no overlap)
```

## Performance Considerations

### Indexes Added
```sql
-- Fact table indexes (for fast UNION)
CREATE INDEX idx_sales_fact_monthly_month ON sales_fact_monthly(month_start);
CREATE INDEX idx_sales_fact_product_month ON sales_fact_monthly_by_product(month_start);
CREATE INDEX idx_customer_bulk_name_month ON customer_bulk_monthly_by_name(month_start);

-- Invoice table indexes (for fast live queries)
CREATE INDEX idx_invoice_date_amount ON "Invoice"(invoice_date, total_amount);
CREATE INDEX idx_invoice_item_totals ON "InvoiceItem"(invoice_id, quantity, total_price);
```

### Query Performance
- **Historical queries**: Fast (indexed table scan)
- **Live queries**: Moderate (aggregation on Invoice tables)
- **UNION queries**: Good (PostgreSQL optimizes UNION ALL well)

For 3 years of data + live transactions:
- Expected response time: < 500ms for most queries
- Large aggregations (AI forecasting): < 2 seconds

## Rollback Plan

If you need to rollback:

### Option 1: Drop unified views (keep analytics working)
```sql
-- This will not affect fact tables (data is safe)
DROP VIEW IF EXISTS v_sales_fact_monthly CASCADE;
DROP VIEW IF EXISTS v_sales_fact_monthly_by_product CASCADE;
DROP VIEW IF EXISTS v_customer_bulk_monthly_by_name_unified CASCADE;
DROP VIEW IF EXISTS v_customer_bulk_monthly CASCADE;
```

### Option 2: Revert analyticsController.js
```bash
git checkout HEAD -- backend/controllers/analyticsController.js
```

This will restore queries to use fact tables directly (old data only).

## Troubleshooting

### Issue: "relation does not exist" error

**Solution**: Run the migration script again:
```bash
node scripts/runMigrateToUnifiedViews.js
```

### Issue: Slow queries after migration

**Solution**: Check if indexes were created:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('sales_fact_monthly', 'Invoice', 'InvoiceItem');
```

If missing, manually run:
```bash
node scripts/runMigrateToUnifiedViews.js
```

### Issue: Duplicate data in results

**Solution**: Verify no overlap:
```sql
SELECT month_start, COUNT(*) 
FROM v_sales_fact_monthly 
GROUP BY month_start 
HAVING COUNT(*) > 1;
```

Should return 0 rows. If duplicates exist, check the UNION query logic.

### Issue: Missing recent data

**Solution**: Verify Invoice system has data:
```sql
SELECT 
  date_trunc('month', invoice_date) as month, 
  COUNT(*) 
FROM "Invoice" 
GROUP BY month 
ORDER BY month DESC 
LIMIT 12;
```

## Maintenance

### Adding New Historical Data

If you import more historical CSV data into fact tables:
1. Import to fact tables as usual (existing scripts work)
2. Unified views automatically include new data
3. No migration needed!

### Refreshing Views

Views are **dynamic** - they always show current data. No refresh needed!

However, if you modify view definitions:
```bash
node scripts/runMigrateToUnifiedViews.js
```

## Benefits of This Approach

✅ **Single source of truth**: Query one view for all data  
✅ **Data preservation**: Historical data stays in fact tables  
✅ **Live data**: New transactions automatically included  
✅ **No code changes**: Only view names updated  
✅ **Performance**: Indexes optimize UNION queries  
✅ **Maintainable**: Easy to understand and debug  
✅ **Flexible**: Can easily add more sources  

## Support

If you encounter issues:
1. Check the verification script output: `node scripts/testUnifiedViews.js`
2. Review the migration log from `runMigrateToUnifiedViews.js`
3. Check PostgreSQL logs for query errors
4. Verify database connection in `.env` file

## Files Created/Modified

### Created Files:
- `backend/scripts/migrateToUnifiedViews.sql` - SQL migration
- `backend/scripts/runMigrateToUnifiedViews.js` - Migration runner
- `backend/scripts/testUnifiedViews.js` - Test suite
- `UNIFIED_VIEWS_MIGRATION.md` - This guide

### Modified Files:
- `backend/controllers/analyticsController.js` - Updated queries to use unified views

---

**Migration Date**: 2025-10-25  
**Database**: PostgreSQL  
**Approach**: UNION-based unified views  
**Status**: ✅ Ready for production

