import { analyticsData } from '../data/analyticsData';

// This function will be replaced with actual API call later
export const getAnalyticsMetrics = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return mock data
  const currentMonth = analyticsData.monthlySales[analyticsData.monthlySales.length - 1];
  const previousMonth = analyticsData.monthlySales[analyticsData.monthlySales.length - 2];

  const calculatePercentageChange = (current, previous) => {
    if (!previous) return 0;
    return Number(((current - previous) / previous) * 100);
  };

  // Calculate total orders from top products
  const currentOrders = analyticsData.topProducts.reduce((sum, product) => sum + product.sales, 0);
  const previousOrders = analyticsData.customerMetrics.previousMonthOrders;

  return {
    profit: {
      value: `₱${(currentMonth.sales * analyticsData.profitMargin).toLocaleString()}`,
      previousMonth: `₱${(previousMonth.sales * analyticsData.profitMargin).toLocaleString()}`,
      percentageChange: calculatePercentageChange(
        currentMonth.sales * analyticsData.profitMargin,
        previousMonth.sales * analyticsData.profitMargin
      )
    },
    averageOrderValue: {
      value: `₱${analyticsData.customerMetrics.averageOrderValue.toLocaleString()}`,
      previousMonth: `₱${analyticsData.customerMetrics.previousMonthOrderValue.toLocaleString()}`,
      percentageChange: calculatePercentageChange(
        analyticsData.customerMetrics.averageOrderValue,
        analyticsData.customerMetrics.previousMonthOrderValue
      )
    },
    orders: {
      value: `${currentOrders} Orders`,
      previousMonth: `${previousOrders} Orders`,
      percentageChange: calculatePercentageChange(currentOrders, previousOrders)
    }
  };
};

// This function will be replaced with actual API call later
export const getSalesData = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return mock data
  return {
    monthlySales: analyticsData.monthlySales,
    topProducts: analyticsData.topProducts
  };
};

// This function will be replaced with actual API call later
export const getInventoryAnalytics = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return mock data
  return {
    stockLevels: analyticsData.stockLevels,
    stockValue: analyticsData.stockValue,
    lowStockItems: analyticsData.lowStockItems
  };
};

// This function will be replaced with actual API call later
export const getCustomerAnalytics = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return mock data
  return analyticsData.customerMetrics;
};

// This function will be replaced with actual API call later
export const getCartInsights = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return mock data
  return analyticsData.cartInsights;
}; 