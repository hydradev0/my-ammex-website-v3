const { getModels } = require('../config/db');
const { Op } = require('sequelize');

// Validate required customer profile fields before checkout
async function validateCustomerProfileOrThrow(customerId) {
  const { Customer } = getModels();
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  const requiredFields = {
    customerName: 'Customer name',
    street: 'Street',
    city: 'City',
    postalCode: 'Postal code',
    country: 'Country',
    telephone1: 'Telephone 1',
    email1: 'Email 1'
  };
  const missing = Object.keys(requiredFields).filter(
    (key) => !customer[key] || String(customer[key]).trim() === ''
  );
  if (missing.length > 0) {
    const error = new Error('Please complete your profile before checkout.');
    error.statusCode = 400;
    error.missingFields = missing.map((k) => requiredFields[k]);
    throw error;
  }

  return customer;
}

function generateOrderNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${yyyy}${mm}${dd}-${random}`;
}

// Resolve selected cart items from provided identifiers
async function resolveSelectedCartItems(customerId, identifiers) {
  const { Cart, CartItem, Item } = getModels();

  const cart = await Cart.findOne({ where: { customerId, status: 'active' } });
  if (!cart) {
    return { cart: null, items: [] };
  }

  const include = [{ model: Item, as: 'item' }];

  let selectedCartItems = [];
  const { itemIds = [], cartItemIds = [] } = identifiers || {};

  if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
    selectedCartItems = await CartItem.findAll({
      where: { id: { [Op.in]: cartItemIds }, cartId: cart.id },
      include
    });
  } else if (Array.isArray(itemIds) && itemIds.length > 0) {
    selectedCartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include
    });
    const wanted = new Set(itemIds.map((v) => Number(v)));
    selectedCartItems = selectedCartItems.filter((ci) => wanted.has(Number(ci.itemId)) || wanted.has(Number(ci.item?.id)));
  }

  return { cart, items: selectedCartItems };
}

// POST /api/checkout/preview
// Body: { itemIds?: number[], cartItemIds?: number[] }
// Note: Does not hard-fail on incomplete profile; returns warnings instead
const previewCheckout = async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    // Soft validate profile: capture missing fields but do not fail preview
    let missingFields = [];
    try {
      await validateCustomerProfileOrThrow(customerId);
    } catch (err) {
      if (err.missingFields) {
        missingFields = err.missingFields;
      } else {
        throw err;
      }
    }

    const { cart, items } = await resolveSelectedCartItems(customerId, req.body);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'No active cart found for customer' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No selected items found in cart' });
    }

    const lineItems = items.map((ci) => {
      const unitPrice = Number(ci.unitPrice || (ci.item ? ci.item.price : 0));
      const quantity = Number(ci.quantity);
      return {
        itemId: ci.itemId,
        name: ci.item?.itemName,
        price: unitPrice,
        quantity,
        total: unitPrice * quantity
      };
    });

    const totalAmount = lineItems.reduce((acc, li) => acc + li.total, 0);

    return res.json({
      success: true,
      data: {
        orderNumber: generateOrderNumber(),
        status: 'pending',
        orderDate: new Date().toISOString(),
        items: lineItems,
        totalAmount
      },
      warnings: missingFields.length > 0 ? {
        profileIncomplete: true,
        missingFields
      } : undefined
    });
  } catch (err) {
    if (err.missingFields) {
      // Keep legacy behavior: but prefer soft warnings above
      return res.status(err.statusCode || 400).json({ success: false, message: err.message, missingFields: err.missingFields });
    }
    next(err);
  }
};

// POST /api/checkout/confirm
// Body: { itemIds?: number[], cartItemIds?: number[], notes?: string }
const confirmCheckout = async (req, res, next) => {
  const { Order, OrderItem, CartItem, Cart } = getModels();
  const sequelize = Order.sequelize;
  const t = await sequelize.transaction();
  try {
    const customerId = Number(req.params.customerId);
    const customer = await validateCustomerProfileOrThrow(customerId);

    const { cart, items } = await resolveSelectedCartItems(customerId, req.body);
    if (!cart) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'No active cart found for customer' });
    }
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'No selected items found in cart' });
    }

    const orderNumber = generateOrderNumber();
    const userId = req.user.id; // employee or same user (client) placing the order

    // Build totals
    const lineItems = items.map((ci) => {
      const unitPrice = Number(ci.unitPrice || (ci.item ? ci.item.price : 0));
      const quantity = Number(ci.quantity);
      return {
        orderId: null, // fill later
        itemId: ci.itemId,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity
      };
    });
    const totalAmount = lineItems.reduce((acc, li) => acc + li.totalPrice, 0);

    // Create order
    const order = await Order.create({
      customerId,
      userId,
      orderNumber,
      totalAmount,
      // Ensure NOT NULL constraint on finalAmount
      finalAmount: totalAmount,
      shippingAddress: JSON.stringify({
        name: customer.customerName,
        street: customer.street,
        city: customer.city,
        postalCode: customer.postalCode,
        country: customer.country,
        phone: customer.telephone1,
        email: customer.email1
      }),
      billingAddress: JSON.stringify({
        name: customer.customerName,
        street: customer.street,
        city: customer.city,
        postalCode: customer.postalCode,
        country: customer.country,
        phone: customer.telephone1,
        email: customer.email1
      }),
      notes: req.body?.notes || null,
      orderDate: new Date(),
      status: 'pending'
    }, { transaction: t });

    // Create order items
    const orderItemsToCreate = lineItems.map((li) => ({ ...li, orderId: order.id }));
    await OrderItem.bulkCreate(orderItemsToCreate, { transaction: t });

    // Remove only the selected cart items from the cart
    const selectedCartItemIds = items.map((ci) => ci.id);
    if (selectedCartItemIds.length > 0) {
      await CartItem.destroy({ where: { id: { [Op.in]: selectedCartItemIds } } , transaction: t });
    }

    // Update cart lastUpdated (keep it active, do not convert/close)
    await Cart.update({ lastUpdated: new Date() }, { where: { id: cart.id }, transaction: t });

    await t.commit();

    // Fetch created order with items for response
    const createdOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    // Client-friendly response (matches Orders.jsx expectations)
    const clientShape = {
      id: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      orderDate: createdOrder.orderDate,
      status: createdOrder.status,
      totalAmount: Number(createdOrder.totalAmount),
      items: createdOrder.items.map((it) => ({
        name: undefined, // will try to enrich below
        quantity: Number(it.quantity),
        price: Number(it.unitPrice),
        total: Number(it.totalPrice)
      }))
    };

    // Try to enrich item names from the just-removed cart items' joins
    try {
      clientShape.items = items.map((ci) => ({
        name: ci.item?.itemName,
        quantity: Number(ci.quantity),
        price: Number(ci.unitPrice || (ci.item ? ci.item.price : 0)),
        total: Number(ci.quantity) * Number(ci.unitPrice || (ci.item ? ci.item.price : 0))
      }));
    } catch (_) {}

    return res.status(201).json({
      success: true,
      data: createdOrder,
      clientView: clientShape
    });
  } catch (err) {
    try { await t.rollback(); } catch (_) {}
    if (err.missingFields) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message, missingFields: err.missingFields });
    }
    next(err);
  }
};

module.exports = {
  previewCheckout,
  confirmCheckout
};

