import { API_BASE_URL, apiCall } from '../utils/apiConfig';

// Hybrid cart service - localStorage for immediate UI, database for persistence
// BULLETPROOF: Global cart state to prevent multiple mounting issues
let globalCartState = null;
let isCartInitialized = false;

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

    // BULLETPROOF: Use global state if available, otherwise read from localStorage
    let savedCart;
    if (globalCartState && isCartInitialized) {
      savedCart = globalCartState;
    } else {
      savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    }
    
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
        price: productData?.price || 0,
        sellingPrice: productData?.price || 0, // Add new field for consistency
        stock: productData?.stock || 0,
        itemCode: productData?.itemCode || '',
        modelNo: productData?.modelNo || '',
        category: productData?.category || '',
        vendor: productData?.vendor || '',
        description: productData?.description || '',
        unit: productData?.unit || 'pcs',
        quantity: quantity
      };
      
      updatedCart = [...savedCart, cartItem];
    }
    
    
    // BULLETPROOF: Update both global state and localStorage
    globalCartState = updatedCart;
    isCartInitialized = true;
    
    localStorage.setItem('customerCart', JSON.stringify(updatedCart));

    // BULLETPROOF: Triple verification
    const verifyCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    
    if (verifyCart.length !== updatedCart.length) {
      console.error('🚨 [CART ERROR] localStorage write failed! Expected:', updatedCart.length, 'Got:', verifyCart.length);
      // Force fix
      localStorage.setItem('customerCart', JSON.stringify(updatedCart));
      globalCartState = updatedCart;
    }

    // BULLETPROOF: Create backup immediately after successful localStorage write
    if (updatedCart.length > 0) {
      localStorage.setItem('customerCart_backup', JSON.stringify(updatedCart));
    }
    
    // 2. Sync to database in background (don't wait for response)
    if (customerId) {
      // Use debounced sync to prevent too many database calls
      debouncedSync(customerId, updatedCart);
    }
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { action: 'add', itemId, quantity, totalItems: updatedCart.length } 
    }));
    
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('❌ [CART ERROR] Error adding item to cart:', error);
    throw error;
  }
};

  // Update cart item quantity (hybrid approach) - BULLETPROOF
export const updateCartItem = async (cartItemId, quantity, customerId) => {
  try {
    // BULLETPROOF: Use global state if available
    let savedCart;
    if (globalCartState && isCartInitialized) {
      savedCart = globalCartState;
    } else {
      savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    }
    
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
    
    // BULLETPROOF: Update both global state and localStorage
    globalCartState = updatedCart;
    isCartInitialized = true;
    localStorage.setItem('customerCart', JSON.stringify(updatedCart));
    
    // BULLETPROOF: Create backup after update
    if (updatedCart.length > 0) {
      localStorage.setItem('customerCart_backup', JSON.stringify(updatedCart));
    } else {
      // Clear backup if cart is empty
      localStorage.removeItem('customerCart_backup');
    }
    
    // 2. Sync to database in background
    if (customerId) {
      debouncedSync(customerId, updatedCart);
    }
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { action: 'update', itemId: cartItemId, quantity, totalItems: updatedCart.length } 
    }));
    
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Remove item from cart (hybrid approach) - SIMPLIFIED
export const removeFromCart = async (cartItemId, customerId) => {
  try {
    // BULLETPROOF: Use global state if available
    let savedCart;
    if (globalCartState && isCartInitialized) {
      savedCart = globalCartState;
    } else {
      savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    }
    
    const updatedCart = savedCart.filter(item => item.id !== cartItemId);
    
    // BULLETPROOF: Update both global state and localStorage
    globalCartState = updatedCart;
    isCartInitialized = true;
    localStorage.setItem('customerCart', JSON.stringify(updatedCart));

    // BULLETPROOF: Create backup after removal
    if (updatedCart.length > 0) {
      localStorage.setItem('customerCart_backup', JSON.stringify(updatedCart));
    } else {
      // Clear backup if cart is empty
      localStorage.removeItem('customerCart_backup');
    }

    // 2. Remove from database immediately (explicit user action)
    if (customerId) {
      cancelDebouncedSync();
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Look up the CartItem in DB by matching Item ID
          const dbCart = await getCustomerCart(customerId);
          const existing = dbCart?.data?.items?.find(ci => ci?.item?.id === cartItemId);
          if (existing?.id) {
            const response = await fetch(`${API_BASE_URL}/cart/items/${existing.id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              console.error('Failed to remove from database:', response.status);
            }
          }
        } catch (err) {
          console.error('Database removal failed:', err);
        }
      }
    }

    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { action: 'remove', itemId: cartItemId, totalItems: updatedCart.length } 
    }));
    
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('❌ [REMOVE ERROR] Error removing item from cart:', error);
    throw error;
  }
};

// Clear customer's cart (hybrid approach) - BULLETPROOF
export const clearCart = async (customerId) => {
  try {
    // BULLETPROOF: Update both global state and localStorage
    globalCartState = [];
    isCartInitialized = true;
    localStorage.setItem('customerCart', JSON.stringify([]));
    
    // BULLETPROOF: Clear backup when cart is cleared
    localStorage.removeItem('customerCart_backup');
    
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
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { action: 'clear', totalItems: 0 } 
    }));
    
    return { success: true, cart: [] };
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Recover cart from database when localStorage and backup are empty
export const recoverCartFromDatabase = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return [];
    }

    // Get database cart
    const dbCart = await getCustomerCart(customerId);
    const dbItems = dbCart.data?.items || [];

    if (dbItems.length > 0) {
      // Transform database items to localStorage format
      const transformedItems = dbItems.map(cartItem => ({
        id: cartItem.item.id,
        name: cartItem.item.itemName,
        price: parseFloat(cartItem.unitPrice),
        sellingPrice: parseFloat(cartItem.unitPrice), // Add new field for consistency
        stock: cartItem.item.quantity,
        itemCode: cartItem.item.itemCode,
        modelNo: cartItem.item.modelNo,
        vendor: cartItem.item.vendor,
        description: cartItem.item.description,
        unit: cartItem.item.unit?.name || 'pcs',
        quantity: cartItem.quantity,
        category: cartItem.item.category?.name || null,
        subcategory: cartItem.item.subcategory?.name || null
      }));

      // Restore to localStorage and create backup
      localStorage.setItem('customerCart', JSON.stringify(transformedItems));
      localStorage.setItem('customerCart_backup', JSON.stringify(transformedItems));
      globalCartState = transformedItems;
      isCartInitialized = true;

      return transformedItems;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Failed to recover cart from database:', error);
    return [];
  }
};

// Clean up database cart to match localStorage (remove stale items)
export const cleanupDatabaseCart = async (customerId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Get current localStorage cart
    const localCart = getLocalCart();
    const localItemIds = localCart.map(item => item.id);

    // Get database cart
    const dbCart = await getCustomerCart(customerId);
    const dbItems = dbCart.data?.items || [];
    const dbItemIds = dbItems.map(item => item.item.id);

    // Find items in database that are not in localStorage
    const staleItems = dbItems.filter(dbItem => !localItemIds.includes(dbItem.item.id));

    if (staleItems.length > 0) {
      // Remove stale items from database
      for (const staleItem of staleItems) {
        try {
          const response = await fetch(`${API_BASE_URL}/cart/items/${staleItem.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.error('Failed to remove stale item:', staleItem.item.id);
          }
        } catch (error) {
          console.error('Error removing stale item:', error);
        }
      }
    }
  } catch (error) {
    console.error('Database cleanup failed:', error);
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


// Get cart from localStorage (for immediate UI updates) with bulletproof global state
export const getLocalCart = () => {
  try {
    // BULLETPROOF: Use global state if available
    if (globalCartState && isCartInitialized) {
      return globalCartState;
    }

    // Read from localStorage
    const cart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    
    // BACKUP PROTECTION: If cart is empty but we have a backup, restore it
    if (cart.length === 0) {
      const backup = localStorage.getItem('customerCart_backup');
      if (backup) {
        try {
          const backupCart = JSON.parse(backup);
          if (backupCart.length > 0) {
            localStorage.setItem('customerCart', backup);
            globalCartState = backupCart;
            isCartInitialized = true;
            return backupCart;
          }
        } catch (e) {
          console.error('Failed to restore backup:', e);
        }
      }
    }
    
    // Remove any duplicate items by ID
    const uniqueCart = cart.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    // Update global state
    globalCartState = uniqueCart;
    isCartInitialized = true;
    
    // Create backup if we have items
    if (uniqueCart.length > 0) {
      localStorage.setItem('customerCart_backup', JSON.stringify(uniqueCart));
    }
    return uniqueCart;
  } catch (error) {
    console.error('❌ [GET LOCAL ERROR] Error reading local cart:', error);
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

// Sync cart to database (background operation) - SIMPLIFIED APPROACH
const syncCartToDatabase = async (customerId, cartItems) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return; // Skip if not authenticated
    }
    
    // SIMPLIFIED: Only add/update items, NEVER remove items
    
    // Get current database cart
    const dbCart = await getCustomerCart(customerId);
    const existingItems = dbCart.data?.items || [];
    
    // Create a map of existing items for quick lookup
    const existingItemsMap = new Map();
    existingItems.forEach(cartItem => {
      existingItemsMap.set(cartItem.item.id, cartItem);
    });
    
    // Process each cart item - ONLY ADD OR UPDATE, NEVER REMOVE
    for (const item of cartItems) {
      const existingItem = existingItemsMap.get(item.id);
      
      if (existingItem) {
        // Update existing item if quantity changed
        if (existingItem.quantity !== item.quantity) {
          const response = await fetch(`${API_BASE_URL}/cart/items/${existingItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ quantity: item.quantity }),
          });
          
          if (!response.ok) {
            console.error('Failed to update item:', response.status, response.statusText);
          }
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/cart/${customerId}/items`, {
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
        
        if (!response.ok) {
          console.error('Failed to add item:', response.status, response.statusText);
        }
      }
    }
    
    // SIMPLIFIED: NO REMOVAL LOGIC - Never remove items from database
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
export const initializeCartFromDatabase = async (customerId, overwriteLocalStorage = false) => {
  try {
    const dbCart = await getCustomerCart(customerId);
    
    if (dbCart.success && dbCart.data?.items) {
      // Transform database cart items to match localStorage format
      const transformedItems = dbCart.data.items.map(cartItem => ({
        id: cartItem.item.id,
        name: cartItem.item.itemName,
        price: parseFloat(cartItem.unitPrice),
        sellingPrice: parseFloat(cartItem.unitPrice), // Add new field for consistency
        stock: cartItem.item.quantity,
        itemCode: cartItem.item.itemCode,
        modelNo: cartItem.item.modelNo,
        vendor: cartItem.item.vendor,
        description: cartItem.item.description,
        unit: cartItem.item.unit?.name || 'pcs',
        quantity: cartItem.quantity,
        category: cartItem.item.category?.name || null,
        subcategory: cartItem.item.subcategory?.name || null
      }));
      
      // Only update localStorage if explicitly requested (not during sync operations)
      if (overwriteLocalStorage) {
        localStorage.setItem('customerCart', JSON.stringify(transformedItems));
      }
      return transformedItems;
    }
    
    return [];
  } catch (error) {
    console.error('Error initializing cart from database:', error);
    const fallbackCart = getLocalCart();
    return fallbackCart; // Fallback to localStorage
  }
};

