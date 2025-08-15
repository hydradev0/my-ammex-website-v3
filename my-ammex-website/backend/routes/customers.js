const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
} = require('../controllers/customerController');

// Validation middleware
const validateCustomer = [
  check('customerName', 'Customer name is required').not().isEmpty().trim(),
  check('telephone1', 'Telephone 1 is required').not().isEmpty().trim(),
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

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private
router.get('/', /* protect, */ getAllCustomers);

// @route   GET /api/customers/stats
// @desc    Get customer statistics
// @access  Private
router.get('/stats', /* protect, */ getCustomerStats);

// @route   GET /api/customers/:id
// @desc    Get single customer by ID
// @access  Private
router.get('/:id', /* protect, */ getCustomerById);

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private
router.post('/', /* protect, authorize('admin', 'sales'), */ validateCustomer, handleValidationErrors, createCustomer);

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', /* protect, authorize('admin', 'sales'), */ updateCustomer);

// @route   DELETE /api/customers/:id
// @desc    Delete customer (admin only)
// @access  Private/Admin
router.delete('/:id', /* protect, authorize('admin'), */ deleteCustomer);

module.exports = router; 