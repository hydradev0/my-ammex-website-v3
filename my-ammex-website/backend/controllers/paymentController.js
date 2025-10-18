const { getModels } = require('../config/db');
const { updateInvoicePayment } = require('../utils/invoiceUtils');
const paymongoService = require('../services/paymongoService');

// Generate unique payment number
function generatePaymentNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `PAY-${yyyy}${mm}${dd}-${random}`;
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
          attributes: ['id', 'customer_name']
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
          attributes: ['id', 'customer_name', 'contact_name']
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
    const { invoiceId, amount } = req.body;
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
      paymentMethod: 'paymongo',
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
      failed: `${baseUrl}/Products/Invoices?payment=failed`
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
    const { Payment, Invoice, Notification, PaymentHistory } = getModels();
    
    // Verify webhook signature (skip in development if testing locally)
    const signature = req.headers['paymongo-signature'];
    const rawBody = JSON.stringify(req.body);
    
    if (signature && !paymongoService.verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Parse webhook event
    const event = paymongoService.parseWebhookEvent(req.body);
    
    console.log('PayMongo webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment.paid':
        await handlePaymentPaid(event.data, Payment, Invoice, Notification, PaymentHistory);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.data, Payment, Notification);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data, Payment, Notification);
        break;
      
      case 'source.chargeable':
        await handleSourceChargeable(event.data, Payment, Invoice, Notification, PaymentHistory);
        break;
      
      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    res.json({ success: true, received: true });

  } catch (error) {
    console.error('Error handling PayMongo webhook:', error);
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
      paymentMethod: 'paymongo',
      reference: paymentData.id,
      notes: 'Payment automatically approved via PayMongo gateway'
    });

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
    const failureCode = paymentData.attributes.last_payment_error?.code || 'unknown';
    const failureMessage = paymentData.attributes.last_payment_error?.message || 'Payment failed';

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
    const failureCode = lastError?.code || lastError?.failed_code || 'unknown';
    const failureMessage = lastError?.message || lastError?.failed_message || 'Payment failed';

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
      paymentMethod: 'paymongo',
      reference: sourceData.id,
      notes: 'E-wallet payment automatically approved via PayMongo gateway'
    });

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
          attributes: ['id', 'customer_name', 'contact_name', 'email1']
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
  getFailedPayments
};
