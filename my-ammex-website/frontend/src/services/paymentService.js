import { API_BASE_URL } from '../utils/apiConfig';

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
export const getPaymentNotifications = async () => {
  return apiRequest('/payments/notifications/my');
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  return apiRequest(`/payments/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  return apiRequest('/payments/notifications/read-all', {
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

// Client: Appeal a rejected payment
export const appealRejectedPayment = async (paymentId, appealReason) => {
  return apiRequest(`/payments/${paymentId}/appeal`, {
    method: 'POST',
    body: JSON.stringify({ appealReason }),
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

// PayMongo: Create payment intent
export const createPaymentIntent = async (invoiceId, amount) => {
  return apiRequest('/payments/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, amount })
  });
};

// PayMongo: Create payment method (card)
export const createPaymentMethod = async (cardDetails, billingDetails) => {
  return apiRequest('/payments/create-payment-method', {
    method: 'POST',
    body: JSON.stringify({ cardDetails, billingDetails })
  });
};

// PayMongo: Attach payment method to intent
export const attachPaymentToIntent = async (paymentIntentId, paymentMethodId, returnUrl, paymentId) => {
  return apiRequest('/payments/attach-payment-method', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId, paymentMethodId, returnUrl, paymentId })
  });
};

// PayMongo: Create payment source (e-wallets)
export const createPaymentSource = async (type, amount, invoiceId, paymentId) => {
  return apiRequest('/payments/create-payment-source', {
    method: 'POST',
    body: JSON.stringify({ type, amount, invoiceId, paymentId })
  });
};

// PayMongo: Get payment status
export const getPaymentStatus = async (paymentIntentId) => {
  return apiRequest(`/payments/status/${paymentIntentId}`);
};

// PayMongo: Get failed payments (Admin)
export const getFailedPayments = async () => {
  return apiRequest('/payments/failed');
};
