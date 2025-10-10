const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/daily-metrics
// @desc    Get daily dashboard metrics with today vs yesterday comparison
// @access  Private
router.get('/daily-metrics', /* protect, */ dashboardController.getDailyDashboardMetrics);

// @route   GET /api/dashboard/basic-metrics
// @desc    Get basic dashboard metrics (monthly view)
// @access  Private
router.get('/basic-metrics', /* protect, */ dashboardController.getBasicDashboardMetrics);

module.exports = router;
