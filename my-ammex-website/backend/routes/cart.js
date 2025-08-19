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

// Get customer's active cart
router.get('/:customerId', getCustomerCart);

// Add item to cart
router.post('/:customerId/items', addToCart);

// Update cart item quantity
router.put('/items/:cartItemId', updateCartItem);

// Remove item from cart
router.delete('/items/:cartItemId', removeFromCart);

// Clear customer's cart
router.delete('/:customerId/clear', clearCart);

// Convert cart to order
router.post('/:customerId/convert', convertCartToOrder);

module.exports = router;

