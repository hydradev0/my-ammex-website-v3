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
  check('email1', 'Email 1 is required').isEmail(),
  check('email2').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty values
    }
    // If value is provided, validate it's a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Please provide a valid email address');
    }
    return true;
  }),
  check('telephone2').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty values
    }
    // If value is provided, validate it's not empty
    if (value.trim() === '') {
      throw new Error('Telephone 2 cannot be empty if provided');
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
router.put('/:id', protect, authorize('Admin', "Warehouse Supervisor"), updateSupplier);

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
