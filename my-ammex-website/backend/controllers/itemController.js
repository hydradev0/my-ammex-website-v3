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
      whereClause.itemName = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const items = await Item.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, as: 'category' },
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
    const { Item, Category, Unit } = getModels();
    const itemData = req.body;

    // Expect: vendor (company name string), categoryId (number), modelNo (string)
    const vendorName = (itemData.vendor || '').toString().trim();
    const categoryId = itemData.categoryId;
    const modelNo = (itemData.modelNo || '').toString().trim();

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

    const item = await Item.create({ ...itemData, itemCode: generatedCode });
    
    // Fetch the created item with related data
    const createdItem = await Item.findByPk(item.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
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
    if (updateData.itemCode && updateData.itemCode !== currentItem.itemCode) {
      const existingCode = await Item.findOne({
        where: {
          itemCode: updateData.itemCode,
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
    if (updateData.vendor || updateData.categoryId || updateData.modelNo) {
      const vendorName = (updateData.vendor || currentItem.vendor || '').toString().trim();
      const categoryId = updateData.categoryId || currentItem.categoryId;
      const category = await Category.findByPk(categoryId);
      const categoryName = (category?.name || '').toString().trim();

      // Extract running number from existing code (3rd part)
      const parts = (currentItem.itemCode || '').split('-');
      const existingNumber = parts[2] && /^\d{3,}$/.test(parts[2]) ? parts[2] : '001';

      const vendorCode = vendorName.substring(0, 3).toUpperCase();
      const categoryCode = categoryName.substring(0, 3).toUpperCase();
      const modelNo = (updateData.modelNo || parts[3] || '').toString().trim();

      const newCode = `${vendorCode}-${categoryCode}-${existingNumber}-${modelNo}`;
      updateData.itemCode = newCode;
      // Do not attempt to persist modelNo if not part of the ORM model
      if (Object.prototype.hasOwnProperty.call(updateData, 'modelNo')) {
        delete updateData.modelNo;
      }
    }

    await currentItem.update(updateData);
    
    // Fetch the updated item with related data
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
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
      whereClause.itemName = { [require('sequelize').Op.iLike]: `%${search}%` };
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

    await item.update({ quantity });
    
    // Fetch the updated item with related data
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
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

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getArchivedItems,
  restoreItem,
  getLowStockItems,
  updateItemStock
}; 