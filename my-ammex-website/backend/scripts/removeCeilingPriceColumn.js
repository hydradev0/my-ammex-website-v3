const { connectDB, getSequelize } = require('../config/db');

const removeCeilingPriceColumn = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database not connected. Please ensure the database is running.');
      return;
    }

    console.log('🔄 Checking Item table structure...');

    // Get the current table description
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Item' 
      AND column_name = 'ceiling_price'
    `);

    if (results.length > 0) {
      console.log('🔄 Ceiling price column found, removing it...');
      
      // Remove the ceiling_price column using raw SQL
      await sequelize.query(`
        ALTER TABLE "Item" 
        DROP COLUMN IF EXISTS "ceiling_price";
      `);
      
      console.log('✅ Ceiling price column removed successfully from Item table.');
    } else {
      console.log('✅ Ceiling price column not found - already removed or never existed.');
    }
    
    // Close the connection
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error removing ceiling price column:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  removeCeilingPriceColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { removeCeilingPriceColumn };

