const { getModels } = require('../config/db');
const { updateInvoicePayment } = require('../utils/invoiceUtils');
const paymongoService = require('../services/paymongoService');
const puppeteer = require('puppeteer');

// Generate unique payment number
function generatePaymentNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `PAY-${yyyy}${mm}${dd}-${random}`;
}

// Generate unique receipt number
async function generateReceiptNumber() {
  const { PaymentReceipt } = getModels();
  const now = new Date();
  const yyyy = now.getFullYear();
  
  // Get the count of receipts this year
  const count = await PaymentReceipt.count({
    where: {
      receiptNumber: {
        [require('sequelize').Op.like]: `RCP-${yyyy}-%`
      }
    }
  });
  
  const nextNumber = String(count + 1).padStart(4, '0');
  return `RCP-${yyyy}-${nextNumber}`;
}

// Helper: Format payment method display name
function formatPaymentMethod(method) {
  const methodMap = {
    'card': 'Credit/Debit Card',
    'gcash': 'GCash',
    'grab_pay': 'GrabPay',
    'paymaya': 'Maya',
    'bank_transfer': 'Bank Transfer',
    'paymongo': 'PayMongo'
  };
  return methodMap[method] || method;
}

// Helper: Generate receipt HTML for PDF generation
function generateReceiptHTML(receipt) {
  const formatCurrency = (amount) => {
    return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${receipt.receiptNumber}</title>
      <style>
        @media print {
          @page { margin: 0; }
          body { margin: 1cm; }
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #1a1a1a;
          background: white;
        }
        .receipt-header {
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .receipt-header h1 {
          color: #1a1a1a;
          margin: 0 0 5px 0;
          font-size: 28px;
          font-weight: 700;
        }
        .receipt-label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .receipt-number {
          font-size: 20px;
          color: #1a1a1a;
          font-weight: 600;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 11px;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          font-weight: 600;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-item {
          margin-bottom: 15px;
        }
        .info-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .amount-box {
          background: #f5f5f5;
          border: 2px solid #1a1a1a;
          border-radius: 4px;
          padding: 24px;
          text-align: right;
          margin: 20px 0;
        }
        .amount-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
         .amount-value {
           font-size: 32px;
           font-weight: 700;
           color: #1a1a1a;
         }
         .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .summary-table td {
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
          font-size: 14px;
        }
        .summary-table td:first-child {
          color: #4a4a4a;
          width: 50%;
        }
        .summary-table td:last-child {
          text-align: right;
          font-weight: 600;
          color: #1a1a1a;
        }
        .summary-table tr.total-row td {
          border-top: 2px solid #1a1a1a;
          border-bottom: 2px solid #1a1a1a;
          font-size: 16px;
          font-weight: 700;
          padding: 15px 0;
          color: #1a1a1a;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          color: #666;
          font-size: 10px;
          page-break-inside: avoid;
        }
        .confirmed-badge {
          display: inline-block;
          padding: 6px 12px;
          background: #f5f5f5;
          border: 1px solid #d0d0d0;
          border-radius: 3px;
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div class="receipt-label">Payment Receipt</div>
            <h1>${receipt.receiptNumber}</h1>
            <div class="confirmed-badge">✓ Payment Confirmed</div>
          </div>
          <div class="amount-box" style="margin: 0; max-width: 280px;">
            <div class="amount-label">Amount Paid</div>
            <div class="amount-value">${formatCurrency(receipt.amount)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${receipt.customer?.customerName || receipt.customer?.contactName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email Address</div>
            <div class="info-value">${receipt.customer?.email1 || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payment Details</div>
        <table class="summary-table">
          <tr>
            <td>Payment Date</td>
            <td>${formatDate(receipt.paymentDate)}</td>
          </tr>
          <tr>
            <td>Payment Time</td>
            <td>${formatTime(receipt.paymentDate)}</td>
          </tr>
          <tr>
            <td>Payment Method</td>
            <td>${formatPaymentMethod(receipt.paymentMethod)}</td>
          </tr>
          ${receipt.paymentReference ? `
          <tr>
            <td>Reference Number</td>
            <td>${receipt.paymentReference}</td>
          </tr>
          ` : ''}
           <tr>
             <td>Invoice Number</td>
             <td>${receipt.invoice?.invoiceNumber || 'N/A'}</td>
           </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Payment Summary</div>
        <table class="summary-table">
          <tr>
            <td>Invoice Total</td>
            <td>${formatCurrency(receipt.totalAmount)}</td>
          </tr>
          <tr>
            <td>This Payment</td>
            <td>- ${formatCurrency(receipt.amount)}</td>
          </tr>
          <tr class="total-row">
            <td>Balance Remaining</td>
            <td>${formatCurrency(receipt.remainingAmount)}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>This receipt serves as proof of payment. For inquiries, please contact our support team with your receipt number.</p>
        <p style="margin-top: 10px;">Generated on ${formatDate(new Date())} at ${formatTime(new Date())}</p>
      </div>
    </body>
    </html>
  `;
}

// Create payment receipt after successful payment
async function createPaymentReceipt(payment, invoice) {
  try {
    const { PaymentReceipt, Customer } = getModels();
    
    // Get customer details
    const customer = await Customer.findByPk(payment.customerId);
    if (!customer) {
      console.error('Customer not found for payment:', payment.id);
      return null;
    }
    
    // Calculate remaining amount after this payment
    const remainingAmount = Number(invoice.remainingBalance) || 0;
    
    // Determine status based on remaining balance
    const status = remainingAmount <= 0 ? 'Completed' : 'Partial';
    
    // Generate receipt number
    const receiptNumber = await generateReceiptNumber();
    
    // Prepare receipt data
    const receiptData = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: customer.customerName || customer.contactName,
      customerEmail: customer.email1,
      paymentMethod: payment.paymentMethod,
      gatewayReference: payment.reference || payment.gatewayPaymentId
    };
    
    // Create receipt
    const receipt = await PaymentReceipt.create({
      receiptNumber: receiptNumber,
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      paymentDate: new Date(),
      amount: payment.amount,
      totalAmount: invoice.totalAmount,
      remainingAmount: remainingAmount,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.reference || payment.gatewayPaymentId,
      status: status,
      receiptData: receiptData
    });
    
    console.log('✓ Payment receipt created:', receipt.receiptNumber);
    return receipt;
  } catch (error) {
    console.error('Error creating payment receipt:', error);
    return null;
  }
}

// Customer submits a payment
const submitPayment = async (req, res, next) => {
  try {
  const { Payment, Invoice, Customer, PaymentHistory, Notification } = getModels();
  const { invoiceId, amount, paymentMethod, reference, notes, attachments } = req.body;
  let customerId = req.user.customerId;

  // Fallback: if token lacks customerId but role is Client, derive via linked Customer.userId
  if (!customerId && req.user && req.user.role === 'Client') {
    const linkedCustomer = await Customer.findOne({ where: { userId: req.user.id } });
    if (linkedCustomer) {
      customerId = linkedCustomer.id;
    }
  }

  if (!customerId) {
    return res.status(401).json({
      success: false,
      message: 'Customer authentication required'
    });
  }

    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID, amount, and payment method are required'
      });
    }

    // Check if invoice exists and belongs to customer
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: Customer, as: 'customer' }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit payments for your own invoices'
      });
    }

    // Check if invoice has remaining balance
    const remainingBalance = Number(invoice.remainingBalance || invoice.totalAmount);
    if (remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This invoice is already fully paid'
      });
    }

    // Validate payment amount
    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    if (paymentAmount > remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`
      });
    }

    // Create payment submission
    const payment = await Payment.create({
      paymentNumber: generatePaymentNumber(),
      invoiceId: invoiceId,
      customerId: customerId,
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      reference: reference || null,
      notes: notes || null,
      status: 'pending_approval',
      attachments: attachments || []
    });

    // Create payment history record
    await PaymentHistory.create({
      paymentId: payment.id,
      invoiceId: invoiceId,
      customerId: customerId,
      action: 'submitted',
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      reference: reference || null,
      notes: notes || null
    });

    // Fetch complete payment with relationships
    const completePayment = await Payment.findByPk(payment.id, {
      include: [
        { model: Invoice, as: 'invoice' },
        { model: Customer, as: 'customer' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Payment submitted successfully. It will be reviewed by our team.',
      data: completePayment
    });

  } catch (error) {
    console.error('Error submitting payment:', error);
    next(error);
  }
};

// Get customer's payment submissions
const getMyPayments = async (req, res, next) => {
  try {
    const { Payment, Invoice, Customer } = getModels();
    const customerId = req.user.customerId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required'
      });
    }

    const payments = await Payment.findAll({
      where: { customerId: customerId },
      include: [
        { 
          model: Invoice, 
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'remainingBalance', 'status']
        },
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'customer_name', 'contact_name']
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching customer payments:', error);
    next(error);
  }
};

// Admin: Get all pending payments
const getPendingPayments = async (req, res, next) => {
  try {
    const { Payment, Invoice, Customer } = getModels();

    const payments = await Payment.findAll({
      where: { status: 'pending_approval' },
      include: [
        { 
          model: Invoice, 
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'remainingBalance', 'status']
        },
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'customer_name', 'contact_name', 'email1']
        }
      ],
      order: [['submittedAt', 'ASC']]
    });

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching pending payments:', error);
    next(error);
  }
};

// Admin: Get all rejected payments
const getRejectedPayments = async (req, res, next) => {
  try {
    const { Payment, Invoice, Customer } = getModels();

    const payments = await Payment.findAll({
      where: { status: 'rejected' },
      include: [
        { 
          model: Invoice, 
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'remainingBalance', 'status']
        },
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'customer_name', 'contact_name', 'email1']
        }
      ],
      order: [['reviewedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching rejected payments:', error);
    next(error);
  }
};

// Admin: Approve payment
const approvePayment = async (req, res, next) => {
  try {
    const { Payment, PaymentHistory, Notification, Invoice } = getModels();
    const paymentId = req.params.id;
    const reviewerId = req.user.id;

    const payment = await Payment.findByPk(paymentId, {
      include: [{ model: Invoice, as: 'invoice' }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be approved'
      });
    }

    // Determine amount to apply: allow admin override via body.amount
    const overrideAmount = req.body && req.body.amount != null ? Number(req.body.amount) : null;
    const amountToApply = overrideAmount != null ? overrideAmount : Number(payment.amount);

    if (isNaN(amountToApply) || amountToApply <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid approval amount' });
    }

    // Update invoice payment using utility function
    const invoiceUpdate = await updateInvoicePayment(payment.invoiceId, amountToApply);
    
    if (!invoiceUpdate.success) {
      return res.status(400).json({
        success: false,
        message: invoiceUpdate.error || 'Failed to update invoice'
      });
    }

    // Update payment status
    await payment.update({
      status: 'approved',
      amount: amountToApply,
      reviewedAt: new Date(),
      reviewedBy: reviewerId
    });

    // Create payment history record
    await PaymentHistory.create({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      action: 'approved',
      amount: amountToApply,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: `Approved by admin`,
      performedBy: reviewerId
    });

    // Create notification for customer
    await Notification.create({
      customerId: payment.customerId,
      type: 'payment_approved',
      title: 'Payment Approved',
      message: `Your payment of <span class=\"font-semibold\">₱${amountToApply}</span> for invoice <span class=\"font-semibold\">${payment.invoice.invoiceNumber}</span> has been approved and applied to your account.`,
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: amountToApply
      }
    });

    res.json({
      success: true,
      message: 'Payment approved successfully',
      data: {
        payment,
        invoiceUpdate: invoiceUpdate.invoice
      }
    });

  } catch (error) {
    console.error('Error approving payment:', error);
    next(error);
  }
};

// Admin: Reject payment
const rejectPayment = async (req, res, next) => {
  try {
    const { Payment, PaymentHistory, Notification, Invoice } = getModels();
    const paymentId = req.params.id;
    const { rejectionReason } = req.body;
    const reviewerId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const payment = await Payment.findByPk(paymentId, {
      include: [{ model: Invoice, as: 'invoice' }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be rejected'
      });
    }

    // Update payment status
    await payment.update({
      status: 'rejected',
      rejectionReason,
      reviewedAt: new Date(),
      reviewedBy: reviewerId
    });

    // Create payment history record
    await PaymentHistory.create({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      action: 'rejected',
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: `Rejected: ${rejectionReason}`,
      performedBy: reviewerId
    });

    // Create notification for customer
    await Notification.create({
      customerId: payment.customerId,
      type: 'payment_rejected',
      title: 'Payment Rejected',
      message: `Your payment of <span class=\"font-semibold\">₱${payment.amount}</span> for invoice <span class=\"font-semibold\">${payment.invoice.invoiceNumber}</span> has been rejected. Reason: <span class=\"font-medium text-red-500\">${rejectionReason}</span>`,
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        rejectionReason
      }
    });

    res.json({
      success: true,
      message: 'Payment rejected successfully',
      data: payment
    });

  } catch (error) {
    console.error('Error rejecting payment:', error);
    next(error);
  }
};

// Client: Appeal a rejected payment
const appealRejectedPayment = async (req, res, next) => {
  try {
    const { Payment, PaymentHistory, Notification, Invoice, Customer } = getModels();
    const paymentId = req.params.id;
    const { appealReason } = req.body || {};
    const customerId = req.user.customerId;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Customer authentication required' });
    }

    if (!appealReason || String(appealReason).trim() === '') {
      return res.status(400).json({ success: false, message: 'Appeal reason is required' });
    }

    const payment = await Payment.findByPk(paymentId, { include: [{ model: Invoice, as: 'invoice' }] });
    if (!payment || payment.customerId !== customerId) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected payments can be appealed' });
    }

    const customer = await Customer.findByPk(customerId);

    // Record in history
    await PaymentHistory.create({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      action: 'rejected',
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: `Appeal submitted: ${appealReason}`
    });

    // Notify Admin/Sales (create a general notification titled Payment Appeal Submitted)
    await Notification.create({
      customerId: payment.customerId,
      type: 'general',
      title: 'Payment Appeal Submitted',
      message: `Customer <span class=\"font-semibold\">${customer?.customerName || 'Unknown Customer'}</span> appealed payment <span class=\"font-semibold\">${payment.paymentNumber}</span> for invoice ${payment.invoice.invoiceNumber}. Reason: <span class=\"font-medium text-red-500\">${appealReason}</span>`,
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        appealReason
      }
    });

    res.json({ success: true, message: 'Appeal submitted successfully' });
  } catch (error) {
    console.error('Error submitting payment appeal:', error);
    next(error);
  }
};

// Admin: Re-approve a previously rejected payment (move back to pending)
const reapproveRejectedPayment = async (req, res, next) => {
  try {
    const { Payment } = getModels();
    const paymentId = req.params.id;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only rejected payments can be re-approved to pending'
      });
    }

    await payment.update({
      status: 'pending_approval',
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: null
    });

    res.json({
      success: true,
      message: 'Payment moved back to pending approval',
      data: payment
    });
  } catch (error) {
    console.error('Error re-approving rejected payment:', error);
    next(error);
  }
};

// Get payment history for an invoice
const getPaymentHistory = async (req, res, next) => {
  try {
    const { PaymentHistory, Invoice, Customer, User } = getModels();
    const { invoiceId } = req.params;
    const customerId = req.user.customerId;

    // Verify invoice belongs to customer
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice || invoice.customerId !== customerId) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or access denied'
      });
    }

    const history = await PaymentHistory.findAll({
      where: { invoiceId },
      include: [
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'customerName']
        },
        { 
          model: User, 
          as: 'performer',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    next(error);
  }
};

// Get all payment history (for admin)
const getAllPaymentHistory = async (req, res, next) => {
  try {
    const { PaymentHistory, Invoice, Customer, User } = getModels();

    const history = await PaymentHistory.findAll({
      include: [
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'customerName', 'contactName']
        },
        { 
          model: User, 
          as: 'performer',
          attributes: ['id', 'name']
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoice_number', 'total_amount', 'remaining_balance', 'remainingBalance', 'paid_amount', 'paidAmount', 'due_date', 'dueDate']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching all payment history:', error);
    next(error);
  }
};

// Get customer notifications
const getPaymentNotifications = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { role, customerId } = req.user;

  // Admin and Sales Marketing: show payment appeals
  if (role === 'Admin' || role === 'Sales Marketing') {
    const adminNotifications = await Notification.findAll({
      where: { type: 'general' },
      order: [['createdAt', 'DESC']]
    });
    const unreadCount = adminNotifications.filter(n => !n.adminIsRead).length;
    return res.json({ success: true, data: { notifications: adminNotifications, unreadCount } });
  }

    // For Client users, check customerId
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required'
      });
    }

    const notifications = await Notification.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']]
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    next(error);
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { id } = req.params; // matches /notifications/:id/read
    const { role, customerId } = req.user;

    if (role === 'Admin' || role === 'Sales Marketing') {
      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      await notification.update({ adminIsRead: true, adminReadAt: new Date() });
      return res.json({ success: true, message: 'Notification marked as read' });
    }

    // For Client users, check customerId and find notification
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required'
      });
    }

    const notification = await Notification.findOne({
      where: { id, customerId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
};

// Mark all notifications as read for the authenticated user
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { role, customerId } = req.user;

    if (role === 'Admin' || role === 'Sales Marketing') {
      await Notification.update(
        { adminIsRead: true, adminReadAt: new Date() },
        { where: { adminIsRead: false } }
      );
    } else {
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Customer authentication required' });
      }
      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { customerId, isRead: false } }
      );
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    next(error);
  }
};

// Get payment history for a specific customer (Admin, Sales Marketing)
const getCustomerPaymentHistory = async (req, res, next) => {
  try {
    const { PaymentHistory, Invoice, Customer, User } = getModels();
    const { customerId } = req.params;

    const history = await PaymentHistory.findAll({
      where: { customerId: customerId },
      include: [
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'customer_name', 'contact_name']
        },
        { 
          model: User, 
          as: 'performer',
          attributes: ['id', 'name']
        },
        { 
          model: Invoice, 
          as: 'invoice',
          attributes: ['id', 'invoice_number', 'total_amount']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching customer payment history:', error);
    next(error);
  }
};

// Get balance history (for admin)
const getBalanceHistory = async (req, res, next) => {
  try {
    const { PaymentHistory, Invoice, Customer } = getModels();

    const balanceHistory = await PaymentHistory.findAll({
      where: { action: 'approved' }, // Only show approved payments in balance tracking
      include: [
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'customerName', 'contactName']
        },
        { 
          model: Invoice, 
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'remainingBalance', 'dueDate', 'paidAmount']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: balanceHistory
    });

  } catch (error) {
    console.error('Error fetching balance history:', error);
    next(error);
  }
};

// Admin: Permanently delete a rejected payment
const deleteRejectedPayment = async (req, res, next) => {
  try {
    const { Payment, PaymentHistory } = getModels();
    const paymentId = req.params.id;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only rejected payments can be deleted'
      });
    }

    await PaymentHistory.destroy({ where: { paymentId } });
    await payment.destroy();

    res.json({
      success: true,
      message: 'Rejected payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rejected payment:', error);
    next(error);
  }
};

// PayMongo: Create Payment Intent
const createPaymentIntent = async (req, res, next) => {
  try {
    const { Payment, Invoice, Customer } = getModels();
    const { invoiceId, amount, paymentMethod = 'card' } = req.body;
    let customerId = req.user.customerId;

    // Fallback: if token lacks customerId but role is Client, derive via linked Customer.userId
    if (!customerId && req.user && req.user.role === 'Client') {
      const linkedCustomer = await Customer.findOne({ where: { userId: req.user.id } });
      if (linkedCustomer) {
        customerId = linkedCustomer.id;
      }
    }

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required'
      });
    }

    // Validate required fields
    if (!invoiceId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID and amount are required'
      });
    }

    // Check if invoice exists and belongs to customer
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: Customer, as: 'customer' }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create payments for your own invoices'
      });
    }

    // Check if invoice has remaining balance
    const remainingBalance = Number(invoice.remainingBalance || invoice.totalAmount);
    if (remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This invoice is already fully paid'
      });
    }

    // Validate payment amount
    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    if (paymentAmount > remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining balance of ₱${remainingBalance.toFixed(2)}`
      });
    }

    // Create PayMongo Payment Intent
    const description = `Payment for Invoice ${invoice.invoiceNumber}`;
    const paymentIntent = await paymongoService.createPaymentIntent(
      paymentAmount,
      invoiceId,
      customerId,
      description
    );

    // Create payment record with pending_payment status
    const payment = await Payment.create({
      paymentNumber: generatePaymentNumber(),
      invoiceId: invoiceId,
      customerId: customerId,
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      status: 'pending_payment',
      gatewayProvider: 'paymongo',
      gatewayPaymentId: paymentIntent.id,
      gatewayStatus: paymentIntent.attributes.status,
      gatewayMetadata: paymentIntent
    });

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        paymentId: payment.id,
        clientKey: paymentIntent.attributes.client_key,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.attributes.status
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    next(error);
  }
};

// PayMongo: Create Payment Method (Card)
const createPaymentMethod = async (req, res, next) => {
  try {
    const { cardDetails, billingDetails } = req.body;

    // Validate required fields
    if (!cardDetails || !cardDetails.card_number || !cardDetails.exp_month || !cardDetails.exp_year || !cardDetails.cvc) {
      return res.status(400).json({
        success: false,
        message: 'Card number, expiry date, and CVC are required'
      });
    }

    if (!billingDetails || !billingDetails.name) {
      return res.status(400).json({
        success: false,
        message: 'Cardholder name is required'
      });
    }

    // Create payment method via PayMongo
    const paymentMethod = await paymongoService.createPaymentMethod(cardDetails, billingDetails);

    res.status(201).json({
      success: true,
      message: 'Payment method created successfully',
      data: {
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.attributes.type,
        details: paymentMethod.attributes.details
      }
    });

  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment method'
    });
  }
};

// PayMongo: Attach Payment Method to Intent
const attachPaymentToIntent = async (req, res, next) => {
  try {
    const { Payment } = getModels();
    const { paymentIntentId, paymentMethodId, returnUrl, paymentId } = req.body;

    // Validate required fields
    if (!paymentIntentId || !paymentMethodId || !returnUrl) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID, payment method ID, and return URL are required'
      });
    }

    // Attach payment method to payment intent
    const attachedIntent = await paymongoService.attachPaymentMethod(
      paymentIntentId,
      paymentMethodId,
      returnUrl
    );

    // Update payment record if paymentId is provided
    if (paymentId) {
      await Payment.update(
        {
          gatewayStatus: attachedIntent.attributes.status,
          gatewayMetadata: attachedIntent
        },
        { where: { id: paymentId } }
      );
    }

    const response = {
      success: true,
      message: 'Payment method attached successfully',
      data: {
        paymentIntentId: attachedIntent.id,
        status: attachedIntent.attributes.status,
        nextAction: attachedIntent.attributes.next_action || null
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to attach payment method'
    });
  }
};

// PayMongo: Create Source (E-Wallets)
const createPaymentSource = async (req, res, next) => {
  try {
    const { Payment } = getModels();
    const { type, amount, invoiceId, paymentId } = req.body;

    // Validate required fields
    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment type and amount are required'
      });
    }

    // Build redirect URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = {
      success: `${baseUrl}/Products/Invoices?payment=success`,
      failed: `${baseUrl}/Products/Payment?invoiceId=${invoiceId}&payment=failed&reason=Payment was declined or cancelled`
    };

    const metadata = {
      invoice_id: String(invoiceId || ''),
      payment_id: String(paymentId || '')
    };

    // Create source via PayMongo
    const source = await paymongoService.createSource(type, amount, redirectUrl, metadata);

    // Update payment record if paymentId is provided
    if (paymentId) {
      await Payment.update(
        {
          paymentMethod: type,
          gatewayPaymentId: source.id,
          gatewayStatus: source.attributes.status,
          gatewayMetadata: source,
          status: 'processing'
        },
        { where: { id: paymentId } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Payment source created successfully',
      data: {
        sourceId: source.id,
        type: source.attributes.type,
        status: source.attributes.status,
        checkoutUrl: source.attributes.redirect?.checkout_url
      }
    });

  } catch (error) {
    console.error('Error creating payment source:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment source'
    });
  }
};

// PayMongo: Webhook Handler
const handlePayMongoWebhook = async (req, res, next) => {
  try {
    console.log('========================================');
    console.log('🔔 WEBHOOK RECEIVED');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('========================================');
    
    const { Payment, Invoice, Notification, PaymentHistory } = getModels();
    
    // Verify webhook signature (skip in development if testing locally)
    const signature = req.headers['paymongo-signature'];
    const rawBody = JSON.stringify(req.body);
    
    console.log('Signature:', signature);
    console.log('Has Signature:', !!signature);
    
    // TEMPORARY: Skip signature verification for debugging
    // TODO: Re-enable this in production after fixing signature
    /*
    if (signature && !paymongoService.verifyWebhookSignature(rawBody, signature)) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }
    */
    
    console.log('✅ Signature verification skipped (for debugging)');

    // Parse webhook event
    const event = paymongoService.parseWebhookEvent(req.body);
    
    console.log('📦 Event Type:', event.type);
    console.log('📦 Event ID:', event.id);
    console.log('📦 Event Data:', JSON.stringify(event.data, null, 2));

    // Handle different event types
    switch (event.type) {
      case 'payment.paid':
        console.log('▶️ Processing payment.paid event...');
        await handlePaymentPaid(event.data, Payment, Invoice, Notification, PaymentHistory);
        console.log('✅ payment.paid processed');
        break;
      
      case 'payment.failed':
        console.log('▶️ Processing payment.failed event...');
        await handlePaymentFailed(event.data, Payment, Notification);
        console.log('✅ payment.failed processed');
        break;
      
      case 'payment_intent.payment_failed':
        console.log('▶️ Processing payment_intent.payment_failed event...');
        await handlePaymentIntentFailed(event.data, Payment, Notification);
        console.log('✅ payment_intent.payment_failed processed');
        break;
      
      case 'source.chargeable':
        console.log('▶️ Processing source.chargeable event...');
        await handleSourceChargeable(event.data, Payment, Invoice, Notification, PaymentHistory);
        console.log('✅ source.chargeable processed');
        break;
      
      default:
        console.log('⚠️ Unhandled webhook event type:', event.type);
    }

    console.log('✅ Webhook processed successfully');
    console.log('========================================\n');
    
    res.json({ success: true, received: true });

  } catch (error) {
    console.error('❌ Error handling PayMongo webhook:', error);
    console.error('Stack trace:', error.stack);
    console.log('========================================\n');
    next(error);
  }
};

// Production: Get payment status from PayMongo
const getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required'
      });
    }

    // Retrieve payment status from PayMongo
    const paymentIntent = await paymongoService.retrievePaymentIntent(paymentIntentId);
    
    return res.json({
      success: true,
      data: {
        status: paymentIntent.attributes.status,
        amount: paymentIntent.attributes.amount,
        currency: paymentIntent.attributes.currency,
        metadata: paymentIntent.attributes.metadata
      }
    });

  } catch (error) {
    console.error('Error retrieving payment status:', error);
    next(error);
  }
};

// Helper: Handle payment.paid event
async function handlePaymentPaid(paymentData, Payment, Invoice, Notification, PaymentHistory) {
  try {
    const paymentIntentId = paymentData.attributes.payment_intent_id;
    
    // Find payment record
    const payment = await Payment.findOne({
      where: { gatewayPaymentId: paymentIntentId },
      include: [{ model: Invoice, as: 'invoice' }]
    });

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntentId);
      return;
    }

    // Check if payment is already processed (idempotency check)
    if (payment.status === 'succeeded') {
      console.log('⚠️ Payment already processed, skipping duplicate:', payment.id);
      return;
    }

    // Update payment status
    await payment.update({
      status: 'succeeded',
      gatewayStatus: 'succeeded',
      gatewayMetadata: paymentData,
      reference: paymentData.id,
      reviewedAt: new Date()
    });

    // Update invoice payment
    const paymentAmount = Number(payment.amount);
    const invoiceUpdate = await updateInvoicePayment(payment.invoiceId, paymentAmount);

    // Create payment history record
    await PaymentHistory.create({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      action: 'approved',
      amount: paymentAmount,
      paymentMethod: payment.paymentMethod || 'paymongo',
      reference: paymentData.id,
      notes: 'Payment automatically approved via PayMongo gateway'
    });

    // Reload invoice with updated balance for receipt
    await payment.invoice.reload();
    
    // Create payment receipt with updated invoice data
    await createPaymentReceipt(payment, payment.invoice);

    // Create notification for customer
    await Notification.create({
      customerId: payment.customerId,
      type: 'payment_approved',
      title: 'Payment Successful',
      message: `Your payment of <span class="font-semibold">₱${paymentAmount.toFixed(2)}</span> for invoice <span class="font-semibold">${payment.invoice.invoiceNumber}</span> has been successfully processed.`,
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: paymentAmount,
        gatewayReference: paymentData.id
      }
    });

    // Note: Admin will see this in Balance Tracking and Payment History tabs via PaymentHistory

    console.log('Payment successfully processed:', payment.id);
  } catch (error) {
    console.error('Error handling payment.paid:', error);
    throw error;
  }
}

// Helper: Handle payment.failed event
async function handlePaymentFailed(paymentData, Payment, Notification) {
  try {
    const paymentIntentId = paymentData.attributes.payment_intent_id;
    
    // Find payment record
    const payment = await Payment.findOne({
      where: { gatewayPaymentId: paymentIntentId }
    });

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntentId);
      return;
    }

    // Extract failure information
    const lastError = paymentData.attributes.last_payment_error;
    
    // Try multiple possible error locations
    const errorData = lastError || paymentData.attributes.error || paymentData.attributes.errors?.[0];
    
    const failureCode = errorData?.code || 
                       errorData?.failed_code || 
                       errorData?.type ||
                       paymentData.attributes.status ||
                       'unknown';
                       
    const failureMessage = errorData?.message || 
                          errorData?.failed_message || 
                          errorData?.detail ||
                          errorData?.description ||
                          paymentData.attributes.status || 
                          'Payment failed';

    // Update payment status
    await payment.update({
      status: 'failed',
      gatewayStatus: 'failed',
      gatewayMetadata: paymentData,
      failureCode: failureCode,
      failureMessage: failureMessage
    });

    // Create notification for customer
    await Notification.create({
      customerId: payment.customerId,
      type: 'payment_rejected',
      title: 'Payment Failed',
      message: `Your payment of <span class="font-semibold">₱${payment.amount}</span> could not be processed. Reason: <span class="font-medium text-red-500">${failureMessage}</span>`,
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        failureCode: failureCode,
        failureMessage: failureMessage
      }
    });

    // Note: Admin will see failed payments in the Failed Payments tab

    console.log('Payment failed:', payment.id, failureCode);
  } catch (error) {
    console.error('Error handling payment.failed:', error);
    throw error;
  }
}

// Helper: Handle payment_intent.payment_failed event
async function handlePaymentIntentFailed(intentData, Payment, Notification) {
  try {
    const paymentIntentId = intentData.id;
    
    // Find payment record
    const payment = await Payment.findOne({
      where: { gatewayPaymentId: paymentIntentId }
    });

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntentId);
      return;
    }

    // Extract failure information
    const lastError = intentData.attributes.last_payment_error;
    
    // Try multiple possible error locations
    const errorData = lastError || intentData.attributes.error || intentData.attributes.errors?.[0];
    
    const failureCode = errorData?.code || 
                       errorData?.failed_code || 
                       errorData?.type ||
                       intentData.attributes.status ||
                       'unknown';
                       
    const failureMessage = errorData?.message || 
                          errorData?.failed_message || 
                          errorData?.detail ||
                          errorData?.description ||
                          intentData.attributes.status || 
                          'Payment failed';

    // Update payment status
    await payment.update({
      status: 'failed',
      gatewayStatus: intentData.attributes.status,
      gatewayMetadata: intentData,
      failureCode: failureCode,
      failureMessage: failureMessage
    });

    // Create notification for customer
    await Notification.create({
      customerId: payment.customerId,
      type: 'payment_rejected',
      title: 'Payment Failed',
      message: `Your payment of <span class="font-semibold">₱${payment.amount}</span> could not be processed. Reason: <span class="font-medium text-red-500">${failureMessage}</span>`,
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        failureCode: failureCode,
        failureMessage: failureMessage
      }
    });

    console.log('Payment intent failed:', payment.id, failureCode);
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
}

// Helper: Handle source.chargeable event (for e-wallets)
async function handleSourceChargeable(sourceData, Payment, Invoice, Notification, PaymentHistory) {
  try {
    console.log('Source chargeable event received:', sourceData.id);
    
    // Find payment by source ID
    const payment = await Payment.findOne({
      where: { gatewayPaymentId: sourceData.id },
      include: [{ model: Invoice, as: 'invoice' }]
    });

    if (!payment) {
      console.error('Payment not found for source:', sourceData.id);
      return;
    }

    // Check if payment is already processed (idempotency check)
    if (payment.status === 'succeeded') {
      console.log('⚠️ Payment already processed, skipping duplicate:', payment.id);
      return;
    }

    // Update payment status to succeeded
    await payment.update({
      status: 'succeeded',
      gatewayStatus: 'succeeded',
      gatewayMetadata: sourceData,
      reference: sourceData.id,
      reviewedAt: new Date()
    });

    // Update invoice payment
    const paymentAmount = Number(payment.amount);
    const invoiceUpdate = await updateInvoicePayment(payment.invoiceId, paymentAmount);

    // Create payment history record
    await PaymentHistory.create({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      action: 'approved',
      amount: paymentAmount,
      paymentMethod: payment.paymentMethod || 'paymongo',
      reference: sourceData.id,
      notes: 'E-wallet payment automatically approved via PayMongo gateway'
    });

    // Reload invoice with updated balance for receipt
    await payment.invoice.reload();
    
    // Create payment receipt with updated invoice data
    await createPaymentReceipt(payment, payment.invoice);

    // Create notification for customer
    await Notification.create({
      customerId: payment.customerId,
      type: 'payment_approved',
      title: 'Payment Successful',
      message: `Your payment of <span class="font-semibold">₱${paymentAmount.toFixed(2)}</span> for invoice <span class="font-semibold">${payment.invoice.invoiceNumber}</span> has been successfully processed.`,
      data: {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: paymentAmount,
        gatewayReference: sourceData.id
      }
    });

    console.log('E-wallet payment successfully processed:', payment.id);
  } catch (error) {
    console.error('Error handling source.chargeable:', error);
    throw error;
  }
}

// Admin: Get failed payments
const getFailedPayments = async (req, res, next) => {
  try {
    const { Payment, Invoice, Customer } = getModels();

    const payments = await Payment.findAll({
      where: { status: 'failed' },
      include: [
        { 
          model: Invoice, 
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'remainingBalance', 'status']
        },
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'customerName', 'contactName', 'email1']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });


    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching failed payments:', error);
    next(error);
  }
};

// Customer: Get all payment receipts
const getMyPaymentReceipts = async (req, res, next) => {
  try {
    const { PaymentReceipt, Invoice, Customer } = getModels();
    let customerId = req.user.customerId;

    // Fallback: if token lacks customerId but role is Client, derive via linked Customer.userId
    if (!customerId && req.user && req.user.role === 'Client') {
      const linkedCustomer = await Customer.findOne({ where: { userId: req.user.id } });
      if (linkedCustomer) {
        customerId = linkedCustomer.id;
      }
    }

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required'
      });
    }

    // Fetch all receipts for the customer
    const receipts = await PaymentReceipt.findAll({
      where: { customerId: customerId },
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'dueDate']
        }
      ],
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      success: true,
      data: receipts
    });

  } catch (error) {
    console.error('Error fetching payment receipts:', error);
    next(error);
  }
};

// Customer: Get specific payment receipt details
const getPaymentReceiptDetails = async (req, res, next) => {
  try {
    const { PaymentReceipt, Invoice, Payment, Customer } = getModels();
    const { receiptId } = req.params;
    let customerId = req.user.customerId;

    // Fallback: if token lacks customerId but role is Client, derive via linked Customer.userId
    if (!customerId && req.user && req.user.role === 'Client') {
      const linkedCustomer = await Customer.findOne({ where: { userId: req.user.id } });
      if (linkedCustomer) {
        customerId = linkedCustomer.id;
      }
    }

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required'
      });
    }

    // Fetch receipt with related data
    const receipt = await PaymentReceipt.findOne({
      where: { 
        id: receiptId,
        customerId: customerId
      },
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'dueDate', 'invoiceDate']
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'paymentNumber', 'paymentMethod', 'reference']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerName', 'contactName', 'email1', 'street', 'city', 'postalCode', 'country']
        }
      ]
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Payment receipt not found'
      });
    }

    res.json({
      success: true,
      data: receipt
    });

  } catch (error) {
    console.error('Error fetching payment receipt details:', error);
    next(error);
  }
};

// Customer: Download payment receipt as PDF
const downloadPaymentReceipt = async (req, res, next) => {
  let browser = null;
  
  try {
    const { PaymentReceipt, Invoice, Payment, Customer } = getModels();
    const { receiptId } = req.params;
    let customerId = req.user.customerId;

    // Fallback: if token lacks customerId but role is Client, derive via linked Customer.userId
    if (!customerId && req.user && req.user.role === 'Client') {
      const linkedCustomer = await Customer.findOne({ where: { userId: req.user.id } });
      if (linkedCustomer) {
        customerId = linkedCustomer.id;
      }
    }

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required'
      });
    }

    // Fetch receipt with full details
    const receipt = await PaymentReceipt.findOne({
      where: { 
        id: receiptId,
        customerId: customerId
      },
      attributes: ['id', 'receiptNumber', 'paymentDate', 'amount', 'totalAmount', 'remainingAmount', 'paymentMethod', 'paymentReference', 'status'],
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'dueDate', 'invoiceDate']
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'paymentNumber', 'paymentMethod', 'reference']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerName', 'contactName', 'email1', 'telephone1', 'street', 'city', 'postalCode', 'country']
        }
      ]
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Payment receipt not found'
      });
    }

    // Generate HTML for the receipt
    const htmlContent = generateReceiptHTML(receipt);

    // Launch Puppeteer browser with production-safe settings
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--single-process',
        '--no-zygote',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    };

    // Add executable path for production if needed
    if (process.env.NODE_ENV === 'production') {
      // Try to use the installed Chrome from puppeteer
      try {
        const { executablePath } = require('puppeteer');
        launchOptions.executablePath = executablePath();
      } catch (error) {
        console.log('Using system Chrome or default executable path');
      }
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    
    try {
      // Set the HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF with optimized settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });

      // Set response headers for PDF download
      const fileName = `${receipt.receiptNumber}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');

      // Send PDF buffer as binary
      res.end(pdfBuffer);
      
    } finally {
      // Ensure page is closed
      try {
        await page.close();
      } catch (pageCloseError) {
        // Page close error - non-critical
      }
    }

  } catch (error) {
    console.error('Error downloading payment receipt:', error);
    
    // Ensure browser is closed even if there's an error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        // Browser close error - non-critical
      }
    }
    
    // Check if it's a Chrome/Puppeteer specific error
    if (error.message.includes('Could not find Chrome') || error.message.includes('Chrome')) {
      console.error('Chrome/Puppeteer installation issue detected');
      res.status(500).json({
        success: false,
        message: 'PDF generation service temporarily unavailable. Please try again later or contact support.',
        error: process.env.NODE_ENV === 'development' ? error.message : 'PDF service unavailable'
      });
    } else {
      // Send error response
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF receipt',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

// Get available payment methods
const getAvailablePaymentMethods = async (req, res, next) => {
  try {
    const { PayMongoPaymentMethod } = getModels();

    // Fetch enabled payment methods from database
    const paymentMethods = await PayMongoPaymentMethod.findAll({
      where: { isEnabled: true },
      order: [['sortOrder', 'ASC']]
    });

    // Transform to frontend format
    const formattedMethods = paymentMethods.map(method => ({
      key: method.methodKey,
      label: method.methodName,
      description: method.description,
      available: method.isEnabled,
      processingTime: method.processingTime,
      fees: method.fees,
      color: method.color,
      icon: method.icon,
      minAmount: parseFloat(method.minAmount),
      maxAmount: parseFloat(method.maxAmount)
    }));

    res.json({
      success: true,
      data: {
        paymentMethods: formattedMethods,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching available payment methods:', error);
    next(error);
  }
};

module.exports = {
  submitPayment,
  getMyPayments,
  getPendingPayments,
  getRejectedPayments,
  approvePayment,
  rejectPayment,
  appealRejectedPayment,
  getPaymentHistory,
  getAllPaymentHistory,
  getCustomerPaymentHistory,
  getPaymentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getBalanceHistory,
  reapproveRejectedPayment,
  deleteRejectedPayment,
  // PayMongo endpoints
  createPaymentIntent,
  createPaymentMethod,
  attachPaymentToIntent,
  createPaymentSource,
  handlePayMongoWebhook,
  getPaymentStatus,
  getFailedPayments,
  getAvailablePaymentMethods,
  // Payment Receipt endpoints
  getMyPaymentReceipts,
  getPaymentReceiptDetails,
  downloadPaymentReceipt
};
