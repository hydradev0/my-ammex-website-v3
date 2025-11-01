const { connectDB, getSequelize } = require('../config/db');

(async () => {
  try {
    await connectDB();
    const sequelize = getSequelize();
    if (!sequelize) throw new Error('Database not connected');
    console.log('Refreshing website analytics materialized views...');
    await sequelize.query('SELECT refresh_website_analytics()');
    console.log('✅ Refreshed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Refresh failed:', err.message);
    process.exit(1);
  }
})();

