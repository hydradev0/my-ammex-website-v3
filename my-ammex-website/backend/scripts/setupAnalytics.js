const { connectDB, getSequelize, closeDB } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupAnalytics() {
  try {
    console.log('🚀 Setting up analytics database schema...');
    await connectDB();
    const sequelize = getSequelize();
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'createAnalyticsSchema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    await sequelize.query(sql);
    
    console.log('✅ Analytics schema created successfully!');
    console.log('📊 Created tables: sales_fact_monthly');
    console.log('📈 Created views: v_sales_monthly');
    console.log('🔧 Created functions: refresh_sales_fact_monthly()');
    console.log('📝 Sample data inserted for testing');
    
    // Test the table
    const [result] = await sequelize.query('SELECT COUNT(*)::int as count FROM sales_fact_monthly');
    
    console.log(`📋 Table contains ${result[0].count} sample records`);
    
  } catch (error) {
    console.error('❌ Error setting up analytics schema:', error.message);
    console.error('💡 Make sure your database is running and accessible');
  } finally {
    await closeDB();
  }
}

setupAnalytics();
