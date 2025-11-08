import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getPaymentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/paymentService';
import { getOrderNotifications, markOrderNotificationAsRead, markAllOrderNotificationsAsRead } from '../services/orderService';
import { getAllNotifications, markNotificationAsRead as markUnifiedNotificationAsRead, markAllNotificationsAsRead as markAllUnifiedNotificationsAsRead } from '../services/notificationService';

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

  // Fetch notifications from unified API
  const fetchNotifications = async () => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    try {
      // Use the new unified notification API
      const response = await getAllNotifications();
      
      // Backend responds with { success, data: { notifications, unreadCount } }
      const payload = response?.data ?? response;
      const allNotifications = Array.isArray(payload?.notifications) ? payload.notifications : [];
      const unreadCount = typeof payload?.unreadCount === 'number' ? payload.unreadCount : 0;
      
      setNotifications(allNotifications);
      setUnreadCount(unreadCount);
      
      return allNotifications;
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
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

  // Mark notification as read using unified API
  const markAsRead = async (notificationId) => {
    // Optimistically update the UI first for instant feedback
    // Update both isRead and adminIsRead to handle both client and admin notifications
    setNotifications(prev => {
      const updated = prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, adminIsRead: true, isRead: true };
        }
        return n;
      });
      setUnreadCount(computeUnreadCount(updated));
      return updated;
    });
    
    try {
      // Make API call in the background
      await markUnifiedNotificationAsRead(notificationId);
      
      // Re-fetch from server to ensure consistency (but UI already updated)
      // This can happen in the background without blocking
      fetchNotifications().then(fetchedNotifications => {
        setNotifications(fetchedNotifications);
        setUnreadCount(computeUnreadCount(fetchedNotifications));
      }).catch(error => {
        console.error('Failed to refresh notifications:', error);
        // If refresh fails, we already optimistically updated, so UI is fine
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // On error, re-fetch to get correct state from server
      fetchNotifications().then(fetchedNotifications => {
        setNotifications(fetchedNotifications);
        setUnreadCount(computeUnreadCount(fetchedNotifications));
      }).catch(refreshError => {
        console.error('Failed to refresh notifications after error:', refreshError);
      });
    }
  };

  // Mark all notifications as read using unified API
  const markAllAsRead = async () => {
    // Optimistically update the UI first for instant feedback
    setNotifications(prev => {
      const updated = prev.map(n => ({
        ...n,
        adminIsRead: true,
        isRead: true
      }));
      setUnreadCount(0);
      return updated;
    });
    
    try {
      // Make API call in the background
      await markAllUnifiedNotificationsAsRead();
      
      // Re-fetch from server to ensure consistency (but UI already updated)
      // This can happen in the background without blocking
      fetchNotifications().then(fetchedNotifications => {
        setNotifications(fetchedNotifications);
        setUnreadCount(computeUnreadCount(fetchedNotifications));
      }).catch(error => {
        console.error('Failed to refresh notifications:', error);
        // If refresh fails, we already optimistically updated, so UI is fine
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Revert optimistic update on error by re-fetching
      fetchNotifications().then(fetchedNotifications => {
        setNotifications(fetchedNotifications);
        setUnreadCount(computeUnreadCount(fetchedNotifications));
      }).catch(refreshError => {
        console.error('Failed to revert notifications:', refreshError);
      });
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
