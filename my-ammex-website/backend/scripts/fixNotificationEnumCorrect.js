const { connectDB, getSequelize } = require('../config/db');

/**
 * Migration script to fix Notification table enum values
 * This script updates the database to match the model enum values
 */
const fixNotificationEnumCorrect = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }

    console.log('🔄 Starting notification enum fix...');

    // Check what enum types exist
    const [enumTypes] = await sequelize.query(`
      SELECT t.typname as enum_name, e.enumlabel as enum_value 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname LIKE '%notification%' 
      ORDER BY t.typname, e.enumsortorder
    `);
    
    console.log('Existing notification enums:');
    enumTypes.forEach(row => console.log(`- ${row.enum_name}: ${row.enum_value}`));

    // Check the actual column type being used
    const [columnInfo] = await sequelize.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'Notification' AND column_name = 'type'
    `);
    
    console.log('Column info:', columnInfo);

    // The database is using enum_notification_type (lowercase)
    // We need to add the missing values to this enum
    const missingValues = ['stock_low', 'stock_high'];
    
    for (const value of missingValues) {
      try {
        await sequelize.query(`
          ALTER TYPE enum_notification_type ADD VALUE IF NOT EXISTS '${value}'
        `);
        console.log(`✅ Added enum value: ${value}`);
      } catch (addError) {
        if (addError.message.includes('already exists')) {
          console.log(`ℹ️  Enum value '${value}' already exists`);
        } else {
          console.log(`⚠️  Error adding '${value}':`, addError.message);
        }
      }
    }

    // Verify the final result
    const [finalCheck] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_notification_type)) as enum_value
      ORDER BY enum_value
    `);
    
    console.log('\n✅ Final enum values in database:');
    finalCheck.forEach((row, i) => console.log(`${i+1}. ${row.enum_value}`));

    console.log('\n🎉 Notification enum fix completed successfully!');

  } catch (error) {
    console.error('❌ Error during notification enum fix:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  fixNotificationEnumCorrect()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = fixNotificationEnumCorrect;
