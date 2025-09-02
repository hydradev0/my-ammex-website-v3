const { getModels } = require('../config/db');
const { Op } = require('sequelize');
// Get current user's customer
const getMyCustomer = async (req, res, next) => {
  try {
    const { Customer } = getModels();
    const customer = await Customer.findOne({ where: { userId: req.user.id } });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// Get all customers
const getAllCustomers = async (req, res, next) => {
  try {
    const { Customer } = getModels();
    const { page = 1, limit = 10, search, isActive } = req.query;
    
    // Build where clause - default to active records unless specified otherwise
    const whereClause = {};
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { customerName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { customerId: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email1: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    // Only filter by isActive if explicitly provided, otherwise default to active records
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    } else {
      whereClause.isActive = true; // Default to active records
    }

    const customers = await Customer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: customers.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(customers.count / limit),
        totalItems: customers.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single customer by ID
const getCustomerById = async (req, res, next) => {
  try {
    const { Customer, Order } = getModels();
    const { id } = req.params;
    const { include } = req.query;

    let includeOptions = [];
    if (include === 'orders') {
      includeOptions.push({
        model: Order,
        as: 'orders',
        where: { isActive: true }, // Filter for active orders
        order: [['orderDate', 'DESC']]
      });
    }

    const customer = await Customer.findByPk(id, {
      where: { isActive: true }, // Filter for active customer
      include: includeOptions
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// Create new customer
const createCustomer = async (req, res, next) => {
  try {
    const { Customer } = getModels();
    const customerData = req.body;

    const customer = await Customer.create(customerData);

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// Update customer
const updateCustomer = async (req, res, next) => {
  try {
    const { Customer } = getModels();
    const { id } = req.params;
    const updateData = req.body || {};

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }


    // Check for duplicate customerId (excluding current customer)
    if (updateData.customerId && updateData.customerId !== customer.customerId) {
      const existingId = await Customer.findOne({
        where: {
          customerId: updateData.customerId,
          id: { [Op.ne]: id }
        }
      });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID already exists'
        });
      }
    }

    // Sanitize: convert empty strings to null to satisfy allowNull validators
    const fields = [
      'customerName','street','city','postalCode','country','contactName',
      'telephone1','telephone2','email1','email2','notes'
    ];
    const sanitized = {};
    for (const key of fields) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        const value = updateData[key];
        sanitized[key] = (typeof value === 'string' && value.trim() === '') ? null : value;
      }
    }

    // Compute profileCompleted on server based on required fields
    const computedCompleted = !!(
      (sanitized.customerName ?? customer.customerName) &&
      (sanitized.telephone1 ?? customer.telephone1) &&
      (sanitized.email1 ?? customer.email1)
    );
    sanitized.profileCompleted = computedCompleted;

    await customer.update(sanitized);

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// Delete customer (soft delete)
const deleteCustomer = async (req, res, next) => {
  try {
    const { Customer } = getModels();
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.update({ isActive: false });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get customer statistics
const getCustomerStats = async (req, res, next) => {
  try {
    const { Customer, Order } = getModels();
    
    const totalCustomers = await Customer.count({ where: { isActive: true } });
    const activeCustomers = await Customer.count({ where: { isActive: true } });
    const totalOrders = await Order.count({ where: { isActive: true } });
    
    // Get top customers by order count
    const topCustomers = await Customer.findAll({
      where: { isActive: true }, // Filter for active customers
      include: [{
        model: Order,
        as: 'orders',
        where: { isActive: true }, // Filter for active orders
        attributes: []
      }],
      attributes: [
        'id',
        'customerName',
        'customerId',
        [require('sequelize').fn('COUNT', require('sequelize').col('orders.id')), 'orderCount']
      ],
      group: ['Customer.id'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('orders.id')), 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        totalOrders,
        topCustomers
      }
    });
  } catch (error) {
    next(error);
  }
  
};



module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  getMyCustomer,

}; 