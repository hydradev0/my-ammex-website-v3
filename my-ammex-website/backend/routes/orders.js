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
  getOrdersByStatus
} = require('../controllers/orderController');

// Validation middleware
const validateOrder = [
  check('customerId', 'Customer ID is required').isInt({ min: 1 }),
  check('orderNumber', 'Order number is required').not().isEmpty(),
  check('totalAmount', 'Total amount must be a positive number').isFloat({ min: 0 }),
  check('items', 'Order items are required').isArray({ min: 1 })
];

const validateOrderItem = [
  check('items.*.productId', 'Product ID is required').isInt({ min: 1 }),
  check('items.*.quantity', 'Quantity must be a positive integer').isInt({ min: 1 }),
  check('items.*.unitPrice', 'Unit price must be a positive number').isFloat({ min: 0 }),
  check('items.*.totalPrice', 'Item total price must be a positive number').isFloat({ min: 0 })
];

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private
router.get('/', /* protect, */ getAllOrders);

// @route   GET /api/orders/status/:status
// @desc    Get orders by status
// @access  Private
router.get('/status/:status', /* protect, */ getOrdersByStatus);

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get('/:id', /* protect, */ getOrderById);

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', /* protect, */ validateOrder, validateOrderItem, handleValidationErrors, createOrder);

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private
router.put('/:id', /* protect, */ updateOrder);

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.patch('/:id/status', /* protect, */ updateOrderStatus);

// @route   DELETE /api/orders/:id
// @desc    Delete order (admin only)
// @access  Private/Admin
router.delete('/:id', /* protect, authorize('admin'), */ deleteOrder);

module.exports = router; 