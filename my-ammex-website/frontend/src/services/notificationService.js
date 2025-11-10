import { API_BASE_URL } from '../utils/apiConfig';

// Get all notifications for authenticated user (role-based)
export const getAllNotifications = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/notifications`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch notifications');
  return data;
};

// Mark a specific notification as read
export const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark notification as read');
  return data;
};

// Mark all notifications as read for the current user/role
export const markAllNotificationsAsRead = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark all notifications as read');
  return data;
};

// Get notification statistics
export const getNotificationStats = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/notifications/stats`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch notification stats');
  return data;
};

// Reply to an order appeal notification
export const replyToAppeal = async (notificationId, replyMessage) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ replyMessage }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send reply');
  return data;
};