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

module.exports = router;
