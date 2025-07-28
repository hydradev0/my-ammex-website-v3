const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
  updateItemStock
} = require('../controllers/itemController');

// Validation middleware
const validateItem = [
  check('itemName', 'Item name is required').not().isEmpty(),
  check('itemCode', 'Item code is required').not().isEmpty(),
  check('vendor', 'Vendor is required').not().isEmpty(),
  check('price', 'Price must be a positive number').isFloat({ min: 0 }),
  check('floorPrice', 'Floor price must be a positive number').isFloat({ min: 0 }),
  check('ceilingPrice', 'Ceiling price must be a positive number').isFloat({ min: 0 }),
  check('unitId', 'Unit is required').isInt({ min: 1 }),
  check('categoryId', 'Category is required').isInt({ min: 1 }),
  check('quantity', 'Quantity must be a non-negative integer').isInt({ min: 0 }),
  check('minLevel', 'Minimum level must be a non-negative integer').isInt({ min: 0 }),
  check('maxLevel', 'Maximum level must be a non-negative integer').isInt({ min: 0 })
];

// @route   GET /api/items
// @desc    Get all items
// @access  Private
router.get('/', /* protect, */ getAllItems);

// @route   GET /api/items/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/low-stock', /* protect, */ getLowStockItems);

// @route   GET /api/items/:id
// @desc    Get single item by ID
// @access  Private
router.get('/:id', /* protect, */ getItemById);

// @route   POST /api/items
// @desc    Create new item (admin only)
// @access  Private/Admin
router.post('/', /* protect, authorize('admin'), */ validateItem, handleValidationErrors, createItem);

// @route   PUT /api/items/:id
// @desc    Update item (admin only)
// @access  Private/Admin
router.put('/:id', /* protect, authorize('admin'), */ updateItem);

// @route   PATCH /api/items/:id/stock
// @desc    Update item stock
// @access  Private
router.patch('/:id/stock', /* protect, */ [
  check('quantity', 'Quantity must be a non-negative integer').isInt({ min: 0 })
], handleValidationErrors, updateItemStock);

// @route   DELETE /api/items/:id
// @desc    Delete item (admin only)
// @access  Private/Admin
router.delete('/:id', /* protect, authorize('admin'), */ deleteItem);

module.exports = router; 