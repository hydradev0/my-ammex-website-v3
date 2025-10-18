const { connectDB, getModels } = require('../config/db');

const createPaymentReceiptsTable = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✓ Database connection established');
    
    console.log('🔄 Creating PaymentReceipt table...');
    
    const { PaymentReceipt } = getModels();

    // Create PaymentReceipt table
    await PaymentReceipt.sync({ force: false });
    console.log('✅ PaymentReceipt table created/verified');

    console.log('\n📋 PaymentReceipt table structure:');
    console.log('   - id (Primary Key)');
    console.log('   - receiptNumber (Unique, format: RCP-YYYY-NNNN)');
    console.log('   - paymentId (Foreign Key to Payment)');
    console.log('   - invoiceId (Foreign Key to Invoice)');
    console.log('   - customerId (Foreign Key to Customer)');
    console.log('   - paymentDate');
    console.log('   - amount');
    console.log('   - totalAmount');
    console.log('   - remainingAmount');
    console.log('   - paymentMethod');
    console.log('   - paymentReference');
    console.log('   - status (Partial/Completed)');
    console.log('   - receiptData (JSON)');
    console.log('   - createdAt, updatedAt');

    console.log('\n✅ PaymentReceipt table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating PaymentReceipt table:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  createPaymentReceiptsTable()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createPaymentReceiptsTable;

