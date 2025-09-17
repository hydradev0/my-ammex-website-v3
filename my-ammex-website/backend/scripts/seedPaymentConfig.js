const { connectDB, getModels, closeDB } = require('../config/db');

(async () => {
  try {
    console.log('🌱 Seeding payment configuration...');
    await connectDB();
    const models = getModels();
    if (!models) {
      console.log('⚠️  Database unavailable. Ensure DATABASE_URL is set.');
      return;
    }
    const { PaymentMethod, Bank } = models;

    // Seed Payment Methods
    const methods = [
      { name: 'Bank Transfer', accountNumber: null, requiresReference: true, isActive: true, qrCodeBase64: null },
      { name: 'Maya (PayMaya)', accountNumber: '0917-123-4567', requiresReference: false, isActive: true, qrCodeBase64: null },
      { name: 'GCash', accountNumber: '0917-987-6543', requiresReference: false, isActive: true, qrCodeBase64: null },
      { name: 'Check', accountNumber: null, requiresReference: true, isActive: true, qrCodeBase64: null },
    ];

    for (const m of methods) {
      const [record, created] = await PaymentMethod.findOrCreate({
        where: { name: m.name },
        defaults: m,
      });
      if (!created) {
        await record.update(m);
      }
      console.log(`✅ Method: ${record.name} (${created ? 'created' : 'updated'})`);
    }

    // Seed Banks
    const banks = [
      { bankName: 'BDO Unibank Inc.', accountNumber: '123-456-7890', isActive: true, qrCodeBase64: null },
      { bankName: 'BPI (Bank of the Philippine Islands)', accountNumber: '987-654-3210', isActive: true, qrCodeBase64: null },
      { bankName: 'Metrobank', accountNumber: '456-789-0123', isActive: true, qrCodeBase64: null },
    ];

    for (const b of banks) {
      const [record, created] = await Bank.findOrCreate({
        where: { bankName: b.bankName },
        defaults: b,
      });
      if (!created) {
        await record.update(b);
      }
      console.log(`✅ Bank: ${record.bankName} (${created ? 'created' : 'updated'})`);
    }

    console.log('🎉 Seeding completed.');
  } catch (e) {
    console.error('❌ Seeding failed:', e);
    process.exitCode = 1;
  } finally {
    await closeDB();
    process.exit();
  }
})();


