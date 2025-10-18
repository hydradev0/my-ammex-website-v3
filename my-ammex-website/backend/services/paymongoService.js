const fetch = require('node-fetch');

// PayMongo API Configuration
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';

// Encode secret key for Basic Auth (PayMongo expects key followed by colon)
const getAuthHeader = () => {
  const encodedKey = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
  return `Basic ${encodedKey}`;
};

async function httpJson(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }

  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail || json?.message || `HTTP ${res.status}`;
    const err = new Error(detail);
    err.responseJson = json;
    err.status = res.status;
    throw err;
  }
  return json;
}

/**
 * Create a PayMongo Payment Intent
 * @param {number} amount - Amount in cents (e.g., 10000 = PHP 100.00)
 * @param {number} invoiceId - Invoice ID for reference
 * @param {number} customerId - Customer ID for reference
 * @param {string} description - Payment description
 * @returns {Promise<Object>} Payment Intent object
 */
const createPaymentIntent = async (amount, invoiceId, customerId, description) => {
  try {
    // Convert to cents (PayMongo requires amount in cents)
    const amountInCents = Math.round(amount * 100);

    const response = await httpJson('POST', `${PAYMONGO_API_BASE}/payment_intents`, {
      data: {
        attributes: {
          amount: amountInCents,
          payment_method_allowed: [
            'card',
            'gcash',
            'grab_pay',
            'paymaya'
          ],
          payment_method_options: {
            card: { request_three_d_secure: 'any' }
          },
          currency: 'PHP',
          description: description,
          statement_descriptor: 'Ammex Trading',
          metadata: {
            invoice_id: String(invoiceId),
            customer_id: String(customerId)
          }
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('PayMongo createPaymentIntent error:', error.responseJson || error.message);
    throw new Error(error.responseJson?.errors?.[0]?.detail || error.message || 'Failed to create payment intent');
  }
};

/**
 * Retrieve a Payment Intent by ID
 * @param {string} paymentIntentId - PayMongo Payment Intent ID
 * @returns {Promise<Object>} Payment Intent object
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const response = await httpJson('GET', `${PAYMONGO_API_BASE}/payment_intents/${paymentIntentId}`);
    return response.data;
  } catch (error) {
    console.error('PayMongo retrievePaymentIntent error:', error.responseJson || error.message);
    throw new Error(error.responseJson?.errors?.[0]?.detail || error.message || 'Failed to retrieve payment intent');
  }
};

/**
 * Attach a Payment Method to a Payment Intent
 * @param {string} paymentIntentId - PayMongo Payment Intent ID
 * @param {string} paymentMethodId - PayMongo Payment Method ID
 * @param {string} returnUrl - URL to redirect after payment
 * @returns {Promise<Object>} Attached Payment Intent object
 */
const attachPaymentMethod = async (paymentIntentId, paymentMethodId, returnUrl) => {
  try {
    const response = await httpJson('POST', `${PAYMONGO_API_BASE}/payment_intents/${paymentIntentId}/attach`, {
      data: {
        attributes: {
          payment_method: paymentMethodId,
          return_url: returnUrl
        }
      }
    });
    return response.data;
  } catch (error) {
    console.error('PayMongo attachPaymentMethod error:', error.responseJson || error.message);
    throw new Error(error.responseJson?.errors?.[0]?.detail || error.message || 'Failed to attach payment method');
  }
};

/**
 * Create a Payment Method (for cards)
 * @param {Object} cardDetails - Card details { card_number, exp_month, exp_year, cvc }
 * @param {Object} billingDetails - Billing details { name, email, phone }
 * @returns {Promise<Object>} Payment Method object
 */
const createPaymentMethod = async (cardDetails, billingDetails) => {
  try {
    const response = await httpJson('POST', `${PAYMONGO_API_BASE}/payment_methods`, {
      data: {
        attributes: {
          type: 'card',
          details: cardDetails,
          billing: billingDetails
        }
      }
    });
    return response.data;
  } catch (error) {
    console.error('PayMongo createPaymentMethod error:', error.responseJson || error.message);
    throw new Error(error.responseJson?.errors?.[0]?.detail || error.message || 'Failed to create payment method');
  }
};

/**
 * Create a Source (for e-wallets like GCash, GrabPay)
 * @param {string} type - Source type (gcash, grab_pay)
 * @param {number} amount - Amount in cents
 * @param {string} redirectUrl - Success/Failed redirect URLs
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Source object
 */
const createSource = async (type, amount, redirectUrl, metadata = {}) => {
  try {
    const amountInCents = Math.round(amount * 100);

    const response = await httpJson('POST', `${PAYMONGO_API_BASE}/sources`, {
      data: {
        attributes: {
          type: type,
          amount: amountInCents,
          currency: 'PHP',
          redirect: {
            success: redirectUrl.success,
            failed: redirectUrl.failed
          },
          metadata: metadata
        }
      }
    });
    return response.data;
  } catch (error) {
    console.error('PayMongo createSource error:', error.responseJson || error.message);
    throw new Error(error.responseJson?.errors?.[0]?.detail || error.message || 'Failed to create source');
  }
};

/**
 * Get supported payment methods
 * @returns {Array<string>} List of supported payment methods
 */
const getSupportedPaymentMethods = () => {
  return [
    { key: 'card', label: 'Credit/Debit Card', icon: 'credit-card' },
    { key: 'gcash', label: 'GCash', icon: 'wallet' },
    { key: 'grab_pay', label: 'GrabPay', icon: 'wallet' },
    { key: 'paymaya', label: 'Maya (PayMaya)', icon: 'wallet' }
  ];
};

/**
 * Verify PayMongo webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature from PayMongo header
 * @returns {boolean} True if signature is valid
 */
const verifyWebhookSignature = (payload, signature) => {
  const crypto = require('crypto');
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('PAYMONGO_WEBHOOK_SECRET not configured');
    return true; // In development, allow webhooks through
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

/**
 * Parse webhook event
 * @param {Object} body - Webhook request body
 * @returns {Object} Parsed event data
 */
const parseWebhookEvent = (body) => {
  try {
    const event = body.data;
    
    return {
      id: event.id,
      type: event.attributes.type,
      data: event.attributes.data || event.attributes, // Use attributes directly if data is not available
      createdAt: event.attributes.created_at,
      updatedAt: event.attributes.updated_at
    };
  } catch (error) {
    console.error('Failed to parse webhook event:', error);
    throw new Error('Invalid webhook payload');
  }
};

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  attachPaymentMethod,
  createPaymentMethod,
  createSource,
  getSupportedPaymentMethods,
  verifyWebhookSignature,
  parseWebhookEvent
};

