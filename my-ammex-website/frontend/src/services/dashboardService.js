import { API_BASE_URL } from '../utils/apiConfig';
import { dashboardData } from '../data/dashboardData';

// Get real daily dashboard metrics from API
export const getDashboardMetrics = async () => {
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

// This function will be replaced with actual API call later
export const getSalesMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dashboardData.sales;
};

// This function will be replaced with actual API call later
export const getOrderMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dashboardData.orders;
};

// This function will be replaced with actual API call later
export const getInventoryMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dashboardData.inventory;
};

// This function will be replaced with actual API call later
export const getCustomerMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dashboardData.customers;
}; 