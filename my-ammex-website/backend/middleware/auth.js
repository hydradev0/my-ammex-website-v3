const jwt = require('jsonwebtoken');
const { getModels } = require('../config/db');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    // Get user from the token
    const { User } = getModels();
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles (case-insensitive with simple aliasing)
exports.authorize = (...roles) => {
  const normalizeRole = (role) => (role || '')
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    

  // Simple alias map to reduce common mismatches
  const toCanonical = (normalizedRole) => {
    switch (normalizedRole) {
      case 'sales':
      case 'sales marketing':
        return 'sales marketing';
      case 'warehouse':
      case 'warehouse supervisor':
        return 'warehouse supervisor';
      case 'admin':
        return 'admin';
      case 'client':
        return 'client';
      default:
        return normalizedRole;
    }
  };

  const allowedCanonical = roles.map((r) => toCanonical(normalizeRole(r)));

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userCanonical = toCanonical(normalizeRole(req.user.role));
    if (!allowedCanonical.includes(userCanonical)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check department access
exports.checkDepartment = (...departments) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!departments.includes(req.user.department)) {
      return res.status(403).json({
        success: false,
        message: `User department ${req.user.department} is not authorized to access this route`,
      });
    }
    next();
  };
}; 

