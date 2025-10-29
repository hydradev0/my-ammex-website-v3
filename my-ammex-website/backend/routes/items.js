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
  updateItemStock,
  updateItemPrice,
  getPriceHistory,
  getStockHistory
} = require('../controllers/itemController');

// Validation middleware
const validateItem = [
  check('modelNo', 'Model number is required').not().isEmpty(),
  check('itemName', 'Item name must be a string').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value !== 'string') {
      throw new Error('Item name must be a string');
    }
    return true;
  }),
  check('vendor', 'Vendor is required').not().isEmpty(),
  check('sellingPrice', 'Selling price must be a positive number').isFloat({ min: 0 }),
  check('supplierPrice', 'Supplier price must be a positive number').isFloat({ min: 0 }),
  check('unitId', 'Unit is required').isInt({ min: 1 }),
  check('categoryId', 'Category is required').isInt({ min: 1 }),
  check('subcategoryId', 'Subcategory must be a valid ID').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const num = parseInt(value);
    if (isNaN(num) || num < 1) {
      throw new Error('Subcategory must be a valid ID');
    }
    return true;
  }),
  check('quantity', 'Quantity must be a non-negative integer').isInt({ min: 0 }),
  check('minLevel', 'Minimum level must be a non-negative integer').isInt({ min: 0 }),
  check('maxLevel', 'Maximum level is required and must be a non-negative integer').isInt({ min: 0 }),
  check('description', 'Description must be a string').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value !== 'string') {
      throw new Error('Description must be a string');
    }
    return true;
  }),
  check('images', 'Images must be an array').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (!Array.isArray(value)) {
      throw new Error('Images must be an array');
    }
    // Validate each image URL if the array is not empty
    for (let i = 0; i < value.length; i++) {
      const url = value[i];
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error(`Image ${i + 1} must be a valid URL`);
      }
      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new Error(`Image ${i + 1} must be a valid URL`);
      }
    }
    return true;
  })
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

// @route   PATCH /api/items/:id/price
// @desc    Update item price
// @access  Private (Admin, Warehouse Supervisor)
router.patch('/:id/price', protect, authorize('Admin', 'Warehouse Supervisor'), [
  check('sellingPrice', 'Selling price must be a positive number').optional().isFloat({ min: 0 }),
  check('supplierPrice', 'Supplier price must be a positive number').optional().isFloat({ min: 0 }),
  check('markupPercentage', 'Markup percentage must be a non-negative number').optional().isFloat({ min: 0 }),
  check('adjustmentType', 'Adjustment type must be either "price" or "markup"').optional().isIn(['price', 'markup'])
], handleValidationErrors, updateItemPrice);

// @route   GET /api/items/:id/price-history
// @desc    Get price history for an item
// @access  Private (Admin, Warehouse Supervisor, Sales Marketing)
router.get('/:id/price-history', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing'), getPriceHistory);

// @route   GET /api/items/:id/stock-history
// @desc    Get stock history for an item
// @access  Private (Admin, Warehouse Supervisor, Sales Marketing)
router.get('/:id/stock-history', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing'), getStockHistory);

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (Admin, Warehouse Supervisor)
router.delete('/:id', protect, authorize('Admin', 'Warehouse Supervisor'), deleteItem);

// @route   POST /api/items/:id/restore
// @desc    Restore archived item
// @access  Private (Admin, Warehouse Supervisor)
router.post('/:id/restore', protect, authorize('Admin', 'Warehouse Supervisor'), restoreItem);

module.exports = router; 