const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getModels } = require('../config/db');
const checkoutController = require('../controllers/checkoutController');

// Safe wrapper to avoid undefined handler at registration time
const useHandler = (name) => (req, res, next) => {
  try {
    const handler = checkoutController && checkoutController[name];
    if (typeof handler !== 'function') {
      const err = new Error(`Checkout controller handler not available: ${name}`);
      err.statusCode = 500;
      return next(err);
    }
    return handler(req, res, next);
  } catch (e) {
    return next(e);
  }
};

// Safe wrappers to avoid undefined middleware at registration time
const safeMiddleware = (name, fn) => (req, res, next) => {
  if (typeof fn === 'function') return fn(req, res, next);
  const err = new Error(`Middleware not available: ${name}`);
  err.statusCode = 500;
  return next(err);
};

const protectSafe = safeMiddleware('protect', protect);
let authorizeClientSafe;
try {
  const authFn = authorize && authorize('Client');
  authorizeClientSafe = typeof authFn === 'function' ? authFn : safeMiddleware('authorize(Client)', undefined);
} catch (e) {
  authorizeClientSafe = (req, res, next) => next(e);
}

// Middleware: ensure :customerId belongs to the authenticated user (Client)
const ensureOwnCustomer = async (req, res, next) => {
  try {
    const { Customer } = getModels();
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for user' });
    }
    req.params.customerId = String(customer.id);
    next();
  } catch (err) {
    next(err);
  }
};

// Preview totals for selected items
router.post('/:customerId/preview', protectSafe, authorizeClientSafe, ensureOwnCustomer, useHandler('previewCheckout'));

// Confirm checkout for selected items → creates Order, keeps remaining cart items
router.post('/:customerId/confirm', protectSafe, authorizeClientSafe, ensureOwnCustomer, useHandler('confirmCheckout'));

module.exports = router;

