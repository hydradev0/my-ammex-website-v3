const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// OrderItem model (for order line items)
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Item name is required' }
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Quantity must be at least 1' }
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Unit price must be greater than or equal to 0' }
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Total must be greater than or equal to 0' }
    }
  }
}, {
  timestamps: true
});

// Order model
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Order ID is required' }
    }
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Client name is required' }
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Total must be greater than or equal to 0' }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['orderId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['date']
    }
  ]
});

// Define relationships
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
});

module.exports = { Order, OrderItem }; 