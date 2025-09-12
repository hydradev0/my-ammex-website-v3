const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export const updateOrderStatus = async (orderId, { status, rejectionReason } = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status, ...(rejectionReason ? { rejectionReason } : {}) })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update order status');
  return data; // { success, data: order }
};


