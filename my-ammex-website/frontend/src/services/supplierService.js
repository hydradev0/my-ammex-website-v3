import {  apiCall } from '../utils/apiConfig';


// ==================== SUPPLIERS API ====================

export const getSuppliers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

  const queryString = queryParams.toString();
  const endpoint = `/suppliers${queryString ? `?${queryString}` : ''}`;
  
  return await apiCall(endpoint);
};

export const getSupplierById = async (id, include = null) => {
  const queryParams = include ? `?include=${include}` : '';
  return await apiCall(`/suppliers/${id}${queryParams}`);
};

export const createSupplier = async (supplierData) => {
  return await apiCall('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplierData),
  });
};

export const updateSupplier = async (id, supplierData) => {
  return await apiCall(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplierData),
  });
};

export const deleteSupplier = async (id) => {
  return await apiCall(`/suppliers/${id}`, {
    method: 'DELETE',
  });
};

export const getSupplierStats = async () => {
  return await apiCall('/suppliers/stats');
};

// Get archived suppliers
export const getArchivedSuppliers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const endpoint = `/suppliers/archived/list${queryString ? `?${queryString}` : ''}`;
  
  return await apiCall(endpoint);
};

// Restore supplier
export const restoreSupplier = async (id) => {
  return await apiCall(`/suppliers/${id}/restore`, {
    method: 'PUT',
  });
};





