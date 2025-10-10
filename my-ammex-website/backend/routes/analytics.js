const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// AI Forecasting Routes
// @route   GET /api/analytics/historical-sales
// @desc    Get historical sales data for AI forecasting
// @access  Private
router.get('/historical-sales', /* protect, */ analyticsController.getHistoricalSalesForAI);

// @route   GET /api/analytics/historical-customer-data
// @desc    Get historical customer purchase data
// @access  Private
router.get('/historical-customer-data', /* protect, */ analyticsController.getHistoricalCustomerData);

// @route   GET /api/analytics/top-products
// @desc    Get top performing products data
// @access  Private
router.get('/top-products', /* protect, */ analyticsController.getTopProducts);

// @route   GET /api/analytics/top-bulk-customers
// @desc    Get top bulk customers data
// @access  Private
router.get('/top-bulk-customers', /* protect, */ analyticsController.getTopBulkCustomers);

// @route   POST /api/analytics/forecast
// @desc    Generate AI sales forecast using OpenRouter
// @access  Private
router.post('/forecast', /* protect, */ analyticsController.generateSalesForecast);
// Customer bulk forecast
router.post('/customer-bulk-forecast', /* protect, */ analyticsController.generateCustomerBulkForecast);

// @route   GET /api/analytics/dashboard-metrics
// @desc    Get dashboard metrics (cached)
// @access  Private
router.get('/dashboard-metrics', /* protect, */ analyticsController.getDashboardMetrics);


// @route   POST /api/analytics/refresh-facts
// @desc    Refresh sales fact table (maintenance)
// @access  Private
router.post('/refresh-facts', /* protect, */ analyticsController.refreshSalesFactTable);



module.exports = router; 