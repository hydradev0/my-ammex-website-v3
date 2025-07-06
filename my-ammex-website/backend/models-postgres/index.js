const User = require('./User');
const Product = require('./Product');
const { Order, OrderItem } = require('./Order');

// Import models to establish relationships
const models = {
  User,
  Product,
  Order,
  OrderItem
};

// Define relationships between models
// User can have many orders
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders'
});

Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Product can be in many order items
Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems'
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

module.exports = models; 