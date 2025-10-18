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

/**
 * Create a PayMongo payment intent for an invoice
 * @param {number} invoiceId - Invoice ID to pay
 * @param {number} amount - Amount to pay
 * @returns {Promise<Object>} Payment intent data with client key
 */
export const createPaymentIntent = async (invoiceId, amount) => {
  return apiRequest('/payments/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, amount }),
  });
};

/**
 * Get failed payments (Admin only)
 * @returns {Promise<Object>} Failed payments list
 */
export const getFailedPayments = async () => {
  return apiRequest('/payments/failed');
};

/**
 * Initialize PayMongo.js SDK
 * @returns {Object} PayMongo instance
 */
export const initializePayMongo = () => {
  const publicKey = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
  
  if (!publicKey || publicKey === 'pk_test_your_public_key_here') {
    console.warn('PayMongo public key not configured. Please set VITE_PAYMONGO_PUBLIC_KEY in .env');
  }

  // Return PayMongo SDK instance (loaded from CDN or npm)
  // For now, we'll handle this differently since PayMongo doesn't have a direct React SDK
  // We'll use their REST API via the backend
  return {
    publicKey,
    isConfigured: publicKey && publicKey !== 'pk_test_your_public_key_here'
  };
};

/**
 * Get supported payment method icons
 * @param {string} method - Payment method key
 * @returns {string} Icon name for lucide-react
 */
export const getPaymentMethodIcon = (method) => {
  const icons = {
    'card': 'CreditCard',
    'gcash': 'Wallet',
    'grab_pay': 'Wallet',
    'paymaya': 'Wallet',
    'maya': 'Wallet'
  };
  return icons[method] || 'DollarSign';
};

/**
 * Format payment method display name
 * @param {string} method - Payment method key
 * @returns {string} Formatted display name
 */
export const formatPaymentMethod = (method) => {
  const names = {
    'card': 'Credit/Debit Card',
    'gcash': 'GCash',
    'grab_pay': 'GrabPay',
    'paymaya': 'Maya (PayMaya)',
    'maya': 'Maya',
    'paymongo': 'PayMongo Gateway'
  };
  return names[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

