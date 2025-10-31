const { connectDB, getModels } = require('../config/db');

// Script to fix paymentTerms column naming
const fixPaymentTermsColumn = async () => {
  try {
    console.log('Starting fix: Renaming paymentTerms to payment_terms...');
    
    // Initialize database connection first
    await connectDB();
    const models = getModels();
    const sequelize = models.Order.sequelize;
    
    // Check if paymentTerms (camelCase) exists
    const camelCaseCheck = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Order' AND column_name = 'paymentTerms';
    `, { type: sequelize.QueryTypes.SELECT });
    
    // Check if payment_terms (snake_case) exists
    const snakeCaseCheck = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Order' AND column_name = 'payment_terms';
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (snakeCaseCheck.length > 0) {
      console.log('✅ payment_terms column already exists, skipping fix');
      return;
    }
    
    if (camelCaseCheck.length > 0) {
      console.log('Renaming paymentTerms to payment_terms...');
      // Rename the column
      await sequelize.query(`
        ALTER TABLE "Order" 
        RENAME COLUMN "paymentTerms" TO "payment_terms";
      `);
      console.log('✅ Successfully renamed paymentTerms to payment_terms');
    } else {
      console.log('Neither column exists. Creating payment_terms column...');
      await sequelize.query(`
        ALTER TABLE "Order" 
        ADD COLUMN "payment_terms" VARCHAR(255) DEFAULT '30 days';
      `);
      console.log('✅ Successfully created payment_terms column');
    }
    
    console.log('Fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  }
};

// Run the fix if this script is executed directly
if (require.main === module) {
  fixPaymentTermsColumn()
    .then(() => {
      console.log('Fix script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixPaymentTermsColumn };

