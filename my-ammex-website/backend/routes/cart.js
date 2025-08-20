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

// Get customer's active cart (Clients only)
router.get('/:customerId', protect, authorize('Client'), (req, res, next) => {
  if (String(req.user.id) !== String(req.params.customerId)) {
    return res.status(403).json({ success: false, message: 'Forbidden: cannot access another customer\'s cart' });
  }
  next();
}, getCustomerCart);

// Add item to cart (Clients only)
router.post('/:customerId/items', protect, authorize('Client'), (req, res, next) => {
  if (String(req.user.id) !== String(req.params.customerId)) {
    return res.status(403).json({ success: false, message: 'Forbidden: cannot modify another customer\'s cart' });
  }
  next();
}, addToCart);

// Update cart item quantity (Clients only)
router.put('/items/:cartItemId', protect, authorize('Client'), updateCartItem);

// Remove item from cart (Clients only)
router.delete('/items/:cartItemId', protect, authorize('Client'), removeFromCart);

// Clear customer's cart (Clients only)
router.delete('/:customerId/clear', protect, authorize('Client'), (req, res, next) => {
  if (String(req.user.id) !== String(req.params.customerId)) {
    return res.status(403).json({ success: false, message: 'Forbidden: cannot clear another customer\'s cart' });
  }
  next();
}, clearCart);

// Convert cart to order (Clients only)
router.post('/:customerId/convert', protect, authorize('Client'), (req, res, next) => {
  if (String(req.user.id) !== String(req.params.customerId)) {
    return res.status(403).json({ success: false, message: 'Forbidden: cannot convert another customer\'s cart' });
  }
  next();
}, convertCartToOrder);

module.exports = router;

