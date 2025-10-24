const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllInvoices,
  getInvoicesByStatus,
  getInvoiceById,
  getMyInvoices,
  updateInvoiceStatus,
  createInvoice,
  getInvoicePaymentHistory,
  getAllInvoicesWithPayments,
  downloadInvoicePdf,
  testTaxCalculation
} = require('../controllers/invoiceController');

// Validation middleware
const validateInvoiceCreation = [
  check('orderId', 'Order ID is required').isInt({ min: 1 }),
  check('paymentTerms', 'Payment terms must be a string').optional().isString(),
  check('notes', 'Notes must be a string').optional().isString()
];

const validateInvoiceStatusUpdate = [
  check('status', 'Status is required').isIn(['awaiting payment', 'partially paid', 'completed', 'rejected', 'overdue'])
];

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private (Admin, Sales Marketing)
router.get('/', protect, authorize('Admin', 'Sales Marketing'), getAllInvoices);

// @route   GET /api/invoices/status/:status
// @desc    Get invoices by status
// @access  Private (Admin, Sales Marketing)
router.get('/status/:status', protect, authorize('Admin', 'Sales Marketing'), getInvoicesByStatus);

// @route   GET /api/invoices/my
// @desc    Get authenticated client's own invoices
// @access  Private (Client)
router.get('/my', protect, authorize('Client'), getMyInvoices);

// @route   GET /api/invoices/:id
// @desc    Get single invoice by ID
// @access  Private (Admin, Sales Marketing)
router.get('/:id', protect, authorize('Admin', 'Sales Marketing'), getInvoiceById);

// @route   POST /api/invoices
// @desc    Create new invoice from approved order
// @access  Private (Admin, Sales Marketing)
router.post('/', protect, authorize('Admin', 'Sales Marketing'), validateInvoiceCreation, handleValidationErrors, createInvoice);

// @route   PATCH /api/invoices/:id/status
// @desc    Update invoice status
// @access  Private (Admin, Sales Marketing)
router.patch('/:id/status', protect, authorize('Admin', 'Sales Marketing'), validateInvoiceStatusUpdate, handleValidationErrors, updateInvoiceStatus);

// @route   GET /api/invoices/:id/payment-history
// @desc    Get payment history for an invoice
// @access  Private (Client)
router.get('/:id/payment-history', protect, authorize('Client'), getInvoicePaymentHistory);

// @route   GET /api/invoices/:id/download
// @desc    Download invoice as PDF
// @access  Private (Client, Admin, Sales Marketing)
router.get('/:id/download', protect, authorize('Client', 'Admin', 'Sales Marketing'), downloadInvoicePdf);

// @route   GET /api/invoices/with-payments
// @desc    Get all invoices with payment details
// @access  Private (Admin, Sales Marketing)
router.get('/with-payments', protect, authorize('Admin', 'Sales Marketing'), getAllInvoicesWithPayments);

// @route   GET /api/invoices/test/tax-calculation
// @desc    Test tax calculation with provided amount
// @access  Private (Admin, Sales Marketing) - for testing purposes
router.get('/test/tax-calculation', protect, authorize('Admin', 'Sales Marketing'), testTaxCalculation);

module.exports = router;
