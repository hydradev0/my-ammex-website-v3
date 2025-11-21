const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStats,
  getArchivedSuppliers,
  restoreSupplier
} = require('../controllers/supplierController');

// Validation middleware
const validateSupplier = [
  check('companyName', 'Company name is required').not().isEmpty().trim(),
  check('contactName', 'Contact name is required').not().isEmpty().trim(),
  check('street', 'Street is required').not().isEmpty().trim(),
  check('city', 'City is required').not().isEmpty().trim(),
  check('country', 'Country is required').not().isEmpty().trim(),
  check('postalCode').optional({ checkFalsy: true }).trim().custom((value) => {
    // Allow empty, null, or undefined
    if (!value || value === '' || value === null || value === undefined) {
      return true;
    }
    // Validate format: 3-10 characters, letters, numbers, spaces, or hyphens
    const postalCodeRegex = /^[A-Za-z0-9\s-]{3,10}$/;
    if (!postalCodeRegex.test(value)) {
      throw new Error('Postal code must be 3-10 characters and contain only letters, numbers, spaces, or hyphens');
    }
    return true;
  }),
  check('email1', 'Company Email 1 is required and must be valid').isEmail(),
  check('email2').optional({ checkFalsy: true }).trim().custom((value) => {
    // Allow empty, null, or undefined
    if (!value || value === '' || value === null || value === undefined) {
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Company Email 2 must be a valid email');
    }
    return true;
  }),
  check('telephone1', 'Company Telephone 1 is required').custom((value) => {
    if (!value) throw new Error('Company Telephone 1 is required');
    const digits = String(value).replace(/[^0-9]/g, '');
    if (digits.length < 7) {
      throw new Error('Company Telephone 1 must have at least 7 digits');
    }
    return true;
  }),
  check('telephone2').optional({ checkFalsy: true }).trim().custom((value) => {
    // Allow empty, null, or undefined
    if (!value || value === '' || value === null || value === undefined) {
      return true;
    }
    // Extract only digits
    const digits = String(value).replace(/[^0-9]/g, '');
    // If there are any digits, require at least 7
    if (digits.length > 0 && digits.length < 7) {
      throw new Error('Company Telephone 2 must have at least 7 digits if provided');
    }
    return true;
  })
];

// @route   GET /api/suppliers
// @desc    Get all suppliers
// @access  Private (Admin, Warehouse Supervisor)
router.get('/', protect, authorize('Admin', "Warehouse Supervisor", "Sales Marketing"), getAllSuppliers);

// @route   GET /api/suppliers/stats
// @desc    Get supplier statistics
// @access  Private (Admin, Warehouse Supervisor)
router.get('/stats', protect, authorize('Admin', "Warehouse Supervisor", "Sales Marketing"), getSupplierStats);

// @route   GET /api/suppliers/:id
// @desc    Get single supplier by ID
// @access  Private (Admin, Warehouse Supervisor)
router.get('/:id', protect, authorize('Admin', "Warehouse Supervisor", "Sales Marketing"), getSupplierById);

// @route   POST /api/suppliers
// @desc    Create new supplier
// @access  Private (Admin)
router.post('/', protect, authorize('Admin', "Warehouse Supervisor"), validateSupplier, handleValidationErrors, createSupplier);

// @route   PUT /api/suppliers/:id
// @desc    Update supplier
// @access  Private (Admin)
router.put('/:id', protect, authorize('Admin', "Warehouse Supervisor"), validateSupplier, handleValidationErrors, updateSupplier);

// @route   DELETE /api/suppliers/:id
// @desc    Delete supplier
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin', "Warehouse Supervisor"), deleteSupplier);

// @route   GET /api/suppliers/archived/list
// @desc    Get archived suppliers
// @access  Private (Admin, Warehouse Supervisor)
router.get('/archived/list', protect, authorize('Admin', "Warehouse Supervisor"), getArchivedSuppliers);

// @route   PUT /api/suppliers/:id/restore
// @desc    Restore archived supplier
// @access  Private (Admin, Warehouse Supervisor)
router.put('/:id/restore', protect, authorize('Admin', "Warehouse Supervisor"), restoreSupplier);

module.exports = router;
