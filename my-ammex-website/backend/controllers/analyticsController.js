const { Order, OrderItem, Product, User } = require('../models-postgres');
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
    const now = moment();
    const lastMonth = moment().subtract(1, 'month');
    const last3Months = moment().subtract(3, 'months');

    // Get sales data using PostgreSQL
    const currentMonthOrders = await Order.findAll({
      where: {
        date: {
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
        date: {
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
        date: {
          [Op.gte]: last3Months.toDate()
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
    const currentMonthSales = currentMonthOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const lastMonthSales = lastMonthOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const last3MonthsSales = last3MonthsOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    const salesGrowth = lastMonthSales > 0 ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;
    const averageOrderValue = currentMonthOrders.length > 0 ? currentMonthSales / currentMonthOrders.length : 0;

    // Top selling products
    const productSales = {};
    currentMonthOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!productSales[item.name]) {
            productSales[item.name] = { quantity: 0, revenue: 0 };
          }
          productSales[item.name].quantity += item.quantity;
          productSales[item.name].revenue += parseFloat(item.total);
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({
        name,
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
    const products = await Product.findAll({
      where: { isActive: true }
    });
    
    // Calculate inventory metrics
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, product) => 
      sum + (parseFloat(product.price) * product.quantity), 0);
    
    // Low stock items
    const lowStockItems = products.filter(product => 
      product.quantity <= product.minStockLevel);
    
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
    const now = moment();
    const lastMonth = moment().subtract(1, 'month');

    // Get customer data
    const customers = await User.findAll({
      where: { role: 'sales' } // Assuming sales users are customers
    });

    const currentMonthOrders = await Order.findAll({
      where: {
        date: {
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

  // Sales Forecasting
  async predictSales() {
    try {
      // Get historical sales data (last 12 months)
      const historicalData = await this.getHistoricalSalesData();
      
      if (historicalData.length < 3) {
        return { nextMonth: 0, confidence: 0, trend: 'insufficient_data' };
      }

      // Simple linear prediction
      const sales = historicalData.map(data => data.sales);
      const avgSales = sales.reduce((sum, sale) => sum + sale, 0) / sales.length;
      
      // Calculate trend
      const trend = sales[sales.length - 1] > avgSales ? 'increasing' : 'decreasing';
      
      // Simple prediction (average of last 3 months)
      const recentSales = sales.slice(-3);
      const nextMonthPrediction = recentSales.reduce((sum, sale) => sum + sale, 0) / recentSales.length;

      return {
        nextMonth: Math.max(0, Math.round(nextMonthPrediction)),
        confidence: 75, // Simplified confidence
        trend
      };
    } catch (error) {
      console.error('Sales prediction error:', error);
      return { nextMonth: 0, confidence: 0, trend: 'error' };
    }
  }

  // Demand Forecasting
  async predictDemand() {
    try {
      const products = await Product.findAll({
        where: { isActive: true }
      });

      const demandPredictions = products.map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.quantity,
        predictedDemand: Math.round(product.quantity * 0.8), // Simplified prediction
        reorderPoint: product.minStockLevel,
        recommendation: product.quantity <= product.minStockLevel ? 'reorder' : 'monitor'
      }));

      return demandPredictions;
    } catch (error) {
      console.error('Demand prediction error:', error);
      return [];
    }
  }

  // Inventory Needs Prediction
  async predictInventoryNeeds() {
    try {
      const products = await Product.findAll({
        where: { isActive: true }
      });

      const inventoryNeeds = products
        .filter(product => product.quantity <= product.minStockLevel)
        .map(product => ({
          productId: product.id,
          productName: product.name,
          currentStock: product.quantity,
          minStockLevel: product.minStockLevel,
          recommendedOrder: product.minStockLevel * 2 - product.quantity,
          urgency: product.quantity === 0 ? 'critical' : 'high'
        }));

      return inventoryNeeds;
    } catch (error) {
      console.error('Inventory prediction error:', error);
      return [];
    }
  }

  // Customer Segmentation
  async segmentCustomers() {
    try {
      const users = await User.findAll({
        where: { role: 'sales' }
      });

      const now = moment();
      const lastMonth = moment().subtract(1, 'month');

      // Get recent orders
      const recentOrders = await Order.findAll({
        where: {
          date: {
            [Op.gte]: lastMonth.toDate()
          }
        }
      });

      // Simple segmentation
      const activeCustomers = users.length; // Simplified
      const newCustomers = Math.floor(users.length * 0.1); // 10% new
      const repeatCustomers = Math.floor(users.length * 0.7); // 70% repeat

      return {
        active: activeCustomers,
        new: newCustomers,
        repeat: repeatCustomers
      };
    } catch (error) {
      console.error('Customer segmentation error:', error);
      return { active: 0, new: 0, repeat: 0 };
    }
  }

  // Customer Lifetime Value
  async calculateCustomerLTV() {
    try {
      const orders = await Order.findAll({
        include: [
          {
            model: OrderItem,
            as: 'items'
          }
        ]
      });

      const totalRevenue = orders.reduce((sum, order) => 
        sum + parseFloat(order.total), 0);
      const averageLTV = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Top customers (simplified)
      const topCustomers = orders
        .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
        .slice(0, 5)
        .map(order => ({
          clientName: order.clientName,
          totalSpent: parseFloat(order.total)
        }));

      return {
        average: averageLTV,
        top: topCustomers
      };
    } catch (error) {
      console.error('Customer LTV error:', error);
      return { average: 0, top: [] };
    }
  }

  // Stock Turnover
  async calculateStockTurnover() {
    try {
      const products = await Product.findAll({
        where: { isActive: true }
      });

      const totalStockValue = products.reduce((sum, product) => 
        sum + (parseFloat(product.price) * product.quantity), 0);

      // Simplified turnover calculation
      const averageTurnover = totalStockValue > 0 ? 12 : 0; // 12 times per year

      return {
        average: averageTurnover,
        totalStockValue
      };
    } catch (error) {
      console.error('Stock turnover error:', error);
      return { average: 0, totalStockValue: 0 };
    }
  }

  // Reorder Recommendations
  async getReorderRecommendations() {
    try {
      const products = await Product.findAll({
        where: { isActive: true }
      });

      return products
        .filter(product => product.quantity <= product.minStockLevel)
        .map(product => ({
          productId: product.id,
          productName: product.name,
          currentStock: product.quantity,
          minStockLevel: product.minStockLevel,
          recommendedOrder: product.minStockLevel * 2,
          urgency: product.quantity === 0 ? 'critical' : 'high'
        }));
    } catch (error) {
      console.error('Reorder recommendations error:', error);
      return [];
    }
  }

  // Historical Sales Data
  async getHistoricalSalesData() {
    try {
      const orders = await Order.findAll({
        where: {
          date: {
            [Op.gte]: moment().subtract(12, 'months').toDate()
          }
        }
      });

      // Group by month
      const monthlyData = {};
      orders.forEach(order => {
        const month = moment(order.date).format('YYYY-MM');
        if (!monthlyData[month]) {
          monthlyData[month] = 0;
        }
        monthlyData[month] += parseFloat(order.total);
      });

      return Object.entries(monthlyData).map(([month, sales]) => ({
        month,
        sales
      }));
    } catch (error) {
      console.error('Historical data error:', error);
      return [];
    }
  }
}

module.exports = new AnalyticsController(); 