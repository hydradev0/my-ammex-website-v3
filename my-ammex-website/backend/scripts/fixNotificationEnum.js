const { connectDB, getSequelize } = require('../config/db');

/**
 * Migration script to fix Notification table enum values
 * This script updates the database to match the model enum values
 */
const fixNotificationEnum = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }

    console.log('🔄 Starting notification enum fix...');

    // First, let's check the current table structure
    const [tableInfo] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Notification' AND column_name = 'type'
    `);

    console.log('Current table structure:', tableInfo);

    // Check if it's using CHECK constraint or ENUM
    const [constraints] = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = '"Notification"'::regclass 
      AND conname LIKE '%type%'
    `);

    console.log('Current constraints:', constraints);

    // Drop the existing CHECK constraint if it exists
    try {
      await sequelize.query(`
        ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_type_check"
      `);
      console.log('✅ Dropped existing CHECK constraint');
    } catch (error) {
      console.log('ℹ️  No existing CHECK constraint to drop');
    }

    // Create the ENUM type if it doesn't exist
    try {
      await sequelize.query(`
        CREATE TYPE enum_Notification_type AS ENUM (
          'invoice_overdue',
          'order_rejected',
          'order_appeal',
          'order_approved',
          'stock_low',
          'stock_high',
          'general'
        )
      `);
      console.log('✅ Created enum_Notification_type');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Enum type already exists, updating values...');
        
        // Add new enum values
        const newValues = [
          'order_rejected',
          'order_appeal', 
          'order_approved',
          'stock_low',
          'stock_high'
        ];

        for (const value of newValues) {
          try {
            await sequelize.query(`
              ALTER TYPE enum_Notification_type ADD VALUE IF NOT EXISTS '${value}'
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
      } else {
        throw error;
      }
    }

    // Change the column type to use the ENUM
    try {
      await sequelize.query(`
        ALTER TABLE "Notification" 
        ALTER COLUMN "type" TYPE enum_Notification_type 
        USING "type"::enum_Notification_type
      `);
      console.log('✅ Updated column to use ENUM type');
    } catch (error) {
      console.log('⚠️  Error updating column type:', error.message);
      
      // If there are existing values that don't match, we might need to handle them
      if (error.message.includes('invalid input value')) {
        console.log('ℹ️  Some existing values don\'t match the new enum. Checking existing data...');
        
        const [existingValues] = await sequelize.query(`
          SELECT DISTINCT "type" FROM "Notification"
        `);
        
        console.log('Existing values in database:', existingValues);
        
        // Update any invalid values to 'general' and remove payment notifications
        await sequelize.query(`
          UPDATE "Notification" 
          SET "type" = 'general' 
          WHERE "type" IN ('payment_rejected', 'payment_approved')
          OR "type" NOT IN (
            'invoice_overdue', 'order_rejected', 'order_appeal', 
            'order_approved', 'stock_low', 'stock_high', 'general'
          )
        `);
        
        console.log('✅ Updated invalid values to "general"');
        
        // Try again to change the column type
        await sequelize.query(`
          ALTER TABLE "Notification" 
          ALTER COLUMN "type" TYPE enum_Notification_type 
          USING "type"::enum_Notification_type
        `);
        console.log('✅ Successfully updated column to use ENUM type');
      }
    }

    // Verify the final result
    const [finalCheck] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_Notification_type)) as enum_value
    `);
    
    console.log('\n✅ Final enum values in database:');
    finalCheck.forEach(row => console.log(`- ${row.enum_value}`));

    console.log('\n🎉 Notification enum fix completed successfully!');

  } catch (error) {
    console.error('❌ Error during notification enum fix:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  fixNotificationEnum()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = fixNotificationEnum;
