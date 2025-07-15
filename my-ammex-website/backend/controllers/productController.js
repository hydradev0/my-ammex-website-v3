const { getModels } = require('../config/db');
const { Op } = require('sequelize');

// Get all products
const getAllProducts = async (req, res, next) => {
  try {
    const { Product, Category, Unit } = getModels();
    const { page = 1, limit = 10, category, search } = req.query;
    
    // Build where clause
    const whereClause = { isActive: true };
    if (category) whereClause.categoryId = category;
    if (search) {
      whereClause.itemName = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const products = await Product.findAndCountAll({
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
      data: products.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(products.count / limit),
        totalItems: products.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single product by ID
const getProductById = async (req, res, next) => {
  try {
    const { Product, Category, Unit } = getModels();
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Create new product
const createProduct = async (req, res, next) => {
  try {
    const { Product, Category, Unit } = getModels();
    const productData = req.body;

    const product = await Product.create(productData);
    
    // Fetch the created product with related data
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdProduct
    });
  } catch (error) {
    next(error);
  }
};

// Update product
const updateProduct = async (req, res, next) => {
  try {
    const { Product, Category, Unit } = getModels();
    const { id } = req.params;
    const updateData = req.body;

    const currentProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });
    if (!currentProduct) {
      return res.status(404).json({   
        success: false,
        message: 'Product not found'
      });
    }

    // Check for duplicate Name (excluding current product)
    if (updateData.itemName && updateData.itemName !== currentProduct.itemName) {
      const existingProduct = await Product.findOne({
        where: {
          itemName: updateData.itemName,
          id: { [Op.ne]: id }
        }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product name already exists'
        });
      }
    }

    // Check for duplicate Code (excluding current product)
    if (updateData.itemCode && updateData.itemCode !== currentProduct.itemCode) {
      const existingCode = await Product.findOne({
        where: {
          itemCode: updateData.itemCode,
          id: { [Op.ne]: id }
        }
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Product code already exists'
        });
      }
    }

    await currentProduct.update(updateData);
    
    // Fetch the updated product with related data
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// Delete product (soft delete)
const deleteProduct = async (req, res, next) => {
  try {
    const { Product } = getModels();
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.update({ isActive: false });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get low stock products
const getLowStockProducts = async (req, res, next) => {
  try {
    const { Product, Category, Unit } = getModels();
    const products = await Product.findAll({
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
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// Update product stock
const updateProductStock = async (req, res, next) => {
  try {
    const { Product, Category, Unit } = getModels();
    const { id } = req.params;
    const { quantity } = req.body;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.update({ quantity });
    
    // Fetch the updated product with related data
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Unit, as: 'unit' }
      ]
    });

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  updateProductStock
}; 