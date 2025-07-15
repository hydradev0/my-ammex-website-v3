const { connectDB, models } = require('../config/db');

const createAdminUser = async () => {
  try {
    await connectDB();
    
    if (!models) {
      console.log('❌ Database not connected. Please check your DATABASE_URL in .env file');
      return;
    }

    const { User } = models;

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@ammex.com' } });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@ammex.com',
      password: 'admin123',
      role: 'admin',
      department: 'Administration',
      isActive: true
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@ammex.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    process.exit(0);
  }
};

createAdminUser(); 