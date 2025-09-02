const express = require('express');
const router = express.Router();
const {
  getCustomerCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  convertCartToOrder
} = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/auth');
const { getModels } = require('../config/db');

// Middleware: ensure the route's :customerId maps to the authenticated user's Customer.id
const ensureOwnCustomer = async (req, res, next) => {
  try {
    const { Customer } = getModels();
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for user' });
    }
    // Normalize param: if client sent their userId, or wrong id, force to owned customer.id
    req.params.customerId = String(customer.id);
    next();
  } catch (err) {
    next(err);
  }
};

// Get customer's active cart (Clients only)
router.get('/:customerId', protect, authorize('Client'), ensureOwnCustomer, getCustomerCart);

// Add item to cart (Clients only)
router.post('/:customerId/items', protect, authorize('Client'), ensureOwnCustomer, addToCart);

// Update cart item quantity (Clients only)
router.put('/items/:cartItemId', protect, authorize('Client'), updateCartItem);

// Remove item from cart (Clients only)
router.delete('/items/:cartItemId', protect, authorize('Client'), removeFromCart);

// Clear customer's cart (Clients only)
router.delete('/:customerId/clear', protect, authorize('Client'), ensureOwnCustomer, clearCart);

// Convert cart to order (Clients only)
router.post('/:customerId/convert', protect, authorize('Client'), ensureOwnCustomer, convertCartToOrder);

module.exports = router;

