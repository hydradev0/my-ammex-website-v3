// Role-based metrics cards configuration
// Each role gets 2-4 cards as requested

export const roleMetrics = {
  admin: {
    name: 'Admin',
    cards: [
      'Today\'s Sales',
      'Today\'s Orders', 
      'Low Stock Items',
      'Today\'s Customers'
    ]
  },
  sales: {
    name: 'Sales User',
    cards: [
      'Today\'s Sales',
      'Today\'s Orders',
      'Today\'s Customers'
    ]
  },
  logistics: {
    name: 'Logistics User',
    cards: [
      'Low Stock Items',
      'Total Stock Value',
      'Out of Stock Items',
      'Reorder Pending'
    ]
  },
};

// Get current user role (in production, this would come from auth context/JWT)
export const getCurrentUserRole = () => {
  // For demo purposes, you can change this to test different roles
  // In production, this would come from your authentication system
  return localStorage.getItem('userRole') || 'admin';
};

// Get metrics cards for current user role
export const getMetricsCardsForRole = (role = null) => {
  const userRole = role || getCurrentUserRole();
  return roleMetrics[userRole]?.cards || roleMetrics.admin.cards;
};

// Get role name
export const getRoleName = (role = null) => {
  const userRole = role || getCurrentUserRole();
  return roleMetrics[userRole]?.name || 'Admin';
};

// Set user role (for demo/testing purposes)
export const setUserRole = (role) => {
  if (roleMetrics[role]) {
    localStorage.setItem('userRole', role);
    return true;
  }
  return false;
}; 