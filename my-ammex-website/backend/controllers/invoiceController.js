const { getModels } = require('../config/db');
const { Op } = require('sequelize');
const htmlPdf = require('html-pdf-node');

// Tax calculation helper functions
function calculateTaxAmounts(finalAmount) {
  // Formula: 
  // If final amount is 714 (selling price with markup), then:
  // Amount without VAT = 714 / 1.12 = 637
  // Tax = 637 x 0.12 = 76
  // Verification: 637 + 76 = 713 (should equal final amount)
  
  const finalAmountNum = Number(finalAmount);
  
  // Step 1: Calculate amount without VAT (final amount / 1.12)
  const amountWithoutVAT = finalAmountNum / 1.12;
  
  // Step 2: Calculate tax amount (amount without VAT * 0.12)
  const taxAmount = amountWithoutVAT * 0.12;
  
  return {
    amountWithoutVAT: Math.round(amountWithoutVAT * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmountWithTax: Math.round((amountWithoutVAT + taxAmount) * 100) / 100
  };
}

// Calculate tax for invoice total
function calculateInvoiceTax(invoiceTotal) {
  const taxCalculation = calculateTaxAmounts(invoiceTotal);
  return {
    subtotal: taxCalculation.amountWithoutVAT,
    taxAmount: taxCalculation.taxAmount,
    total: taxCalculation.totalAmountWithTax
  };
}

// Helper function to add tax information to invoice data
function addTaxInfoToInvoice(invoice) {
  if (!invoice) return invoice;
  
  const taxCalculation = calculateInvoiceTax(invoice.totalAmount);
  return {
    ...invoice.toJSON ? invoice.toJSON() : invoice,
    taxInfo: {
      subtotal: taxCalculation.subtotal,
      taxAmount: taxCalculation.taxAmount,
      totalWithTax: taxCalculation.total,
      taxRate: 12 // 12% VAT
    }
  };
}

// Generate invoice number similar to order number format
function generateInvoiceNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `INV-${yyyy}${mm}${dd}-${random}`;
}

// Helper: Generate Invoice HTML for PDF
function generateInvoiceHTML(invoice) {
  const formatCurrency = (amount) => `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Calculate tax amounts
  const taxCalculation = calculateInvoiceTax(invoice.totalAmount);

  const itemsRows = (invoice.items || []).map((it) => `
      <tr>
        <td style="border:1px solid #e5e7eb;padding:8px 12px;">${it.item?.itemName || ''}</td>
        <td style="border:1px solid #e5e7eb;padding:8px 12px;">${it.item?.modelNo || ''}</td>
        <td style="border:1px solid #e5e7eb;padding:8px 12px;text-align:center;">${Number(it.quantity)}</td>
        <td style="border:1px solid #e5e7eb;padding:8px 12px;text-align:right;">${formatCurrency(it.unitPrice)}</td>
        <td style="border:1px solid #e5e7eb;padding:8px 12px;text-align:right;">${formatCurrency(it.totalPrice)}</td>
      </tr>
  `).join('');

  const customer = invoice.customer || {};

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color:#111827; margin: 32px; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111827; padding-bottom:16px; margin-bottom:24px; }
        .company h1 { margin:0 0 6px 0; font-size:24px; }
        .label { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; }
        .value { font-size:14px; font-weight:600; color:#111827; }
        .title { font-size:28px; font-weight:800; margin:0 0 8px 0; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px; }
        table { width:100%; border-collapse:collapse; }
        th { background:#f9fafb; border:1px solid #e5e7eb; padding:10px 12px; text-align:left; font-size:12px; color:#374151; }
        tfoot td { padding:8px 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">
          <h1>AMMEX</h1>
          <div class="label">Address</div>
          <div class="value">123 Business Street, Makati City, Metro Manila 1234, Philippines</div>
          <div class="label" style="margin-top:8px">Contact</div>
          <div class="value">+63 2 1234 5678 • info@ammex.com</div>
        </div>
        <div style="text-align:right;">
          <div class="title">INVOICE</div>
          <div><span class="label">Invoice #</span><div class="value">${invoice.invoiceNumber}</div></div>
          <div style="margin-top:8px"><span class="label">Date</span><div class="value">${formatDate(invoice.invoiceDate)}</div></div>
          <div style="margin-top:8px"><span class="label">Due Date</span><div class="value">${formatDate(invoice.dueDate)}</div></div>
        </div>
      </div>

      <div class="grid">
        <div>
          <div class="label">Bill To</div>
          <div class="value">${customer.customerName || ''}</div>
          <div>${customer.email1 || ''}</div>
          <div>${[customer.street, customer.city, customer.country].filter(Boolean).join(', ')}</div>
        </div>
        <div>
          <div class="label">Payment Terms</div>
          <div class="value">${invoice.paymentTerms || '30 days'}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Model No.</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Unit Price</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="display:flex; justify-content:flex-end; margin-top:16px;">
        <table style="width:320px;">
          <tbody>
            <tr>
              <td class="label">Subtotal</td>
              <td style="text-align:right" class="value">${formatCurrency(taxCalculation.subtotal)}</td>
            </tr>
            <tr>
              <td class="label">Tax (12% VAT)</td>
              <td style="text-align:right">${formatCurrency(taxCalculation.taxAmount)}</td>
            </tr>
            <tr>
              <td class="label">Total Amount</td>
              <td style="text-align:right" class="value">${formatCurrency(taxCalculation.total)}</td>
            </tr>
            <tr style="height:16px;">
              <td colspan="2"></td>
            </tr>
            <tr>
              <td class="label">Paid Amount</td>
              <td style="text-align:right">${formatCurrency(invoice.paidAmount || 0)}</td>
            </tr>
            <tr>
              <td class="label">Balance Due</td>
              <td style="text-align:right" class="value">${formatCurrency(invoice.remainingBalance ?? taxCalculation.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top:32px; border-top:1px solid #e5e7eb; padding-top:16px; text-align:center; color:#6b7280; font-size:12px;">
        This invoice serves as proof of purchase. For any inquiries, please contact our support team with your invoice number.
      </div>
    </body>
  </html>`;
}

// Download invoice as PDF (Client, Admin, Sales Marketing)
const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { Invoice, InvoiceItem, Customer, Item } = getModels();
    const { id } = req.params;
    
    let whereClause = { id };
    
    // For Client users, restrict to their own invoices
    if (req.user.role === 'Client') {
      let customerId = req.user.customerId;
      
      if (!customerId) {
        const linkedCustomer = await Customer.findOne({ where: { userId: req.user.id } });
        if (linkedCustomer) customerId = linkedCustomer.id;
      }
      
      if (!customerId) {
        return res.status(401).json({ success: false, message: 'Customer authentication required' });
      }
      
      whereClause.customerId = customerId;
    }
    // For Admin and Sales Marketing, no customer restriction

    const invoice = await Invoice.findOne({
      where: whereClause,
      include: [
        { model: InvoiceItem, as: 'items', include: [{ model: Item, as: 'item' }] },
        { model: Customer, as: 'customer' }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const htmlContent = generateInvoiceHTML(invoice);

    const options = {
      format: 'A4',
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      printBackground: true,
      displayHeaderFooter: false
    };

    htmlPdf.generatePdf({ content: htmlContent }, options)
      .then((pdfBuffer) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
        return res.end(pdfBuffer);
      })
      .catch((error) => next(error));
  } catch (error) {
    next(error);
  }
};


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

    // Use the order total as the final amount (it already includes markup and VAT)
    const orderTotal = order.finalAmount || order.totalAmount;

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      orderId: order.id,
      customerId: order.customerId,
      invoiceDate: new Date(),
      dueDate,
      totalAmount: orderTotal, // Use the order total as is (already includes markup and VAT)
      paidAmount: 0.00,
      remainingBalance: orderTotal, // Balance is the same as total amount
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

    // Add tax information to all invoices
    const invoicesWithTax = invoices.rows.map(invoice => addTaxInfoToInvoice(invoice));

    res.json({
      success: true,
      data: invoicesWithTax,
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

    // Add tax information to all invoices
    const invoicesWithTax = invoices.rows.map(invoice => addTaxInfoToInvoice(invoice));

    res.json({
      success: true,
      data: invoicesWithTax,
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

    // Add tax information to the invoice
    const invoiceWithTax = addTaxInfoToInvoice(invoice);

    res.json({
      success: true,
      data: invoiceWithTax
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
      
      // Calculate tax amounts for this invoice
      const taxCalculation = calculateInvoiceTax(invoice.totalAmount);
      
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
        subtotal: taxCalculation.subtotal,
        taxAmount: taxCalculation.taxAmount,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        paymentStatus: paymentStatus,
        paymentTerms: invoice.paymentTerms,
        items: (invoice.items || []).map((item) => ({
          name: item.item?.itemName || '',
          modelNo: item.item?.modelNo || '',
          quantity: Number(item.quantity),
          unit: item.item?.unit?.name || '',
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

// Test function to verify tax calculations (for development/testing purposes)
const testTaxCalculation = (req, res, next) => {
  try {
    const { amount } = req.query;
    const testAmount = amount ? Number(amount) : 714; // Default to 714 as final amount
    
    const result = calculateTaxAmounts(testAmount);
    
    res.json({
      success: true,
      data: {
        inputAmount: testAmount,
        calculation: result,
        formula: {
          step1: `${testAmount} / 1.12 = ${result.amountWithoutVAT} (Amount without VAT)`,
          step2: `${result.amountWithoutVAT} x 0.12 = ${result.taxAmount} (TAX)`,
          verification: `${result.amountWithoutVAT} + ${result.taxAmount} = ${result.totalAmountWithTax} (Should equal ${testAmount})`
        }
      }
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
  createInvoiceFromOrder,
  getInvoicePaymentHistory,
  getAllInvoicesWithPayments,
  downloadInvoicePdf,
  testTaxCalculation
};
