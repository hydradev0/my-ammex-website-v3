import { API_BASE_URL } from '../utils/apiConfig';

export const getPendingOrdersForSales = async (page = 1, limit = 10) => {
  const token = localStorage.getItem('token');
  const url = new URL(`${API_BASE_URL}/orders/status/pending`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch pending orders');
  return data; // { success, data: Order[], pagination }
};

export const getRejectedOrdersForSales = async (page = 1, limit = 10) => {
  const token = localStorage.getItem('token');
  const url = new URL(`${API_BASE_URL}/orders/status/rejected`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch rejected orders');
  return data; // { success, data: Order[], pagination }
};

export const updateOrderStatus = async (orderId, { status, rejectionReason, discountPercent, discountAmount } = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ 
      status, 
      ...(rejectionReason ? { rejectionReason } : {}),
      ...(discountPercent !== undefined ? { discountPercent } : {}),
      ...(discountAmount !== undefined ? { discountAmount } : {})
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update order status');
  return data; // { success, data: order }
};

// Client: fetch own orders (optionally filter by status)
export const getMyOrders = async (status = undefined) => {
  const token = localStorage.getItem('token');
  const url = new URL(`${API_BASE_URL}/orders/my`);
  if (status) url.searchParams.set('status', status);
  const res = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
  return data;
};

// Client: cancel own order (by numeric id or orderNumber)
export const cancelMyOrder = async (orderIdOrNumber) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/${orderIdOrNumber}/cancel`, {
    method: 'PATCH',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to cancel order');
  return data;
};

// Client: appeal a rejected order (by numeric id or orderNumber)
export const appealRejectedOrder = async (orderIdOrNumber, appealReason) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/${orderIdOrNumber}/appeal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ appealReason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit appeal');
  return data;
};

// Get order notifications
export const getOrderNotifications = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/notifications/my`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch order notifications');
  return data;
};

// Mark order notification as read
export const markOrderNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark notification as read');
  return data;
};

// Mark all order notifications as read
export const markAllOrderNotificationsAsRead = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark all notifications as read');
  return data;
};


