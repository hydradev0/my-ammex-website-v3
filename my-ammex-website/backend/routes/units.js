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

// Public routes
router.get('/', getUnits);
router.get('/:id', getUnit);

// Protected routes
router.post('/', /* protect, authorize('admin'), */ validateUnit, handleValidationErrors, createUnit);
router.put('/:id', /* protect, authorize('admin'), */ validateUnit, handleValidationErrors, updateUnit);
router.delete('/:id', /* protect, authorize('admin'), */ deleteUnit);

module.exports = router; 