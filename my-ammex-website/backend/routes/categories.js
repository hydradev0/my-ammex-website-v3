const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Private routes (Admin, Warehouse Supervisor, Sales Marketing - read only)
router.get('/', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing'), getCategories);
router.get('/:id', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing'), getCategory);

// Protected routes (Admin, Warehouse Supervisor)
router.post('/', protect, authorize('Admin', 'Warehouse Supervisor'), createCategory);
router.put('/:id', protect, authorize('Admin', 'Warehouse Supervisor'), updateCategory);
router.delete('/:id', protect, authorize('Admin', 'Warehouse Supervisor'), deleteCategory);

module.exports = router; 