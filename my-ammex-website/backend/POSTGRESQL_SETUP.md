# PostgreSQL Setup Guide

This project uses PostgreSQL as the database. The PostgreSQL code is currently commented out to prevent interruption during development.

## Prerequisites

1. **Install PostgreSQL** on your system:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

## Database Setup

### Option 1: Using DATABASE_URL (Recommended)

1. Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/ammex_website
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=30d
   ```

2. Create the database:
   ```sql
   CREATE DATABASE ammex_website;
   ```

3. **To enable PostgreSQL** (currently commented out):
   - Uncomment the PostgreSQL connection code in `config/db.js`
   - Uncomment the routes in `server.js`
   - Run the setup script: `npm run setup-db`

## Running the Application

### Development Mode (Current - No Database)
```bash
npm run dev
```
The server will run with mock data and no database connection.

### Production Mode with PostgreSQL
1. Set up your `.env` file with `DATABASE_URL`
2. Uncomment the PostgreSQL code in `config/db.js`
3. Uncomment the routes in `server.js`
4. Run: `npm start`

## Database Models

The following PostgreSQL models have been created in `models-postgres/`:

- **Users**: Authentication and user management
- **Products**: Inventory management
- **Orders**: Order management with line items
- **OrderItems**: Individual items within orders

## Relationships

- Users can have many Orders
- Products can be in many OrderItems
- Orders have many OrderItems
- OrderItems belong to both Orders and Products

## Current Status

- ✅ MongoDB completely removed
- ✅ PostgreSQL models created
- ✅ PostgreSQL code commented out (won't interrupt frontend)
- ✅ Mock routes active for development
- ⏳ Ready to enable PostgreSQL when needed

## To Enable PostgreSQL

1. **Uncomment in `config/db.js`**:
   ```javascript
   // Remove the /* and */ around the PostgreSQL connection code
   ```

2. **Uncomment in `server.js`**:
   ```javascript
   // Remove the /* and */ around the routes section
   ```

3. **Set up your database**:
   ```bash
   npm run setup-db
   ```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running: `sudo service postgresql start` (Linux) or check Services (Windows)
- Verify your connection string format
- Check that the database exists

### Permission Issues
- Ensure your PostgreSQL user has the necessary permissions
- You may need to create the user: `CREATE USER username WITH PASSWORD 'password';`
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE ammex_website TO username;`

### Port Conflicts
- Default PostgreSQL port is 5432
- If using a different port, update your connection string

## Default Admin User

When you enable PostgreSQL, the setup script creates a default admin user:
- Email: `admin@ammex.com`
- Password: `admin123`
- Role: `admin`

**Important**: Change these credentials in production! 