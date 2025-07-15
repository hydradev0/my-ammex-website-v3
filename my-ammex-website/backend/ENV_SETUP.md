# Environment Variables Setup Guide

## How to Create Your .env File

1. Create a new file called `.env` in the `backend/` directory
2. Copy the variables below and fill in your actual values

## Required Environment Variables

```env
# ========================================
# AMMEX WEBSITE - ENVIRONMENT VARIABLES
# ========================================

# ========================================
# SERVER CONFIGURATION
# ========================================
NODE_ENV=development
PORT=5000

# ========================================
# DATABASE CONFIGURATION (PostgreSQL)
# ========================================
# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database_name
DATABASE_URL=postgresql://postgres:password@localhost:5432/ammex_db

# Alternative: Individual database variables (uncomment if preferred)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=ammex_db
# DB_USER=postgres
# DB_PASSWORD=password

# ========================================
# JWT AUTHENTICATION
# ========================================
# JWT Secret for token signing (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# ========================================
# CORS CONFIGURATION
# ========================================
# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# ========================================
# SECURITY
# ========================================
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ========================================
# LOGGING
# ========================================
# Log level (error, warn, info, debug)
LOG_LEVEL=info

# ========================================
# FILE UPLOADS (if needed)
# ========================================
# Maximum file upload size (in bytes)
MAX_FILE_SIZE=10485760

# ========================================
# EMAIL CONFIGURATION (if needed)
# ========================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# FROM_EMAIL=noreply@ammex.com
# FROM_NAME=Ammex Website

# ========================================
# ANALYTICS (if needed)
# ========================================
# Google Analytics ID
# GA_TRACKING_ID=G-XXXXXXXXXX

# ========================================
# DEVELOPMENT SETTINGS
# ========================================
# Enable detailed logging in development
DEBUG=true

# ========================================
# PRODUCTION SETTINGS (uncomment for production)
# ========================================
# NODE_ENV=production
# JWT_SECRET=your-production-jwt-secret-here
# DATABASE_URL=postgresql://username:password@production-host:5432/ammex_db_prod
```

## Quick Start for Development

For immediate development, you only need these essential variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ammex_db
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
```

## Database Setup

1. **Install PostgreSQL** if you haven't already
2. **Create a database**:
   ```sql
   CREATE DATABASE ammex_db;
   ```
3. **Update the DATABASE_URL** in your .env file with your actual PostgreSQL credentials

## Security Notes

- **Never commit your .env file** to version control
- **Change the JWT_SECRET** to a strong, unique value
- **Use different values** for development and production
- **Keep your database credentials secure**

## Production Deployment

When deploying to production:

1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Configure your production database URL
4. Set appropriate rate limiting values
5. Configure CORS for your production domain

## Troubleshooting

- If you get database connection errors, check your PostgreSQL installation and credentials
- If authentication fails, verify your JWT_SECRET is set correctly
- If CORS errors occur, check that FRONTEND_URL matches your frontend's actual URL 