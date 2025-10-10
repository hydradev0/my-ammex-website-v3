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
          COALESCE(SUM(quantity * price), 0) as total_stock_value
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
          COALESCE(SUM(quantity * price), 0) as total_stock_value
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
}

module.exports = new DashboardController();
