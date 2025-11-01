const fs = require('fs');
const path = require('path');
const { getSequelize, connectDB } = require('../config/db');

(async () => {
  try {
    await connectDB();
    const sequelize = getSequelize();
    if (!sequelize) {
      throw new Error('Database not connected. Set DATABASE_URL in .env');
    }

    const sqlPath = path.resolve(__dirname, 'createWebsiteAnalytics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running website analytics schema setup...');
    await sequelize.query(sql);
    console.log('✅ Website analytics schema created/refreshed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to setup website analytics schema:', err.message);
    process.exit(1);
  }
})();


