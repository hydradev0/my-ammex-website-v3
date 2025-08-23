const { connectDB, getModels } = require('../config/db');

const removePhoneNumberColumn = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    const { sequelize, User } = getModels();
    if (!sequelize) {
      console.log('❌ Database not connected. Please ensure the database is running.');
      return;
    }

    console.log('🔄 Checking User table structure...');

    // Get the current table description
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'phone_number'
    `);

    if (results.length > 0) {
      console.log('🔄 Phone number column found, removing it...');
      
      // Remove the phone number column using raw SQL
      await sequelize.query(`
        ALTER TABLE "User" 
        DROP COLUMN IF EXISTS "phone_number";
      `);
      
      console.log('✅ Phone number column removed successfully from User table.');
    } else {
      console.log('✅ Phone number column not found - already removed or never existed.');
    }
    
    // Close the connection
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error removing phone number column:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  removePhoneNumberColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { removePhoneNumberColumn };
