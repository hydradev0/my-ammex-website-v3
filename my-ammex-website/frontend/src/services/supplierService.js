const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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





