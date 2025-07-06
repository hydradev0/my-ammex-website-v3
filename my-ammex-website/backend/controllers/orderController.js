const { Order, OrderItem } = require('../models-postgres');

// Get all orders
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    // Build where clause
    const whereClause = {};
    if (status) whereClause.status = status;
    if (startDate && endDate) {
      whereClause.date = {
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
    const { id } = req.params;

    const order = await Order.findByPk(id, {
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
    const { orderId, clientName, items, total } = req.body;

    // Create order
    const order = await Order.create({
      orderId,
      clientName,
      total,
      date: new Date()
    });

    // Create order items
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        ...item,
        orderId: order.id
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
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.destroy();

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