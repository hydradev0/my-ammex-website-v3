import { inventoryAlertsData } from '../data/inventoryAlertsData';

// This function will be replaced with actual API call later
export const getInventoryAlerts = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For now, return mock data
  return inventoryAlertsData.map(alert => ({
    ...alert,
    severity: calculateSeverity(alert.currentStock, alert.minimumStockLevel),
    status: calculateStatus(alert.currentStock, alert.minimumStockLevel)
  }));
};

const calculateSeverity = (currentStock, minimumStockLevel) => {
  if (currentStock === 0) return 'critical';
  if (currentStock <= minimumStockLevel * 0.3) return 'critical';
  if (currentStock <= minimumStockLevel * 0.5) return 'high';
  if (currentStock <= minimumStockLevel) return 'medium';
  return 'low';
};

const calculateStatus = (currentStock, minimumStockLevel) => {
  return currentStock < minimumStockLevel ? 'active' : 'resolved';
}; 