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
    const { Invoice, InvoiceItem, Order, OrderItem, Customer, Item, Category } = getModels();
    
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
      totalAmount: order.finalAmount || order.totalAmount, // Use finalAmount if available (with discount), otherwise totalAmount
      paidAmount: 0.00,
      remainingBalance: order.finalAmount || order.totalAmount, // Use finalAmount if available (with discount), otherwise totalAmount
      status: 'awaiting payment',
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
    const { Invoice, InvoiceItem, Customer, Item, Order, Category } = getModels();
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
          include: [{ 
            model: Item, 
            as: 'item',
            include: [
              { model: Category, as: 'category' },
              { model: Category, as: 'subcategory' }
            ]
          }]
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
    const { Invoice, InvoiceItem, Customer, Item, Order, Category } = getModels();
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const invoices = await Invoice.findAndCountAll({
      where: { status },
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ 
            model: Item, 
            as: 'item',
            include: [
              { model: Category, as: 'category' },
              { model: Category, as: 'subcategory' }
            ]
          }]
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
    const { Invoice, InvoiceItem, Customer, Item, Order, Category } = getModels();
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ 
            model: Item, 
            as: 'item',
            include: [
              { model: Category, as: 'category' },
              { model: Category, as: 'subcategory' }
            ]
          }]
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
    const { Invoice, InvoiceItem, Customer, Item, Order, Category } = getModels();
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
          include: [{ 
            model: Item, 
            as: 'item',
            include: [
              { model: Category, as: 'category' },
              { model: Category, as: 'subcategory' }
            ]
          }]
        },
        {
          model: Order,
          as: 'order'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Shape to client-friendly structure matching frontend expectations
    const clientInvoices = [];
    
    for (const invoice of invoices) {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const isOverdue = dueDate < today;
      
      // Use database columns for payment amounts
      const paidAmount = Number(invoice.paidAmount || 0);
      const remainingAmount = invoice.remainingBalance !== null && invoice.remainingBalance !== undefined 
        ? Number(invoice.remainingBalance) 
        : Number(invoice.totalAmount);
      
      // Determine payment status based on remaining amount and invoice status
      let paymentStatus;
      if (remainingAmount <= 0) {
        // Only mark as completed if balance is 0 or negative
        paymentStatus = 'completed';
      } else if (isOverdue) {
        // Overdue if past due date and still has balance
        paymentStatus = 'overdue';
      } else if (paidAmount > 0 && remainingAmount > 0) {
        // Partially paid if some payment has been made
        paymentStatus = 'partially paid';
      } else {
        // Default to awaiting payment
        paymentStatus = 'awaiting payment';
      }
      
      // Update database status if it doesn't match the calculated payment status
      if (invoice.status !== paymentStatus) {
        try {
          await invoice.update({ status: paymentStatus });
        } catch (error) {
          console.error(`Failed to update invoice ${invoice.id} status:`, error);
        }
      }
      
      clientInvoices.push({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderId: invoice.order?.orderNumber || `ORD-${invoice.orderId}`,
        customerName: customer.customerName,
        customerEmail: customer.email1,
        customerAddress: `${customer.street || ''}, ${customer.city || ''}, ${customer.country || ''}`.trim(),
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
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
      });
    }

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

// Get invoice payment history (Admin, Sales Marketing)
const getInvoicePaymentHistory = async (req, res, next) => {
  try {
    const { PaymentHistory, Invoice, Customer, User } = getModels();
    const { invoiceId } = req.params;
    const customerId = req.user.customerId;

    // Verify invoice belongs to customer
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice || invoice.customerId !== customerId) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or access denied'
      });
    }

    const history = await PaymentHistory.findAll({
      where: { invoiceId },
      include: [
        { 
          model: Customer, 
          as: 'customer',
          attributes: ['id', 'companyName']
        },
        { 
          model: User, 
          as: 'performer',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching invoice payment history:', error);
    next(error);
  }
};

// Admin: Get all invoices with payment details
const getAllInvoicesWithPayments = async (req, res, next) => {
  try {
    const { Invoice, InvoiceItem, Customer, Item, Payment, Category } = getModels();
    const { page = 1, limit = 10, status, search } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { invoiceNumber: { [Op.iLike]: `%${search}%` } },
        { '$customer.companyName$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'companyName', 'contactPerson', 'email']
        },
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ 
            model: Item, 
            as: 'item', 
            attributes: ['id', 'name', 'description'],
            include: [
              { model: Category, as: 'category' },
              { model: Category, as: 'subcategory' }
            ]
          }]
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'status', 'paymentMethod', 'submittedAt', 'reviewedAt']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching invoices with payments:', error);
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
  createInvoiceFromOrder,
  getInvoicePaymentHistory,
  getAllInvoicesWithPayments
};
