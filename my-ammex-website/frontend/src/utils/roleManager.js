// Role-based metrics cards configuration
// Each role gets 2-4 cards as requested

export const roleMetrics = {
  'Admin': {
    name: 'Administrator',
    cards: [
      'Today\'s Sales',
      'Today\'s Orders', 
      'Low Stock Items',
      'Out of Stock Items'
    ]
  },
  'Sales Marketing': {
    name: 'Sales Marketing',
    cards: [
      'Today\'s Sales',
      'Today\'s Orders',
    ]
  },
  'Warehouse Supervisor': {
    name: 'Warehouse Supervisor',
    cards: [
      'Low Stock Items',
      'Total Stock Value',
      'Out of Stock Items',
    ]
  },
};

// Get metrics cards for current user role
export const getMetricsCardsForRole = (role) => {
  return roleMetrics[role]?.cards || roleMetrics['Admin'].cards;
};

// Get role name
export const getRoleName = (role) => {
  return roleMetrics[role]?.name || 'Administrator';
};

// Check if user has access to inventory alerts
export const hasInventoryAlertsAccess = (role) => {
  return ['Admin', 'Warehouse Supervisor'].includes(role);
};

// Check if user has access to daily comparison
export const hasDailyComparisonAccess = (role) => {
  return ['Admin', 'Sales Marketing', 'Warehouse Supervisor'].includes(role);
}; 

// Analytics metrics cards configuration
export const analyticsRoleMetrics = {
  'Admin': {
    cards: ['Monthly Profit', 'Average Order Value', 'Monthly Orders','Inventory Growth Rate']
  },
  'Sales Marketing': {
    cards: ['Monthly Profit', 'Average Order Value', 'Monthly Orders']
  },
  'Warehouse Supervisor': {
    cards: ['Monthly Fast Moving Items', 'Monthly Slow Moving Items', 'Inventory Growth Rate']
  },
};

// Get analytics metrics cards for current user role
export const getAnalyticsCardsForRole = (role) => {
  return analyticsRoleMetrics[role]?.cards || analyticsRoleMetrics['Admin'].cards;
};