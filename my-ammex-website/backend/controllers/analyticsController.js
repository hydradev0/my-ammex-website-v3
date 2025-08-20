const { getModels } = require('../config/db');
const { Op } = require('sequelize');
const moment = require('moment');

// Analytics Controller
class AnalyticsController {
  // Get comprehensive analytics dashboard data
  async getDashboardAnalytics(req, res, next) {
    try {
      const [
        salesMetrics,
        inventoryMetrics,
        customerMetrics,
        predictions
      ] = await Promise.all([
        this.getSalesMetrics(),
        this.getInventoryMetrics(),
        this.getCustomerMetrics(),
        this.getPredictions()
      ]);

      res.json({
        success: true,
        data: {
          sales: salesMetrics,
          inventory: inventoryMetrics,
          customers: customerMetrics,
          predictions: predictions
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Sales Analytics
  async getSalesMetrics() {
    const { Order, OrderItem } = getModels();
    const now = moment();
    const lastMonth = moment().subtract(1, 'month');
    const last3Months = moment().subtract(3, 'months');

    // Get sales data using PostgreSQL
    const currentMonthOrders = await Order.findAll({
      where: {
        isActive: true, // Filter for active orders
        orderDate: {
          [Op.gte]: now.startOf('month').toDate()
        }
      },
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    const lastMonthOrders = await Order.findAll({
      where: {
        isActive: true, // Filter for active orders
        orderDate: {
          [Op.gte]: lastMonth.startOf('month').toDate(),
          [Op.lt]: now.startOf('month').toDate()
        }
      },
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    const last3MonthsOrders = await Order.findAll({
      where: {
        isActive: true, // Filter for active orders
        orderDate: {
          [Op.gte]: moment().subtract(3, 'months').toDate()
        }
      },
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    // Calculate metrics
    const currentMonthSales = currentMonthOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const lastMonthSales = lastMonthOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const last3MonthsSales = last3MonthsOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    const salesGrowth = lastMonthSales > 0 ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;
    const averageOrderValue = currentMonthOrders.length > 0 ? currentMonthSales / currentMonthOrders.length : 0;

    // Top selling items
    const itemSales = {};
    currentMonthOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!itemSales[item.itemId]) {
            itemSales[item.itemId] = { quantity: 0, revenue: 0 };
          }
          itemSales[item.itemId].quantity += item.quantity;
          itemSales[item.itemId].revenue += parseFloat(item.totalPrice);
        });
      }
    });

    const topItems = Object.entries(itemSales)
      .map(([itemId, data]) => ({
        itemId,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      currentMonthSales,
      lastMonthSales,
      salesGrowth,
      averageOrderValue,
      totalOrders: currentMonthOrders.length,
      topItems
    };
  }

      // Inventory Analytics
    async getInventoryMetrics() {
      const { Item } = getModels();
      const items = await Item.findAll({
        where: { isActive: true }
      });
      
      // Calculate inventory metrics
      const totalProducts = items.length;
      const totalStockValue = items.reduce((sum, item) => 
        sum + (parseFloat(item.price) * item.quantity), 0);
      
      // Low stock items
      const lowStockItems = items.filter(item => 
        item.quantity <= item.minLevel);
    
    // Stock turnover analysis
    const stockTurnover = await this.calculateStockTurnover();
    
    // AI-powered reorder recommendations
    const reorderRecommendations = await this.getReorderRecommendations();

    return {
      totalProducts,
      totalStockValue,
      lowStockItems: lowStockItems.length,
      stockTurnover,
      reorderRecommendations
    };
  }

  // Customer Analytics
  async getCustomerMetrics() {
    const { User, Order } = getModels();
    const now = moment();
    const lastMonth = moment().subtract(1, 'month');

    // Get customer data
    const customers = await User.findAll({
      where: { role: 'Sales Marketing' } // Match frontend role naming
    });

    const currentMonthOrders = await Order.findAll({
      where: {
        isActive: true, // Filter for active orders
        orderDate: {
          [Op.gte]: now.startOf('month').toDate()
        }
      }
    });

    // Customer segmentation
    const customerSegments = await this.segmentCustomers();
    
    // Customer lifetime value
    const customerLTV = await this.calculateCustomerLTV();

    return {
      totalCustomers: customers.length,
      activeCustomers: customerSegments.active,
      newCustomers: customerSegments.new,
      repeatCustomers: customerSegments.repeat,
      averageLTV: customerLTV.average,
      topCustomers: customerLTV.top
    };
  }

  // AI Predictions
  async getPredictions() {
    const salesForecast = await this.predictSales();
    const demandForecast = await this.predictDemand();
    const inventoryForecast = await this.predictInventoryNeeds();

    return {
      salesForecast,
      demandForecast,
      inventoryForecast
    };
  }

  // Sales prediction
  async predictSales() {
    const { Order } = getModels();
    const historicalData = await this.getHistoricalSalesData();
    
    // Simple linear regression for sales prediction
    const months = historicalData.length;
    if (months < 2) {
      return { forecast: 0, confidence: 0 };
    }

    const sumX = months * (months + 1) / 2;
    const sumY = historicalData.reduce((sum, data) => sum + data.sales, 0);
    const sumXY = historicalData.reduce((sum, data, index) => sum + (index + 1) * data.sales, 0);
    const sumX2 = months * (months + 1) * (2 * months + 1) / 6;

    const slope = (months * sumXY - sumX * sumY) / (months * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / months;

    const nextMonthForecast = slope * (months + 1) + intercept;
    const confidence = Math.max(0, Math.min(100, 85 - months * 2)); // Confidence decreases with less data

    return {
      forecast: Math.max(0, nextMonthForecast),
      confidence: Math.round(confidence),
      trend: slope > 0 ? 'increasing' : 'decreasing'
    };
  }

  // Demand prediction
  async predictDemand() {
    const { OrderItem, Item } = getModels();
    const historicalData = await OrderItem.findAll({
      include: [{
        model: Item,
        as: 'item'
      }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Group by item and calculate average demand
    const itemDemand = {};
    historicalData.forEach(item => {
      if (!itemDemand[item.itemId]) {
        itemDemand[item.itemId] = { totalQuantity: 0, count: 0 };
      }
      itemDemand[item.itemId].totalQuantity += item.quantity;
      itemDemand[item.itemId].count += 1;
    });

    const demandForecast = Object.entries(itemDemand).map(([itemId, data]) => ({
      itemId,
      averageDemand: Math.round(data.totalQuantity / data.count),
      confidence: Math.min(90, 50 + data.count * 2)
    }));

    return demandForecast;
  }

  // Inventory needs prediction
  async predictInventoryNeeds() {
    const { Item } = getModels();
    const items = await Item.findAll({
      where: { isActive: true }
    });

    const demandForecast = await this.predictDemand();
    const demandMap = {};
    demandForecast.forEach(item => {
      demandMap[item.itemId] = item.averageDemand;
    });

    const inventoryNeeds = items.map(item => {
      const predictedDemand = demandMap[item.id] || 0;
      const currentStock = item.quantity;
      const recommendedOrder = Math.max(0, predictedDemand - currentStock + item.minLevel);
      
      return {
        itemId: item.id,
        itemName: item.itemName,
        currentStock,
        predictedDemand,
        recommendedOrder,
        urgency: currentStock <= item.minLevel ? 'high' : 
                currentStock <= item.minLevel * 1.5 ? 'medium' : 'low'
      };
    });

    return inventoryNeeds;
  }

  // Customer segmentation
  async segmentCustomers() {
    const { User, Order } = getModels();
    const customers = await User.findAll({
      where: { role: 'Sales Marketing' }
    });

    const customerOrders = await Order.findAll({
      where: {
        isActive: true, // Filter for active orders
        orderDate: {
          [Op.gte]: moment().subtract(12, 'months').toDate()
        }
      }
    });

    // Simple segmentation based on order frequency
    const customerOrderCount = {};
    customerOrders.forEach(order => {
      if (!customerOrderCount[order.customerId]) {
        customerOrderCount[order.customerId] = 0;
      }
      customerOrderCount[order.customerId]++;
    });

    const segments = {
      active: 0,
      new: 0,
      repeat: 0
    };

    customers.forEach(customer => {
      const orderCount = customerOrderCount[customer.id] || 0;
      if (orderCount >= 5) segments.active++;
      else if (orderCount >= 2) segments.repeat++;
      else if (orderCount >= 1) segments.new++;
    });

    return segments;
  }

  // Customer lifetime value
  async calculateCustomerLTV() {
    const { Order } = getModels();
    const customerOrders = await Order.findAll({
      where: {
        isActive: true, // Filter for active orders
        orderDate: {
          [Op.gte]: moment().subtract(12, 'months').toDate()
        }
      }
    });

    const customerRevenue = {};
    customerOrders.forEach(order => {
      if (!customerRevenue[order.customerId]) {
        customerRevenue[order.customerId] = 0;
      }
      customerRevenue[order.customerId] += parseFloat(order.totalAmount);
    });

    const ltvValues = Object.values(customerRevenue);
    const averageLTV = ltvValues.length > 0 ? 
      ltvValues.reduce((sum, ltv) => sum + ltv, 0) / ltvValues.length : 0;

    const topCustomers = Object.entries(customerRevenue)
      .map(([customerId, ltv]) => ({ customerId, ltv }))
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 10);

    return {
      average: Math.round(averageLTV * 100) / 100,
      top: topCustomers
    };
  }

  // Stock turnover analysis
  async calculateStockTurnover() {
    const { Item, OrderItem } = getModels();
    const items = await Item.findAll({
      where: { isActive: true }
    });

    const orderItems = await OrderItem.findAll({
      include: [{
        model: Item,
        as: 'item'
      }],
      where: {
        isActive: true, // Filter for active orders
        createdAt: {
          [Op.gte]: moment().subtract(12, 'months').toDate()
        }
      }
    });

    const itemSales = {};
    orderItems.forEach(item => {
      if (!itemSales[item.itemId]) {
        itemSales[item.itemId] = 0;
      }
      itemSales[item.itemId] += item.quantity;
    });

    const turnoverRates = items.map(item => {
      const annualSales = itemSales[item.id] || 0;
      const averageInventory = item.quantity;
      const turnoverRate = averageInventory > 0 ? annualSales / averageInventory : 0;

      return {
        itemId: item.id,
        itemName: item.itemName,
        annualSales,
        averageInventory,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        category: turnoverRate > 12 ? 'high' : 
                 turnoverRate > 6 ? 'medium' : 'low'
      };
    });

    return turnoverRates;
  }

  // Reorder recommendations
  async getReorderRecommendations() {
    const { Item } = getModels();
    const items = await Item.findAll({
      where: { isActive: true }
    });

    const recommendations = items
      .filter(item => item.quantity <= item.minLevel)
      .map(item => {
        const recommendedQuantity = item.maxLevel - item.quantity;
        const urgency = item.quantity === 0 ? 'critical' : 
                       item.quantity <= item.minLevel * 0.5 ? 'high' : 'medium';

        return {
          itemId: item.id,
          itemName: item.itemName,
          currentStock: item.quantity,
          minLevel: item.minLevel,
          maxLevel: item.maxLevel,
          recommendedQuantity: Math.max(0, recommendedQuantity),
          urgency,
          estimatedCost: Math.round(recommendedQuantity * parseFloat(item.price) * 100) / 100
        };
      })
      .sort((a, b) => {
        const urgencyOrder = { critical: 3, high: 2, medium: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });

    return recommendations;
  }

  // Get historical sales data
  async getHistoricalSalesData() {
    const { Order } = getModels();
    const months = 12;
    const historicalData = [];

    for (let i = months - 1; i >= 0; i--) {
      const startDate = moment().subtract(i, 'months').startOf('month');
      const endDate = moment().subtract(i, 'months').endOf('month');

      const orders = await Order.findAll({
        where: {
          isActive: true, // Filter for active orders
          orderDate: {
            [Op.between]: [startDate.toDate(), endDate.toDate()]
          }
        }
      });

      const monthlySales = orders.reduce((sum, order) => 
        sum + parseFloat(order.totalAmount), 0);

      historicalData.push({
        month: startDate.format('YYYY-MM'),
        sales: monthlySales,
        orders: orders.length
      });
    }

    return historicalData;
  }
}

// Create instance and export methods
const analyticsController = new AnalyticsController();

module.exports = analyticsController; 