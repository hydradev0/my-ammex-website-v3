const express = require('express');
const router = express.Router();
const {
  getSettingsByCategory,
  getAllSettings,
  updateSettings,
  updateCompanySettings,
  updateMarkupSettings,
  getCompanySettings,
  getMarkupSettings
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Get all settings
router.get('/', getAllSettings);

// Get settings by category
router.get('/category/:category', getSettingsByCategory);

// Get company settings (for invoice template)
router.get('/company', getCompanySettings);

// Get markup settings (for product pricing)
router.get('/markup', getMarkupSettings);

// Update all settings
router.put('/', updateSettings);

// Update company settings
router.put('/company', updateCompanySettings);

// Update markup settings
router.put('/markup', updateMarkupSettings);

module.exports = router;
