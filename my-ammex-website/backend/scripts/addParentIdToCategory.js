const { connectDB, getModels } = require('../config/db');

// Script to add parentId column to Category table for subcategory support
const addParentIdToCategory = async () => {
  try {
    console.log('Starting migration: Adding parentId to Category table...');
    
    // Initialize database connection first
    await connectDB();
    const models = getModels();
    const sequelize = models.Category.sequelize;
    
    // First, sync the database to create all tables
    console.log('Syncing database to create tables...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables created/updated');
    
    // List all tables to see what exists
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('Available tables:', tables.map(t => t.table_name));
    
    // Find the correct table name (could be 'Categories', 'categories', etc.)
    const categoryTable = tables.find(t => 
      t.table_name.toLowerCase().includes('categor')
    );
    
    if (!categoryTable) {
      throw new Error('Category table not found in database');
    }
    
    const tableName = categoryTable.table_name;
    console.log(`Using table: ${tableName}`);
    
    // Check if parentId column already exists
    const tableInfo = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' AND column_name = 'parentId';
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (tableInfo.length > 0) {
      console.log('✅ parentId column already exists, skipping migration');
      return;
    }
    
    // Add parentId column to Category table
    console.log('Adding parentId column...');
    await sequelize.query(`
      ALTER TABLE "${tableName}" 
      ADD COLUMN "parentId" INTEGER REFERENCES "${tableName}"("id") ON DELETE SET NULL;
    `);
    
    console.log('✅ Successfully added parentId column to Category table');
    
    // Update the unique constraint to allow duplicate names for different parent categories
    // First, drop the existing unique constraint on name
    await sequelize.query(`
      ALTER TABLE "${tableName}" 
      DROP CONSTRAINT IF EXISTS "${tableName}_name_key";
    `);
    
    // Add a new unique constraint that allows duplicate names only if they have different parentId
    await sequelize.query(`
      ALTER TABLE "${tableName}" 
      ADD CONSTRAINT "${tableName}_name_parentId_unique" 
      UNIQUE ("name", "parentId");
    `);
    
    console.log('✅ Successfully updated unique constraint for name + parentId combination');
    
    console.log('Migration completed successfully!');
    console.log('Categories can now have subcategories with the same name under different parents.');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  addParentIdToCategory()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addParentIdToCategory };
