const { connectDB, getModels, getSequelize } = require('../config/db');

const createProductDiscountsTable = async () => {
  try {
    console.log('🔄 Connecting to database...');
    
    // First establish database connection
    await connectDB();
    
    console.log('🔄 Creating ProductDiscount table...');
    
    const sequelize = getSequelize();
    const models = getModels();
    
    if (!models) {
      throw new Error('Database connection not established. Please check your DATABASE_URL in .env file.');
    }
    
    const { ProductDiscount } = models;

    // Create ProductDiscount table
    await ProductDiscount.sync({ force: false });
    console.log('✅ ProductDiscount table created/verified');

    // Create additional indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_product_discounts_item_id ON "ProductDiscount"(item_id);
      CREATE INDEX IF NOT EXISTS idx_product_discounts_is_active ON "ProductDiscount"(is_active);
      CREATE INDEX IF NOT EXISTS idx_product_discounts_dates ON "ProductDiscount"(start_date, end_date);
    `);
    console.log('✅ Indexes created');

    // Create constraint for date validation
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE "ProductDiscount"
        ADD CONSTRAINT check_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log('✅ Date constraint created');

    console.log('🎉 ProductDiscount table setup completed successfully!');
    
    console.log('📋 ProductDiscount table structure:');
    console.log('   - id (Primary Key)');
    console.log('   - item_id (Foreign Key to Item)');
    console.log('   - discount_percentage (0.01-100)');
    console.log('   - start_date (Optional)');
    console.log('   - end_date (Optional)');
    console.log('   - is_active (Boolean, default true)');
    console.log('   - created_by (Foreign Key to User)');
    console.log('   - created_at, updated_at');

  } catch (error) {
    console.error('❌ Error creating ProductDiscount table:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  createProductDiscountsTable()
    .then(() => {
      console.log('✅ ProductDiscount table creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ ProductDiscount table creation failed:', error);
      process.exit(1);
    });
}

module.exports = createProductDiscountsTable;

