const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  updateProductStock
} = require('../controllers/productController');

// Validation middleware
const validateProduct = [
  check('name', 'Product name is required').not().isEmpty(),
  check('sku', 'SKU is required').not().isEmpty(),
  check('price', 'Price must be a positive number').isFloat({ min: 0 }),
  check('quantity', 'Quantity must be a non-negative integer').isInt({ min: 0 })
];

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', protect, getAllProducts);

// @route   GET /api/products/low-stock
// @desc    Get low stock products
// @access  Private
router.get('/low-stock', protect, getLowStockProducts);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Private
router.get('/:id', protect, getProductById);

// @route   POST /api/products
// @desc    Create new product (admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), validateProduct, createProduct);

// @route   PUT /api/products/:id
// @desc    Update product (admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), updateProduct);

// @route   PATCH /api/products/:id/stock
// @desc    Update product stock
// @access  Private
router.patch('/:id/stock', protect, updateProductStock);

// @route   DELETE /api/products/:id
// @desc    Delete product (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router; 