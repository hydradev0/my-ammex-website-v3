import { API_BASE_URL } from '../utils/apiConfig';

// Get real daily dashboard metrics from API
export const getDailyDashboardMetrics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/daily-metrics`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Dashboard metrics request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch dashboard metrics');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    // Fallback to mock data if API fails
    return dashboardData;
  }
};


// Get inventory alerts from API
export const getInventoryAlerts = async (severity = 'all') => {
  try {
    const url = new URL(`${API_BASE_URL}/dashboard/inventory-alerts`);
    if (severity && severity !== 'all') {
      url.searchParams.append('severity', severity);
    }

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Inventory alerts request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch inventory alerts');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    throw error;
  }
}; 