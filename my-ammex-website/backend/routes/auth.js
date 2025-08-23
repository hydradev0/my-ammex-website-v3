const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  getAllUsers,
  updateUser,
  deleteUser
} = require('../controllers/authController');

// Validation middleware
const validateRegistration = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('role', 'Valid role is required').isIn(['Admin', 'Client', 'Warehouse Supervisor', 'Sales Marketing']),
  check('department', 'Valid department is required').isIn(['Sales', 'Warehouse', 'Administration', 'Client Services'])
];

const validateLogin = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// @route   POST /api/auth/register
// @desc    Register new user (admin only)
// @access  Private/Admin
router.post('/register', protect, authorize('Admin'), validateRegistration, handleValidationErrors, registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, handleValidationErrors, loginUser);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getCurrentUser);

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', protect, authorize('Admin'), getAllUsers);

// @route   PUT /api/auth/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put('/users/:id', protect, authorize('Admin'), updateUser);

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);

// @route   GET /api/auth/roles
// @desc    Get available user roles
// @access  Public
router.get('/roles', (req, res) => {
  res.json({
    success: true,
    data: [
      { value: 'Admin', label: 'Administrator' },
      { value: 'Sales Marketing', label: 'Sales Marketing' },
      { value: 'Warehouse Supervisor', label: 'Warehouse Supervisor' },
      { value: 'Client', label: 'Client' }
    ]
  });
});

// @route   GET /api/auth/departments
// @desc    Get available departments
// @access  Public
router.get('/departments', (req, res) => {
  res.json({
    success: true,
    data: [
      { value: 'Sales', label: 'Sales' },
      { value: 'Warehouse', label: 'Warehouse' },
      { value: 'Administration', label: 'Administration' },
      { value: 'Client Services', label: 'Client Services' }
    ]
  });
});

module.exports = router; 