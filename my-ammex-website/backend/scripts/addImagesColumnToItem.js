const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addImagesColumnToItem() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding images column to item table...');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Item' AND column_name = 'images'
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Images column already exists in item table');
      return;
    }
    
    // Add the images column as JSONB
    const addColumnQuery = `
      ALTER TABLE "Item" 
      ADD COLUMN images JSONB DEFAULT '[]'::jsonb
    `;
    
    await client.query(addColumnQuery);
    console.log('✅ Successfully added images column to Item table');
    
    // Add an index for better performance on JSONB queries
    const addIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_item_images 
      ON "Item" USING GIN (images)
    `;
    
    await client.query(addIndexQuery);
    console.log('✅ Successfully added GIN index on images column');
    
    // Verify the column was added
    const verifyQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Item' AND column_name = 'images'
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log('📋 Images column details:', verifyResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error adding images column:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addImagesColumnToItem()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
