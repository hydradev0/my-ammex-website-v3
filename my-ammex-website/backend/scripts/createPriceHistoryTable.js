const { connectDB, getModels } = require('../config/db');

const createPriceHistoryTable = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('Creating PriceHistory table...');
    
    const { PriceHistory } = getModels();
    
    // Create PriceHistory table
    await PriceHistory.sync({ force: false });
    console.log('✓ PriceHistory table created/verified');
    
    console.log('PriceHistory table created successfully!');
    
  } catch (error) {
    console.error('Error creating PriceHistory table:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createPriceHistoryTable()
    .then(() => {
      console.log('PriceHistory table setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('PriceHistory table setup failed:', error);
      process.exit(1);
    });
}

module.exports = createPriceHistoryTable;

