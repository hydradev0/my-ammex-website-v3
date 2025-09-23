const { connectDB, getSequelize } = require('../config/db');

const checkTables = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }
    
    console.log('📊 Checking existing tables...');
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('✅ Existing tables:');
    results.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    process.exit(0);
  }
};

checkTables();
