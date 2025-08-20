const { connectDB, getModels } = require('../config/db');

const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Connect to database
    await connectDB();
    
    const models = getModels();
    if (!models) {
      console.log('❌ Database models not available');
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📊 Available models:');
    
    Object.keys(models).forEach(modelName => {
      if (modelName !== 'Sequelize') {
        console.log(`   - ${modelName}`);
      }
    });
    
    // Test a simple query
    const { User } = models;
    const userCount = await User.count();
    console.log(`\n👥 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role'],
        limit: 5
      });
      
      console.log('\n📋 Sample users:');
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testConnection();
