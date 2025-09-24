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
    const { Order, OrderItem, Item } = getModels();
    const { createInvoiceFromOrder } = require('./invoiceController');
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.user.id;

    // Accept either numeric DB id or orderNumber
    let order = null;
    if (/^\d+$/.test(String(id))) {
      order = await Order.findByPk(id, {
        include: [{ model: OrderItem, as: 'items', include: [{ model: Item, as: 'item' }] }]
      });
    }
    if (!order) {
      order = await Order.findOne({ 
        where: { orderNumber: String(id) },
        include: [{ model: OrderItem, as: 'items', include: [{ model: Item, as: 'item' }] }]
      });
    }
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Handle inventory deduction/restoration based on status changes
    const previousStatus = order.status;
    
    // If moving from pending to approved, deduct inventory
    if (previousStatus === 'pending' && status === 'approved') {
      try {
        console.log('Processing order approval with inventory deduction...');
        console.log('Order items:', order.items?.length || 0);
        
        // Check if order has items
        if (!order.items || order.items.length === 0) {
          console.log('No items found in order');
          return res.status(400).json({
            success: false,
            message: 'Order has no items to process'
          });
        }
        
        // Validate inventory availability before approving
        for (const orderItem of order.items) {
          const item = orderItem.item;
          if (!item) {
            console.log('Item not found for order item:', orderItem.id);
            return res.status(400).json({
              success: false,
              message: `Item not found for order item ${orderItem.id}`
            });
          }
          
          console.log(`Checking inventory for item ${item.itemName}: available=${item.quantity}, required=${orderItem.quantity}`);
          
          if (item.quantity < orderItem.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient inventory for item "${item.itemName}". Available: ${item.quantity}, Required: ${orderItem.quantity}`
            });
          }
        }
        
        // Deduct inventory quantities
        for (const orderItem of order.items) {
          const item = orderItem.item;
          const newQuantity = item.quantity - orderItem.quantity;
          console.log(`Deducting inventory for ${item.itemName}: ${item.quantity} - ${orderItem.quantity} = ${newQuantity}`);
          await item.update({ quantity: newQuantity });
        }
        
        console.log('Inventory deduction completed successfully');
      } catch (inventoryError) {
        console.error('Error during inventory deduction:', inventoryError);
        return res.status(500).json({
          success: false,
          message: `Failed to process inventory: ${inventoryError.message}`
        });
      }
    }
    
    // If moving from approved to rejected, restore inventory
    if (previousStatus === 'approved' && status === 'rejected') {
      console.log('Processing order rejection with inventory restoration...');
      for (const orderItem of order.items) {
        const item = orderItem.item;
        if (item) {
          const newQuantity = item.quantity + orderItem.quantity;
          console.log(`Restoring inventory for ${item.itemName}: ${item.quantity} + ${orderItem.quantity} = ${newQuantity}`);
          await item.update({ quantity: newQuantity });
        }
      }
      console.log('Inventory restoration completed successfully');
    }
    
    // If moving from rejected to pending, no inventory change needed
    // If moving from pending to rejected, no inventory change needed

    // Persist provided status directly. If rejecting, capture reason in notes.
    const updateData = { status };
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

    // Create notification when order is rejected
    if (status === 'rejected') {
      try {
        const { Notification, Customer } = getModels();
        const customer = await Customer.findByPk(order.customerId);
        
        await Notification.create({
          customerId: order.customerId,
          type: 'order_rejected',
          title: 'Order Rejected',
          message: `Your order <span class=\"font-semibold\">${order.orderNumber}</span> has been rejected. ${rejectionReason ? `Reason: <span class="font-medium text-red-500">${rejectionReason}</span>` : ''}`,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            rejectionReason
          }
        });
      } catch (notificationError) {
        console.error('Failed to create rejection notification:', notificationError);
        // Don't fail the order update if notification fails
      }
    }

    // Automatically create invoice when order is approved
    let createdInvoice = null;
    if (status === 'approved') {
      try {
        createdInvoice = await createInvoiceFromOrder(order.id, userId);
      } catch (invoiceError) {
        // Log the error but don't fail the order update
        console.error('Failed to create invoice for approved order:', invoiceError.message);
      }
    }

    res.json({
      success: true,
      data: order,
      ...(createdInvoice && { invoice: createdInvoice })
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

    // Process orders to extract rejection metadata for rejected orders
    const processedOrders = orders.rows.map(order => {
      if (order.status === 'rejected' && order.notes) {
        const notes = String(order.notes);
        const rejectIndex = notes.indexOf('REJECT:');
        if (rejectIndex >= 0) {
          const rejectionReason = notes.slice(rejectIndex + 'REJECT:'.length).trim();
          return {
            ...order.toJSON(),
            rejectionReason
          };
        }
      }
      return order.toJSON();
    });

    res.json({
      success: true,
      data: processedOrders,
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
      // Use provided status directly (DB enum now includes 'rejected')
      where.status = status;
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
        const isRejected = o.status === 'rejected';
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

// Client cancels own order (only if still pending/processing)
const cancelMyOrder = async (req, res, next) => {
  try {
    const { Order, Customer } = getModels();
    const { id } = req.params; // can be numeric id or orderNumber

    // Resolve authenticated user's customer
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for user' });
    }

    // Resolve order by id or orderNumber, and ensure ownership
    let order = null;
    if (/^\d+$/.test(String(id))) {
      order = await Order.findOne({ where: { id: Number(id), customerId: customer.id } });
    }
    if (!order) {
      order = await Order.findOne({ where: { orderNumber: String(id), customerId: customer.id } });
    }
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Allow cancellation only for pending or processing
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Only pending or processing orders can be cancelled' });
    }

    await order.update({ status: 'cancelled' });

    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Client appeals a rejected order
const appealRejectedOrder = async (req, res, next) => {
  try {
    const { Order, Customer, Notification } = getModels();
    const { id } = req.params; // can be numeric id or orderNumber
    const { appealReason } = req.body || {};

    if (!appealReason || String(appealReason).trim() === '') {
      return res.status(400).json({ success: false, message: 'Appeal reason is required' });
    }

    // Resolve authenticated user's customer
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for user' });
    }

    // Resolve order by id or orderNumber, and ensure ownership
    let order = null;
    if (/^\d+$/.test(String(id))) {
      order = await Order.findOne({ where: { id: Number(id), customerId: customer.id } });
    }
    if (!order) {
      order = await Order.findOne({ where: { orderNumber: String(id), customerId: customer.id } });
    }
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected orders can be appealed' });
    }



    // Create notification for Admin/Sales
    await Notification.create({
      customerId: order.customerId,
      type: 'order_appeal',
      title: 'Order Appeal Submitted',
      message: `Customer <span class=\"font-semibold\">${customer.customerName || 'Unknown Customer'}</span> appealed order <span class=\"font-semibold\">${order.orderNumber}</span>. Reason: <span class=\"font-medium text-red-500\">${appealReason}</span>`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        appealReason
      }
    });

    res.json({ success: true, message: 'Appeal submitted successfully' });
  } catch (error) {
    console.error('Error submitting order appeal:', error);
    next(error);
  }
};

// Get order notifications
const getOrderNotifications = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { role, customerId } = req.user;

    // Admin and Sales Marketing: show order appeals and general order notifications
    if (role === 'Admin' || role === 'Sales Marketing') {
      const adminNotifications = await Notification.findAll({
        where: { 
          type: { [Op.in]: ['order_appeal', 'general'] }
        },
        order: [['createdAt', 'DESC']]
      });
      const unreadCount = adminNotifications.filter(n => !n.adminIsRead).length;
      return res.json({ success: true, data: { notifications: adminNotifications, unreadCount } });
    }

    // For Client users, check customerId
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required'
      });
    }

    // Get order-related notifications for customers
    const notifications = await Notification.findAll({
      where: { 
        customerId,
        type: { [Op.in]: ['order_rejected', 'order_appeal'] }
      },
      order: [['createdAt', 'DESC']]
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching order notifications:', error);
    next(error);
  }
};

// Mark order notification as read
const markOrderNotificationAsRead = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { id } = req.params;
    const { role, customerId } = req.user;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check ownership for clients
    if (role === 'Client' && notification.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update read status based on role
    if (role === 'Admin' || role === 'Sales Marketing') {
      await notification.update({
        adminIsRead: true,
        adminReadAt: new Date()
      });
    } else {
      await notification.update({
        isRead: true,
        readAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
};

// Mark all order notifications as read
const markAllOrderNotificationsAsRead = async (req, res, next) => {
  try {
    const { Notification } = getModels();
    const { role, customerId } = req.user;

    if (role === 'Admin' || role === 'Sales Marketing') {
      await Notification.update(
        {
          adminIsRead: true,
          adminReadAt: new Date()
        },
        {
          where: { 
            type: { [Op.in]: ['order_appeal', 'general'] },
            adminIsRead: false
          }
        }
      );
    } else {
      await Notification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: { 
            customerId,
            type: { [Op.in]: ['order_rejected', 'order_appeal'] },
            isRead: false
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
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
  getMyOrders,
  cancelMyOrder,
  appealRejectedOrder,
  getOrderNotifications,
  markOrderNotificationAsRead,
  markAllOrderNotificationsAsRead
}; 