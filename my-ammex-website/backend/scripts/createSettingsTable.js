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

async function createSettingsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create the settings table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type VARCHAR(50) NOT NULL DEFAULT 'string',
        category VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Table settings created successfully');

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_settings_category 
      ON settings(category);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_settings_setting_key 
      ON settings(setting_key);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_settings_is_active 
      ON settings(is_active);
    `);

    console.log('✅ Indexes created successfully');

    // Check if any records exist
    const [existingRecords] = await sequelize.query(
      'SELECT COUNT(*) as count FROM settings'
    );

    if (parseInt(existingRecords[0].count) === 0) {
      console.log('📝 Inserting default settings...');
      
      // Insert default company settings
      await sequelize.query(`
        INSERT INTO settings (setting_key, setting_value, setting_type, category, description) VALUES
        ('company_name', 'Ammex Corporation', 'string', 'company', 'Company name'),
        ('company_email', 'contact@ammex.com', 'string', 'company', 'Company email address'),
        ('company_phone', '+63 2 1234 5678', 'string', 'company', 'Company phone number'),
        ('company_address', '123 Business Ave, Makati City, Philippines', 'text', 'company', 'Company address'),
        ('company_website', 'www.ammex.com', 'string', 'company', 'Company website'),
        ('company_tax_id', '123-456-789', 'string', 'company', 'Company tax ID'),
        ('company_description', 'Leading provider of quality products and services', 'text', 'company', 'Company description'),
        ('company_logo_url', '', 'string', 'company', 'Company logo URL'),
        
        ('markup_enabled', 'true', 'boolean', 'markup', 'Enable markup on products'),
        ('markup_rate', '20', 'number', 'markup', 'Markup percentage'),
        ('markup_type', 'percentage', 'string', 'markup', 'Markup type: percentage or fixed'),
        ('fixed_markup_amount', '0', 'number', 'markup', 'Fixed markup amount in PHP'),
        
        ('paymongo_enabled', 'true', 'boolean', 'payments', 'Enable PayMongo payment gateway'),
        ('default_currency', 'PHP', 'string', 'payments', 'Default currency code'),
        ('payment_terms', '30 days', 'string', 'payments', 'Default payment terms'),
        
        ('invoice_prefix', 'INV', 'string', 'invoice', 'Invoice number prefix'),
        ('invoice_start_number', '1000', 'number', 'invoice', 'Starting invoice number'),
        ('invoice_footer_text', 'This invoice serves as proof of purchase. For any inquiries, please contact our support team with your invoice number.', 'text', 'invoice', 'Invoice footer text');
      `);

      console.log('✅ Default settings inserted successfully');
    } else {
      console.log('ℹ️  Settings table already has data, skipping default insert');
    }

    console.log('🎉 Settings table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating settings table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createSettingsTable()
    .then(() => {
      console.log('✅ Settings table creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Settings table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createSettingsTable };
