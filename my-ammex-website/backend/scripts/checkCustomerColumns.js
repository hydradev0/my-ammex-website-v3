const { connectDB, getSequelize } = require('../config/db');

const checkCustomerColumns = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }
    
    console.log('📊 Checking Customer table columns...');
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Customer' 
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Customer table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('Error checking Customer columns:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  checkCustomerColumns()
    .then(() => {
      console.log('Customer columns check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Customer columns check failed:', error);
      process.exit(1);
    });
}

module.exports = checkCustomerColumns;
