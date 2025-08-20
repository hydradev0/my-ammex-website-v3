const API_BASE_URL = 'http://localhost:5000/api';

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
