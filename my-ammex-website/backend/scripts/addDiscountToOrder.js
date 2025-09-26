const { connectDB, getSequelize } = require('../config/db');

async function addDiscountToOrder() {
  try {
    console.log('Adding discount fields to Order table...');
    
    // Connect to database
    await connectDB();
    const sequelize = getSequelize();
    
    // Add discount percentage and discount amount columns
    await sequelize.query(`
      ALTER TABLE "Order" 
      ADD COLUMN "discount_percent" DECIMAL(5,2) DEFAULT 0.00,
      ADD COLUMN "discount_amount" DECIMAL(10,2) DEFAULT 0.00,
      ADD COLUMN "final_amount" DECIMAL(10,2);
    `);
    
    // Update existing orders to have final_amount = total_amount (no discount applied)
    await sequelize.query(`
      UPDATE "Order" 
      SET "final_amount" = "total_amount" 
      WHERE "final_amount" IS NULL;
    `);
    
    // Make final_amount NOT NULL after setting values
    await sequelize.query(`
      ALTER TABLE "Order" 
      ALTER COLUMN "final_amount" SET NOT NULL;
    `);
    
    console.log('✅ Successfully added discount fields to Order table');
    console.log('✅ Updated existing orders with finalAmount = totalAmount');
    
  } catch (error) {
    console.error('❌ Error adding discount fields to Order table:', error);
    throw error;
  }
}

// Run the migration
addDiscountToOrder()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
