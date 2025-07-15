const { getModels } = require('../config/db');

// Get all orders
const getAllOrders = async (req, res, next) => {
  try {
    const { Order, OrderItem } = getModels();
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    const whereClause = { isActive: true }; // Default to active orders
    if (status) whereClause.status = status;
    if (startDate && endDate) {
      whereClause.orderDate = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: orders.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(orders.count / limit),
        totalItems: orders.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single order by ID
const getOrderById = async (req, res, next) => {
  try {
    const { Order, OrderItem } = getModels();
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      where: { isActive: true }, // Filter for active order
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Create new order
const createOrder = async (req, res, next) => {
  try {
    const { Order, OrderItem } = getModels();
    const { customerId, orderNumber, totalAmount, items, shippingAddress, billingAddress, notes } = req.body;

    // Create order
    const order = await Order.create({
      customerId,
      orderNumber,
      totalAmount,
      shippingAddress,
      billingAddress,
      notes,
      orderDate: new Date()
    });

    // Create order items
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }));
      
      await OrderItem.bulkCreate(orderItems);
    }

    // Fetch order with items
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdOrder
    });
  } catch (error) {
    next(error);
  }
};

// Update order
const updateOrder = async (req, res, next) => {
  try {
    const { Order, OrderItem } = getModels();
    const { id } = req.params;
    const updateData = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update(updateData);

    // Fetch updated order with items
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { Order } = getModels();
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ status });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Delete order
const deleteOrder = async (req, res, next) => {
  try {
    const { Order } = getModels();
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ isActive: false });

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get orders by status
const getOrdersByStatus = async (req, res, next) => {
  try {
    const { Order, OrderItem } = getModels();
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.findAndCountAll({
      where: { status },
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: orders.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(orders.count / limit),
        totalItems: orders.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByStatus
}; 