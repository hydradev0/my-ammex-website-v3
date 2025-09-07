const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { getModels } = require('../config/db');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '30d'
  });
};

// Register new user (admin only)
const registerUser = async (req, res, next) => {
  try {
    const { User, Customer } = getModels();
    const { name, email, password, role, department } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      department
    });

    // If role is Client, auto-create linked Customer stub
    let customer = null;
    if (user.role === 'Client') {
      customer = await Customer.create({
        userId: user.id,
        customerName: name, // Map the name field to customerName
        // allow stub with mostly nulls; customerId will be set by hook
        isActive: true
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        customerPk: customer ? customer.id : null,
        customerId: customer ? customer.customerId : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const loginUser = async (req, res, next) => {
  try {
    const { User, Customer } = getModels();
    const { email, password } = req.body;
    const emailTrimmed = (email || '').trim();

    // Check if user exists
    const user = await User.findOne({ where: { email: { [Op.iLike]: emailTrimmed } } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Create token
    const token = generateToken(user.id);

    // Load linked customer
    const customer = await Customer.findOne({ where: { userId: user.id } });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        customerPk: customer ? customer.id : null,
        customerId: customer ? customer.customerId : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    const { User, Customer } = getModels();
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const customer = await Customer.findOne({ where: { userId: user.id } });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        customerPk: customer ? customer.id : null,
        customerId: customer ? customer.customerId : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { User } = getModels();
    const { includeInactive, page = 1, limit = 50 } = req.query;
    
    // Build where clause based on includeInactive parameter
    const whereClause = includeInactive === 'true' ? {} : { isActive: true };
    
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalItems: count,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user (admin only or self-update)
const updateUser = async (req, res, next) => {
  try {
    const { User } = getModels();
    const { id } = req.params;
    const updateData = req.body;

    // Determine which user to update
    let targetUserId = id;
    
    // If no ID in params (self-update via /me route), use current user's ID
    if (!id || id === 'me') {
      targetUserId = req.user.id;
    }

    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For self-updates, only allow certain fields to be updated
    if (targetUserId === req.user.id) {
      const allowedFields = ['name', 'email']; // Only allow name and email for self-updates
      const filteredData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });
      
      // Check if email is being changed and if it already exists
      if (filteredData.email && filteredData.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: filteredData.email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }
      
      await user.update(filteredData);
    } else {
      // Admin update - allow all fields
      await user.update(updateData);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { User } = getModels();
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getAllUsers,
  updateUser,
  deleteUser
}; 