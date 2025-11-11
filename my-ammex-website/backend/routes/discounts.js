const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllItemsForDiscount,
  getDiscountedProducts,
  applyDiscount,
  removeDiscount,
  getDiscountSettings
} = require('../controllers/discountController');

// Validation middleware for applying discount
const validateApplyDiscount = [
  check('productIds', 'Product IDs must be an array').isArray({ min: 1 }),
  check('productIds.*', 'Each product ID must be a valid integer').isInt({ min: 1 }),
  check('discountPercentage', 'Discount percentage must be between 1 and 100')
    .isFloat({ min: 0.01, max: 100 }),
  check('startDate', 'Start date must be a valid date')
    .optional({ checkFalsy: true })
    .isISO8601(),
  check('endDate', 'End date must be a valid date')
    .optional({ checkFalsy: true })
    .isISO8601()
];

// @route   GET /api/discounts/items
// @desc    Get all items with pagination for discount management
// @access  Private (Admin, Sales Marketing)
router.get(
  '/items',
  protect,
  authorize('Admin', 'Sales Marketing'),
  getAllItemsForDiscount
);

// @route   GET /api/discounts/active
// @desc    Get all currently discounted products
// @access  Private (Admin, Sales Marketing)
router.get(
  '/active',
  protect,
  authorize('Admin', 'Sales Marketing'),
  getDiscountedProducts
);

// @route   GET /api/discounts/settings
// @desc    Get discount settings (max discount, tiers, etc.)
// @access  Private (Admin, Sales Marketing)
router.get(
  '/settings',
  protect,
  authorize('Admin', 'Sales Marketing'),
  getDiscountSettings
);

// @route   POST /api/discounts/apply
// @desc    Apply discount to products
// @access  Private (Admin, Sales Marketing)
router.post(
  '/apply',
  protect,
  authorize('Admin', 'Sales Marketing'),
  validateApplyDiscount,
  handleValidationErrors,
  applyDiscount
);

// @route   DELETE /api/discounts/:id
// @desc    Remove discount from a product
// @access  Private (Admin, Sales Marketing)
router.delete(
  '/:id',
  protect,
  authorize('Admin', 'Sales Marketing'),
  removeDiscount
);

module.exports = router;

