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

// ==================== ACCOUNTS API ====================

export const getArchivedAccounts = async (params = {}) => {
  const { page = 1, limit = 10 } = params;
  
  try {
    const response = await apiCall(`/auth/users?includeInactive=true&page=${page}&limit=${limit}`);
    
    // Filter only inactive accounts from the response
    const inactiveAccounts = response.data?.filter(user => !user.isActive) || [];
    
    // Recalculate pagination for inactive accounts only
    const totalInactive = inactiveAccounts.length;
    const totalPages = Math.ceil(totalInactive / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAccounts = inactiveAccounts.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedAccounts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalInactive,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Error fetching archived accounts:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch archived accounts'
    };
  }
};

export const restoreAccount = async (accountId) => {
  try {
    const response = await apiCall(`/auth/users/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: true }),
    });

    return {
      success: true,
      data: response.data,
      message: 'Account restored successfully'
    };
  } catch (error) {
    console.error('Error restoring account:', error);
    return {
      success: false,
      message: error.message || 'Failed to restore account'
    };
  }
};
