const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllNotifications,
  getStockNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationStats
} = require('../controllers/notificationController');

// @route   GET /api/notifications
// @desc    Get all notifications for authenticated user
// @access  Private (All roles)
router.get('/', protect, getAllNotifications);

// @route   GET /api/notifications/stock
// @desc    Get stock notifications for warehouse/admin
// @access  Private (Admin, Warehouse Admin)
router.get('/stock', protect, authorize('Admin', 'Warehouse Admin'), getStockNotifications);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private (All roles)
router.patch('/:id/read', protect, markNotificationAsRead);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read for current user
// @access  Private (All roles)
router.patch('/read-all', protect, markAllNotificationsAsRead);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private (All roles)
router.get('/stats', protect, getNotificationStats);

module.exports = router;
