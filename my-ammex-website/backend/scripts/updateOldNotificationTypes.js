const { connectDB, getSequelize } = require('../config/db');

const updateOldNotificationTypes = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }

    console.log('🔄 Updating old notification types...');

    // First, let's see what old types exist
    const [oldTypes] = await sequelize.query(`
      SELECT type, COUNT(*) as count 
      FROM "Notification" 
      WHERE type NOT IN ('invoice_overdue', 'order_rejected', 'order_appeal', 'order_approved', 'stock_low', 'stock_high', 'general')
      GROUP BY type
    `);
    
    console.log('Old notification types found:');
    oldTypes.forEach(row => console.log(`- ${row.type}: ${row.count} notifications`));

    // Update old inventory notification types to new ones
    const updates = [
      { old: 'inventory_low_stock', new: 'stock_low' },
      { old: 'inventory_high_stock', new: 'stock_high' },
      { old: 'payment_rejected', new: 'general' },
      { old: 'payment_approved', new: 'general' }
    ];

    for (const update of updates) {
      try {
        const [result] = await sequelize.query(`
          UPDATE "Notification" 
          SET type = :newType 
          WHERE type = :oldType
        `, {
          replacements: { 
            newType: update.new, 
            oldType: update.old 
          }
        });
        
        console.log(`✅ Updated ${update.old} → ${update.new}: ${result[1]} rows affected`);
      } catch (error) {
        console.log(`⚠️  Error updating ${update.old}: ${error.message}`);
      }
    }

    // Check final result
    const [finalTypes] = await sequelize.query(`
      SELECT DISTINCT type FROM "Notification" ORDER BY type
    `);
    
    console.log('\n✅ Final notification types in database:');
    finalTypes.forEach((row, i) => console.log(`${i+1}. ${row.type}`));

    console.log('\n🎉 Notification type update completed successfully!');

  } catch (error) {
    console.error('❌ Error during notification type update:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  updateOldNotificationTypes()
    .then(() => {
      console.log('Update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}

module.exports = updateOldNotificationTypes;
