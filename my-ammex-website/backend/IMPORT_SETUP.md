# Import Feature Setup Instructions

## Quick Setup

### 1. Install Required Packages

```bash
cd backend
npm install csv-parser multer
```

### 2. Restart Your Backend Server

```bash
npm run dev
# or
npm start
```

### 3. Test the Feature

1. Log in as an Admin user
2. Navigate to **Admin → Import Data** in the menu
3. Upload a CSV file to test

## What Was Installed

- **csv-parser** (^3.0.0): Streaming CSV parser
- **multer** (^1.4.5-lts.1): Middleware for handling multipart/form-data (file uploads)

## Important Notes

⚠️ The import controller currently **parses and validates** CSV files but **does NOT insert data into the database**.

You need to add database insertion logic in `controllers/importController.js` where you see the TODO comments:

```javascript
// TODO: Add actual database insertion logic based on your requirements
// Example: await SalesData.create({ ... });
```

## Directory Structure Created

```
backend/
  └── uploads/
      └── imports/          # Where uploaded CSV files are temporarily stored
          └── .gitignore    # Prevents uploaded files from being committed to git
```

## API Endpoint

**POST** `/api/import/csv`
- **Authentication**: Required (JWT token)
- **Authorization**: Admin only
- **Content-Type**: multipart/form-data
- **Parameters**:
  - `file`: CSV file (required)
  - `type`: Import type - "sales" or "bulk" (required)

## Next Steps

1. Define your database schema for the imported data
2. Add the database insertion logic in the controller
3. Test with your actual CSV files
4. Customize validation rules as needed

See `IMPORT_FEATURE_GUIDE.md` in the root directory for detailed documentation.

