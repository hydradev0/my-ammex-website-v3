const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { getModels } = require('../config/db');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  getMyCustomer,
  fixMyProfileCompletion
} = require('../controllers/customerController');

// Validation middleware
const validateCustomer = [
  check('customerName', 'Customer name is required').not().isEmpty().trim(),
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
// @access  Private (Admin, Sales Marketing, Client (Read Only))
router.get('/', protect, authorize('Admin', 'Sales Marketing', 'Client'), getAllCustomers);

// @route   GET /api/customers/stats
// @desc    Get customer statistics
// @access  Private (Admin, Sales Marketing, Client (Read Only))
router.get('/stats', protect, authorize('Admin', 'Sales Marketing', 'Client'), getCustomerStats);

// @route   GET /api/customers/me
// @desc    Get current user's customer
// @access  Private (Any authenticated user)
router.get('/me', protect, getMyCustomer);

// @route   POST /api/customers/fix-profile-completion
// @desc    Fix profile completion status for current user
// @access  Private (Any authenticated user)
router.post('/fix-profile-completion', protect, fixMyProfileCompletion);

// Ownership guard for client updating their own customer only
const ensureOwnCustomerByParam = async (req, res, next) => {
  try {
    // Admins/Sales can pass
    if (req.user.role === 'Admin' || req.user.role === 'Sales Marketing') return next();
    const { Customer } = getModels();
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (customer.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot modify another customer' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/customers/:id
// @desc    Get single customer by ID
// @access  Private (Admin, Sales Marketing, Client (Read Only))
router.get('/:id', protect, authorize('Admin', 'Sales Marketing', 'Client'), getCustomerById);

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private (Admin, Sales Marketing)
router.post('/', protect, authorize('Admin', 'Sales Marketing'), validateCustomer, handleValidationErrors, createCustomer);

// @route   PUT /api/customers/:id
// @desc    Update customer (Admins/Sales can update any; Clients only their own)
// @access  Private
router.put('/:id', protect, authorize('Admin', 'Sales Marketing', 'Client'), ensureOwnCustomerByParam, updateCustomer);

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private (Admin, Sales Marketing)
router.delete('/:id', protect, authorize('Admin', 'Sales Marketing'), deleteCustomer);

module.exports = router; 