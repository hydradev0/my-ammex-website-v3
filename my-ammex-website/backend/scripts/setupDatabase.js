const { connectDB, getSequelize } = require('../config/db');

const setupDatabase = async () => {
  try {
    console.log('🚀 Setting up database...');
    
    // Connect to database
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }
    
    // Sync all models (this will create all tables)
    console.log('📊 Creating database tables...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created successfully');
    
    // Create initial admin user
    console.log('👤 Creating initial admin user...');
    const { createAdminUser } = require('./createAdminUser');
    await createAdminUser();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Login with admin@ammex.com / admin123');
    console.log('   3. Change the default password');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
};

// Run the setup
setupDatabase();
