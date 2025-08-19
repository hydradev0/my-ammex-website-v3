const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const { initializeModels } = require('../models-postgres');

dotenv.config();

const createCartTables = async () => {
  let sequelize = null;
  
  try {
    // Check if DATABASE_URL is provided
    if (!process.env.DATABASE_URL) {
      console.log('❌ No DATABASE_URL found in environment variables');
      console.log('📝 Please create a .env file with DATABASE_URL=postgresql://username:password@localhost:5432/database_name');
      process.exit(1);
    }

    // Create Sequelize instance
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false, // Disable logging for this script
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    });

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database');

    // Initialize models
    const models = initializeModels(sequelize);
    console.log('✅ Models initialized');

    // Sync models to create tables
    console.log('🔄 Creating cart tables...');
    await sequelize.sync({ alter: true });
    console.log('✅ Cart tables created successfully');

    // Verify tables exist
    const tableNames = await sequelize.showAllSchemas();
    console.log('📋 Available tables:', tableNames.map(t => t.name).filter(name => name !== 'information_schema'));

    console.log('🎉 Cart tables setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating cart tables:', error.message);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('✅ Database connection closed');
    }
  }
};

// Run the script
if (require.main === module) {
  createCartTables();
}

module.exports = { createCartTables };

