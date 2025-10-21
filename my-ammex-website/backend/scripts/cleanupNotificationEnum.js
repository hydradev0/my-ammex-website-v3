const { connectDB, getSequelize } = require('../config/db');

const cleanupNotificationEnum = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }

    console.log('🔄 Cleaning up notification enum...');

    // First, let's see what we have
    const [currentEnum] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::"enum_Notification_type")) as enum_value
      ORDER BY enum_value
    `);
    
    console.log('Current enum values:');
    currentEnum.forEach((row, i) => console.log(`${i+1}. ${row.enum_value}`));

    // Update any remaining old values to new ones
    const updates = [
      { old: 'inventory_low_stock', new: 'stock_low' },
      { old: 'inventory_overstock', new: 'stock_high' }
    ];

    for (const update of updates) {
      try {
        const [result] = await sequelize.query(`
          UPDATE "Notification" 
          SET type = :newType::"enum_Notification_type"
          WHERE type::text = :oldType
        `, {
          replacements: { 
            newType: update.new, 
            oldType: update.old 
          }
        });
        
        console.log(`✅ Updated ${update.old} → ${update.new}: ${result[1]} rows affected`);
      } catch (error) {
        console.log(`ℹ️  No ${update.old} notifications to update: ${error.message}`);
      }
    }

    // Check what notification types exist now
    const [notificationTypes] = await sequelize.query(`
      SELECT DISTINCT type FROM "Notification" ORDER BY type
    `);
    
    console.log('\n✅ Current notification types in database:');
    notificationTypes.forEach((row, i) => console.log(`${i+1}. ${row.type}`));

    // Show final enum values
    const [finalEnum] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::"enum_Notification_type")) as enum_value
      ORDER BY enum_value
    `);
    
    console.log('\n✅ Final enum values:');
    finalEnum.forEach((row, i) => console.log(`${i+1}. ${row.enum_value}`));

    console.log('\n🎉 Notification enum cleanup completed!');
    console.log('Note: PostgreSQL does not allow removing enum values, but all data has been updated to use the correct values.');

  } catch (error) {
    console.error('❌ Error during notification enum cleanup:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  cleanupNotificationEnum()
    .then(() => {
      console.log('Cleanup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupNotificationEnum;
