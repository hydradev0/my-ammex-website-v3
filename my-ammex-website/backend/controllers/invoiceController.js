const { getModels } = require('../config/db');
const { Op } = require('sequelize');

// Generate invoice number similar to order number format
function generateInvoiceNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `INV-${yyyy}${mm}${dd}-${random}`;
}

// Create invoice automatically from approved order
const createInvoiceFromOrder = async (orderId, userId) => {
  try {
    const { Invoice, InvoiceItem, Order, OrderItem, Customer, Item } = getModels();
    
    // Get the approved order with items
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Item, as: 'item' }]
        },
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ where: { orderId } });
    if (existingInvoice) {
      throw new Error('Invoice already exists for this order');
    }

    // Calculate due date (30 days from invoice date)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      orderId: order.id,
      customerId: order.customerId,
      invoiceDate: new Date(),
      dueDate,
      totalAmount: order.totalAmount,
      status: 'pending',
      paymentTerms: '30 days',
      createdBy: userId
    });

    // Create invoice items from order items
    if (order.items && order.items.length > 0) {
      const invoiceItems = order.items.map(orderItem => ({
        invoiceId: invoice.id,
        itemId: orderItem.itemId,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice,
        totalPrice: orderItem.totalPrice
      }));
      
      await InvoiceItem.bulkCreate(invoiceItems);
    }

    // Fetch complete invoice with relationships
    const createdInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Item, as: 'item' }]
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Order,
          as: 'order'
        }
      ]
    });

    return createdInvoice;
  } catch (error) {
    throw error;
  }
};

// Get all invoices (for Admin and Sales Marketing)
const getAllInvoices = async (req, res, next) => {
  try {
    const { Invoice, InvoiceItem, Customer, Item, Order } = getModels();
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (startDate && endDate) {
      whereClause.invoiceDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const invoices = await Invoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Item, as: 'item' }]
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Order,
          as: 'order'
        }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: invoices.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(invoices.count / limit),
        totalItems: invoices.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get invoices by status
const getInvoicesByStatus = async (req, res, next) => {
  try {
    const { Invoice, InvoiceItem, Customer, Item, Order } = getModels();
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const invoices = await Invoice.findAndCountAll({
      where: { status },
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Item, as: 'item' }]
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Order,
          as: 'order'
        }
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: invoices.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(invoices.count / limit),
        totalItems: invoices.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single invoice by ID
const getInvoiceById = async (req, res, next) => {
  try {
    const { Invoice, InvoiceItem, Customer, Item, Order } = getModels();
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Item, as: 'item' }]
        },
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: Order,
          as: 'order'
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// Get authenticated client's own invoices
const getMyInvoices = async (req, res, next) => {
  try {
    const { Invoice, InvoiceItem, Customer, Item, Order } = getModels();
    const { status } = req.query;

    // Map auth user -> customer
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for user' });
    }

    const where = { customerId: customer.id };
    if (status) {
      where.status = status;
    }

    const invoices = await Invoice.findAll({
      where,
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Item, as: 'item' }]
        },
        {
          model: Order,
          as: 'order'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Shape to client-friendly structure matching frontend expectations
    const clientInvoices = invoices.map((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const isOverdue = dueDate < today;
      
      // Calculate payment status based on actual payment data, not invoice status
      let paymentStatus = 'pending';
      
      if (isOverdue) {
        paymentStatus = 'overdue';
      } else if (invoice.status === 'completed') {
        // If invoice is completed but no payment tracking yet, show as pending payment
        paymentStatus = 'awaiting payment';
      }
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderId: invoice.order?.orderNumber || `ORD-${invoice.orderId}`,
        customerName: customer.customerName,
        customerEmail: customer.email1,
        customerAddress: `${customer.street || ''}, ${customer.city || ''}, ${customer.country || ''}`.trim(),
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: 0, // Will be implemented in payment phase
        remainingAmount: Number(invoice.totalAmount), // Will be updated in payment phase
        paymentStatus: paymentStatus,
        paymentTerms: invoice.paymentTerms,
        items: (invoice.items || []).map((item) => ({
          name: item.item?.itemName || 'Unknown Item',
          description: item.item?.description || '',
          quantity: Number(item.quantity),
          unit: item.item?.unit?.name || 'pcs',
          unitPrice: Number(item.unitPrice),
          total: Number(item.totalPrice)
        })),
        discountApplied: 0,
        createdDate: invoice.createdAt,
        lastUpdated: invoice.updatedAt
      };
    });

    res.json({ success: true, data: clientInvoices });
  } catch (error) {
    next(error);
  }
};

// Update invoice status (for marking as completed)
const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { Invoice } = getModels();
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.update({ status });

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// Manual invoice creation (for Admin and Sales Marketing)
const createInvoice = async (req, res, next) => {
  try {
    const { Invoice, Order, OrderItem, Customer, Item } = getModels();
    const { orderId, paymentTerms, notes } = req.body;
    const userId = req.user.id;

    // Check if order exists and is approved
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Item, as: 'item' }]
        },
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved orders can be converted to invoices'
      });
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ where: { orderId } });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this order'
      });
    }

    // Create invoice using the helper function
    const invoice = await createInvoiceFromOrder(orderId, userId);

    // Update with additional fields if provided
    const updateData = {};
    if (paymentTerms) updateData.paymentTerms = paymentTerms;
    if (notes) updateData.notes = notes;
    
    if (Object.keys(updateData).length > 0) {
      await invoice.update(updateData);
    }

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInvoices,
  getInvoicesByStatus,
  getInvoiceById,
  getMyInvoices,
  updateInvoiceStatus,
  createInvoice,
  createInvoiceFromOrder
};
