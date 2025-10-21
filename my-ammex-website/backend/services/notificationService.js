const { getModels } = require('../config/db');

class NotificationService {
  /**
   * Check stock levels and create notifications for warehouse/admin
   * @param {Object} item - The item to check
   * @param {number} previousQuantity - Previous quantity before update
   */
  static async checkStockLevels(item, previousQuantity = null) {
    try {
      const { Notification } = getModels();
      
      // Get current quantity
      const currentQuantity = item.quantity;
      const minLevel = item.minLevel;
      const maxLevel = item.maxLevel;
      
      // Check if item reached minimum level
      if (currentQuantity <= minLevel && (previousQuantity === null || previousQuantity > minLevel)) {
        await this.createStockLowNotification(item);
      }
      
      // Check if item reached maximum level (if maxLevel is set)
      if (maxLevel && currentQuantity >= maxLevel && (previousQuantity === null || previousQuantity < maxLevel)) {
        await this.createStockHighNotification(item);
      }
      
    } catch (error) {
      console.error('Error checking stock levels:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Create low stock notification
   * @param {Object} item - The item with low stock
   */
  static async createStockLowNotification(item) {
    try {
      const { Notification } = getModels();
      
      const severity = item.quantity === 0 ? 'CRITICAL' : 
                      item.quantity <= (item.minLevel * 0.3) ? 'HIGH' : 'MEDIUM';
      
      const message = item.quantity === 0 
        ? `OUT OF STOCK: <span class="font-semibold">${item.itemName}</span> (${item.modelNo}) is completely out of stock. Immediate reordering required.`
        : `LOW STOCK ALERT: <span class="font-semibold">${item.itemName}</span> (${item.modelNo}) has only <span class="font-medium text-red-500">${item.quantity}</span> units remaining. Minimum level: ${item.minLevel}`;
      
      await Notification.create({
        customerId: 1, // Use a default customer ID for system notifications
        type: 'stock_low',
        title: `Stock Alert - ${severity}`,
        message: message,
        data: {
          itemId: item.id,
          itemName: item.itemName,
          modelNo: item.modelNo,
          currentStock: item.quantity,
          minLevel: item.minLevel,
          severity: severity.toLowerCase(),
          reorderAmount: Math.max(0, item.minLevel - item.quantity)
        }
      });
      
      console.log(`Low stock notification created for item: ${item.itemName}`);
    } catch (error) {
      console.error('Error creating low stock notification:', error);
    }
  }

  /**
   * Create high stock notification
   * @param {Object} item - The item with high stock
   */
  static async createStockHighNotification(item) {
    try {
      const { Notification } = getModels();
      
      await Notification.create({
        customerId: 1, // Use a default customer ID for system notifications
        type: 'stock_high',
        title: 'Overstock Alert',
        message: `OVERSTOCK ALERT: <span class="font-semibold">${item.itemName}</span> (${item.modelNo}) has reached maximum level of <span class="font-medium text-orange-500">${item.quantity}</span> units. Consider reducing stock or adjusting maximum level.`,
        data: {
          itemId: item.id,
          itemName: item.itemName,
          modelNo: item.modelNo,
          currentStock: item.quantity,
          maxLevel: item.maxLevel,
          excessAmount: item.quantity - item.maxLevel
        }
      });
      
      console.log(`High stock notification created for item: ${item.itemName}`);
    } catch (error) {
      console.error('Error creating high stock notification:', error);
    }
  }

  /**
   * Get stock notifications for warehouse/admin
   * @param {Object} user - The authenticated user
   */
  static async getStockNotifications(user) {
    try {
      const { Notification } = getModels();
      
      // Only warehouse/admin and admin can see stock notifications
      if (user.role !== 'Admin' && user.role !== 'Warehouse Admin') {
        return { notifications: [], unreadCount: 0 };
      }
      
      const notifications = await Notification.findAll({
        where: { 
          type: { [require('sequelize').Op.in]: ['stock_low', 'stock_high'] }
        },
        order: [['createdAt', 'DESC']]
      });
      
      const unreadCount = notifications.filter(n => !n.adminIsRead).length;
      
      return { notifications, unreadCount };
    } catch (error) {
      console.error('Error fetching stock notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Mark stock notification as read
   * @param {number} notificationId - The notification ID
   * @param {Object} user - The authenticated user
   */
  static async markStockNotificationAsRead(notificationId, user) {
    try {
      const { Notification } = getModels();
      
      const notification = await Notification.findByPk(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Check if user has permission to read this notification
      if (user.role !== 'Admin' && user.role !== 'Warehouse Admin') {
        throw new Error('Access denied');
      }
      
      await notification.update({
        adminIsRead: true,
        adminReadAt: new Date()
      });
      
      return { success: true, message: 'Notification marked as read' };
    } catch (error) {
      console.error('Error marking stock notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all stock notifications as read
   * @param {Object} user - The authenticated user
   */
  static async markAllStockNotificationsAsRead(user) {
    try {
      const { Notification } = getModels();
      const { Op } = require('sequelize');
      
      // Check if user has permission
      if (user.role !== 'Admin' && user.role !== 'Warehouse Admin') {
        throw new Error('Access denied');
      }
      
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
      
      return { success: true, message: 'All stock notifications marked as read' };
    } catch (error) {
      console.error('Error marking all stock notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
