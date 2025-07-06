const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics');
const auth = require('../middleware/auth');

// Get comprehensive analytics dashboard
router.get('/dashboard', auth, analyticsController.getDashboardAnalytics);

// Get specific analytics data
router.get('/sales', auth, async (req, res) => {
  try {
    const salesMetrics = await analyticsController.getSalesMetrics();
    res.json({ success: true, data: salesMetrics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales analytics' });
  }
});

router.get('/inventory', auth, async (req, res) => {
  try {
    const inventoryMetrics = await analyticsController.getInventoryMetrics();
    res.json({ success: true, data: inventoryMetrics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory analytics' });
  }
});

router.get('/customers', auth, async (req, res) => {
  try {
    const customerMetrics = await analyticsController.getCustomerMetrics();
    res.json({ success: true, data: customerMetrics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch customer analytics' });
  }
});

// AI Predictions
router.get('/predictions/sales', auth, async (req, res) => {
  try {
    const salesForecast = await analyticsController.predictSales();
    res.json({ success: true, data: salesForecast });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate sales forecast' });
  }
});

router.get('/predictions/demand', auth, async (req, res) => {
  try {
    const demandForecast = await analyticsController.predictDemand();
    res.json({ success: true, data: demandForecast });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate demand forecast' });
  }
});

router.get('/predictions/inventory', auth, async (req, res) => {
  try {
    const inventoryForecast = await analyticsController.predictInventoryNeeds();
    res.json({ success: true, data: inventoryForecast });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate inventory forecast' });
  }
});

// Reorder recommendations
router.get('/recommendations/reorder', auth, async (req, res) => {
  try {
    const recommendations = await analyticsController.getReorderRecommendations();
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate reorder recommendations' });
  }
});

// Anomaly detection
router.get('/anomalies', auth, async (req, res) => {
  try {
    const anomalies = await analyticsController.detectAnomalies();
    res.json({ success: true, data: anomalies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to detect anomalies' });
  }
});

// Customer segmentation
router.get('/customers/segments', auth, async (req, res) => {
  try {
    const segments = await analyticsController.segmentCustomers();
    res.json({ success: true, data: segments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to segment customers' });
  }
});

// Customer lifetime value
router.get('/customers/ltv', auth, async (req, res) => {
  try {
    const ltv = await analyticsController.calculateCustomerLTV();
    res.json({ success: true, data: ltv });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to calculate customer LTV' });
  }
});

// Stock turnover analysis
router.get('/inventory/turnover', auth, async (req, res) => {
  try {
    const turnover = await analyticsController.calculateStockTurnover();
    res.json({ success: true, data: turnover });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to calculate stock turnover' });
  }
});

module.exports = router; 