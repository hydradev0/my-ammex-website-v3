const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/daily-metrics
// @desc    Get daily dashboard metrics with today vs yesterday comparison
// @access  Private
router.get('/daily-metrics', /* protect, */ dashboardController.getDailyDashboardMetrics);


// @route   GET /api/dashboard/inventory-alerts
// @desc    Get inventory alerts for items that need reordering
// @access  Private
router.get('/inventory-alerts', /* protect, */ dashboardController.getInventoryAlerts);

module.exports = router;
