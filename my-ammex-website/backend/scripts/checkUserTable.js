const { connectDB, getModels } = require('../config/db');

const checkUserTable = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    const { sequelize } = getModels();
    if (!sequelize) {
      console.log('❌ Database not connected. Please ensure the database is running.');
      return;
    }

    console.log('🔄 Checking User table structure...');

    // Get all columns in the User table
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Current User table columns:');
    results.forEach(column => {
      console.log(`  - ${column.column_name} (${column.data_type}) ${column.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    // Check specifically for phone_number column
    const phoneColumn = results.find(col => col.column_name === 'phone_number');
    if (phoneColumn) {
      console.log('⚠️  phone_number column still exists - needs to be removed');
      
      // Remove it
      await sequelize.query(`ALTER TABLE "User" DROP COLUMN "phone_number";`);
      console.log('✅ phone_number column removed successfully');
    } else {
      console.log('✅ phone_number column not found - already removed');
    }
    
    // Close the connection
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error checking User table:', error.message);
  }
};

// Run the check if this script is executed directly
if (require.main === module) {
  checkUserTable()
    .then(() => {
      console.log('🎉 Check completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkUserTable };
