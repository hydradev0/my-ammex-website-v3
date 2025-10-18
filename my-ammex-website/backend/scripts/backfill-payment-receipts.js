const { connectDB, getModels } = require('../config/db');

// Generate unique receipt number
async function generateReceiptNumber(PaymentReceipt) {
  const now = new Date();
  const yyyy = now.getFullYear();
  
  // Get the count of receipts this year
  const { Op } = require('sequelize');
  const count = await PaymentReceipt.count({
    where: {
      receiptNumber: {
        [Op.like]: `RCP-${yyyy}-%`
      }
    }
  });
  
  const nextNumber = String(count + 1).padStart(4, '0');
  return `RCP-${yyyy}-${nextNumber}`;
}

const backfillPaymentReceipts = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✓ Connected\n');
    
    const { Payment, PaymentReceipt, Invoice, Customer } = getModels();
    
    // Get all succeeded payments
    const succeededPayments = await Payment.findAll({
      where: { status: 'succeeded' },
      include: [
        { model: Invoice, as: 'invoice' },
        { model: Customer, as: 'customer' }
      ],
      order: [['createdAt', 'ASC']] // Oldest first to maintain receipt number order
    });
    
    console.log(`Found ${succeededPayments.length} succeeded payments\n`);
    
    // Check which payments already have receipts
    const existingReceipts = await PaymentReceipt.findAll();
    const paymentIdsWithReceipts = existingReceipts.map(r => r.paymentId);
    
    const paymentsWithoutReceipts = succeededPayments.filter(
      p => !paymentIdsWithReceipts.includes(p.id)
    );
    
    console.log(`${existingReceipts.length} receipts already exist`);
    console.log(`${paymentsWithoutReceipts.length} payments need receipts\n`);
    
    if (paymentsWithoutReceipts.length === 0) {
      console.log('✅ All succeeded payments already have receipts!');
      process.exit(0);
    }
    
    console.log('🔄 Creating receipts for old payments...\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const payment of paymentsWithoutReceipts) {
      try {
        if (!payment.invoice || !payment.customer) {
          console.log(`⚠️  Skipping Payment ${payment.id}: Missing invoice or customer`);
          skipped++;
          continue;
        }
        
        // Calculate remaining amount
        const remainingAmount = Number(payment.invoice.remainingBalance) || 0;
        
        // Determine status
        const status = remainingAmount <= 0 ? 'Completed' : 'Partial';
        
        // Generate receipt number
        const receiptNumber = await generateReceiptNumber(PaymentReceipt);
        
        // Prepare receipt data
        const receiptData = {
          invoiceNumber: payment.invoice.invoiceNumber,
          customerName: payment.customer.customerName || payment.customer.contactName,
          customerEmail: payment.customer.email1,
          paymentMethod: payment.paymentMethod,
          gatewayReference: payment.reference || payment.gatewayPaymentId
        };
        
        // Create receipt
        await PaymentReceipt.create({
          receiptNumber: receiptNumber,
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          customerId: payment.customerId,
          paymentDate: payment.reviewedAt || payment.updatedAt || payment.createdAt,
          amount: payment.amount,
          totalAmount: payment.invoice.totalAmount,
          remainingAmount: remainingAmount,
          paymentMethod: payment.paymentMethod,
          paymentReference: payment.reference || payment.gatewayPaymentId,
          status: status,
          receiptData: receiptData
        });
        
        console.log(`✅ Created ${receiptNumber} for Payment ${payment.id} (${payment.paymentMethod} - ₱${payment.amount})`);
        created++;
        
      } catch (error) {
        console.error(`❌ Error creating receipt for Payment ${payment.id}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Created: ${created} receipts`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped: ${skipped} payments`);
    }
    console.log(`\n🎉 Backfill completed!`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

backfillPaymentReceipts();

