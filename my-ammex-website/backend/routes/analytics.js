const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive analytics dashboard
// @access  Private
router.get('/dashboard', /* protect, */ analyticsController.getDashboardAnalytics);

// @route   GET /api/analytics/sales
// @desc    Get sales analytics
// @access  Private
router.get('/sales', /* protect, */ async (req, res, next) => {
  try {
    const salesMetrics = await analyticsController.getSalesMetrics();
    res.json({ success: true, data: salesMetrics });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/inventory
// @desc    Get inventory analytics
// @access  Private
router.get('/inventory', /* protect, */ async (req, res, next) => {
  try {
    const inventoryMetrics = await analyticsController.getInventoryMetrics();
    res.json({ success: true, data: inventoryMetrics });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/customers
// @desc    Get customer analytics
// @access  Private
router.get('/customers', /* protect, */ async (req, res, next) => {
  try {
    const customerMetrics = await analyticsController.getCustomerMetrics();
    res.json({ success: true, data: customerMetrics });
  } catch (error) {
    next(error);
  }
});

// AI Predictions
// @route   GET /api/analytics/predictions/sales
// @desc    Get sales forecast
// @access  Private
router.get('/predictions/sales', /* protect, */ async (req, res, next) => {
  try {
    const salesForecast = await analyticsController.predictSales();
    res.json({ success: true, data: salesForecast });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/predictions/demand
// @desc    Get demand forecast
// @access  Private
router.get('/predictions/demand', /* protect, */ async (req, res, next) => {
  try {
    const demandForecast = await analyticsController.predictDemand();
    res.json({ success: true, data: demandForecast });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/predictions/inventory
// @desc    Get inventory forecast
// @access  Private
router.get('/predictions/inventory', /* protect, */ async (req, res, next) => {
  try {
    const inventoryForecast = await analyticsController.predictInventoryNeeds();
    res.json({ success: true, data: inventoryForecast });
  } catch (error) {
    next(error);
  }
});

// Reorder recommendations
// @route   GET /api/analytics/recommendations/reorder
// @desc    Get reorder recommendations
// @access  Private
router.get('/recommendations/reorder', /* protect, */ async (req, res, next) => {
  try {
    const recommendations = await analyticsController.getReorderRecommendations();
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
});

// Customer segmentation
// @route   GET /api/analytics/customers/segments
// @desc    Get customer segments
// @access  Private
router.get('/customers/segments', /* protect, */ async (req, res, next) => {
  try {
    const segments = await analyticsController.segmentCustomers();
    res.json({ success: true, data: segments });
  } catch (error) {
    next(error);
  }
});

// Customer lifetime value
// @route   GET /api/analytics/customers/ltv
// @desc    Get customer lifetime value
// @access  Private
router.get('/customers/ltv', /* protect, */ async (req, res, next) => {
  try {
    const ltv = await analyticsController.calculateCustomerLTV();
    res.json({ success: true, data: ltv });
  } catch (error) {
    next(error);
  }
});

// Stock turnover analysis
// @route   GET /api/analytics/inventory/turnover
// @desc    Get stock turnover analysis
// @access  Private
router.get('/inventory/turnover', /* protect, */ async (req, res, next) => {
  try {
    const turnover = await analyticsController.calculateStockTurnover();
    res.json({ success: true, data: turnover });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 