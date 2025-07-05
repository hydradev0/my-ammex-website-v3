const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// Get all products
router.get('/', protect, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Get a single product by ID
router.get('/:id', protect, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// Create a new product (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.status(201).json(product);
});

// Update a product (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// Delete a product (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

module.exports = router; 