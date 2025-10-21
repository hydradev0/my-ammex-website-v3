const { QueryTypes } = require('sequelize');
const { getSequelize } = require('../config/db');

class DashboardController {
  // Get daily dashboard metrics with today vs yesterday comparison
  async getDailyDashboardMetrics(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get today's sales metrics from Invoice table
      const todayMetrics = await getSequelize().query(`
        SELECT 
          COALESCE(SUM(i.total_amount), 0) as total_sales,
          COUNT(i.id) as total_orders,
          COALESCE(AVG(i.total_amount), 0) as avg_order_value,
          COUNT(DISTINCT i.customer_id) as unique_customers
        FROM "Invoice" i
        WHERE DATE(i.invoice_date) = :today
          AND i.status != 'rejected'
      `, { 
        replacements: { today },
        type: QueryTypes.SELECT 
      });

      // Get yesterday's sales metrics from Invoice table
      const yesterdayMetrics = await getSequelize().query(`
        SELECT 
          COALESCE(SUM(i.total_amount), 0) as total_sales,
          COUNT(i.id) as total_orders,
          COALESCE(AVG(i.total_amount), 0) as avg_order_value,
          COUNT(DISTINCT i.customer_id) as unique_customers
        FROM "Invoice" i
        WHERE DATE(i.invoice_date) = :yesterday
          AND i.status != 'rejected'
      `, { 
        replacements: { yesterday },
        type: QueryTypes.SELECT 
      });

      // Get pending orders count from Order table
      const pendingOrders = await getSequelize().query(`
        SELECT COUNT(*) as count
        FROM "Order" o
        WHERE o.status = 'pending'
      `, { type: QueryTypes.SELECT });

      // Get inventory metrics from Item table
      const inventoryMetrics = await getSequelize().query(`
        SELECT 
          COUNT(CASE WHEN quantity > 0 AND quantity < min_level THEN 1 END) as low_stock,
          COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN quantity <= min_level * 0.5 THEN 1 END) as reorder_pending,
          COALESCE(SUM(quantity * selling_price), 0) as total_stock_value
        FROM "Item"
        WHERE is_active = true
      `, { type: QueryTypes.SELECT });

      // Get customer metrics from Customer table
      const customerMetrics = await getSequelize().query(`
        SELECT 
          COUNT(*) as active_customers,
          COUNT(CASE WHEN DATE(created_at) = :today THEN 1 END) as new_signups_today
        FROM "Customer"
        WHERE is_active = true
      `, { 
        replacements: { today },
        type: QueryTypes.SELECT 
      });

      const todayData = todayMetrics[0];
      const yesterdayData = yesterdayMetrics[0];
      const pendingData = pendingOrders[0];
      const inventoryData = inventoryMetrics[0];
      const customerData = customerMetrics[0];

      // Calculate growth percentages
      const salesGrowth = yesterdayData.total_sales > 0 ? 
        ((todayData.total_sales - yesterdayData.total_sales) / yesterdayData.total_sales * 100) : 0;
      
      const ordersGrowth = yesterdayData.total_orders > 0 ? 
        ((todayData.total_orders - yesterdayData.total_orders) / yesterdayData.total_orders * 100) : 0;

      const metrics = {
        sales: {
          total: parseFloat(todayData.total_sales),
          averageOrderValue: parseFloat(todayData.avg_order_value),
          growth: Math.round(salesGrowth * 100) / 100
        },
        orders: {
          total: parseInt(todayData.total_orders),
          pending: parseInt(pendingData.count),
          growth: Math.round(ordersGrowth * 100) / 100
        },
        inventory: {
          lowStock: parseInt(inventoryData.low_stock),
          critical: parseInt(inventoryData.out_of_stock),
          totalStockValue: parseFloat(inventoryData.total_stock_value),
          outOfStock: parseInt(inventoryData.out_of_stock),
          reorderPending: parseInt(inventoryData.reorder_pending)
        },
        customers: {
          active: parseInt(customerData.active_customers),
          newSignups: parseInt(customerData.new_signups_today)
        },
        comparison: {
          yesterday: {
            sales: parseFloat(yesterdayData.total_sales),
            orders: parseInt(yesterdayData.total_orders)
          }
        }
      };

      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching daily dashboard metrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch daily dashboard metrics',
        details: error.message 
      });
    }
  }

  // Get basic dashboard metrics (fallback for older implementations)
  async getBasicDashboardMetrics(req, res) {
    try {
      // Get current month metrics from Invoice table
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const monthMetrics = await getSequelize().query(`
        SELECT 
          COALESCE(SUM(i.total_amount), 0) as total_sales,
          COUNT(i.id) as total_orders,
          COALESCE(AVG(i.total_amount), 0) as avg_order_value
        FROM "Invoice" i
        WHERE DATE(i.invoice_date) >= :monthStart
          AND i.status != 'rejected'
      `, { 
        replacements: { monthStart: monthStart.toISOString().split('T')[0] },
        type: QueryTypes.SELECT 
      });

      // Get pending orders
      const pendingOrders = await getSequelize().query(`
        SELECT COUNT(*) as count
        FROM "Order" o
        WHERE o.status = 'pending'
      `, { type: QueryTypes.SELECT });

      // Get inventory metrics
      const inventoryMetrics = await getSequelize().query(`
        SELECT 
          COUNT(CASE WHEN quantity > 0 AND quantity < min_level THEN 1 END) as low_stock,
          COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock,
          COALESCE(SUM(quantity * selling_price), 0) as total_stock_value
        FROM "Item"
        WHERE is_active = true
      `, { type: QueryTypes.SELECT });

      // Get customer metrics
      const customerMetrics = await getSequelize().query(`
        SELECT COUNT(*) as active_customers
        FROM "Customer"
        WHERE is_active = true
      `, { type: QueryTypes.SELECT });

      const monthData = monthMetrics[0];
      const pendingData = pendingOrders[0];
      const inventoryData = inventoryMetrics[0];
      const customerData = customerMetrics[0];

      const metrics = {
        sales: {
          total: parseFloat(monthData.total_sales),
          averageOrderValue: parseFloat(monthData.avg_order_value)
        },
        orders: {
          total: parseInt(monthData.total_orders),
          pending: parseInt(pendingData.count)
        },
        inventory: {
          lowStock: parseInt(inventoryData.low_stock),
          critical: parseInt(inventoryData.out_of_stock),
          totalStockValue: parseFloat(inventoryData.total_stock_value),
          outOfStock: parseInt(inventoryData.out_of_stock)
        },
        customers: {
          active: parseInt(customerData.active_customers)
        }
      };

      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching basic dashboard metrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch basic dashboard metrics',
        details: error.message 
      });
    }
  }

  // Get inventory alerts - items with low stock or overstock
  async getInventoryAlerts(req, res) {
    try {
      const { severity, type } = req.query; // type: 'all', 'low_stock', 'overstock'; severity: 'all', 'critical', 'high', 'medium'

      // Build severity condition for low stock alerts
      let lowStockSeverityCondition = '';
      if (severity && severity !== 'all') {
        if (severity === 'critical') {
          lowStockSeverityCondition = 'AND i.quantity = 0';
        } else if (severity === 'high') {
          lowStockSeverityCondition = 'AND i.quantity > 0 AND i.quantity <= (i.min_level * 0.3)';
        } else if (severity === 'medium') {
          lowStockSeverityCondition = 'AND i.quantity > (i.min_level * 0.3) AND i.quantity <= i.min_level';
        }
      }

      // Build severity condition for overstock alerts
      let overstockSeverityCondition = '';
      if (severity && severity !== 'all') {
        if (severity === 'critical') {
          overstockSeverityCondition = 'AND i.quantity >= (i.max_level * 1.5)';
        } else if (severity === 'high') {
          overstockSeverityCondition = 'AND i.quantity >= (i.max_level * 1.25) AND i.quantity < (i.max_level * 1.5)';
        } else if (severity === 'medium') {
          overstockSeverityCondition = 'AND i.quantity >= i.max_level AND i.quantity < (i.max_level * 1.25)';
        }
      }

      let lowStockAlerts = [];
      let overstockAlerts = [];

      // Fetch low stock alerts if type is 'all' or 'low_stock'
      if (!type || type === 'all' || type === 'low_stock') {
        lowStockAlerts = await getSequelize().query(`
          SELECT 
            i.id,
            i.item_code as "itemCode",
            i.model_no as "modelNo",
            i.vendor,
            i.quantity as "currentStock",
            i.min_level as "minimumStockLevel",
            i.max_level as "maximumStockLevel",
            i.selling_price as "price",
            c.name as "categoryName",
            u.name as "unitName",
            CASE 
              WHEN i.quantity = 0 THEN 'critical'
              WHEN i.quantity <= (i.min_level * 0.3) THEN 'high'
              WHEN i.quantity <= (i.min_level * 0.5) THEN 'high'
              WHEN i.quantity <= i.min_level THEN 'medium'
              ELSE 'low'
            END as severity,
            'low_stock' as "alertType",
            CASE 
              WHEN i.quantity = 0 THEN 'OUT OF STOCK: Immediate reordering required'
              WHEN i.quantity <= (i.min_level * 0.3) THEN 'CRITICALLY LOW: Only ' || i.quantity || ' units remaining'
              WHEN i.quantity <= (i.min_level * 0.5) THEN 'VERY LOW STOCK: ' || i.quantity || ' units remaining'
              ELSE 'LOW STOCK: Below minimum level of ' || i.min_level || ' units'
            END as message,
            (i.min_level - i.quantity) as "reorderAmount",
            'active' as status,
            i.created_at as "createdAt",
            i.updated_at as "updatedAt"
          FROM "Item" i
          LEFT JOIN "Category" c ON i.category_id = c.id
          LEFT JOIN "Unit" u ON i.unit_id = u.id
          WHERE i.is_active = true 
            AND i.quantity <= i.min_level
            ${lowStockSeverityCondition}
          ORDER BY 
            CASE 
              WHEN i.quantity = 0 THEN 1
              WHEN i.quantity <= (i.min_level * 0.3) THEN 2
              WHEN i.quantity <= (i.min_level * 0.5) THEN 3
              ELSE 4
            END,
            i.quantity ASC
        `, { 
          type: QueryTypes.SELECT 
        });
      }

      // Fetch overstock alerts if type is 'all' or 'overstock'
      if (!type || type === 'all' || type === 'overstock') {
        overstockAlerts = await getSequelize().query(`
          SELECT 
            i.id,
            i.item_code as "itemCode",
            i.model_no as "modelNo",
            i.vendor,
            i.quantity as "currentStock",
            i.min_level as "minimumStockLevel",
            i.max_level as "maximumStockLevel",
            i.selling_price as "price",
            c.name as "categoryName",
            u.name as "unitName",
            CASE 
              WHEN i.quantity >= (i.max_level * 1.5) THEN 'critical'
              WHEN i.quantity >= (i.max_level * 1.25) THEN 'high'
              WHEN i.quantity >= i.max_level THEN 'medium'
              ELSE 'low'
            END as severity,
            'overstock' as "alertType",
            CASE 
              WHEN i.quantity >= (i.max_level * 1.5) THEN 'CRITICAL OVERSTOCK: ' || (i.quantity - i.max_level) || ' units over maximum'
              WHEN i.quantity >= (i.max_level * 1.25) THEN 'HIGH OVERSTOCK: ' || (i.quantity - i.max_level) || ' units excess'
              ELSE 'OVERSTOCK: At or above maximum level of ' || i.max_level || ' units'
            END as message,
            (i.quantity - i.max_level) as "excessAmount",
            'active' as status,
            i.created_at as "createdAt",
            i.updated_at as "updatedAt"
          FROM "Item" i
          LEFT JOIN "Category" c ON i.category_id = c.id
          LEFT JOIN "Unit" u ON i.unit_id = u.id
          WHERE i.is_active = true 
            AND i.max_level > 0
            AND i.quantity >= i.max_level
            ${overstockSeverityCondition}
          ORDER BY 
            CASE 
              WHEN i.quantity >= (i.max_level * 1.5) THEN 1
              WHEN i.quantity >= (i.max_level * 1.25) THEN 2
              ELSE 3
            END,
            i.quantity DESC
        `, { 
          type: QueryTypes.SELECT 
        });
      }

      res.json({ 
        success: true, 
        data: {
          lowStock: lowStockAlerts,
          overstock: overstockAlerts,
          lowStockCount: lowStockAlerts.length,
          overstockCount: overstockAlerts.length,
          totalCount: lowStockAlerts.length + overstockAlerts.length
        }
      });
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch inventory alerts',
        details: error.message 
      });
    }
  }
}

module.exports = new DashboardController();
