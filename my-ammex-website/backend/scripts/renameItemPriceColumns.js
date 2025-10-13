const { connectDB, getSequelize } = require('../config/db');

const renameItemPriceColumns = async () => {
  try {
    await connectDB();

    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database not connected. Please ensure the database is running.');
      return;
    }

    console.log('🔄 Ensuring Item pricing columns are renamed and data preserved...');

    // Log current columns BEFORE changes
    const [beforeCols] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Item'
      ORDER BY column_name;
    `);
    console.log('📋 Columns BEFORE:', beforeCols.map(r => r.column_name).join(', '));

    // Handle selling_price
    const [sellingLog] = await sequelize.query(`
      DO $$
      BEGIN
        -- Case 1: Both price and selling_price exist -> copy then drop old
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Item' AND column_name = 'price'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Item' AND column_name = 'selling_price'
        ) THEN
          EXECUTE 'UPDATE "Item" SET "selling_price" = COALESCE("selling_price", "price")';
          EXECUTE 'ALTER TABLE "Item" DROP COLUMN IF EXISTS "price"';
          RAISE NOTICE 'Handled selling_price: copied from price and dropped price.';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Item' AND column_name = 'price'
        ) THEN
          -- Case 2: Only price exists -> rename to selling_price
          EXECUTE 'ALTER TABLE "Item" RENAME COLUMN "price" TO "selling_price"';
          RAISE NOTICE 'Handled selling_price: renamed price to selling_price.';
        ELSE
          RAISE NOTICE 'Handled selling_price: no changes needed.';
        END IF;
      END
      $$;
    `);

    // Handle supplier_price
    const [supplierLog] = await sequelize.query(`
      DO $$
      BEGIN
        -- Case 1: Both floor_price and supplier_price exist -> copy then drop old
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Item' AND column_name = 'floor_price'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Item' AND column_name = 'supplier_price'
        ) THEN
          EXECUTE 'UPDATE "Item" SET "supplier_price" = COALESCE("supplier_price", "floor_price")';
          EXECUTE 'ALTER TABLE "Item" DROP COLUMN IF EXISTS "floor_price"';
          RAISE NOTICE 'Handled supplier_price: copied from floor_price and dropped floor_price.';
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Item' AND column_name = 'floor_price'
        ) THEN
          -- Case 2: Only floor_price exists -> rename to supplier_price
          EXECUTE 'ALTER TABLE "Item" RENAME COLUMN "floor_price" TO "supplier_price"';
          RAISE NOTICE 'Handled supplier_price: renamed floor_price to supplier_price.';
        ELSE
          RAISE NOTICE 'Handled supplier_price: no changes needed.';
        END IF;
      END
      $$;
    `);

    // Log current columns AFTER changes
    const [afterCols] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Item'
      ORDER BY column_name;
    `);
    console.log('📋 Columns AFTER:', afterCols.map(r => r.column_name).join(', '));

    console.log('✅ Column rename completed.');

    await sequelize.close();
    console.log('✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error renaming columns:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

if (require.main === module) {
  renameItemPriceColumns()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { renameItemPriceColumns };
