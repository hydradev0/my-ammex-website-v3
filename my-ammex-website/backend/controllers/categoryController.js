const { getModels } = require('../config/db');
const { Op } = require('sequelize');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const models = getModels();
    const { include } = req.query;

    let includeOptions = [];
    // Always include subcategories for the customer portal
    includeOptions.push({
      model: models.Category,
      as: 'subcategories',
      where: { isActive: true },
      required: false,
      order: [['name', 'ASC']]
    });

    const categories = await models.Category.findAll({
      where: { 
        isActive: true,
        parentId: null // Only get main categories (not subcategories)
      },
      include: includeOptions,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res) => {
  try {
    const models = getModels();
    const { include } = req.query;

    let includeOptions = [];
    if (include === 'items') {
      includeOptions.push({
        model: models.Item,
        as: 'items',
        where: { isActive: true },
        required: false,
        include: [{
          model: models.Unit,
          as: 'unit',
          attributes: ['id', 'unit']
        }]
      });
    }

    const category = await models.Category.findByPk(req.params.id, {
      where: { isActive: true },
      include: includeOptions,
      order: include === 'items' ? [['items', 'itemName', 'ASC']] : undefined
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category'
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const models = getModels();
    const { name, parentId } = req.body;

    // Check if category already exists with the same name and parentId
    const whereClause = { name };
    if (parentId) {
      whereClause.parentId = parentId;
    } else {
      whereClause.parentId = null;
    }

    const existingCategory = await models.Category.findOne({ where: whereClause });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists in this level'
      });
    }

    // If parentId is provided, verify the parent category exists
    if (parentId) {
      const parentCategory = await models.Category.findByPk(parentId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    const newCategory = await models.Category.create({ name, parentId: parentId || null });

    res.status(201).json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    const models = getModels();
    const { name, parentId } = req.body;
    const currentCategory = await models.Category.findByPk(req.params.id);

    if (!currentCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate name (excluding current category) within the same parent level
    if (name && name !== currentCategory.name) {
      const whereClause = {
        name,
        id: { [Op.ne]: req.params.id }
      };
      
      if (parentId !== undefined) {
        whereClause.parentId = parentId || null;
      } else {
        whereClause.parentId = currentCategory.parentId;
      }

      const existingCategory = await models.Category.findOne({
        where: whereClause
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists in this level'
        });
      }
    }

    // If parentId is being changed, verify the parent category exists
    if (parentId !== undefined && parentId !== currentCategory.parentId) {
      if (parentId) {
        const parentCategory = await models.Category.findByPk(parentId);
        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found'
          });
        }
      }
    }

    await currentCategory.update(req.body);

    res.json({
      success: true,
      data: currentCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete category (hard delete)
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const models = getModels();
    const category = await models.Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has subcategories
    const subcategories = await models.Category.findAll({
      where: { parentId: category.id, isActive: true }
    });

    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with active subcategories. Please delete subcategories first.'
      });
    }

    // Check if category has items
    const items = await models.Item.findAll({
      where: { categoryId: category.id, isActive: true }
    });

    if (items.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with active items. Please reassign or delete items first.'
      });
    }

    // Permanently delete the category
    await category.destroy();

    res.json({
      success: true,
      message: 'Category permanently deleted'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
};

// @desc    Get subcategories for a specific category
// @route   GET /api/categories/:id/subcategories
// @access  Public
const getSubcategories = async (req, res) => {
  try {
    const models = getModels();
    const categoryId = req.params.id;

    // First verify the parent category exists
    const parentCategory = await models.Category.findByPk(categoryId);
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: 'Parent category not found'
      });
    }

    // Get all subcategories for this parent
    const subcategories = await models.Category.findAll({
      where: { 
        parentId: categoryId,
        isActive: true 
      },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories'
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories
}; 