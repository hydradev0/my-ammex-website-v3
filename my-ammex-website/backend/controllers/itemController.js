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

    const item = await Item.create(itemData);
    
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

    // Check for duplicate Name (excluding current item)
    if (updateData.itemName && updateData.itemName !== currentItem.itemName) {
      const existingItem = await Item.findOne({
        where: {
          itemName: updateData.itemName,
          id: { [Op.ne]: id }
        }
      });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item name already exists'
        });
      }
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

// Delete item (soft delete)
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

    await item.update({ isActive: false });

    res.json({
      success: true,
      message: 'Item deleted successfully'
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
  getLowStockItems,
  updateItemStock
}; 