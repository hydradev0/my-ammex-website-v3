# Website Analytics Auto-Refresh Options

This document describes how to automatically refresh the website analytics materialized views without manual intervention.

## Current Setup

The website analytics use PostgreSQL materialized views:
- `mv_category_traffic_daily` - Category traffic aggregation
- `mv_top_clicked_items_daily` - Top clicked products
- `mv_cart_additions_daily` - Cart addition events

These views need to be refreshed to include new data from the `Event` table.

---

## ✅ Option 1: Manual Refresh Button (IMPLEMENTED)

A "Refresh Analytics" button has been added to the Website Analytics page that:
1. Calls the refresh endpoint: `POST /api/analytics/website/refresh`
2. Refreshes all three materialized views
3. Automatically reloads the data
4. Shows success/error messages

**Usage**: Simply click the "Refresh Analytics" button in the UI.

---

## Option 2: Automatic Scheduled Refresh

Choose one of the following methods to automatically refresh analytics on a schedule:

### Method A: PostgreSQL `pg_cron` Extension (Recommended)

`pg_cron` allows you to schedule jobs directly in PostgreSQL.

#### 1. Install pg_cron Extension

```sql
-- Run as superuser
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### 2. Schedule the Refresh Job

```sql
-- Refresh analytics every hour at minute 0
SELECT cron.schedule(
  'refresh-website-analytics',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT refresh_website_analytics()$$
);

-- OR refresh every 30 minutes
SELECT cron.schedule(
  'refresh-website-analytics',
  '*/30 * * * *',  -- Every 30 minutes
  $$SELECT refresh_website_analytics()$$
);

-- OR refresh every day at 2 AM
SELECT cron.schedule(
  'refresh-website-analytics',
  '0 2 * * *',  -- Daily at 2 AM
  $$SELECT refresh_website_analytics()$$
);
```

#### 3. View Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

#### 4. Unschedule (if needed)

```sql
SELECT cron.unschedule('refresh-website-analytics');
```

#### Cron Schedule Format
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 * * * *` - Every hour
- `*/15 * * * *` - Every 15 minutes
- `0 2 * * *` - Every day at 2:00 AM
- `0 */4 * * *` - Every 4 hours
- `0 0 * * 0` - Every Sunday at midnight

---

### Method B: Node.js Cron Job (Alternative)

If you can't use `pg_cron`, use Node.js scheduling.

#### 1. Install node-cron

```bash
npm install node-cron
```

#### 2. Create Scheduler Service

Create `backend/services/analyticsScheduler.js`:

```javascript
const cron = require('node-cron');
const { getSequelize } = require('../config/db');

class AnalyticsScheduler {
  start() {
    // Refresh every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('⏰ Starting scheduled website analytics refresh...');
        const sequelize = getSequelize();
        
        if (!sequelize) {
          console.error('❌ Database not connected');
          return;
        }
        
        await sequelize.query('SELECT refresh_website_analytics()');
        console.log('✅ Website analytics refreshed successfully');
      } catch (error) {
        console.error('❌ Failed to refresh website analytics:', error.message);
      }
    });
    
    console.log('📅 Analytics refresh scheduler started');
  }
}

module.exports = new AnalyticsScheduler();
```

#### 3. Start Scheduler in server.js

Add to `backend/server.js`:

```javascript
const analyticsScheduler = require('./services/analyticsScheduler');

// ... after database connection
analyticsScheduler.start();
```

---

### Method C: System Cron Job (Linux/Unix)

Use system cron to call the existing refresh script.

#### 1. Make Script Executable

```bash
chmod +x backend/scripts/refreshWebsiteAnalytics.js
```

#### 2. Add to Crontab

```bash
crontab -e
```

Add this line (adjust paths as needed):

```bash
# Refresh website analytics every hour
0 * * * * cd /path/to/your/project && node backend/scripts/refreshWebsiteAnalytics.js >> /var/log/website-analytics-refresh.log 2>&1
```

**Examples:**
```bash
# Every 30 minutes
*/30 * * * * cd /path/to/project && node backend/scripts/refreshWebsiteAnalytics.js

# Every day at 2 AM
0 2 * * * cd /path/to/project && node backend/scripts/refreshWebsiteAnalytics.js

# Every 4 hours
0 */4 * * * cd /path/to/project && node backend/scripts/refreshWebsiteAnalytics.js
```

---

### Method D: Windows Task Scheduler

For Windows servers.

#### 1. Create Batch Script

Create `refresh-analytics.bat`:

```batch
@echo off
cd C:\path\to\your\project
node backend\scripts\refreshWebsiteAnalytics.js >> logs\analytics-refresh.log 2>&1
```

#### 2. Schedule with Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily, Hourly)
4. Set action: Start a program
5. Program: `C:\path\to\your\project\refresh-analytics.bat`

---

## Option 3: Continuous Materialized View (PostgreSQL 13+)

PostgreSQL doesn't have true "continuous" materialized views, but you can:

### Use REFRESH MATERIALIZED VIEW CONCURRENTLY

This allows queries while refreshing:

```sql
-- First, add unique indexes (required for CONCURRENTLY)
CREATE UNIQUE INDEX mv_ctd_unique_idx ON mv_category_traffic_daily (event_date, category);
CREATE UNIQUE INDEX mv_tcid_unique_idx ON mv_top_clicked_items_daily (event_date, product_name, model_no);
CREATE UNIQUE INDEX mv_cad_unique_idx ON mv_cart_additions_daily (event_date, product_name, model_no);

-- Update refresh function to use CONCURRENTLY
CREATE OR REPLACE FUNCTION refresh_website_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_traffic_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_clicked_items_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cart_additions_daily;
END;
$$ LANGUAGE plpgsql;
```

Then schedule with any method above.

---

## Recommendation

**For Production:**
- Use **pg_cron** (Method A) if available - native PostgreSQL solution
- Refresh frequency: **Every 30 minutes to 1 hour** for most use cases
- Use `CONCURRENTLY` option to avoid locking

**For Development:**
- Use **Manual Refresh Button** (Option 1) for on-demand testing
- Or use **Node.js Cron** (Method B) for simple local scheduling

**Monitoring:**
- Log refresh operations
- Monitor refresh duration
- Alert on failures

---

## Testing

After setting up automatic refresh:

```sql
-- Check last refresh time
SELECT 
  schemaname,
  matviewname,
  last_refresh
FROM pg_matviews
WHERE matviewname LIKE 'mv_%';

-- Manual test
SELECT refresh_website_analytics();

-- Verify data
SELECT * FROM mv_category_traffic_daily 
WHERE event_date = CURRENT_DATE 
ORDER BY event_date DESC;
```

---

## Troubleshooting

### Refresh Taking Too Long
- Add indexes to Event table
- Consider incremental updates
- Use CONCURRENTLY option

### Permission Issues
```sql
-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_website_analytics() TO your_app_user;
```

### Memory Issues with Large Data
```sql
-- Set maintenance_work_mem higher
SET maintenance_work_mem = '1GB';
REFRESH MATERIALIZED VIEW mv_category_traffic_daily;
```

---

## Additional Resources

- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)

