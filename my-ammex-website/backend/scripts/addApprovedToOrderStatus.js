const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const addApprovedToOrderStatus = async () => {
  try {
    console.log('🔄 Connecting to database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    // Create sequelize instance
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false
    });

    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    console.log('🔄 Adding "approved" to Order status enum...');

    // Add "approved" to the enum
    await sequelize.query(`
      ALTER TYPE "enum_Order_status" ADD VALUE IF NOT EXISTS 'approved';
    `);

    await sequelize.close();

    console.log('✅ "approved" status added to Order enum successfully!');
    console.log('📋 Available order statuses: pending, approved, rejected, cancelled');

  } catch (error) {
    console.error('❌ Error adding approved to Order status enum:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  addApprovedToOrderStatus()
    .then(() => {
      console.log('✅ Order status enum update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Order status enum update failed:', error);
      process.exit(1);
    });
}

module.exports = addApprovedToOrderStatus;
