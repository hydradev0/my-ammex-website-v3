const { connectDB, getSequelize } = require('../config/db');

const finalNotificationEnumFix = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }

    console.log('🔄 Final notification enum fix...');

    // Add missing values to the correct enum type (enum_Notification_type with capital N)
    const missingValues = ['stock_low', 'stock_high'];
    
    for (const value of missingValues) {
      try {
        await sequelize.query(`
          ALTER TYPE "enum_Notification_type" ADD VALUE IF NOT EXISTS '${value}'
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

    // Now update any old notification types
    try {
      // Update inventory_low_stock to stock_low
      await sequelize.query(`
        UPDATE "Notification" 
        SET type = 'stock_low'::"enum_Notification_type"
        WHERE type::text = 'inventory_low_stock'
      `);
      console.log('✅ Updated inventory_low_stock → stock_low');
    } catch (error) {
      console.log('ℹ️  No inventory_low_stock notifications to update');
    }

    try {
      // Update inventory_high_stock to stock_high
      await sequelize.query(`
        UPDATE "Notification" 
        SET type = 'stock_high'::"enum_Notification_type"
        WHERE type::text = 'inventory_high_stock'
      `);
      console.log('✅ Updated inventory_high_stock → stock_high');
    } catch (error) {
      console.log('ℹ️  No inventory_high_stock notifications to update');
    }

    // Verify the final result
    const [finalCheck] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::"enum_Notification_type")) as enum_value
      ORDER BY enum_value
    `);
    
    console.log('\n✅ Final enum values in database:');
    finalCheck.forEach((row, i) => console.log(`${i+1}. ${row.enum_value}`));

    // Check what notification types exist now
    const [notificationTypes] = await sequelize.query(`
      SELECT DISTINCT type FROM "Notification" ORDER BY type
    `);
    
    console.log('\n✅ Current notification types in database:');
    notificationTypes.forEach((row, i) => console.log(`${i+1}. ${row.type}`));

    console.log('\n🎉 Final notification enum fix completed successfully!');

  } catch (error) {
    console.error('❌ Error during final notification enum fix:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  finalNotificationEnumFix()
    .then(() => {
      console.log('Fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = finalNotificationEnumFix;
