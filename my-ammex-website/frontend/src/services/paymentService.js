const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Payment submission
export const submitPayment = async (paymentData) => {
  return apiRequest('/payments/submit', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
};

// Get customer's payment submissions
export const getMyPayments = async () => {
  return apiRequest('/payments/my');
};

// Get payment history for an invoice
export const getPaymentHistory = async (invoiceId) => {
  return apiRequest(`/payments/history/invoice/${invoiceId}`);
};

// Get customer notifications
export const getNotifications = async () => {
  return apiRequest('/payments/notifications/my');
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  return apiRequest(`/payments/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
};

// Admin: Get pending payments
export const getPendingPayments = async () => {
  return apiRequest('/payments/pending');
};

// Admin: Get rejected payments
export const getRejectedPayments = async () => {
  return apiRequest('/payments/rejected');
};

// Admin: Approve payment
export const approvePayment = async (paymentId, amount) => {
  const body = amount != null ? { amount } : undefined;
  return apiRequest(`/payments/${paymentId}/approve`, {
    method: 'PATCH',
    ...(body && { body: JSON.stringify(body) }),
  });
};

// Admin: Reject payment
export const rejectPayment = async (paymentId, rejectionReason) => {
  return apiRequest(`/payments/${paymentId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectionReason }),
  });
};

// Admin: Re-approve rejected payment (move back to pending)
export const reapprovePayment = async (paymentId) => {
  return apiRequest(`/payments/${paymentId}/reapprove`, {
    method: 'PATCH',
  });
};

// Admin: Delete rejected payment permanently
export const deleteRejectedPayment = async (paymentId) => {
  return apiRequest(`/payments/${paymentId}`, {
    method: 'DELETE',
  });
};

// Get invoice payment history
export const getInvoicePaymentHistory = async (invoiceId) => {
  return apiRequest(`/invoices/${invoiceId}/payment-history`);
};

// Admin: Get all invoices with payment details
export const getAllInvoicesWithPayments = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return apiRequest(`/invoices/with-payments?${queryParams}`);
};

// Get payment methods
export const getPaymentMethods = async () => {
  return apiRequest('/payment-methods');
};

// Get balance history (for admin)
export const getBalanceHistory = async () => {
  return apiRequest('/payments/balance-history');
};

// Get all payment history (for admin)
export const getAllPaymentHistory = async () => {
  return apiRequest('/payments/history');
};
