import { API_BASE_URL, apiCall } from '../utils/apiConfig';

// ==================== CUSTOMERS API ====================

export const getCustomers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

  const queryString = queryParams.toString();
  const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;
  
  return await apiCall(endpoint);
};

export const getCustomerById = async (id, include = null) => {
  const queryParams = include ? `?include=${include}` : '';
  return await apiCall(`/customers/${id}${queryParams}`);
};

export const createCustomer = async (customerData) => {
  return await apiCall('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });
};

export const updateCustomer = async (id, customerData) => {
  return await apiCall(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  });
};

export const deleteCustomer = async (id) => {
  return await apiCall(`/customers/${id}`, {
    method: 'DELETE',
  });
};

export const getCustomerStats = async () => {
  return await apiCall('/customers/stats');
};

// Get the authenticated user's customer record
export const getMyCustomer = async () => {
  return await apiCall('/customers/me');
};
