const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product name is required' }
    }
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'SKU is required' }
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Price must be greater than or equal to 0' }
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Quantity must be greater than or equal to 0' }
    }
  },
  category: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  minStockLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      min: { args: [0], msg: 'Minimum stock level must be greater than or equal to 0' }
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  indexes: [
    {
      unique: true,
      fields: ['sku']
    },
    {
      fields: ['category']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Product; 