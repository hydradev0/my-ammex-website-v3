const { getSequelize, connectDB } = require('../config/db');

const setupCustomerBulkAnalytics = async () => {
  try {
    await connectDB();
    const sequelize = getSequelize();
    
    console.log('🔧 Setting up customer bulk analytics...');
    
    // Step 1: Create the customer_bulk_monthly_by_name table
    console.log('\n📊 Creating customer_bulk_monthly_by_name table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS customer_bulk_monthly_by_name (
        id SERIAL PRIMARY KEY,
        month_start DATE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        bulk_orders_count INTEGER NOT NULL DEFAULT 0,
        bulk_orders_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
        average_bulk_order_value NUMERIC(15,2) NOT NULL DEFAULT 0,
        model_no VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add unique constraint to prevent duplicates
    await sequelize.query(`
      ALTER TABLE customer_bulk_monthly_by_name 
      ADD CONSTRAINT customer_bulk_monthly_by_name_month_customer_key 
      UNIQUE (month_start, customer_name);
    `).catch(() => {
      console.log('⚠️  Unique constraint already exists');
    });
    
    // Add indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_bulk_monthly_by_name_month_start 
      ON customer_bulk_monthly_by_name (month_start);
    `).catch(() => {
      console.log('⚠️  Index already exists');
    });
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_bulk_monthly_by_name_amount
      ON customer_bulk_monthly_by_name (bulk_orders_amount);
    `).catch(() => {
      console.log('⚠️  Index already exists');
    });
    
    console.log('✅ customer_bulk_monthly_by_name table created successfully');
    
    // Step 2: Drop and recreate view for top customers by bulk orders
    console.log('\n📋 Recreating v_top_customers_monthly view...');

    // First drop the existing view if it exists
    await sequelize.query(`DROP VIEW IF EXISTS v_top_customers_monthly;`).catch(() => {
      console.log('⚠️  View may not exist or already dropped');
    });

    // Create the updated view
    await sequelize.query(`
      CREATE VIEW v_top_customers_monthly AS
      SELECT
        month_start,
        customer_name,
        bulk_orders_count,
        bulk_orders_amount,
        average_bulk_order_value,
        model_no
      FROM customer_bulk_monthly_by_name
      ORDER BY month_start DESC, bulk_orders_amount DESC;
    `);
    
    console.log('✅ v_top_customers_monthly view created successfully');
    
    // Step 3: Check if we have any existing data
    const existingData = await sequelize.query(`
      SELECT COUNT(*) as count FROM customer_bulk_monthly_by_name;
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (existingData[0].count > 0) {
      console.log(`📊 Found ${existingData[0].count} existing records`);
      console.log('🔧 Removing ranking column and updating structure...');

      // Drop ranking column if it exists
      await sequelize.query(`
        ALTER TABLE customer_bulk_monthly_by_name DROP COLUMN IF EXISTS ranking;
      `).catch(() => {
        console.log('⚠️  Ranking column may not exist or already dropped');
      });

      // Add model_no column if it doesn't exist
      await sequelize.query(`
        ALTER TABLE customer_bulk_monthly_by_name ADD COLUMN IF NOT EXISTS model_no VARCHAR(100);
      `).catch(() => {
        console.log('⚠️  Model_no column may already exist');
      });

      console.log('✅ Table structure updated!');
      return;
    }
    
    // Step 4: Generate sample data (since we don't have real bulk order data yet)
    console.log('\n🌱 Generating sample customer bulk data...');
    
    // Sample customer names (you can replace these with real customer names from your database)
    const sampleCustomers = [
      'ABC Manufacturing Corp',
      'XYZ Industrial Supplies',
      'Tech Solutions Ltd',
      'Global Hardware Inc',
      'Premium Tools Co',
      'Industrial Systems Ltd',
      'Advanced Materials Inc',
      'Professional Equipment Co',
      'Smart Manufacturing Ltd',
      'Elite Industrial Group'
    ];
    
    const sampleData = [];
    
    // Generate data for October, November, December 2024
    const months = ['2024-10-01', '2024-11-01', '2024-12-01'];
    
    months.forEach((month, monthIndex) => {
      // Generate customers with varying performance levels
      const customersWithPerformance = sampleCustomers.map((customer, index) => {
        const bulkOrdersCount = Math.floor(Math.random() * 15) + 5; // 5-19 bulk orders
        const bulkOrdersAmount = Math.floor(Math.random() * 500000) + 100000; // 100k-600k
        const averageBulkOrderValue = Math.round(bulkOrdersAmount / bulkOrdersCount);

        return {
          customer,
          bulkOrdersCount,
          bulkOrdersAmount,
          averageBulkOrderValue
        };
      });

      // Sort by bulk_orders_amount DESC to get actual top performers
      customersWithPerformance.sort((a, b) => b.bulkOrdersAmount - a.bulkOrdersAmount);

      // Take top 10 customers (no ranking needed)
      customersWithPerformance.slice(0, 10).forEach((customerData) => {
        sampleData.push({
          month_start: month,
          customer_name: customerData.customer,
          bulk_orders_count: customerData.bulkOrdersCount,
          bulk_orders_amount: customerData.bulkOrdersAmount,
          average_bulk_order_value: customerData.averageBulkOrderValue,
          model_no: null // Will be filled later if needed
        });
      });
    });
    
    // Insert sample data
    console.log(`📥 Inserting ${sampleData.length} sample records...`);
    for (const record of sampleData) {
      await sequelize.query(`
        INSERT INTO customer_bulk_monthly_by_name
        (month_start, customer_name, bulk_orders_count, bulk_orders_amount, average_bulk_order_value, model_no)
        VALUES (
          '${record.month_start}',
          '${record.customer_name}',
          ${record.bulk_orders_count},
          ${record.bulk_orders_amount},
          ${record.average_bulk_order_value},
          ${record.model_no ? `'${record.model_no}'` : 'NULL'}
        )
        ON CONFLICT (month_start, customer_name) DO NOTHING;
      `);
    }
    
    // Verify the data was inserted
    const insertedCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM customer_bulk_monthly_by_name;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`✅ Successfully inserted ${insertedCount[0].count} records`);

    // Fix rankings to ensure they correspond to actual performance
    console.log('\n🔧 Fixing customer rankings to match performance...');
    await sequelize.query(`
      WITH ranked_customers AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY month_start
            ORDER BY bulk_orders_amount DESC
          ) as new_ranking
        FROM customer_bulk_monthly_by_name
      )
      UPDATE customer_bulk_monthly_by_name
      SET ranking = ranked_customers.new_ranking
      FROM ranked_customers
      WHERE customer_bulk_monthly_by_name.id = ranked_customers.id;
    `);

    // Show sample of inserted data
    const sampleRecords = await sequelize.query(`
      SELECT id, month_start, customer_name, bulk_orders_count, bulk_orders_amount, model_no
      FROM customer_bulk_monthly_by_name
      ORDER BY month_start DESC, bulk_orders_amount DESC
      LIMIT 15;
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📊 Sample of inserted data (sorted by bulk_orders_amount):');
    console.table(sampleRecords);

    console.log('\n🎯 Customer bulk analytics setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up customer bulk analytics:', error.message);
    console.error('Error details:', error);
  } finally {
    process.exit(0);
  }
};

// Run the setup function
setupCustomerBulkAnalytics();