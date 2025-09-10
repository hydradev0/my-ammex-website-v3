const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Import for legacy support (will be removed when API is ready)
import { inventoryAlertsData } from '../data/inventoryAlertsData';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// ==================== ITEMS API ====================

export const getItems = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.category) queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const endpoint = `/items${queryString ? `?${queryString}` : ''}`;
  
  return await apiCall(endpoint);
};

export const getItemById = async (id) => {
  return await apiCall(`/items/${id}`);
};

export const createItem = async (itemData) => {
  return await apiCall('/items', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
};

export const updateItem = async (id, itemData) => {
  return await apiCall(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  });
};

export const deleteItem = async (id) => {
  return await apiCall(`/items/${id}`, {
    method: 'DELETE',
  });
};

export const getArchivedItems = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const endpoint = `/items/archived${queryString ? `?${queryString}` : ''}`;
  return await apiCall(endpoint);
};

export const restoreItem = async (id) => {
  return await apiCall(`/items/${id}/restore`, {
    method: 'POST',
  });
};

export const getLowStockItems = async () => {
  return await apiCall('/items/low-stock');
};

export const updateItemStock = async (id, quantity) => {
  return await apiCall(`/items/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
};

export const updateItemPrice = async (id, price, reason) => { 
  return await apiCall(`/items/${id}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ price, reason }),
  });
};

// ==================== CATEGORIES API ====================

export const getCategories = async () => {
  return await apiCall('/categories');
};

export const getCategoryById = async (id, include = null) => {
  const queryParams = include ? `?include=${include}` : '';
  return await apiCall(`/categories/${id}${queryParams}`);
};

export const createCategory = async (categoryData) => {
  return await apiCall('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};

export const updateCategory = async (id, categoryData) => {
  return await apiCall(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  });
};

export const deleteCategory = async (id) => {
  return await apiCall(`/categories/${id}`, {
    method: 'DELETE',
  });
};

// ==================== UNITS API ====================

export const getUnits = async () => {
  return await apiCall('/units');
};

export const getUnitById = async (id, include = null) => {
  const queryParams = include ? `?include=${include}` : '';
  return await apiCall(`/units/${id}${queryParams}`);
};

export const createUnit = async (unitData) => {
  return await apiCall('/units', {
    method: 'POST',
    body: JSON.stringify(unitData),
  });
};

export const updateUnit = async (id, unitData) => {
  return await apiCall(`/units/${id}`, {
    method: 'PUT',
    body: JSON.stringify(unitData),
  });
};

export const deleteUnit = async (id) => {
  return await apiCall(`/units/${id}`, {
    method: 'DELETE',
  });
};

// ==================== INVENTORY ALERTS (Legacy Support) ====================

// Import moved to top of file
// import { inventoryAlertsData } from '../data/inventoryAlertsData';

// This function will be replaced with actual API call later
export const getInventoryAlerts = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return mock data
  return inventoryAlertsData.map(alert => ({
    ...alert,
    severity: calculateSeverity(alert.currentStock, alert.minimumStockLevel),
    status: calculateStatus(alert.currentStock, alert.minimumStockLevel)
  }));
};

const calculateSeverity = (currentStock, minimumStockLevel) => {
  if (currentStock === 0) return 'critical';
  if (currentStock <= minimumStockLevel * 0.3) return 'critical';
  if (currentStock <= minimumStockLevel * 0.5) return 'high';
  if (currentStock <= minimumStockLevel) return 'medium';
  return 'low';
};

const calculateStatus = (currentStock, minimumStockLevel) => {
  return currentStock < minimumStockLevel ? 'active' : 'resolved';
}; 