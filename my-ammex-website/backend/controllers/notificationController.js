const { getModels } = require('../config/db');
const NotificationService = require('../services/notificationService');

// Get all notifications for authenticated user
const getAllNotifications = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { role, customerId } = req.user;

    let notifications = [];
    let unreadCount = 0;

    if (role === 'Admin') {
      // Admin: show all notifications
      const adminNotifications = await Notification.findAll({
        where: { 
          type: { [require('sequelize').Op.in]: ['order_appeal', 'general', 'stock_low', 'stock_high', 'order_approved'] }
        },
        order: [['createdAt', 'DESC']]
      });
      notifications = adminNotifications;
      unreadCount = adminNotifications.filter(n => !n.adminIsRead).length;
    } else if (role === 'Sales Marketing') {
      // Sales Marketing: show only order/business-related notifications (NO stock alerts)
      const salesNotifications = await Notification.findAll({
        where: { 
          type: { [require('sequelize').Op.in]: ['order_appeal', 'general', 'order_approved'] }
        },
        order: [['createdAt', 'DESC']]
      });
      notifications = salesNotifications;
      unreadCount = salesNotifications.filter(n => !n.adminIsRead).length;
    } else if (role === 'Warehouse Supervisor') {
      // Warehouse Supervisor: show only stock notifications
      const stockNotifications = await Notification.findAll({
        where: { 
          type: { [require('sequelize').Op.in]: ['stock_low', 'stock_high'] }
        },
        order: [['createdAt', 'DESC']]
      });
      notifications = stockNotifications;
      unreadCount = stockNotifications.filter(n => !n.adminIsRead).length;
    } else if (role === 'Client') {
      // Client users: show their order notifications
      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: 'Customer authentication required'
        });
      }

      const clientNotifications = await Notification.findAll({
        where: { 
          customerId,
          type: { [require('sequelize').Op.in]: ['order_rejected', 'order_approved', 'order_appeal', 'general'] }
        },
        order: [['createdAt', 'DESC']]
      });
      
      notifications = clientNotifications;
      unreadCount = clientNotifications.filter(n => !n.isRead).length;
    }

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    next(error);
  }
};

// Get stock notifications (for warehouse/admin)
const getStockNotifications = async (req, res, next) => {
  try {
    const result = await NotificationService.getStockNotifications(req.user);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching stock notifications:', error);
    next(error);
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { id } = req.params;
    const { role, customerId } = req.user;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check ownership for clients
    if (role === 'Client' && notification.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update read status based on role
    if (role === 'Admin' || role === 'Sales Marketing' || role === 'Warehouse Supervisor') {
      await notification.update({
        adminIsRead: true,
        adminReadAt: new Date()
      });
    } else {
      await notification.update({
        isRead: true,
        readAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { role, customerId } = req.user;
    const { Op } = require('sequelize');

    if (role === 'Admin') {
      await Notification.update(
        {
          adminIsRead: true,
          adminReadAt: new Date()
        },
        {
          where: { 
            type: { [Op.in]: ['order_appeal', 'order_approved', 'general', 'stock_low', 'stock_high'] },
            adminIsRead: false
          }
        }
      );
    } else if (role === 'Sales Marketing') {
      await Notification.update(
        {
          adminIsRead: true,
          adminReadAt: new Date()
        },
        {
          where: { 
            type: { [Op.in]: ['order_appeal', 'order_approved', 'general'] },
            adminIsRead: false
          }
        }
      );
    } else if (role === 'Warehouse Supervisor') {
      await Notification.update(
        {
          adminIsRead: true,
          adminReadAt: new Date()
        },
        {
          where: { 
            type: { [Op.in]: ['stock_low', 'stock_high'] },
            adminIsRead: false
          }
        }
      );
    } else {
      await Notification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: { 
            customerId,
            type: { [Op.in]: ['order_rejected', 'order_approved', 'order_appeal', 'general'] },
            isRead: false
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    next(error);
  }
};

// Get notification statistics
const getNotificationStats = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { role, customerId } = req.user;
    const { Op } = require('sequelize');

    let stats = {
      total: 0,
      unread: 0,
      byType: {}
    };

    if (role === 'Admin') {
      const notifications = await Notification.findAll({
        where: { 
          type: { [Op.in]: ['order_appeal', 'order_approved', 'general', 'stock_low', 'stock_high'] }
        }
      });
      
      stats.total = notifications.length;
      stats.unread = notifications.filter(n => !n.adminIsRead).length;
      
      // Group by type
      notifications.forEach(notification => {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = { total: 0, unread: 0 };
        }
        stats.byType[notification.type].total++;
        if (!notification.adminIsRead) {
          stats.byType[notification.type].unread++;
        }
      });
    } else if (role === 'Sales Marketing') {
      const notifications = await Notification.findAll({
        where: { 
          type: { [Op.in]: ['order_appeal', 'order_approved', 'general'] }
        }
      });
      
      stats.total = notifications.length;
      stats.unread = notifications.filter(n => !n.adminIsRead).length;
      
      // Group by type
      notifications.forEach(notification => {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = { total: 0, unread: 0 };
        }
        stats.byType[notification.type].total++;
        if (!notification.adminIsRead) {
          stats.byType[notification.type].unread++;
        }
      });
    } else if (role === 'Warehouse Supervisor') {
      const notifications = await Notification.findAll({
        where: { 
          type: { [Op.in]: ['stock_low', 'stock_high'] }
        }
      });
      
      stats.total = notifications.length;
      stats.unread = notifications.filter(n => !n.adminIsRead).length;
      
      // Group by type
      notifications.forEach(notification => {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = { total: 0, unread: 0 };
        }
        stats.byType[notification.type].total++;
        if (!notification.adminIsRead) {
          stats.byType[notification.type].unread++;
        }
      });
    } else if (role === 'Client') {
      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: 'Customer authentication required'
        });
      }

      const notifications = await Notification.findAll({
        where: { 
          customerId,
          type: { [Op.in]: ['order_rejected', 'order_approved', 'order_appeal', 'general'] }
        }
      });
      
      stats.total = notifications.length;
      stats.unread = notifications.filter(n => !n.isRead).length;
      
      // Group by type
      notifications.forEach(notification => {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = { total: 0, unread: 0 };
        }
        stats.byType[notification.type].total++;
        if (!notification.isRead) {
          stats.byType[notification.type].unread++;
        }
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    next(error);
  }
};

// Reply to order appeal
const replyToAppeal = async (req, res, next) => {
  try {
    const { Notification, Customer, Order } = getModels();
    const { id } = req.params; // notification ID
    const { replyMessage } = req.body || {};

    if (!replyMessage || String(replyMessage).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    // Only Admin and Sales Marketing can reply
    if (req.user.role !== 'Admin' && req.user.role !== 'Sales Marketing') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Admin and Sales Marketing can reply to appeals.'
      });
    }

    // Find the appeal notification
    const appealNotification = await Notification.findByPk(id);
    if (!appealNotification) {
      return res.status(404).json({
        success: false,
        message: 'Appeal notification not found'
      });
    }

    // Verify it's an order appeal
    if (appealNotification.type !== 'order_appeal') {
      return res.status(400).json({
        success: false,
        message: 'This notification is not an order appeal'
      });
    }

    // Get customer and order details
    const customer = await Customer.findByPk(appealNotification.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const orderData = appealNotification.data || {};
    const orderNumber = orderData.orderNumber || 'Unknown';

    // Create reply notification for the customer
    await Notification.create({
      customerId: appealNotification.customerId,
      type: 'general',
      title: 'Appeal Response',
      message: `Response to your appeal for order <span class="font-bold">${orderNumber}</span>: <span class="font-medium text-blue-600">${replyMessage}</span>`,
      data: {
        orderId: orderData.orderId,
        orderNumber: orderNumber,
        appealNotificationId: id,
        replyFrom: req.user.name || req.user.role,
        replyMessage: replyMessage
      }
    });

    // Mark the original appeal notification as read (admin has responded)
    await appealNotification.update({
      adminIsRead: true,
      adminReadAt: new Date()
    });

    res.json({
      success: true,
      message: 'Reply sent successfully to customer'
    });

  } catch (error) {
    console.error('Error replying to appeal:', error);
    next(error);
  }
};

module.exports = {
  getAllNotifications,
  getStockNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationStats,
  replyToAppeal
};
