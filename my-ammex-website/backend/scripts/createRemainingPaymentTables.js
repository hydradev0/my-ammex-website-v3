const { connectDB, getSequelize } = require('../config/db');

const createRemainingTables = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const sequelize = getSequelize();
    if (!sequelize) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }
    
    console.log('📊 Creating remaining payment tables...');
    
    // Create payment_history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "payment_history" (
        "id" SERIAL PRIMARY KEY,
        "payment_id" INTEGER REFERENCES "payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
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
    console.log('✓ payment_history table created/verified');
    
    // Create notification table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "notification" (
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
    console.log('✓ notification table created/verified');
    
    console.log('✅ All remaining payment tables created successfully!');
    
  } catch (error) {
    console.error('Error creating remaining tables:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createRemainingTables()
    .then(() => {
      console.log('Remaining payment tables setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Remaining payment tables setup failed:', error);
      process.exit(1);
    });
}

module.exports = createRemainingTables;
