import { apiCall } from '../utils/apiConfig';


// ==================== ITEMS API ====================

export const getItems = async (params = {}) => {
  const queryParams = new URLSearchParams();

  // Only append if provided; let caller control page size
  if (params.limit) queryParams.append('limit', params.limit);

  if (params.page) queryParams.append('page', params.page);
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

export const updateItemStock = async (id, { quantity, adjustmentType }) => {
  return await apiCall(`/items/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity, adjustmentType }),
  });
};

export const updateItemPrice = async (id, { sellingPrice, supplierPrice, markupPercentage, adjustmentType }) => { 
  return await apiCall(`/items/${id}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ sellingPrice, supplierPrice, markupPercentage, adjustmentType }),
  });
};

export const getPriceHistory = async (itemId) => {
  return await apiCall(`/items/${itemId}/price-history`);
};

export const getStockHistory = async (itemId) => {
  return await apiCall(`/items/${itemId}/stock-history`);
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

export const getSubcategories = async (categoryId) => {
  return await apiCall(`/categories/${categoryId}/subcategories`);
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

