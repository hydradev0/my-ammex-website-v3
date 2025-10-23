const express = require('express');
const router = express.Router();
const { check, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const ctrl = require('../controllers/paymentController');

// Validation middleware for payment submission
const validatePaymentSubmission = [
  check('invoiceId', 'Invoice ID is required').isInt({ min: 1 }),
  check('amount', 'Payment amount is required and must be a positive number').isFloat({ min: 0.01 }),
  check('paymentMethod', 'Payment method is required').notEmpty(),
  check('reference', 'Reference number is required').notEmpty().bail().isString(),
  check('notes', 'Notes must be a string').optional().isString(),
  check('attachments', 'Attachments must be an array').optional().isArray()
];

// Validation middleware for payment approval/rejection (validate URL param)
const validatePaymentAction = [
  param('id', 'Payment ID is required').isInt({ min: 1 })
];

// Validation middleware for rejection reason
const validateRejectionReason = [
  check('rejectionReason', 'Rejection reason is required').notEmpty()
];

// @route   POST /api/payments/submit
// @desc    Submit a new payment for an invoice
// @access  Private (Client)
router.post('/submit', protect, authorize('Client'), validatePaymentSubmission, handleValidationErrors, ctrl.submitPayment);

// @route   GET /api/payments/my
// @desc    Get authenticated client's own payments
// @access  Private (Client)
router.get('/my', protect, authorize('Client'), ctrl.getMyPayments);

// @route   GET /api/payments/pending
// @desc    Get all pending payments (for admin approval)
// @access  Private (Admin, Sales Marketing)
router.get('/pending', protect, authorize('Admin', 'Sales Marketing'), ctrl.getPendingPayments);

// @route   GET /api/payments/rejected
// @desc    Get all rejected payments
// @access  Private (Admin, Sales Marketing)
router.get('/rejected', protect, authorize('Admin', 'Sales Marketing'), ctrl.getRejectedPayments);

// @route   PATCH /api/payments/:id/approve
// @desc    Approve a pending payment
// @access  Private (Admin, Sales Marketing)
router.patch('/:id/approve', protect, authorize('Admin', 'Sales Marketing'), validatePaymentAction, handleValidationErrors, ctrl.approvePayment);

// @route   PATCH /api/payments/:id/reject
// @desc    Reject a pending payment
// @access  Private (Admin, Sales Marketing)
router.patch('/:id/reject', protect, authorize('Admin', 'Sales Marketing'), validatePaymentAction, validateRejectionReason, handleValidationErrors, ctrl.rejectPayment);

// @route   POST /api/payments/:id/appeal
// @desc    Client appeals a rejected payment
// @access  Private (Client)
router.post('/:id/appeal', protect, authorize('Client'), ctrl.appealRejectedPayment);

// @route   PATCH /api/payments/:id/reapprove
// @desc    Move a rejected payment back to pending approval
// @access  Private (Admin, Sales Marketing)
router.patch('/:id/reapprove', protect, authorize('Admin', 'Sales Marketing'), validatePaymentAction, handleValidationErrors, ctrl.reapproveRejectedPayment);

// @route   DELETE /api/payments/:id
// @desc    Permanently delete a rejected payment
// @access  Private (Admin, Sales Marketing)
router.delete('/:id', protect, authorize('Admin', 'Sales Marketing'), validatePaymentAction, handleValidationErrors, ctrl.deleteRejectedPayment);

// @route   GET /api/payments/history
// @desc    Get all payment history (for admin)
// @access  Private (Admin, Sales Marketing)
router.get('/history', protect, authorize('Admin', 'Sales Marketing'), ctrl.getAllPaymentHistory);

// @route   GET /api/payments/history/invoice/:invoiceId
// @desc    Get payment history for a specific invoice
// @access  Private (Client)
router.get('/history/invoice/:invoiceId', protect, authorize('Client'), ctrl.getPaymentHistory);

// @route   GET /api/payments/history/customer/:customerId
// @desc    Get payment history for a specific customer (for admin)
// @access  Private (Admin, Sales Marketing)
router.get('/history/customer/:customerId', protect, authorize('Admin', 'Sales Marketing'), ctrl.getCustomerPaymentHistory);

// @route   GET /api/notifications/my
// @desc    Get authenticated user's own notifications
// @access  Private (Client, Admin, Sales Marketing)
router.get('/notifications/my', protect, authorize('Client', 'Admin', 'Sales Marketing'), ctrl.getPaymentNotifications);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private (Client, Admin, Sales Marketing)
router.patch('/notifications/:id/read', protect, authorize('Client', 'Admin', 'Sales Marketing'), ctrl.markNotificationAsRead);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read for current user (or all admin notifications)
// @access  Private (Client, Admin, Sales Marketing)
router.patch('/notifications/read-all', protect, authorize('Client', 'Admin', 'Sales Marketing'), ctrl.markAllNotificationsAsRead);

// @route   GET /api/payments/balance-history
// @desc    Get balance history (for admin)
// @access  Private (Admin, Sales Marketing)
router.get('/balance-history', protect, authorize('Admin', 'Sales Marketing'), ctrl.getBalanceHistory);

// @route   POST /api/payments/create-payment-intent
// @desc    Create PayMongo payment intent for an invoice
// @access  Private (Client)
router.post('/create-payment-intent', protect, authorize('Client'), ctrl.createPaymentIntent);

// @route   POST /api/payments/create-payment-method
// @desc    Create PayMongo payment method (for card)
// @access  Private (Client)
router.post('/create-payment-method', protect, authorize('Client'), ctrl.createPaymentMethod);

// @route   POST /api/payments/attach-payment-method
// @desc    Attach payment method to payment intent
// @access  Private (Client)
router.post('/attach-payment-method', protect, authorize('Client'), ctrl.attachPaymentToIntent);

// @route   POST /api/payments/create-payment-source
// @desc    Create PayMongo source (for e-wallets)
// @access  Private (Client)
router.post('/create-payment-source', protect, authorize('Client'), ctrl.createPaymentSource);

// @route   POST /api/payments/webhook/paymongo
// @desc    PayMongo webhook handler
// @access  Public (Verified via signature)
router.post('/webhook/paymongo', express.raw({type: 'application/json'}), ctrl.handlePayMongoWebhook);

// @route   POST /api/payments/webhook
// @desc    PayMongo webhook endpoint
// @access  Public (webhook)
router.post('/webhook', ctrl.handlePayMongoWebhook);

// @route   GET /api/payments/webhook/test
// @desc    Test webhook endpoint (to verify it's accessible)
// @access  Public
router.get('/webhook/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: req.originalUrl
  });
});

// @route   GET /api/payments/webhook/health
// @desc    Webhook health check endpoint
// @access  Public
router.get('/webhook/health', ctrl.webhookHealthCheck);

// @route   GET /api/payments/webhook/stats
// @desc    Webhook statistics for monitoring
// @access  Public
router.get('/webhook/stats', ctrl.getWebhookStats);

// @route   GET /api/payments/status/:paymentIntentId
// @desc    Get payment status from PayMongo
// @access  Private (Client)
router.get('/status/:paymentIntentId', protect, authorize('Client'), ctrl.getPaymentStatus);

// @route   GET /api/payments/failed
// @desc    Get all failed payments
// @access  Private (Admin, Sales Marketing)
router.get('/failed', protect, authorize('Admin', 'Sales Marketing'), ctrl.getFailedPayments);

// @route   GET /api/payments/methods/available
// @desc    Get available payment methods
// @access  Public
router.get('/methods/available', ctrl.getAvailablePaymentMethods);

// @route   GET /api/payments/receipts/my
// @desc    Get authenticated client's payment receipts
// @access  Private (Client)
router.get('/receipts/my', protect, authorize('Client'), ctrl.getMyPaymentReceipts);

// @route   GET /api/payments/receipts/:receiptId
// @desc    Get specific payment receipt details
// @access  Private (Client)
router.get('/receipts/:receiptId', protect, authorize('Client'), ctrl.getPaymentReceiptDetails);

// @route   GET /api/payments/receipts/:receiptId/download
// @desc    Download payment receipt as PDF
// @access  Private (Client)
router.get('/receipts/:receiptId/download', protect, authorize('Client'), ctrl.downloadPaymentReceipt);

module.exports = router;
