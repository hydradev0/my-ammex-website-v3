import { inventoryAlertsData } from './inventoryAlertsData';

// Calculate inventory counts from inventoryAlertsData
const calculateInventoryCounts = () => {
  const lowStock = inventoryAlertsData.filter(item => 
    item.currentStock > 0 && item.currentStock < item.minimumStockLevel
  ).length;
  
  const critical = inventoryAlertsData.filter(item => 
    item.currentStock === 0
  ).length;

  return { lowStock, critical };
};

// Mock data for dashboard
export const dashboardData = {
  sales: {
    total: 7650,
    averageOrderValue: 450,
  },
  orders: {
    total: 17,
    pending: 5,
    completed: 12
  },
  inventory: calculateInventoryCounts(),
  customers: {
    active: 17,
    newSignups: 3,
    repeatCustomers: 14
  }
};

// Helper function to get formatted metrics for Dashboard
export const getFormattedDashboardMetrics = () => {
  return {
    sales: {
      value: `₱${dashboardData.sales.total.toLocaleString()}`,
      change: dashboardData.sales.todayVsYesterday,
      topProduct: dashboardData.sales.topSellingProduct,
      topProductSales: dashboardData.sales.topSellingProductSales,
      averageOrderValue: `₱${dashboardData.sales.averageOrderValue.toLocaleString()}`
    },
    orders: {
      total: dashboardData.orders.total,
      pending: dashboardData.orders.pending,
      completed: dashboardData.orders.completed
    },
    inventory: {
      lowStock: dashboardData.inventory.lowStock,
      critical: dashboardData.inventory.critical
    },
    customers: {
      active: dashboardData.customers.active,
      newSignups: dashboardData.customers.newSignups,
      repeatCustomers: dashboardData.customers.repeatCustomers
    }
  };
}; 