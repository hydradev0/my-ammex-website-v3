const { connectDB, getModels, closeDB } = require('../config/db');

(async () => {
  try {
    await connectDB();
    const models = getModels();
    if (!models) {
      console.log('No database configured. Set DATABASE_URL in .env');
      return;
    }
    const { PaymentMethod, Bank } = models;
    await PaymentMethod.sync({ alter: true });
    await Bank.sync({ alter: true });
    console.log('✅ PaymentMethod and Bank tables are synchronized.');
  } catch (e) {
    console.error('❌ Failed to create/sync payment config tables:', e);
  } finally {
    await closeDB();
    process.exit(0);
  }
})();


