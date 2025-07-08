import { itemsData } from './itemsData';

export const inventoryAlertsData = itemsData
  .filter(item => item.quantity <= item.minLevel)
  .map((item, idx) => ({
    id: idx + 1,
    productName: item.itemName,
    sku: item.itemCode,
    currentStock: item.quantity,
    minimumStockLevel: item.minLevel,
    category: item.category,
    monthlySales: item.unitsSold,
    severity: item.quantity === 0 ? 'critical' : (item.quantity <= item.minLevel * 0.5 ? 'high' : 'medium'),
    status: 'active',
  }));