const { connectDB, getSequelize } = require('../config/db');

const fixPaymentTableNames = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }
    
    console.log('📊 Fixing payment table names...');
    
    // Drop existing tables with incorrect names
    console.log('🗑️ Dropping existing payment tables...');
    await sequelize.query('DROP TABLE IF EXISTS "payment_history" CASCADE;');
    console.log('✓ Dropped payment_history table');
    
    await sequelize.query('DROP TABLE IF EXISTS "notification" CASCADE;');
    console.log('✓ Dropped notification table');
    
    await sequelize.query('DROP TABLE IF EXISTS "payment" CASCADE;');
    console.log('✓ Dropped payment table');
    
    // Create tables with correct names
    console.log('🏗️ Creating tables with correct names...');
    
    // Create Payment table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id" SERIAL PRIMARY KEY,
        "payment_number" VARCHAR(255) NOT NULL UNIQUE,
        "invoice_id" INTEGER NOT NULL REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "customer_id" INTEGER NOT NULL REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "amount" DECIMAL(10,2) NOT NULL CHECK ("amount" > 0),
        "payment_method" VARCHAR(255) NOT NULL,
        "reference" VARCHAR(255),
        "notes" TEXT,
        "status" VARCHAR(255) NOT NULL DEFAULT 'pending_approval' CHECK ("status" IN ('pending_approval', 'approved', 'rejected')),
        "rejection_reason" TEXT,
        "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "reviewed_at" TIMESTAMP WITH TIME ZONE,
        "reviewed_by" INTEGER REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "attachments" JSON DEFAULT '[]',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Payment table created');
    
    // Create PaymentHistory table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "PaymentHistory" (
        "id" SERIAL PRIMARY KEY,
        "payment_id" INTEGER REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "invoice_id" INTEGER NOT NULL REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "customer_id" INTEGER NOT NULL REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "action" VARCHAR(255) NOT NULL CHECK ("action" IN ('submitted', 'approved', 'rejected', 'manual_entry', 'refund')),
        "amount" DECIMAL(10,2) NOT NULL,
        "payment_method" VARCHAR(255),
        "reference" VARCHAR(255),
        "notes" TEXT,
        "performed_by" INTEGER REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ PaymentHistory table created');
    
    // Create Notification table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" SERIAL PRIMARY KEY,
        "customer_id" INTEGER NOT NULL REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "type" VARCHAR(255) NOT NULL CHECK ("type" IN ('payment_rejected', 'payment_approved', 'invoice_overdue', 'general')),
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSON,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Notification table created');
    
    console.log('✅ All payment tables created with correct names!');
    
  } catch (error) {
    console.error('Error fixing payment table names:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  fixPaymentTableNames()
    .then(() => {
      console.log('Payment table names fixed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to fix payment table names:', error);
      process.exit(1);
    });
}

module.exports = fixPaymentTableNames;
