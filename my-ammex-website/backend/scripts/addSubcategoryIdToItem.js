const { connectDB, getSequelize } = require('../config/db');

async function addSubcategoryIdToItem() {
  try {
    // Connect to database first
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      throw new Error('Database connection not available');
    }
    
    console.log('Adding subcategory_id column to items table...');
    
    // Add the subcategory_id column to the items table
    await sequelize.query(`
      ALTER TABLE "Item" 
      ADD COLUMN IF NOT EXISTS "subcategory_id" INTEGER 
      REFERENCES "Category"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE;
    `);
    
    console.log('✅ Successfully added subcategory_id column to items table');
    
    // Add an index for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_items_subcategory_id" 
      ON "Item"("subcategory_id");
    `);
    
    console.log('✅ Successfully created index for subcategory_id');
    
  } catch (error) {
    console.error('❌ Error adding subcategory_id column:', error.message);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addSubcategoryIdToItem()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addSubcategoryIdToItem;
