const { connectDB, getSequelize } = require('../config/db');

const updateCustomerTable = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }
    
    console.log('📊 Updating Customer table column names...');
    
    // Check if the column already exists with the correct name
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Customer' 
      AND column_name = 'company_name';
    `);
    
    if (columns.length === 0) {
      // Rename companyName to company_name
      await sequelize.query(`
        ALTER TABLE "Customer" 
        RENAME COLUMN "companyName" TO "company_name";
      `);
      console.log('✓ Renamed companyName to company_name');
    } else {
      console.log('✓ company_name column already exists');
    }
    
    // Check if contactName column exists
    const [contactColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Customer' 
      AND column_name = 'contact_name';
    `);
    
    if (contactColumns.length === 0) {
      // Rename contactName to contact_name
      await sequelize.query(`
        ALTER TABLE "Customer" 
        RENAME COLUMN "contactName" TO "contact_name";
      `);
      console.log('✓ Renamed contactName to contact_name');
    } else {
      console.log('✓ contact_name column already exists');
    }
    
    console.log('✅ Customer table updated successfully!');
    
  } catch (error) {
    console.error('Error updating Customer table:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  updateCustomerTable()
    .then(() => {
      console.log('Customer table update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Customer table update failed:', error);
      process.exit(1);
    });
}

module.exports = updateCustomerTable;
