const dotenv = require('dotenv');
dotenv.config();
const { connectDB, sequelize } = require('../config/db');

(async () => {
  try {
    // Ensure DB is connected
    await connectDB();
    if (!sequelize) {
      console.error('Sequelize is not initialized. Ensure DATABASE_URL is set.');
      process.exit(1);
    }

    const qi = sequelize.getQueryInterface();
    const tableName = 'Item';

    const table = await qi.describeTable(tableName).catch(() => null);
    if (!table) {
      console.error(`Table "${tableName}" not found. Make sure models are synced first.`);
      process.exit(1);
    }

    if (table.model_no) {
      console.log('Column "model_no" already exists. Nothing to do.');
      process.exit(0);
    }

    console.log('Adding column "model_no" to table "Item"...');
    await qi.addColumn(tableName, 'model_no', {
      type: sequelize.Sequelize.STRING,
      allowNull: true
    });
    console.log('✅ Column added successfully.');

    console.log('Backfilling legacy rows...');
    await sequelize.query(
      "UPDATE \"Item\" SET model_no = 'LEG-' || LPAD(id::text, 4, '0') WHERE model_no IS NULL;"
    );
    console.log('✅ Backfill complete.');

    console.log('Setting NOT NULL constraint on model_no...');
    await qi.changeColumn(tableName, 'model_no', {
      type: sequelize.Sequelize.STRING,
      allowNull: false
    });
    console.log('✅ Constraint applied.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to add model_no column:', err.message);
    process.exit(1);
  }
})();


