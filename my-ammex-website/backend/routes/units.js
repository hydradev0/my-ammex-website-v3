const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit
} = require('../controllers/unitController');

// Validation middleware
const validateUnit = [
  check('name', 'Unit name is required').not().isEmpty().trim(),
  check('name', 'Unit name must be between 1 and 50 characters').isLength({ min: 1, max: 50 })
];

// Private routes (Admin, Warehouse Supervisor, Sales Marketing - read only)
router.get('/', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing'), getUnits);
router.get('/:id', protect, authorize('Admin', 'Warehouse Supervisor', 'Sales Marketing'), getUnit);

// Protected routes (Admin, Warehouse Supervisor)
router.post('/', protect, authorize('Admin', 'Warehouse Supervisor'), validateUnit, handleValidationErrors, createUnit);
router.put('/:id', protect, authorize('Admin', 'Warehouse Supervisor'), validateUnit, handleValidationErrors, updateUnit);
router.delete('/:id', protect, authorize('Admin', 'Warehouse Supervisor'), deleteUnit);

module.exports = router; 