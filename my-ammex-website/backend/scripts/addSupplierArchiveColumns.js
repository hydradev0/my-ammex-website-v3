const dotenv = require('dotenv');
dotenv.config();
const { connectDB, sequelize } = require('../config/db');

(async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    if (!sequelize) {
      console.error('Sequelize is not initialized. Ensure DATABASE_URL is set.');
      process.exit(1);
    }

    const qi = sequelize.getQueryInterface();
    const tableName = 'Supplier';

    // Check if table exists
    const table = await qi.describeTable(tableName).catch(() => null);
    if (!table) {
      console.error(`Table "${tableName}" not found. Make sure models are synced first.`);
      process.exit(1);
    }

    // Check if columns already exist
    if (table.archived_at && table.archived_by) {
      console.log('Archive columns already exist. Nothing to do.');
      process.exit(0);
    }

    console.log('Adding archive columns to suppliers table...');
    
    // Add archivedAt column if it doesn't exist
    if (!table.archived_at) {
      await qi.addColumn(tableName, 'archived_at', {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      });
      console.log('Added archivedAt column');
    }
    
    // Add archivedBy column if it doesn't exist
    if (!table.archived_by) {
      await qi.addColumn(tableName, 'archived_by', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'User',
          key: 'id'
        }
      });
      console.log('Added archivedBy column');
    }
    
    console.log('✅ Successfully added archive columns to suppliers table');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding archive columns:', error);
    process.exit(1);
  }
})();
