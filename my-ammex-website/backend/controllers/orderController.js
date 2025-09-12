const { getModels } = require('../config/db');
const { Op } = require('sequelize');

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
    const { customerId, totalAmount, items, shippingAddress, billingAddress, notes } = req.body;

    const orderNumber = generateOrderNumber();
    const userId = req.user.id; // employee's user ID from auth middleware

    // Create order
    const order = await Order.create({
      customerId,      // the customer (registered or walk-in)
      userId,          // the employee handling the order
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
        itemId: item.itemId,
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
    const { status, rejectionReason } = req.body;

    // Accept either numeric DB id or orderNumber
    let order = null;
    if (/^\d+$/.test(String(id))) {
      order = await Order.findByPk(id);
    }
    if (!order) {
      order = await Order.findOne({ where: { orderNumber: String(id) } });
    }
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Normalize: persist 'rejected' as 'cancelled' in DB enum. If re-approving to 'pending', strip REJECT: marker.
    const normalizedStatus = status === 'rejected' ? 'cancelled' : status;
    const updateData = { status: normalizedStatus };
    if (status === 'rejected' && typeof rejectionReason === 'string' && rejectionReason.trim() !== '') {
      // Persist rejection reason into notes (non-destructive: append or set)
      const prefix = 'REJECT:';
      const existing = order.notes ? String(order.notes) + ' ' : '';
      updateData.notes = `${existing}${prefix} ${rejectionReason.trim()}`.trim();
    } else if (status === 'pending') {
      // Remove any REJECT: marker from notes when re-approving
      if (order.notes) {
        const cleaned = String(order.notes).replace(/REJECT:[^]*$/i, '').trim();
        updateData.notes = cleaned.length > 0 ? cleaned : null;
      }
    }

    await order.update(updateData);

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

// Get orders by status (includes customer and item details)
const getOrdersByStatus = async (req, res, next) => {
  try {
    const { Order, OrderItem, Customer, Item } = getModels();
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.findAndCountAll({
      where: { status },
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'items', include: [{ model: Item, as: 'item' }] }
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

function generateOrderNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `ORD-${yyyy}${mm}${dd}-${random}`;
}

// Get authenticated client's own orders (optionally filter by status)
const getMyOrders = async (req, res, next) => {
  try {
    const { Order, OrderItem, Customer, Item } = getModels();
    const { status } = req.query;

    // Map auth user -> customer
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for user' });
    }

    const where = { customerId: customer.id };
    if (status) {
      if (status === 'rejected') {
        // Map to DB status 'cancelled' and filter by REJECT marker later
        where.status = 'cancelled';
      } else {
        where.status = status;
      }
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Item, as: 'item' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Shape to client-friendly structure like Orders.jsx expects
    const clientOrders = orders
      .map((o) => {
        const notes = o.notes ? String(o.notes) : '';
        const idx = notes.indexOf('REJECT:');
        const isRejected = (status === 'rejected') || (o.status === 'cancelled');
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          orderDate: o.orderDate,
          status: isRejected ? 'rejected' : o.status,
          totalAmount: Number(o.totalAmount),
          items: (o.items || []).map((it) => ({
            name: it.item?.itemName,
            quantity: Number(it.quantity),
            price: Number(it.unitPrice),
            total: Number(it.totalPrice)
          })),
          ...(idx >= 0 ? { rejectionReason: notes.slice(idx + 'REJECT:'.length).trim() } : {})
        };
      });

    res.json({ success: true, data: clientOrders });
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
  getOrdersByStatus,
  getMyOrders
}; 