import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getPaymentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/paymentService';
import { getOrderNotifications, markOrderNotificationAsRead, markAllOrderNotificationsAsRead } from '../services/orderService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications from API (both payment and order notifications)
  const fetchNotifications = async () => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    try {
      const [paymentResponse, orderResponse] = await Promise.all([
        getPaymentNotifications().catch(e => {
          console.error('❌ Payment notifications error:', e);
          return { data: { notifications: [] } };
        }),
        getOrderNotifications().catch(e => {
          console.error('❌ Order notifications error:', e);
          return { data: { notifications: [] } };
        })
      ]);
      
      const paymentNotifications = paymentResponse.data?.notifications || [];
      const orderNotifications = orderResponse.data?.notifications || [];
      
      // Combine and deduplicate by ID, then sort by creation date
      const allNotificationsMap = new Map();
      
      // Add payment notifications
      paymentNotifications.forEach(notif => {
        allNotificationsMap.set(notif.id, notif);
      });
      
      // Add order notifications (will overwrite if same ID exists)
      orderNotifications.forEach(notif => {
        allNotificationsMap.set(notif.id, notif);
      });
      
      // Convert back to array and sort by creation date
      const allNotifications = Array.from(allNotificationsMap.values()).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      return allNotifications;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: compute unread count according to role
  const computeUnreadCount = (list) => {
    if (!Array.isArray(list)) return 0;
    const role = user?.role;
    if (role === 'Admin' || role === 'Sales Marketing') {
      return list.filter(n => !n.adminIsRead).length;
    }
    return list.filter(n => !n.isRead).length;
  };

  // Load notifications on user change
  useEffect(() => {
    const loadNotifications = async () => {
      if (user?.id) {
        const fetchedNotifications = await fetchNotifications();
        setNotifications(fetchedNotifications);
        setUnreadCount(computeUnreadCount(fetchedNotifications));
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();
  }, [user?.id]);

  // Lightweight polling to simulate real-time updates
  useEffect(() => {
    if (!user?.id) return;
    const intervalId = setInterval(async () => {
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications);
      setUnreadCount(computeUnreadCount(fetchedNotifications));
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [user?.id]);

  // Mark notification as read (dynamic based on notification type)
  const markAsRead = async (notificationId) => {
    try {
      // Determine if it's an order notification based on type
      const notification = notifications.find(n => n.id === notificationId);
      const isOrderNotification = notification && ['order_rejected', 'order_appeal'].includes(notification.type);
      
      if (isOrderNotification) {
        await markOrderNotificationAsRead(notificationId);
      } else {
        await markNotificationAsRead(notificationId);
      }
      
      // Re-fetch from server to persist across reloads
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications);
      setUnreadCount(computeUnreadCount(fetchedNotifications));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read (both payment and order notifications)
  const markAllAsRead = async () => {
    try {
      await Promise.all([
        markAllNotificationsAsRead(),
        markAllOrderNotificationsAsRead()
      ]);
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications);
      setUnreadCount(computeUnreadCount(fetchedNotifications));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Remove notification
  const removeNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Add new notification (for real-time updates)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Refresh notifications (for manual refresh)
  const refreshNotifications = async () => {
    if (user?.id) {
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications);
      setUnreadCount(computeUnreadCount(fetchedNotifications));
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
