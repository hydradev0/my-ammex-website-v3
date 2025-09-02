const { getModels } = require('../config/db');

// Get customer's active cart
const getCustomerCart = async (req, res) => {
  try {
    const { Cart, CartItem, Item } = getModels();
    const { customerId } = req.params;

    // Find or create active cart for customer
    let [cart, created] = await Cart.findOrCreate({
      where: { 
        customerId,
        status: 'active'
      },
      defaults: {
        customerId,
        status: 'active',
        lastUpdated: new Date()
      }
    });

    // Get cart items with item details
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [{
        model: Item,
        as: 'item',
        attributes: ['id', 'itemName', 'itemCode', 'price', 'quantity', 'description']
      }],
      order: [['addedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        cart: {
          id: cart.id,
          customerId: cart.customerId,
          status: cart.status,
          lastUpdated: cart.lastUpdated,
          itemCount: cartItems.length
        },
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          addedAt: item.addedAt,
          item: item.item
        }))
      }
    });
  } catch (error) {
    console.error('Error getting customer cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error.message
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { Cart, CartItem, Item } = getModels();
    const { customerId } = req.params;
    const { itemId, quantity = 1 } = req.body;

    // Validate input
    if (!itemId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Item ID and quantity (minimum 1) are required'
      });
    }

    // Check if item exists and has sufficient stock
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${item.quantity}`
      });
    }

    // Find or create active cart for customer
    let [cart, created] = await Cart.findOrCreate({
      where: { 
        customerId,
        status: 'active'
      },
      defaults: {
        customerId,
        status: 'active',
        lastUpdated: new Date()
      }
    });

    // Check if item already exists in cart
    const existingCartItem = await CartItem.findOne({
      where: { cartId: cart.id, itemId }
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      if (newQuantity > item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more. Total would exceed available stock: ${item.quantity}`
        });
      }

      await existingCartItem.update({
        quantity: newQuantity,
        unitPrice: item.price
      });
    } else {
      // Add new item to cart
      await CartItem.create({
        cartId: cart.id,
        itemId,
        quantity,
        unitPrice: item.price
      });
    }

    // Update cart lastUpdated
    await cart.update({ lastUpdated: new Date() });

    res.json({
      success: true,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { Cart, CartItem, Item } = getModels();
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cartItem = await CartItem.findByPk(cartItemId, {
      include: [{
        model: Item,
        as: 'item'
      }]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check stock availability
    if (quantity > cartItem.item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${cartItem.item.quantity}`
      });
    }

    await cartItem.update({ quantity });

    // Update cart lastUpdated
    await Cart.update(
      { lastUpdated: new Date() },
      { where: { id: cartItem.cartId } }
    );

    res.json({
      success: true,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { Cart, CartItem } = getModels();
    const { cartItemId } = req.params;

    const cartItem = await CartItem.findByPk(cartItemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    await cartItem.destroy();

    // Update cart lastUpdated
    await Cart.update(
      { lastUpdated: new Date() },
      { where: { id: cartItem.cartId } }
    );

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Clear customer's cart
const clearCart = async (req, res) => {
  try {
    const { Cart, CartItem } = getModels();
    const { customerId } = req.params;

    const cart = await Cart.findOne({
      where: { customerId, status: 'active' }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'No active cart found for customer'
      });
    }

    // Remove all cart items
    await CartItem.destroy({
      where: { cartId: cart.id }
    });

    // Update cart lastUpdated
    await cart.update({ lastUpdated: new Date() });

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// Convert cart to order (mark cart as converted)
const convertCartToOrder = async (req, res) => {
  try {
    const { Cart, Customer } = getModels();
    const { customerId } = req.params;

    // Validate required customer profile fields before checkout
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
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
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before checkout.',
        missingFields: missing.map((k) => requiredFields[k])
      });
    }

    const cart = await Cart.findOne({
      where: { customerId, status: 'active' }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'No active cart found for customer'
      });
    }

    // Mark cart as converted
    await cart.update({ 
      status: 'converted',
      lastUpdated: new Date()
    });

    res.json({
      success: true,
      message: 'Cart converted to order successfully'
    });
  } catch (error) {
    console.error('Error converting cart to order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert cart to order',
      error: error.message
    });
  }
};

module.exports = {
  getCustomerCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  convertCartToOrder
};

