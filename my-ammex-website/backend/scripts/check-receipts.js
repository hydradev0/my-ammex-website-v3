const { connectDB, getModels } = require('../config/db');

const checkReceipts = async () => {
  try {
    await connectDB();
    const { PaymentReceipt, Payment } = getModels();
    
    const receipts = await PaymentReceipt.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    const payments = await Payment.findAll({
      where: { status: 'succeeded' },
      order: [['createdAt', 'DESC']]
    });
    
    console.log('=== RECEIPTS ===');
    console.log('Total receipts:', receipts.length);
    receipts.forEach(r => {
      console.log(`  ${r.receiptNumber} - Payment ID: ${r.paymentId} - Amount: ${r.amount}`);
    });
    
    console.log('\n=== SUCCEEDED PAYMENTS ===');
    console.log('Total succeeded payments:', payments.length);
    payments.forEach(p => {
      console.log(`  Payment ID: ${p.id} - ${p.paymentMethod} - Amount: ${p.amount} - Created: ${p.createdAt}`);
    });
    
    console.log('\n=== ANALYSIS ===');
    const paymentIdsWithReceipts = receipts.map(r => r.paymentId);
    const paymentsWithoutReceipts = payments.filter(p => !paymentIdsWithReceipts.includes(p.id));
    
    if (paymentsWithoutReceipts.length > 0) {
      console.log(`⚠️  ${paymentsWithoutReceipts.length} payments without receipts:`);
      paymentsWithoutReceipts.forEach(p => {
        console.log(`  Payment ${p.id}: ${p.paymentMethod} - ${p.amount}`);
      });
    } else {
      console.log('✅ All succeeded payments have receipts!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkReceipts();

