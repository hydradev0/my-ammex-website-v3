const { connectDB, getModels } = require('../config/db');

const usersToSeed = [
  { name: 'Admin User', email: 'admin@ammex.com', password: 'admin123', role: 'Admin', department: 'Administration' },
  { name: 'Sales Marketing User', email: 'sales@ammex.com', password: 'sales123', role: 'Sales Marketing', department: 'Sales' },
  { name: 'Warehouse Supervisor User', email: 'warehouse@ammex.com', password: 'warehouse123', role: 'Warehouse Supervisor', department: 'Warehouse' },
  { name: 'Client User', email: 'client@ammex.com', password: 'client123', role: 'Client', department: 'Client Services' }
];

const createRoleUsers = async () => {
  try {
    await connectDB();
    const { User } = getModels();

    for (const data of usersToSeed) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) {
        console.log(`✅ User already exists: ${data.email}`);
        continue;
      }
      await User.create(data);
      console.log(`✅ Created user: ${data.email}`);
    }

    console.log('🎉 Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

module.exports = { createRoleUsers };

if (require.main === module) {
  createRoleUsers();
}


