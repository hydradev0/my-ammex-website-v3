const { getModels } = require('../config/db');
const { Op } = require('sequelize');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const models = getModels();
    const categories = await models.Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
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
    if (include === 'products') {
      includeOptions.push({
        model: models.Product,
        as: 'products',
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
      order: include === 'products' ? [['products', 'itemName', 'ASC']] : undefined
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
    const { name } = req.body;

    // Check if category already exists
    const existingCategory = await models.Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const newCategory = await models.Category.create({ name });

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
    const { name } = req.body;
    const currentCategory = await models.Category.findByPk(req.params.id);

    if (!currentCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate name (excluding current category)
    if (name && name !== currentCategory.name) {
      const existingCategory = await models.Category.findOne({
        where: {
          name,
          id: { [Op.ne]: req.params.id }
        }
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
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

// @desc    Delete category
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

    await category.update({ isActive: false });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
}; 