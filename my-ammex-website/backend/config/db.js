// PostgreSQL Configuration (Commented out to prevent interruption)
// const { Sequelize } = require('sequelize');

// let sequelize = null;

const connectDB = async () => {
  try {
    // Check if DATABASE_URL is provided for PostgreSQL
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  No database configuration found. Server running without database.');
      console.log('📝 To use PostgreSQL, create a .env file with DATABASE_URL=postgresql://username:password@localhost:5432/database_name');
      
      // For development, we can continue without database
      console.log('🚀 Server running without database connection');
      return;
    }

    // PostgreSQL Connection (Commented out to prevent interruption)
    /*
    if (process.env.DATABASE_URL) {
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false, // Set to console.log to see SQL queries
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });

      await sequelize.authenticate();
      console.log('PostgreSQL Connected successfully.');
      
      // Sync all models (in development)
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: true });
        console.log('Database synchronized.');
      }
    }
    */

  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    console.log('⚠️  Continuing without database connection for development');
    // Don't exit process for development
    // process.exit(1);
  }
};

// Export both the connection function and sequelize instance
module.exports = { connectDB, sequelize: null }; 