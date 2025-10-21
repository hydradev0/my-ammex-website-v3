const { getModels } = require('../config/db');
const { Op } = require('sequelize');

// Get all items
const getAllItems = async (req, res, next) => {
  try {
    const { Item, Category, Unit } = getModels();
    const { page = 1, limit = 10, category, search } = req.query;
    
    // Build where clause
    const whereClause = { isActive: true };
    if (category) whereClause.categoryId = category;
    if (search) {
      whereClause.modelNo = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const items = await Item.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, as: 'category' },
        { model: Category, as: 'subcategory' },
        { model: Unit, as: 'unit' }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: items.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(items.count / limit),
        totalItems: items.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single item by ID
const getItemById = async (req, res, next) => {
  try {
    const { Item, Category, Unit } = getModels();
    const { id } = req.params;

    const item = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Category, as: 'subcategory' },
        { model: Unit, as: 'unit' }
      ]
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// Create new item
const createItem = async (req, res, next) => {
  try {
    const { Item, Category, Unit, Supplier } = getModels();
    const itemData = req.body;
    
    // Expect: vendor (company name string), categoryId (number), modelNo (string)
    const vendorName = (itemData.vendor || '').toString().trim();
    const categoryId = itemData.categoryId;
    const modelNo = (itemData.modelNo || '').toString().trim();

    // Find supplier by company name if vendor is provided but supplierId is not
    let supplierId = itemData.supplierId;
    if (!supplierId && vendorName) {
      const supplier = await Supplier.findOne({
        where: { companyName: vendorName }
      });
      if (supplier) {
        supplierId = supplier.id;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: `Supplier with company name "${vendorName}" not found. Please create the supplier first.` 
        });
      }
    }

    // Ensure supplierId is provided
    if (!supplierId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Supplier is required. Please select a valid supplier.' 
      });
    }

    // Fetch category to get its name
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Invalid categoryId' });
    }

    // Build code parts
    const vendorCode = vendorName.substring(0, 3).toUpperCase();
    const categoryCode = (category.name || '').substring(0, 3).toUpperCase();

    // Running number: global sequential across all items
    const latestItem = await Item.findOne({
      order: [['createdAt', 'DESC']]
    });
    let nextNumber = 1;
    if (latestItem && latestItem.itemCode) {
      const parts = latestItem.itemCode.split('-');
      const maybeNum = parts[2];
      const parsed = parseInt(maybeNum, 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }
    const runningNumber = String(nextNumber).padStart(3, '0');

    const generatedCode = `${vendorCode}-${categoryCode}-${runningNumber}-${modelNo}`;

    const item = await Item.create({ 
      ...itemData, 
      itemCode: generatedCode,
      supplierId: supplierId
    });
    
    // Fetch the created item with related data
    const createdItem = await Item.findByPk(item.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Category, as: 'subcategory' },
        { model: Unit, as: 'unit' },
        { model: Supplier, as: 'supplier' }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdItem
    });
  } catch (error) {
    next(error);
  }
};

// Update item
const updateItem = async (req, res, next) => {
  try {
    const { Item, Category, Unit } = getModels();
    const { id } = req.params;
    const updateData = req.body;

    // Clean up empty string values for integer fields
    const cleanUpdateData = { ...updateData };
    
    // Convert empty strings to null for integer fields
    const integerFields = ['categoryId', 'subcategoryId', 'unitId', 'quantity', 'minLevel', 'maxLevel'];
    integerFields.forEach(field => {
      if (cleanUpdateData[field] === '') {
        // For required fields like minLevel and maxLevel, don't allow null
        if (field === 'minLevel' || field === 'maxLevel') {
          delete cleanUpdateData[field]; // Remove the field to keep existing value
        } else {
          cleanUpdateData[field] = null;
        }
      } else if (cleanUpdateData[field] !== undefined && cleanUpdateData[field] !== null) {
        // Ensure it's a valid integer
        const parsed = parseInt(cleanUpdateData[field]);
        cleanUpdateData[field] = isNaN(parsed) ? null : parsed;
      }
    });
    
    // Convert empty strings to null for decimal fields
    const decimalFields = ['sellingPrice', 'supplierPrice'];
    decimalFields.forEach(field => {
      if (cleanUpdateData[field] === '') {
        cleanUpdateData[field] = null;
      } else if (cleanUpdateData[field] !== undefined && cleanUpdateData[field] !== null) {
        // Ensure it's a valid number
        const parsed = parseFloat(cleanUpdateData[field]);
        cleanUpdateData[field] = isNaN(parsed) ? null : parsed;
      }
    });

    const currentItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });
    if (!currentItem) {
      return res.status(404).json({   
        success: false,
        message: 'Item not found'
      });
    }



    // Check for duplicate Code (excluding current item)
    if (cleanUpdateData.itemCode && cleanUpdateData.itemCode !== currentItem.itemCode) {
      const existingCode = await Item.findOne({
        where: {
          itemCode: cleanUpdateData.itemCode,
          id: { [Op.ne]: id }
        }
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Item code already exists'
        });
      }
    }

    // If vendor/category/modelNo provided, regenerate itemCode while preserving running number
    if (cleanUpdateData.vendor || cleanUpdateData.categoryId || cleanUpdateData.modelNo) {
      const vendorName = (cleanUpdateData.vendor || currentItem.vendor || '').toString().trim();
      const categoryId = cleanUpdateData.categoryId || currentItem.categoryId;
      const category = await Category.findByPk(categoryId);
      const categoryName = (category?.name || '').toString().trim();

      // Extract running number from existing code (3rd part)
      const parts = (currentItem.itemCode || '').split('-');
      const existingNumber = parts[2] && /^\d{3,}$/.test(parts[2]) ? parts[2] : '001';

      const vendorCode = vendorName.substring(0, 3).toUpperCase();
      const categoryCode = categoryName.substring(0, 3).toUpperCase();
      const modelNo = (cleanUpdateData.modelNo || parts[3] || '').toString().trim();

      const newCode = `${vendorCode}-${categoryCode}-${existingNumber}-${modelNo}`;
      cleanUpdateData.itemCode = newCode;
      // Ensure modelNo is set to the value from the request (if provided)
      // or keep the existing value if not provided
      cleanUpdateData.modelNo = cleanUpdateData.modelNo || modelNo;
    } else {
      // If itemCode regeneration is not triggered but modelNo is provided,
      // ensure it's still updated
      if (cleanUpdateData.modelNo !== undefined) {
        cleanUpdateData.modelNo = cleanUpdateData.modelNo.toString().trim();
      }
    }

    await currentItem.update(cleanUpdateData);
    
    // Fetch the updated item with related data
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Category, as: 'subcategory' },
        { model: Unit, as: 'unit' }
      ]
    });

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    next(error);
  }
};

// Delete item (soft delete + archive metadata)
const deleteItem = async (req, res, next) => {
  try {
    const { Item } = getModels();
    const { id } = req.params;

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await item.update({ 
      isActive: false,
      archivedAt: new Date(),
      archivedBy: req.user?.id || null
    });

    res.json({
      success: true,
      message: 'Item archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get archived items
const getArchivedItems = async (req, res, next) => {
  try {
    const { Item, Category, Unit } = getModels();
    const { page = 1, limit = 10, search } = req.query;

    const whereClause = { isActive: false };
    if (search) {
      whereClause.modelNo = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const items = await Item.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['archivedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: items.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(items.count / limit),
        totalItems: items.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Restore archived item
const restoreItem = async (req, res, next) => {
  try {
    const { Item } = getModels();
    const { id } = req.params;

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Item is already active'
      });
    }

    await item.update({ isActive: true, archivedAt: null, archivedBy: null });

    res.json({
      success: true,
      message: 'Item restored successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get low stock items
const getLowStockItems = async (req, res, next) => {
  try {
    const { Item, Category, Unit } = getModels();
    const items = await Item.findAll({
      where: {
        isActive: true,
        quantity: {
          [require('sequelize').Op.lte]: require('sequelize').col('minLevel')
        }
      },
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ],
      order: [['quantity', 'ASC']]
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// Update item stock
const updateItemStock = async (req, res, next) => {
  try {
    const { Item, Category, Unit } = getModels();
    const NotificationService = require('../services/notificationService');
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Store previous quantity for stock level monitoring
    const previousQuantity = item.quantity;

    await item.update({ quantity });
    
    // Fetch the updated item with related data
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Category, as: 'subcategory' },
        { model: Unit, as: 'unit' }
      ]
    });

    // Check stock levels and create notifications if needed
    try {
      await NotificationService.checkStockLevels(updatedItem, previousQuantity);
    } catch (notificationError) {
      console.error('Error checking stock levels:', notificationError);
      // Don't fail the stock update if notification fails
    }

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    next(error);
  }
};

// Update item price
const updateItemPrice = async (req, res, next) => {
  try {
    const { Item, Category, Unit, PriceHistory } = getModels();
    const { id } = req.params;
    let { sellingPrice, supplierPrice, markupPercentage, adjustmentType } = req.body;

    const item = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Store old values for history
    // Supplier price is optionally overridden by the request; default to current
    supplierPrice = supplierPrice !== undefined && supplierPrice !== null && supplierPrice !== ''
      ? parseFloat(supplierPrice)
      : parseFloat(item.supplierPrice);
    const oldSellingPrice = parseFloat(item.sellingPrice);
    const oldMarkup = ((oldSellingPrice - supplierPrice) / supplierPrice) * 100;

    // Calculate based on adjustment type
    if (adjustmentType === 'markup' && markupPercentage !== undefined) {
      // Calculate selling price from markup percentage
      markupPercentage = parseFloat(markupPercentage);
      sellingPrice = supplierPrice * (1 + markupPercentage / 100);
    } else if (adjustmentType === 'price' && sellingPrice !== undefined) {
      // Calculate markup percentage from selling price
      sellingPrice = parseFloat(sellingPrice);
      markupPercentage = ((sellingPrice - supplierPrice) / supplierPrice) * 100;
    } else {
      // Default: if only sellingPrice provided
      sellingPrice = parseFloat(sellingPrice);
      markupPercentage = ((sellingPrice - supplierPrice) / supplierPrice) * 100;
    }

    // Validate selling price is not below supplier price
    if (sellingPrice < supplierPrice) {
      return res.status(400).json({
        success: false,
        message: `New selling price (₱${sellingPrice.toFixed(2)}) cannot be below supplier price (₱${supplierPrice.toFixed(2)})`
      });
    }

    // Validate markup percentage is non-negative
    if (markupPercentage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Markup percentage cannot be negative'
      });
    }

    // Create price history record (supplier price may change if provided)
    await PriceHistory.create({
      itemId: id,
      oldSupplierPrice: parseFloat(item.supplierPrice),
      newSupplierPrice: supplierPrice,
      oldSellingPrice: oldSellingPrice,
      newSellingPrice: sellingPrice,
      oldMarkup: oldMarkup,
      newMarkup: markupPercentage,
      adjustmentType: adjustmentType || 'price',
      changedBy: req.user.id
    });

    // Update selling price and optionally supplier price
    await item.update({ 
      sellingPrice: sellingPrice,
      supplierPrice: supplierPrice
    });
    
    // Fetch the updated item with related data
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Category, as: 'subcategory' },
        { model: Unit, as: 'unit' }
      ]
    });

    res.json({
      success: true,
      data: {
        ...updatedItem.toJSON(),
        markupPercentage: markupPercentage
      },
      message: `Price updated successfully. Selling price: ₱${oldSellingPrice.toFixed(2)} → ₱${sellingPrice.toFixed(2)} (Markup: ${oldMarkup.toFixed(1)}% → ${markupPercentage.toFixed(1)}%)`
    });
  } catch (error) {
    next(error);
  }
};

// Get price history for an item
const getPriceHistory = async (req, res, next) => {
  try {
    const { PriceHistory, User } = getModels();
    const { id } = req.params;

    const history = await PriceHistory.findAll({
      where: { itemId: id },
      include: [
        {
          model: User,
          as: 'changer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getArchivedItems,
  restoreItem,
  getLowStockItems,
  updateItemStock,
  updateItemPrice,
  getPriceHistory
}; 