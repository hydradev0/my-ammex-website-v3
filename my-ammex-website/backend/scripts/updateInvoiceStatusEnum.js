const { connectDB, getModels } = require('../config/db');

/**
 * Migration script to update Invoice status enum
 * This script updates the enum values for Invoice status from the old values to the new ones:
 * Old: 'pending', 'completed'
 * New: 'awaiting payment', 'partially paid', 'completed', 'rejected', 'overdue'
 */
const updateInvoiceStatusEnum = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Get the sequelize instance from the db config
    const { getSequelize } = require('../config/db');
    const sequelize = getSequelize();
    
    console.log('🔄 Starting Invoice status enum update...');
    
    // Step 1: Add new enum values to the existing enum type
    console.log('📝 Adding new enum values...');
    await sequelize.query(`
      ALTER TYPE "enum_Invoice_status" ADD VALUE IF NOT EXISTS 'awaiting payment';
    `);
    
    await sequelize.query(`
      ALTER TYPE "enum_Invoice_status" ADD VALUE IF NOT EXISTS 'partially paid';
    `);
    
    await sequelize.query(`
      ALTER TYPE "enum_Invoice_status" ADD VALUE IF NOT EXISTS 'rejected';
    `);
    
    await sequelize.query(`
      ALTER TYPE "enum_Invoice_status" ADD VALUE IF NOT EXISTS 'overdue';
    `);
    
    console.log('✅ New enum values added successfully');
    
    // Step 2: Update existing 'pending' records to 'awaiting payment'
    console.log('🔄 Updating existing records...');
    const updateResult = await sequelize.query(`
      UPDATE "Invoice" 
      SET status = 'awaiting payment' 
      WHERE status = 'pending'
    `);
    
    console.log(`📊 Updated ${updateResult[1]} records from 'pending' to 'awaiting payment'`);
    
    // Step 3: Remove the old 'pending' value from enum (optional - can be done later)
    // Note: PostgreSQL doesn't allow removing enum values directly
    // The old 'pending' value will remain but won't be used
    
    console.log('✅ Invoice status enum update completed successfully!');
    console.log('📋 New enum values: awaiting payment, partially paid, completed, rejected, overdue');
    console.log('⚠️  Note: Old "pending" value remains in enum but is no longer used');
    
  } catch (error) {
    console.error('❌ Error updating Invoice status enum:', error);
    throw error;
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  updateInvoiceStatusEnum()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { updateInvoiceStatusEnum };
