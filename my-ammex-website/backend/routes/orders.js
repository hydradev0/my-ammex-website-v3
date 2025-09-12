const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByStatus,
  getMyOrders
} = require('../controllers/orderController');
const { getModels } = require('../config/db');

// Validation middleware
const validateOrder = [
  check('customerId', 'Customer ID is required').isInt({ min: 1 }),
  check('totalAmount', 'Total amount must be a positive number').isFloat({ min: 0 }),
  check('items', 'Order items are required').isArray({ min: 1 })
];

const validateOrderItem = [
  check('items.*.itemId', 'Item ID is required').isInt({ min: 1 }),
  check('items.*.quantity', 'Quantity must be a positive integer').isInt({ min: 1 }),
  check('items.*.unitPrice', 'Unit price must be a positive number').isFloat({ min: 0 }),
  check('items.*.totalPrice', 'Item total price must be a positive number').isFloat({ min: 0 })
];

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private (Admin, Sales Marketing)
router.get('/', protect, authorize('Admin', 'Sales Marketing'), getAllOrders);

// @route   GET /api/orders/status/:status
// @desc    Get orders by status (includes customer and item details)
// @access  Private (Admin, Sales Marketing)
router.get('/status/:status', protect, authorize('Admin', 'Sales Marketing'), getOrdersByStatus);

// Place specific routes before dynamic :id to avoid conflicts
router.get('/my', protect, authorize('Client'), getMyOrders);

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private (Admin, Sales Marketing)
router.get('/:id', protect, authorize('Admin', 'Sales Marketing'), getOrderById);

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (Admin, Sales Marketing)
router.post('/', protect, authorize('Admin', 'Sales Marketing'), validateOrder, validateOrderItem, handleValidationErrors, createOrder);

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private (Admin, Sales Marketing)
router.put('/:id', protect, authorize('Admin', 'Sales Marketing'), updateOrder);

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private (Admin, Sales Marketing)
router.patch('/:id/status', protect, authorize('Admin', 'Sales Marketing'), updateOrderStatus);

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private (Admin, Sales Marketing)
router.delete('/:id', protect, authorize('Admin', 'Sales Marketing'), deleteOrder);

// Moved '/my' above to avoid being captured by '/:id'

module.exports = router; 