const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get all items with pagination for discount management
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.category - Category filter (optional)
 * @param {string} params.search - Search term (optional)
 * @returns {Promise<Object>} Response with items and pagination
 */
export const getItemsForDiscount = async ({ page = 1, limit = 12, category, search } = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (category && category !== 'all') {
      params.append('category', category);
    }

    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    const response = await fetch(`${API_BASE_URL}/discounts/items?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch items');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching items for discount:', error);
    throw error;
  }
};

/**
 * Get all currently discounted products
 * @returns {Promise<Object>} Response with discounted products
 */
export const getDiscountedProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts/active`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch discounted products');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching discounted products:', error);
    throw error;
  }
};

/**
 * Apply discount to products
 * @param {Object} discountData - Discount data
 * @param {number[]} discountData.productIds - Array of product IDs
 * @param {number} discountData.discountPercentage - Discount percentage (1-100)
 * @param {string} discountData.startDate - Start date (optional)
 * @param {string} discountData.endDate - End date (optional)
 * @returns {Promise<Object>} Response with success message
 */
export const applyDiscount = async ({ productIds, discountPercentage, startDate, endDate }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productIds,
        discountPercentage: parseFloat(discountPercentage),
        startDate: startDate || null,
        endDate: endDate || null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to apply discount');
    }

    return await response.json();
  } catch (error) {
    console.error('Error applying discount:', error);
    throw error;
  }
};

/**
 * Remove discount from a product
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Response with success message
 */
export const removeDiscount = async (productId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove discount');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing discount:', error);
    throw error;
  }
};

/**
 * Update discount for a product
 * @param {Object} discountData - Discount data
 * @param {number} discountData.productId - Product ID
 * @param {number} discountData.discountPercentage - Discount percentage (1-100)
 * @param {string} discountData.startDate - Start date (optional)
 * @param {string} discountData.endDate - End date (optional)
 * @returns {Promise<Object>} Response with success message
 */
export const updateDiscount = async ({ productId, discountPercentage, startDate, endDate }) => {
  try {
    // Use applyDiscount endpoint which handles deactivating old and creating new
    const response = await fetch(`${API_BASE_URL}/discounts/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productIds: [productId],
        discountPercentage: parseFloat(discountPercentage),
        startDate: startDate || null,
        endDate: endDate || null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update discount');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating discount:', error);
    throw error;
  }
};

/**
 * Get discount settings (max discount, tiers, etc.)
 * @returns {Promise<Object>} Response with discount settings
 */
export const getDiscountSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts/settings`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch discount settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching discount settings:', error);
    throw error;
  }
};

