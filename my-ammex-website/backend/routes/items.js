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
  getArchivedItems,
  restoreItem,
  getLowStockItems,
  updateItemStock
} = require('../controllers/itemController');

// Validation middleware
const validateItem = [
  check('itemName', 'Item name is required').not().isEmpty(),
  check('modelNo', 'Model number is required').not().isEmpty(),
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
// @access  Private (Admin, Warehouse Supervisor, Sales Marketing & Client (Read Only))
router.get('/', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing', 'Client'), getAllItems);

// @route   GET /api/items/archived
// @desc    Get archived (deleted) items
// @access  Private (Admin, Warehouse Supervisor)
router.get('/archived', protect, authorize('Admin', 'Warehouse Supervisor'), getArchivedItems);

// @route   GET /api/items/low-stock
// @desc    Get low stock items
// @access  Private (Admin, Warehouse Supervisor, Sales Marketing & Client (Read Only))
router.get('/low-stock', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing', 'Client'), getLowStockItems);

// @route   GET /api/items/:id
// @desc    Get single item by ID
// @access  Private (Admin, Warehouse Supervisor, Sales Marketing & Client (Read Only))
router.get('/:id', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing', 'Client'), getItemById);

// @route   POST /api/items
// @desc    Create new item
// @access  Private (Admin, Warehouse Supervisor)
router.post('/', protect, authorize('Admin', 'Warehouse Supervisor'), validateItem, handleValidationErrors, createItem);

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private (Admin, Warehouse Supervisor)
router.put('/:id', protect, authorize('Admin', 'Warehouse Supervisor'), updateItem);

// @route   PATCH /api/items/:id/stock
// @desc    Update item stock
// @access  Private (Admin, Warehouse Supervisor)
router.patch('/:id/stock', protect, authorize('Admin', 'Warehouse Supervisor'), [
  check('quantity', 'Quantity must be a non-negative integer').isInt({ min: 0 })
], handleValidationErrors, updateItemStock);

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (Admin, Warehouse Supervisor)
router.delete('/:id', protect, authorize('Admin', 'Warehouse Supervisor'), deleteItem);

// @route   POST /api/items/:id/restore
// @desc    Restore archived item
// @access  Private (Admin, Warehouse Supervisor)
router.post('/:id/restore', protect, authorize('Admin', 'Warehouse Supervisor'), restoreItem);

module.exports = router; 