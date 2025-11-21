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
const { getAllTiers, saveTiers, getMyTier, getCustomerTier } = require('../controllers/tierController');
const { protect, authorize } = require('../middleware/auth');

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

// Account Tiers
// Reuse Settings access logic: keep protected, no specific role checks for list/save
router.get('/tiers', getAllTiers);
router.put('/tiers', saveTiers);

// Current user's tier (any authenticated user; returns default if not a Client)
router.get('/tiers/me', getMyTier);
router.get('/tiers/my', getMyTier); // alias for legacy frontend path

// Specific customer's tier (Admin + Sales Marketing)
router.get('/tiers/customer/:customerId', authorize('Admin', 'Sales Marketing'), getCustomerTier);

// Update all settings
router.put('/', updateSettings);

// Update company settings
router.put('/company', updateCompanySettings);

// Update markup settings
router.put('/markup', updateMarkupSettings);

module.exports = router;
