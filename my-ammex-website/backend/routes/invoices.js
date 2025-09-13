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
  createInvoice
} = require('../controllers/invoiceController');

// Validation middleware
const validateInvoiceCreation = [
  check('orderId', 'Order ID is required').isInt({ min: 1 }),
  check('paymentTerms', 'Payment terms must be a string').optional().isString(),
  check('notes', 'Notes must be a string').optional().isString()
];

const validateInvoiceStatusUpdate = [
  check('status', 'Status is required').isIn(['pending', 'completed'])
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

module.exports = router;
