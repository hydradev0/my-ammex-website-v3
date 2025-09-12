const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Hybrid cart service - localStorage for immediate UI, database for persistence

// Debounce mechanism to prevent too many database calls
let syncTimeout = null;
const DEBOUNCE_DELAY = 500; // 0.5 second delay

const cancelDebouncedSync = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
};

const debouncedSync = (customerId, cartItems) => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(() => {
    syncCartToDatabase(customerId, cartItems);
    syncTimeout = null;
  }, DEBOUNCE_DELAY);
};

// Get customer's active cart (from database)
export const getCustomerCart = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cart/${customerId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch cart');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
};

// Add item to cart (hybrid approach)
export const addToCart = async (customerId, itemId, quantity = 1, productData = null) => {
  try {
    // 1. Immediate UI update with localStorage
    const savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    
    // Find existing item by ID
    const existingIndex = savedCart.findIndex(item => item.id === itemId);
    
    let updatedCart;
    if (existingIndex !== -1) {
      // Update existing item quantity
      const existingItem = savedCart[existingIndex];
      const newQuantity = Math.min(existingItem.quantity + quantity, productData?.stock || 999);
      
      updatedCart = [...savedCart];
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQuantity
      };
    } else {
      // Create new cart item with product data
      const cartItem = {
        id: itemId,
        name: productData?.name || 'Product',
        price: productData?.price || 0,
        stock: productData?.stock || 0,
        itemCode: productData?.itemCode || '',
        vendor: productData?.vendor || '',
        description: productData?.description || '',
        unit: productData?.unit || 'pcs',
        quantity: quantity
      };
      updatedCart = [...savedCart, cartItem];
    }
    
    // Update localStorage immediately
    localStorage.setItem('customerCart', JSON.stringify(updatedCart));
    
    // 2. Sync to database in background (don't wait for response)
    if (customerId) {
      // Use debounced sync to prevent too many database calls
      debouncedSync(customerId, updatedCart);
    }
    
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
};

  // Update cart item quantity (hybrid approach)
export const updateCartItem = async (cartItemId, quantity, customerId) => {
  try {
    // 1. Immediate UI update with localStorage
    const savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    
    // Find the item by ID and update quantity
    const itemIndex = savedCart.findIndex(item => item.id === cartItemId);
    
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }
    
    let updatedCart;
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      updatedCart = savedCart.filter(item => item.id !== cartItemId);
    } else {
      // Update quantity
      updatedCart = [...savedCart];
      updatedCart[itemIndex] = {
        ...updatedCart[itemIndex],
        quantity: quantity
      };
    }
    
    localStorage.setItem('customerCart', JSON.stringify(updatedCart));
    
    // 2. Sync to database in background
    if (customerId) {
      debouncedSync(customerId, updatedCart);
    }
    
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Remove item from cart (hybrid approach)
export const removeFromCart = async (cartItemId, customerId) => {
  try {
    // 1. Immediate UI update with localStorage
    const savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    const updatedCart = savedCart.filter(item => item.id !== cartItemId);
    localStorage.setItem('customerCart', JSON.stringify(updatedCart));

    // 2. Ensure DB removal happens immediately (no debounce) to avoid flash-back
    if (customerId) {
      cancelDebouncedSync();
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Look up the CartItem in DB by matching Item ID
          const dbCart = await getCustomerCart(customerId);
          const existing = dbCart?.data?.items?.find(ci => ci?.item?.id === cartItemId);
          if (existing?.id) {
            await fetch(`${API_BASE_URL}/cart/items/${existing.id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
          }
        } catch (err) {
          console.error('Immediate DB remove failed (will be reconciled on next sync):', err);
        }
      }
    }

    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw error;
  }
};

// Clear customer's cart (hybrid approach)
export const clearCart = async (customerId) => {
  try {
    // 1. Immediate UI update with localStorage
    localStorage.setItem('customerCart', JSON.stringify([]));
    
    // 2. Ensure DB is cleared immediately (no debounce) to avoid flash-back
    if (customerId) {
      // Cancel any pending debounced syncs which might re-push items
      cancelDebouncedSync();
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE_URL}/cart/${customerId}/clear`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    }
    
    return { success: true, cart: [] };
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Convert cart to order
export const convertCartToOrder = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cart/${customerId}/convert`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to convert cart to order');
    }
    
    // Clear localStorage after successful conversion
    localStorage.setItem('customerCart', JSON.stringify([]));
    
    return data;
  } catch (error) {
    console.error('Error converting cart to order:', error);
    throw error;
  }
};

// Checkout preview (server-side pricing of selected items)
export const checkoutPreview = async (customerId, { itemIds = [], cartItemIds = [] } = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/checkout/${customerId}/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ itemIds, cartItemIds })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to preview checkout');
  return data;
};

// Checkout confirm (creates order from selected items, removes only those from cart)
export const checkoutConfirm = async (customerId, { itemIds = [], cartItemIds = [], notes = '' } = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/checkout/${customerId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ itemIds, cartItemIds, notes })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to confirm checkout');
  return data;
};


// Get cart from localStorage (for immediate UI updates)
export const getLocalCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    // Remove any duplicate items by ID
    return cart.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
  } catch (error) {
    console.error('Error reading local cart:', error);
    return [];
  }
};

// Clean cart by removing duplicates and invalid items
export const cleanCart = (cart) => {
  if (!Array.isArray(cart)) return [];
  
  // Remove duplicates by ID, keeping the first occurrence
  const uniqueCart = cart.filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id)
  );
  
  // Remove items with invalid data
  return uniqueCart.filter(item => 
    item && 
    item.id && 
    item.name && 
    item.price !== undefined && 
    item.quantity > 0
  );
};

// Sync cart to database (background operation)
const syncCartToDatabase = async (customerId, cartItems) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return; // Skip if not authenticated
    
    // Get current database cart
    const dbCart = await getCustomerCart(customerId);
    const existingItems = dbCart.data?.items || [];
    
    // Create a map of existing items for quick lookup
    const existingItemsMap = new Map();
    existingItems.forEach(cartItem => {
      existingItemsMap.set(cartItem.item.id, cartItem);
    });
    
    // Process each cart item
    for (const item of cartItems) {
      const existingItem = existingItemsMap.get(item.id);
      
      if (existingItem) {
        // Update existing item if quantity changed
        if (existingItem.quantity !== item.quantity) {
          await fetch(`${API_BASE_URL}/cart/items/${existingItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ quantity: item.quantity }),
          });
        }
      } else {
        // Add new item
        await fetch(`${API_BASE_URL}/cart/${customerId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ 
            itemId: item.id, 
            quantity: item.quantity 
          }),
        });
      }
    }
    
    // Remove items that are no longer in the cart
    for (const existingItem of existingItems) {
      const stillExists = cartItems.some(item => item.id === existingItem.item.id);
      if (!stillExists) {
        await fetch(`${API_BASE_URL}/cart/items/${existingItem.id}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }
    }
    
    console.log('Cart synced to database successfully');
  } catch (error) {
    console.error('Error syncing cart to database:', error);
    // Don't throw error - this is a background operation
  }
};

// Sync single item to database (background operation)
const syncToDatabase = async (customerId, itemId, quantity, productData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return; // Skip if not authenticated
    
    // First, check if item already exists in database cart
    const dbCart = await getCustomerCart(customerId);
    const existingItem = dbCart.data?.items?.find(cartItem => cartItem.item.id === itemId);
    
    if (existingItem) {
      // Update existing item quantity instead of adding
      await fetch(`${API_BASE_URL}/cart/items/${existingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ quantity: quantity }),
      });
    } else {
      // Add new item to cart
      await fetch(`${API_BASE_URL}/cart/${customerId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ itemId, quantity }),
      });
    }
    
    console.log('Item synced to database successfully');
  } catch (error) {
    console.error('Error syncing item to database:', error);
    // Don't throw error - this is a background operation
  }
};

// Initialize cart from database (when user logs in)
export const initializeCartFromDatabase = async (customerId) => {
  try {
    const dbCart = await getCustomerCart(customerId);
    if (dbCart.success && dbCart.data?.items) {
      // Transform database cart items to match localStorage format
      const transformedItems = dbCart.data.items.map(cartItem => ({
        id: cartItem.item.id,
        name: cartItem.item.itemName,
        price: parseFloat(cartItem.unitPrice),
        stock: cartItem.item.quantity,
        itemCode: cartItem.item.itemCode,
        vendor: cartItem.item.vendor,
        description: cartItem.item.description,
        unit: cartItem.item.unit?.name || 'pcs',
        quantity: cartItem.quantity
      }));
      
      // Update localStorage with database data
      localStorage.setItem('customerCart', JSON.stringify(transformedItems));
      return transformedItems;
    }
    return [];
  } catch (error) {
    console.error('Error initializing cart from database:', error);
    return getLocalCart(); // Fallback to localStorage
  }
};

