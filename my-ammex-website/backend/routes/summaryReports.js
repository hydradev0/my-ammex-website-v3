const express = require('express');
const router = express.Router();
const summaryReportController = require('../controllers/summaryReportController');
const { protect } = require('../middleware/auth');

// NOTE: Order matters! Specific routes must come before dynamic routes

// ==================== MONTHLY REPORTS ====================
// @route   GET /api/summary-reports/years/:year/months
// @desc    Get available months for a specific year
// @access  Private
router.get('/years/:year/months', /* protect, */ summaryReportController.getAvailableMonths);

// @route   GET /api/summary-reports/years
// @desc    Get available years for dropdown
// @access  Private
router.get('/years', /* protect, */ summaryReportController.getAvailableYears);

// @route   GET /api/summary-reports/monthly/:year/:month
// @desc    Get monthly report data for a specific year and month
// @access  Private
router.get('/monthly/:year/:month', /* protect, */ summaryReportController.getMonthlyReport);

// ==================== WEEKLY REPORTS ====================
// @route   GET /api/summary-reports/weekly/years/:year/months/:month/weeks
// @desc    Get available weeks for a specific year and month
// @access  Private
router.get('/weekly/years/:year/months/:month/weeks', /* protect, */ summaryReportController.getAvailableWeeks);

// @route   GET /api/summary-reports/weekly/:year/:month/:week
// @desc    Get weekly report data for a specific year, month, and week
// @access  Private
router.get('/weekly/:year/:month/:week', /* protect, */ summaryReportController.getWeeklyReport);

// ==================== ANNUAL REPORTS ====================
// @route   GET /api/summary-reports/annual/:year
// @desc    Get annual report data for a specific year
// @access  Private
router.get('/annual/:year', /* protect, */ summaryReportController.getAnnualReport);

module.exports = router;
