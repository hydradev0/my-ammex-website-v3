const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' 
      ? { require: true, rejectUnauthorized: false }
      : false
  }
});

async function createPayMongoPaymentMethodsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create the table using raw SQL
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS paymongo_payment_methods (
        id SERIAL PRIMARY KEY,
        method_key VARCHAR(50) NOT NULL UNIQUE,
        method_name VARCHAR(100) NOT NULL,
        description TEXT,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        processing_time VARCHAR(50) NOT NULL DEFAULT 'Instant',
        fees VARCHAR(100) NOT NULL DEFAULT 'No additional fees',
        color VARCHAR(20) NOT NULL DEFAULT 'blue',
        icon VARCHAR(50) NOT NULL DEFAULT 'CreditCard',
        min_amount DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
        max_amount DECIMAL(10, 2) NOT NULL DEFAULT 100000.00,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Table paymongo_payment_methods created successfully');

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_paymongo_payment_methods_is_enabled 
      ON paymongo_payment_methods(is_enabled);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_paymongo_payment_methods_sort_order 
      ON paymongo_payment_methods(sort_order);
    `);

    console.log('✅ Indexes created successfully');

    // Check if any records exist
    const [existingRecords] = await sequelize.query(
      'SELECT COUNT(*) as count FROM paymongo_payment_methods'
    );

    if (parseInt(existingRecords[0].count) === 0) {
      console.log('📝 Seeding default PayMongo payment methods...');

      // Insert default payment methods
      await sequelize.query(`
        INSERT INTO paymongo_payment_methods 
        (method_key, method_name, description, is_enabled, processing_time, fees, color, icon, min_amount, max_amount, sort_order)
        VALUES
        ('card', 'Credit/Debit Card', 'Pay securely with your credit or debit card', true, 'Instant', 'No additional fees', 'blue', 'CreditCard', 1.00, 100000.00, 1),
        ('gcash', 'GCash', 'Pay using your GCash wallet', true, 'Instant', 'No additional fees', 'blue', 'Smartphone', 1.00, 100000.00, 2),
        ('grab_pay', 'GrabPay', 'Pay using your GrabPay wallet', true, 'Instant', 'No additional fees', 'green', 'Smartphone', 1.00, 100000.00, 3),
        ('paymaya', 'PayMaya', 'Pay using your PayMaya account', true, 'Instant', 'No additional fees', 'green', 'Smartphone', 1.00, 100000.00, 4),
        ('billease', 'BillEase', 'Buy now, pay later with BillEase', false, '1-2 business days', 'Check BillEase for fees', 'purple', 'FileText', 1.00, 100000.00, 5),
        ('dob', 'Online Banking', 'Pay directly from your bank account', true, '1-2 business days', 'No additional fees', 'indigo', 'Building', 1.00, 100000.00, 6),
        ('dob_ubp', 'UnionBank Online', 'Pay using UnionBank online banking', true, '1-2 business days', 'No additional fees', 'red', 'Building', 1.00, 100000.00, 7)
        ON CONFLICT (method_key) DO NOTHING;
      `);

      console.log('✅ Default payment methods seeded successfully');
    } else {
      console.log(`ℹ️  Table already contains ${existingRecords[0].count} records. Skipping seeding.`);
    }

    // Display current payment methods
    const [paymentMethods] = await sequelize.query(`
      SELECT method_key, method_name, is_enabled, sort_order 
      FROM paymongo_payment_methods 
      ORDER BY sort_order
    `);

    console.log('\n📋 Current PayMongo Payment Methods:');
    console.table(paymentMethods);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
createPayMongoPaymentMethodsTable()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

