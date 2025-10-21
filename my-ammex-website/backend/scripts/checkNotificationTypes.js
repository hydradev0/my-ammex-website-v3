const { connectDB, getSequelize } = require('../config/db');

const checkNotificationTypes = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }

    // Check what notification types exist in the database
    const [results] = await sequelize.query(`
      SELECT DISTINCT type FROM "Notification" ORDER BY type
    `);
    
    console.log('Current notification types in database:');
    results.forEach((row, i) => console.log(`${i+1}. ${row.type}`));

    // Check if there are any with old names
    const [oldTypes] = await sequelize.query(`
      SELECT COUNT(*) as count FROM "Notification" 
      WHERE type IN ('inventory_low_stock', 'inventory_high_stock')
    `);
    
    console.log(`\nNotifications with old names: ${oldTypes[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkNotificationTypes();
