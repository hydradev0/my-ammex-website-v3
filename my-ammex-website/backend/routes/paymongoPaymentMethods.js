const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/paymongoPaymentMethodController');

// @route   GET /api/paymongo-payment-methods
// @desc    Get all PayMongo payment methods (admin)
// @access  Private (Admin, Sales Marketing)
router.get('/', protect, authorize('Admin', 'Sales Marketing'), ctrl.getAllPaymentMethods);

// @route   GET /api/paymongo-payment-methods/:id
// @desc    Get specific PayMongo payment method
// @access  Private (Admin, Sales Marketing)
router.get('/:id', protect, authorize('Admin', 'Sales Marketing'), ctrl.getPaymentMethodById);

// @route   PUT /api/paymongo-payment-methods/:id
// @desc    Update PayMongo payment method
// @access  Private (Admin, Sales Marketing)
router.put('/:id', protect, authorize('Admin', 'Sales Marketing'), ctrl.updatePaymentMethod);

// @route   PUT /api/paymongo-payment-methods/:id/toggle
// @desc    Toggle payment method enabled/disabled
// @access  Private (Admin, Sales Marketing)
router.put('/:id/toggle', protect, authorize('Admin', 'Sales Marketing'), ctrl.togglePaymentMethod);

// @route   PUT /api/paymongo-payment-methods/reorder
// @desc    Reorder payment methods
// @access  Private (Admin, Sales Marketing)
router.put('/reorder', protect, authorize('Admin', 'Sales Marketing'), ctrl.reorderPaymentMethods);

module.exports = router;
