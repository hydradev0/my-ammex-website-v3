const { getModels } = require('../config/db');
const { Op } = require('sequelize');

// Get all suppliers
const getAllSuppliers = async (req, res, next) => {
  try {
    const { Supplier } = getModels();
    const { page = 1, limit = 10, search, isActive } = req.query;
    
    // Build where clause - default to active records unless specified otherwise
    const whereClause = {};
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { companyName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { supplierId: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email1: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    // Only filter by isActive if explicitly provided, otherwise default to active records
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    } else {
      whereClause.isActive = true; // Default to active records
    }

    const suppliers = await Supplier.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: suppliers.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(suppliers.count / limit),
        totalItems: suppliers.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single supplier by ID
const getSupplierById = async (req, res, next) => {
  try {
    const { Supplier } = getModels();
    const { id } = req.params;
    const { include } = req.query;

    let includeOptions = [];
    if (include === 'orders') {
      // Add order relationships if needed in the future
      // For now, just return supplier data
    }

    const supplier = await Supplier.findByPk(id, {
      where: { isActive: true }, // Filter for active supplier
      include: includeOptions
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// Create new supplier
const createSupplier = async (req, res, next) => {
  try {
    const { Supplier } = getModels();
    const supplierData = req.body;

    const supplier = await Supplier.create(supplierData);

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// Update supplier
const updateSupplier = async (req, res, next) => {
  try {
    const { Supplier } = getModels();
    const { id } = req.params;
    const updateData = req.body;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if supplierId is being updated and if it's unique
    if (updateData.supplierId && updateData.supplierId !== supplier.supplierId) {
      const existingId = await Supplier.findOne({
        where: { supplierId: updateData.supplierId }
      });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: 'Supplier ID already exists'
        });
      }
    }

    await supplier.update(updateData);

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// Delete supplier (soft delete + archive metadata)
const deleteSupplier = async (req, res, next) => {
  try {
    const { Supplier } = getModels();
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.update({ 
      isActive: false,
      archivedAt: new Date(),
      archivedBy: req.user?.id || null
    });

    res.json({
      success: true,
      message: 'Supplier archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get supplier statistics
const getSupplierStats = async (req, res, next) => {
  try {
    const { Supplier } = getModels();
    
    const totalSuppliers = await Supplier.count({ where: { isActive: true } });
    const activeSuppliers = await Supplier.count({ where: { isActive: true } });
    
    // Get top suppliers by creation date (most recent)
    const topSuppliers = await Supplier.findAll({
      where: { isActive: true },
      attributes: [
        'id',
        'companyName',
        'supplierId',
        'contactName',
        'email1',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        topSuppliers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get archived suppliers
const getArchivedSuppliers = async (req, res, next) => {
  try {
    const { Supplier } = getModels();
    const { page = 1, limit = 10 } = req.query;
    
    const suppliers = await Supplier.findAndCountAll({
      where: { isActive: false },
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['archivedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: suppliers.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(suppliers.count / limit),
        totalItems: suppliers.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Restore supplier
const restoreSupplier = async (req, res, next) => {
  try {
    const { Supplier } = getModels();
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.update({ 
      isActive: true,
      archivedAt: null,
      archivedBy: null
    });

    res.json({
      success: true,
      message: 'Supplier restored successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStats,
  getArchivedSuppliers,
  restoreSupplier,
};
