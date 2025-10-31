const { connectDB, getModels } = require('../config/db');

// Script to add paymentTerms column to Order table
const addPaymentTermsToOrder = async () => {
  try {
    console.log('Starting migration: Adding paymentTerms to Order table...');
    
    // Initialize database connection first
    await connectDB();
    const models = getModels();
    const sequelize = models.Order.sequelize;
    
    // List all tables to see what exists
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('Available tables:', tables.map(t => t.table_name));
    
    // Find the correct table name (could be 'Orders', 'orders', etc.)
    const orderTable = tables.find(t => 
      t.table_name.toLowerCase().includes('order') && !t.table_name.toLowerCase().includes('item')
    );
    
    if (!orderTable) {
      throw new Error('Order table not found in database');
    }
    
    const tableName = orderTable.table_name;
    console.log(`Using table: ${tableName}`);
    
    // Check if paymentTerms column already exists
    const tableInfo = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' AND column_name = 'paymentTerms';
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (tableInfo.length > 0) {
      console.log('✅ paymentTerms column already exists, skipping migration');
      return;
    }
    
    // Add paymentTerms column to Order table
    console.log('Adding paymentTerms column...');
    await sequelize.query(`
      ALTER TABLE "${tableName}" 
      ADD COLUMN "paymentTerms" VARCHAR(255) DEFAULT '30 days';
    `);
    
    console.log('✅ Successfully added paymentTerms column to Order table');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  addPaymentTermsToOrder()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addPaymentTermsToOrder };

