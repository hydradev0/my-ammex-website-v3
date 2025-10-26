const express = require('express');
const router = express.Router();
const monthlyReportController = require('../controllers/monthlyReportController');
const { protect } = require('../middleware/auth');

// NOTE: Order matters! Specific routes must come before dynamic routes

// @route   GET /api/monthly-reports/years/:year/months
// @desc    Get available months for a specific year
// @access  Private
router.get('/years/:year/months', /* protect, */ monthlyReportController.getAvailableMonths);

// @route   GET /api/monthly-reports/years
// @desc    Get available years for dropdown
// @access  Private
router.get('/years', /* protect, */ monthlyReportController.getAvailableYears);

// @route   GET /api/monthly-reports/:year/:month
// @desc    Get monthly report data for a specific year and month
// @access  Private
router.get('/:year/:month', /* protect, */ monthlyReportController.getMonthlyReport);

module.exports = router;
