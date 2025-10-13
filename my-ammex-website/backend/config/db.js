const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const { initializeModels } = require('../models-postgres');
dotenv.config();

let sequelize = null;
let models = null;

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

    // PostgreSQL Connection with best practices
    if (process.env.DATABASE_URL) {
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 10, // Maximum number of connection instances
          min: 0,  // Minimum number of connection instances
          acquire: 60000, // Maximum time, in milliseconds, that pool will try to get connection before throwing error
          idle: 10000 // Maximum time, in milliseconds, that a connection can be idle before being released
        },
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        define: {
          timestamps: true, // Adds createdAt and updatedAt timestamps
          underscored: true, // Use snake_case for column names
          freezeTableName: true // Prevents Sequelize from pluralizing table names
        }
      });

      // Test the connection
      await sequelize.authenticate();
      console.log('✅ PostgreSQL Connected successfully.');
      
      // Initialize models after connection is established
      models = {
        ...initializeModels(sequelize),
        Sequelize: sequelize.Sequelize
      };
      
      // Sync all models (force sync for schema changes)
      console.log('🔄 Synchronizing database schema...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized.');
    }

  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    console.log('⚠️  Continuing without database connection for development');
    // Don't exit process for development
  }
};

// Graceful shutdown function
const closeDB = async () => {
  if (sequelize) {
    try {
      await sequelize.close();
      console.log('✅ Database connection closed.');
    } catch (error) {
      console.error('❌ Error closing database connection:', error.message);
    }
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Closing database connection...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Closing database connection...');
  await closeDB();
  process.exit(0);
});

// Export both the connection function and sequelize instance
module.exports = { 
  connectDB, 
  getSequelize: () => sequelize,
  closeDB, 
  getModels: () => models
}; 