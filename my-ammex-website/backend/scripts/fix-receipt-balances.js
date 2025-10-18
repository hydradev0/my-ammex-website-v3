const { connectDB, getModels } = require('../config/db');

/**
 * Script to fix incorrect remaining balances in payment receipts
 * For each invoice, recalculate the balance after each payment chronologically
 */
const fixReceiptBalances = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✓ Database connection established\n');

    const { PaymentReceipt, Payment, Invoice } = getModels();

    // Get all invoices that have receipts
    const receipts = await PaymentReceipt.findAll({
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount']
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'amount', 'createdAt']
        }
      ],
      order: [['invoiceId', 'ASC'], ['paymentDate', 'ASC']]
    });

    console.log(`📋 Found ${receipts.length} receipts to process\n`);

    if (receipts.length === 0) {
      console.log('✅ No receipts to fix!');
      process.exit(0);
    }

    // Group receipts by invoice
    const receiptsByInvoice = {};
    receipts.forEach(receipt => {
      const invoiceId = receipt.invoiceId;
      if (!receiptsByInvoice[invoiceId]) {
        receiptsByInvoice[invoiceId] = [];
      }
      receiptsByInvoice[invoiceId].push(receipt);
    });

    console.log(`📊 Processing ${Object.keys(receiptsByInvoice).length} invoices\n`);

    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    // Process each invoice
    for (const [invoiceId, invoiceReceipts] of Object.entries(receiptsByInvoice)) {
      try {
        // Sort receipts by payment date
        invoiceReceipts.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

        const invoice = invoiceReceipts[0].invoice;
        const invoiceTotal = Number(invoice.totalAmount);
        let runningBalance = invoiceTotal;

        console.log(`\n📄 Invoice ${invoice.invoiceNumber} (Total: ₱${invoiceTotal.toFixed(2)})`);

        for (const receipt of invoiceReceipts) {
          const paymentAmount = Number(receipt.amount);
          const oldRemainingAmount = Number(receipt.remainingAmount);
          
          // Calculate correct remaining balance after this payment
          runningBalance = runningBalance - paymentAmount;
          const correctRemainingAmount = Math.max(0, runningBalance);
          
          // Determine correct status
          const correctStatus = correctRemainingAmount <= 0 ? 'Completed' : 'Partial';

          // Check if update is needed
          if (
            Math.abs(oldRemainingAmount - correctRemainingAmount) > 0.01 ||
            receipt.status !== correctStatus
          ) {
            console.log(`  ✏️  ${receipt.receiptNumber}:`);
            console.log(`      Payment: ₱${paymentAmount.toFixed(2)}`);
            console.log(`      Old Balance: ₱${oldRemainingAmount.toFixed(2)} (${receipt.status})`);
            console.log(`      New Balance: ₱${correctRemainingAmount.toFixed(2)} (${correctStatus})`);

            await receipt.update({
              remainingAmount: correctRemainingAmount,
              status: correctStatus
            });

            updated++;
          } else {
            console.log(`  ✓ ${receipt.receiptNumber}: Already correct (₱${correctRemainingAmount.toFixed(2)})`);
            unchanged++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing invoice ${invoiceId}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✓ Updated: ${updated}`);
    console.log(`   - Unchanged: ${unchanged}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(60));
    console.log('\n✅ Receipt balance fix completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing receipt balances:', error);
    process.exit(1);
  }
};

// Run the script if called directly
if (require.main === module) {
  fixReceiptBalances();
}

module.exports = fixReceiptBalances;

