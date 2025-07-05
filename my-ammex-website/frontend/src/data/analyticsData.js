// Mock data for analytics
export const analyticsData = {
  monthlySales: [
    { month: 'Jan', sales: 15000 },
    { month: 'Feb', sales: 18000 },
    { month: 'Mar', sales: 22000 },
    { month: 'Apr', sales: 19000 },
    { month: 'May', sales: 25000 },
    { month: 'Jun', sales: 28000 }
  ],
  topProducts: [
    { 
      name: 'Drill', 
      sales: 120,
      revenue: 125000,
      growth: 15
    },
    { 
      name: 'Wrenches', 
      sales: 95,
      revenue: 98500,
      growth: 8
    },
    { 
      name: 'Grinder', 
      sales: 85,
      revenue: 75200,
      growth: -3
    }
  ],
  profitMargin: 0.35,
  customerMetrics: {
    totalCustomers: 250,
    repeatCustomers: 180,
    averageOrderValue: 450,
    previousMonthOrderValue: 420,
    previousMonthOrders: 280
  }
};

// Helper function to get formatted metrics for Analytics page
export const getFormattedMetrics = () => {
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