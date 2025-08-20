# Authentication System Setup Guide

## Overview

Your Ammex Website already has a complete authentication backend and database system built with:
- **PostgreSQL** database with Sequelize ORM
- **JWT** token-based authentication
- **Role-based access control** (Admin, Client, Warehouse Supervisor, Sales Marketing)
- **Department-based permissions** (Sales, Warehouse, Administration, Client Services)
- **Secure password hashing** with bcrypt
- **Protected routes** with middleware

## Quick Start

### 1. Environment Setup

Create a `.env` file in the `backend/` directory:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ammex_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
```

### 2. Database Setup

#### Install PostgreSQL
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql`
- **Ubuntu**: `sudo apt-get install postgresql postgresql-contrib`

#### Create Database
```sql
CREATE DATABASE ammex_db;
```

#### Run Setup Scripts
```bash
# Install dependencies
npm install

# Setup database and create admin user
npm run setup-db

# Test database connection
npm run test-db
```

### 3. Start the Server
```bash
npm run dev
```

## Default Admin User

After running the setup, you'll have access to:
- **Email**: `admin@ammex.com`
- **Password**: `admin123`
- **Role**: `Admin`
- **Department**: `Administration`

⚠️ **IMPORTANT**: Change these credentials in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (Admin only)
- `PUT /api/auth/users/:id` - Update user (Admin only)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### Protected Routes
All routes except login are protected and require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles & Permissions

### Admin
- Full system access
- User management
- All CRUD operations

### Warehouse Supervisor
- Inventory management
- Stock adjustments
- Order processing

### Sales Marketing
- Customer management
- Sales orders
- Analytics access

### Client
- Limited access
- View products
- Place orders

## Database Models

### User Model
- Authentication fields (email, password)
- Role and department assignment
- Active/inactive status
- Last login tracking

### Relationships
- Users can have many Orders
- Users belong to Departments
- Role-based access control

## Security Features

### Password Security
- Bcrypt hashing with salt rounds
- Minimum 6 character requirement
- Automatic hashing on create/update

### JWT Security
- 30-day token expiration
- Secure token verification
- User validation on each request

### Route Protection
- Authentication middleware
- Role-based authorization
- Department-based access control

## Frontend Integration

Your React frontend is already configured to work with this backend:

### AuthContext
- Automatic token management
- User state management
- Login/logout functionality

### Protected Routes
- Route-level authentication
- Role-based component rendering
- Automatic redirects

## Development Commands

```bash
# Start development server
npm run dev

# Setup database
npm run setup-db

# Create admin user only
npm run create-admin

# Test database connection
npm run test-db

# Sync database models
npm run db:sync
```

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check your DATABASE_URL format
3. Verify database exists
4. Check user permissions

### Authentication Issues
1. Verify JWT_SECRET is set
2. Check token expiration
3. Ensure user is active
4. Verify role permissions

### Common Errors
- **"Database models not initialized"**: Run `npm run setup-db`
- **"Not authorized"**: Check user role and department
- **"User not found"**: Verify user exists and is active

## Production Deployment

### Security Checklist
- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Configure production database
- [ ] Set up SSL/TLS
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting
- [ ] Enable logging

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your-production-secret-here
DATABASE_URL=postgresql://user:pass@prod-host:5432/ammex_prod
FRONTEND_URL=https://yourdomain.com
```

## Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Test database connection
4. Check user permissions
5. Review middleware configuration

Your authentication system is production-ready and follows security best practices!
