const { connectDB, getModels, getSequelize } = require('../config/db');

const createInvoiceTables = async () => {
  try {
    console.log('🔄 Connecting to database...');
    
    // First establish database connection
    await connectDB();
    
    console.log('🔄 Creating Invoice tables...');
    
    const sequelize = getSequelize();
    const models = getModels();
    
    if (!models) {
      throw new Error('Database connection not established. Please check your DATABASE_URL in .env file.');
    }
    
    const { Invoice, InvoiceItem } = models;

    // Create Invoice table
    await Invoice.sync({ force: false });
    console.log('✅ Invoice table created/verified');

    // Create InvoiceItem table
    await InvoiceItem.sync({ force: false });
    console.log('✅ InvoiceItem table created/verified');

    console.log('🎉 Invoice tables setup completed successfully!');
    
    // Test the tables by creating a sample record (optional)
    console.log('📋 Invoice table structure:');
    console.log('   - id (Primary Key)');
    console.log('   - invoiceNumber (Unique)');
    console.log('   - orderId (Foreign Key to Order)');
    console.log('   - customerId (Foreign Key to Customer)');
    console.log('   - invoiceDate');
    console.log('   - dueDate');
    console.log('   - totalAmount');
    console.log('   - status (pending/completed)');
    console.log('   - paymentTerms');
    console.log('   - notes');
    console.log('   - createdBy (Foreign Key to User)');
    console.log('   - createdAt, updatedAt');

    console.log('📋 InvoiceItem table structure:');
    console.log('   - id (Primary Key)');
    console.log('   - invoiceId (Foreign Key to Invoice)');
    console.log('   - itemId (Foreign Key to Item)');
    console.log('   - quantity');
    console.log('   - unitPrice');
    console.log('   - totalPrice');
    console.log('   - createdAt, updatedAt');

  } catch (error) {
    console.error('❌ Error creating Invoice tables:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  createInvoiceTables()
    .then(() => {
      console.log('✅ Invoice tables creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Invoice tables creation failed:', error);
      process.exit(1);
    });
}

module.exports = createInvoiceTables;
