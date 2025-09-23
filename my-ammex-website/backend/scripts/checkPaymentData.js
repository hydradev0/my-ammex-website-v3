// Quick DB inspection to see if there are approved/partial payments and history
const { connectDB, getModels } = require('../config/db');

const run = async () => {
  await connectDB();
  const { Invoice, Payment, PaymentHistory, Customer } = getModels();

  // Fetch invoices with completed/partially paid
  const invoices = await Invoice.findAll({
    where: { status: ['completed', 'partially_paid'] },
    include: [
      { model: Customer, as: 'customer', attributes: ['id'] }
    ],
    limit: 10
  });
  console.log(`Found ${invoices.length} completed/partially paid invoices`);
  invoices.forEach(inv => {
    console.log({ id: inv.id, invoiceNumber: inv.invoiceNumber, status: inv.status, totalAmount: inv.totalAmount, remainingBalance: inv.remainingBalance, customerId: inv.customerId });
  });

  // Payments summary
  const payments = await Payment.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
  console.log(`Sample payments: ${payments.length}`);
  payments.forEach(p => {
    console.log({ id: p.id, invoiceId: p.invoiceId, customerId: p.customerId, amount: p.amount, status: p.status, method: p.paymentMethod });
  });

  // Payment history summary
  const histories = await PaymentHistory.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
  console.log(`Sample history records: ${histories.length}`);
  histories.forEach(h => {
    console.log({ id: h.id, paymentId: h.paymentId, invoiceId: h.invoiceId, action: h.action, amount: h.amount, method: h.paymentMethod });
  });
};

if (require.main === module) {
  run().then(() => process.exit()).catch(err => { console.error(err); process.exit(1); });
}

module.exports = run;


