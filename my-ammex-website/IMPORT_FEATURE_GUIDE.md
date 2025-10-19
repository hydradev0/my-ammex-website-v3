# Import Data Feature Guide

## Overview
The Import Data feature allows administrators to upload CSV files and import historical data into the system. This is a one-time import feature designed for migrating existing data.

## Features Implemented

### Frontend
✅ **Import Data Page** (`frontend/src/Pages/Admin/ImportData.jsx`)
- Drag-and-drop CSV upload interface
- Import type selection (Sales or Bulk Orders)
- Real-time upload progress
- Import results display with statistics
- Error reporting for failed imports
- Clean, modern UI with visual feedback

✅ **Navigation Integration**
- Added "Admin" dropdown menu in navigation
- "Import Data" option visible only to Admin users
- "Account Management" also moved to Admin dropdown

✅ **Route Protection**
- Admin-only access with `ProtectedRoute` wrapper
- Route: `/admin/importdata`

### Backend
✅ **Import Controller** (`backend/controllers/importController.js`)
- CSV file parsing with validation
- Error handling for malformed data
- Import statistics tracking
- Support for multiple import types

✅ **Import Routes** (`backend/routes/import.js`)
- Multer file upload middleware
- CSV-only file validation
- 10MB file size limit
- Admin authentication required

✅ **Server Integration**
- Import route added to `server.js`
- Upload directory created: `backend/uploads/imports/`
- `.gitignore` configured to exclude uploaded files

## How to Use

### 1. Access the Feature
1. Log in as an **Admin** user
2. Click on the **Admin** dropdown in the navigation
3. Select **Import Data**

### 2. Upload CSV File
1. Select the import type:
   - **Sales Orders**: For historical sales order data
   - **Bulk Orders**: For bulk order data
2. Upload your CSV file by:
   - Dragging and dropping the file onto the upload area
   - Clicking "Browse Files" to select from your computer
3. Click **Import Data** button

### 3. Review Results
After import:
- View import statistics (total, imported, failed, skipped)
- Review any errors that occurred
- Option to import another file

## Required Setup

### Install Dependencies
The following npm packages need to be installed in the backend:

```bash
cd my-ammex-website/backend
npm install csv-parser multer
```

### Package Versions
- `csv-parser`: For parsing CSV files
- `multer`: For handling multipart/form-data file uploads

## CSV Format Requirements

### Sales Orders CSV
Expected columns:
- `month_start`: Start date of the month (YYYY-MM-DD)
- `total_revenue`: Total revenue for the month
- `total_orders`: Number of orders
- `total_units`: Number of units sold
- `avg_order_value`: Average order value
- `new_customers`: Number of new customers

### Bulk Orders CSV
*Format to be defined based on your data structure*

## Important Notes

⚠️ **Database Logic Required**
The import controller currently **validates and parses** CSV data but does **NOT** insert into the database. You need to:

1. Define the database tables/models for storing imported data
2. Add insertion logic in `importController.js`
3. Update the validation rules based on your requirements

See the TODO comments in `backend/controllers/importController.js` for where to add database logic.

### Example Database Implementation

```javascript
// In importController.js, replace the TODO with:

if (type === 'sales') {
  for (const row of results) {
    try {
      // Validate
      if (!row.month_start) {
        errors.push({ row: rowNumber, message: 'Missing month_start' });
        failed++;
        continue;
      }

      // Insert into database
      await SalesData.create({
        monthStart: row.month_start,
        totalRevenue: parseFloat(row.total_revenue),
        totalOrders: parseInt(row.total_orders),
        totalUnits: parseInt(row.total_units),
        avgOrderValue: parseFloat(row.avg_order_value),
        newCustomers: parseInt(row.new_customers)
      });

      imported++;
    } catch (error) {
      errors.push({ row: rowNumber, message: error.message });
      failed++;
    }
  }
}
```

## Security Features

✅ File type validation (CSV only)
✅ File size limit (10MB)
✅ Admin-only access
✅ Automatic file cleanup after import
✅ Protected API routes with JWT authentication

## File Structure

```
frontend/src/
  ├── Pages/Admin/
  │   ├── ImportData.jsx          # Import page component
  │   └── AccountManagement.jsx   # Existing admin page
  ├── Components/
  │   └── Navigation.jsx          # Updated with Admin dropdown
  └── App.jsx                     # Updated with import route

backend/
  ├── controllers/
  │   └── importController.js     # Import logic
  ├── routes/
  │   └── import.js              # Import routes
  ├── uploads/imports/           # Upload directory
  │   └── .gitignore            # Ignore uploaded files
  └── server.js                  # Updated with import route
```

## Next Steps

1. ✅ Install required npm packages (`csv-parser` and `multer`)
2. ⚠️ Define database schema for imported data (if not using existing tables)
3. ⚠️ Add database insertion logic in `importController.js`
4. ⚠️ Test with your actual CSV files
5. ⚠️ Add validation rules specific to your data requirements
6. Optional: Add import history tracking
7. Optional: Add data preview before import

## Testing Checklist

- [ ] Can admin user access Import Data page?
- [ ] Are non-admin users blocked from accessing?
- [ ] Does drag-and-drop upload work?
- [ ] Does file browse upload work?
- [ ] Are non-CSV files rejected?
- [ ] Are CSV files parsed correctly?
- [ ] Are errors displayed properly?
- [ ] Is data being inserted into database?
- [ ] Are duplicate entries handled correctly?

## Troubleshooting

### "Module not found: csv-parser or multer"
Run: `npm install csv-parser multer` in the backend directory

### "Cannot read uploads/imports directory"
Ensure the directory exists: `backend/uploads/imports/`

### "Import completed but no data in database"
Add database insertion logic in `importController.js` (see TODO comments)

### "File too large" error
Default limit is 10MB. Adjust in `backend/routes/import.js`:
```javascript
limits: { fileSize: 20 * 1024 * 1024 } // 20MB
```

## Support
For questions or issues, refer to this documentation or check the code comments in the implementation files.

