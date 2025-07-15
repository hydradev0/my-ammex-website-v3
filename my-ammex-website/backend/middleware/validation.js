const { validationResult } = require('express-validator');

/**
 * Generic validation error handler middleware
 * 
 * This middleware can be used with ANY route that uses express-validator.
 * It automatically catches validation errors and returns a consistent error response.
 * 
 * Usage:
 * router.post('/example', validateData, handleValidationErrors, controller);
 * 
 * The middleware will:
 * 1. Check for validation errors from express-validator
 * 2. If errors exist, return a 400 response with detailed error info
 * 3. If no errors, continue to the next middleware/controller
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

module.exports = { handleValidationErrors }; 