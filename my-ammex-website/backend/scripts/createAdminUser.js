const { connectDB, getModels } = require('../config/db');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();
    
    const { User } = getModels();
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@ammex.com' } 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }
    
    // Create admin user
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@ammex.com',
      password: 'admin123', // This will be hashed by the model hooks
      role: 'Admin',
      department: 'Administration',
      isActive: true
    });
    
    console.log('✅ Admin user created successfully:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Department: ${adminUser.department}`);
    console.log('\n⚠️  IMPORTANT: Change the default password in production!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

// Export for reuse and allow running directly
module.exports = { createAdminUser };

if (require.main === module) {
  createAdminUser();
}