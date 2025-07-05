const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// Get all orders (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  const orders = await Order.find().populate('user').populate('items.product');
  res.json(orders);
});

// Get orders for current user
router.get('/my', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  res.json(orders);
});

// Get a single order by ID (admin or owner)
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user').populate('items.product');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(order);
});

// Create a new order
router.post('/', protect, async (req, res) => {
  const { items, total } = req.body;
  const order = new Order({
    user: req.user._id,
    items,
    total
  });
  await order.save();
  res.status(201).json(order);
});

// Update order status (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

// Delete an order (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ message: 'Order deleted' });
});

module.exports = router; 