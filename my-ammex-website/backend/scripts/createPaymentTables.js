const { connectDB, getModels } = require('../config/db');

const createPaymentTables = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('Creating payment-related tables...');
    
    const { Payment, PaymentHistory, Notification } = getModels();

    
    // Create Payment table
    await Payment.sync({ force: false });
    console.log('✓ Payment table created/verified');
    
    // Create PaymentHistory table
    await PaymentHistory.sync({ force: false });
    console.log('✓ PaymentHistory table created/verified');
    
    // Create Notification table
    await Notification.sync({ force: false });
    console.log('✓ Notification table created/verified');
    
    console.log('All payment tables created successfully!');
    
  } catch (error) {
    console.error('Error creating payment tables:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createPaymentTables()
    .then(() => {
      console.log('Payment tables setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Payment tables setup failed:', error);
      process.exit(1);
    });
}

module.exports = createPaymentTables;
