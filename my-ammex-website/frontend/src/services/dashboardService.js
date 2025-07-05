import { dashboardData } from '../data/dashboardData';

// This function will be replaced with actual API call later
export const getDashboardMetrics = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return mock data
  return dashboardData;
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