const { connectDB, getSequelize, closeDB } = require('../config/db');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structures...');
    await connectDB();
    const sequelize = getSequelize();

    // Check InvoiceItem columns
    const [invoiceItemColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'InvoiceItem'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 InvoiceItem Table Structure:');
    console.table(invoiceItemColumns);

    // Check if there are any Invoice records
    const [invoiceCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM "Invoice";
    `);

    console.log(`\n📊 Invoice records: ${invoiceCount[0].count}`);

    // Check if there are any InvoiceItem records
    const [invoiceItemCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM "InvoiceItem";
    `);

    console.log(`📊 InvoiceItem records: ${invoiceItemCount[0].count}`);

    // Check Item table structure
    const [itemColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Item'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Item Table Structure:');
    console.table(itemColumns);

    // Check Category table structure
    const [categoryColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Category'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Category Table Structure:');
    console.table(categoryColumns);

  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await closeDB();
  }
}

checkTableStructure();
