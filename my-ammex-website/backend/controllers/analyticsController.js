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

    // Top selling products
    const productSales = {};
    currentMonthOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { quantity: 0, revenue: 0 };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += parseFloat(item.totalPrice);
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([productId, data]) => ({
        productId,
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
      topProducts
    };
  }

  // Inventory Analytics
  async getInventoryMetrics() {
    const { Product } = getModels();
    const products = await Product.findAll({
      where: { isActive: true }
    });
    
    // Calculate inventory metrics
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, product) => 
      sum + (parseFloat(product.price) * product.quantity), 0);
    
    // Low stock items
    const lowStockItems = products.filter(product => 
      product.quantity <= product.minLevel);
    
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
      where: { role: 'sales' } // Assuming sales users are customers
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
    const { OrderItem, Product } = getModels();
    const historicalData = await OrderItem.findAll({
      include: [{
        model: Product,
        as: 'product'
      }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Group by product and calculate average demand
    const productDemand = {};
    historicalData.forEach(item => {
      if (!productDemand[item.productId]) {
        productDemand[item.productId] = { totalQuantity: 0, count: 0 };
      }
      productDemand[item.productId].totalQuantity += item.quantity;
      productDemand[item.productId].count += 1;
    });

    const demandForecast = Object.entries(productDemand).map(([productId, data]) => ({
      productId,
      averageDemand: Math.round(data.totalQuantity / data.count),
      confidence: Math.min(90, 50 + data.count * 2)
    }));

    return demandForecast;
  }

  // Inventory needs prediction
  async predictInventoryNeeds() {
    const { Product } = getModels();
    const products = await Product.findAll({
      where: { isActive: true }
    });

    const demandForecast = await this.predictDemand();
    const demandMap = {};
    demandForecast.forEach(item => {
      demandMap[item.productId] = item.averageDemand;
    });

    const inventoryNeeds = products.map(product => {
      const predictedDemand = demandMap[product.id] || 0;
      const currentStock = product.quantity;
      const recommendedOrder = Math.max(0, predictedDemand - currentStock + product.minLevel);
      
      return {
        productId: product.id,
        productName: product.itemName,
        currentStock,
        predictedDemand,
        recommendedOrder,
        urgency: currentStock <= product.minLevel ? 'high' : 
                currentStock <= product.minLevel * 1.5 ? 'medium' : 'low'
      };
    });

    return inventoryNeeds;
  }

  // Customer segmentation
  async segmentCustomers() {
    const { User, Order } = getModels();
    const customers = await User.findAll({
      where: { role: 'sales' }
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
    const { Product, OrderItem } = getModels();
    const products = await Product.findAll({
      where: { isActive: true }
    });

    const orderItems = await OrderItem.findAll({
      include: [{
        model: Product,
        as: 'product'
      }],
      where: {
        isActive: true, // Filter for active orders
        createdAt: {
          [Op.gte]: moment().subtract(12, 'months').toDate()
        }
      }
    });

    const productSales = {};
    orderItems.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = 0;
      }
      productSales[item.productId] += item.quantity;
    });

    const turnoverRates = products.map(product => {
      const annualSales = productSales[product.id] || 0;
      const averageInventory = product.quantity;
      const turnoverRate = averageInventory > 0 ? annualSales / averageInventory : 0;

      return {
        productId: product.id,
        productName: product.itemName,
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
    const { Product } = getModels();
    const products = await Product.findAll({
      where: { isActive: true }
    });

    const recommendations = products
      .filter(product => product.quantity <= product.minLevel)
      .map(product => {
        const recommendedQuantity = product.maxLevel - product.quantity;
        const urgency = product.quantity === 0 ? 'critical' : 
                       product.quantity <= product.minLevel * 0.5 ? 'high' : 'medium';

        return {
          productId: product.id,
          productName: product.itemName,
          currentStock: product.quantity,
          minLevel: product.minLevel,
          maxLevel: product.maxLevel,
          recommendedQuantity: Math.max(0, recommendedQuantity),
          urgency,
          estimatedCost: Math.round(recommendedQuantity * parseFloat(product.price) * 100) / 100
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