const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { getModels } = require('../config/db');

// Generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
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
    const { User, Customer } = getModels();
    const { id } = req.params;
    const updateData = req.body;

    // Determine which user to update
    let targetUserId = id;
    
    // If no ID in params (self-update via /me route), use current user's ID
    if (!id || id === 'me') {
      targetUserId = req.user.id;
    }

    const user = await User.findByPk(targetUserId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false // Don't require customer (some users might not have one)
        }
      ]
    });
    
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
        const existingUser = await User.findOne({ 
          where: { 
            email: filteredData.email,
            id: { [Op.ne]: targetUserId }
          } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }
      
      // Update user record
      await user.update(filteredData);
      
      // If user has a linked customer and we're updating name/email, sync to customer
      if (user.customer && (filteredData.name || filteredData.email)) {
        const customerUpdateData = {};
        
        // Sync customerName if name changed
        if (filteredData.name && filteredData.name !== user.customer.customerName) {
          customerUpdateData.customerName = filteredData.name;
        }
        
        // Sync email1 if email changed
        if (filteredData.email && filteredData.email !== user.customer.email1) {
          customerUpdateData.email1 = filteredData.email;
        }
        
        // Update customer if there are changes
        if (Object.keys(customerUpdateData).length > 0) {
          await Customer.update(customerUpdateData, {
            where: { userId: targetUserId }
          });
        }
      }
    } else {
      // Admin update - allow all fields
      
      // Check if email is being changed and if it already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ 
          where: { 
            email: updateData.email,
            id: { [Op.ne]: targetUserId }
          } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }
      
      // Update user record
      await user.update(updateData);
      
      // If user has a linked customer and we're updating name/email, sync to customer
      if (user.customer && (updateData.name || updateData.email)) {
        const customerUpdateData = {};
        
        // Sync customerName if name changed
        if (updateData.name && updateData.name !== user.customer.customerName) {
          customerUpdateData.customerName = updateData.name;
        }
        
        // Sync email1 if email changed
        if (updateData.email && updateData.email !== user.customer.email1) {
          customerUpdateData.email1 = updateData.email;
        }
        
        // Update customer if there are changes
        if (Object.keys(customerUpdateData).length > 0) {
          await Customer.update(customerUpdateData, {
            where: { userId: targetUserId }
          });
        }
      }
    }

    // Fetch updated user data
    const updatedUser = await User.findByPk(targetUserId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        isActive: updatedUser.isActive,
        customerPk: updatedUser.customer ? updatedUser.customer.id : null,
        customerId: updatedUser.customer ? updatedUser.customer.customerId : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Updated deleteUser function in auth controller
const deleteUser = async (req, res, next) => {
  try {
    const { User, Customer } = getModels();
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete user
    await user.update({ isActive: false });

    // Also soft delete linked customer if exists
    await Customer.update(
      { isActive: false }, 
      { where: { userId: id } }
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Updated deleteCustomer function in customer controller
const deleteCustomer = async (req, res, next) => {
  try {
    const { Customer, User } = getModels();
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Soft delete customer
    await customer.update({ isActive: false });

    // Also soft delete linked user if exists
    if (customer.userId) {
      await User.update(
        { isActive: false }, 
        { where: { id: customer.userId } }
      );
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
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
  deleteUser,
  deleteCustomer
}; 