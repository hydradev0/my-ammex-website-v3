const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const tf = require('@tensorflow/tfjs-node');
const ss = require('simple-statistics');
const moment = require('moment');
const _ = require('lodash');

// AI Analytics Controller
class AnalyticsController {
  // Get comprehensive analytics dashboard data
  async getDashboardAnalytics(req, res) {
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
      console.error('Analytics error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch analytics data' });
    }
  }

  // Sales Analytics
  async getSalesMetrics() {
    const now = moment();
    const lastMonth = moment().subtract(1, 'month');
    const last3Months = moment().subtract(3, 'months');

    // Get sales data
    const currentMonthOrders = await Order.find({
      date: { $gte: now.startOf('month').toDate() }
    });

    const lastMonthOrders = await Order.find({
      date: { 
        $gte: lastMonth.startOf('month').toDate(),
        $lt: now.startOf('month').toDate()
      }
    });

    const last3MonthsOrders = await Order.find({
      date: { $gte: last3Months.toDate() }
    });

    // Calculate metrics
    const currentMonthSales = currentMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const lastMonthSales = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const last3MonthsSales = last3MonthsOrders.reduce((sum, order) => sum + order.total, 0);

    const salesGrowth = lastMonthSales > 0 ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0;
    const averageOrderValue = currentMonthOrders.length > 0 ? currentMonthSales / currentMonthOrders.length : 0;

    // Top selling products
    const productSales = {};
    currentMonthOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.total;
      });
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
    const products = await Product.find({ isActive: true });
    
    // Calculate inventory metrics
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    
    // Low stock items
    const lowStockItems = products.filter(product => product.quantity <= product.minStockLevel);
    
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
    const customers = await User.find({ role: 'customer' });
    const currentMonthOrders = await Order.find({
      date: { $gte: now.startOf('month').toDate() }
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

  // Sales Forecasting using Linear Regression
  async predictSales() {
    try {
      // Get historical sales data (last 12 months)
      const historicalData = await this.getHistoricalSalesData();
      
      if (historicalData.length < 3) {
        return { nextMonth: 0, confidence: 0, trend: 'insufficient_data' };
      }

      // Prepare data for regression
      const x = historicalData.map((_, index) => index);
      const y = historicalData.map(data => data.sales);

      // Calculate linear regression
      const regression = ss.linearRegression(x.map(xi => [xi]), y);
      
      // Predict next month
      const nextMonthIndex = x.length;
      const nextMonthPrediction = regression.m * nextMonthIndex + regression.b;
      
      // Calculate confidence (R-squared)
      const yMean = ss.mean(y);
      const ssRes = y.reduce((sum, yi, i) => {
        const predicted = regression.m * x[i] + regression.b;
        return sum + Math.pow(yi - predicted, 2);
      }, 0);
      const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
      const rSquared = 1 - (ssRes / ssTot);

      return {
        nextMonth: Math.max(0, Math.round(nextMonthPrediction)),
        confidence: Math.round(rSquared * 100),
        trend: regression.m > 0 ? 'increasing' : 'decreasing',
        slope: regression.m
      };
    } catch (error) {
      console.error('Sales prediction error:', error);
      return { nextMonth: 0, confidence: 0, trend: 'error' };
    }
  }

  // Demand Prediction for Products
  async predictDemand() {
    try {
      const products = await Product.find({ isActive: true });
      const demandPredictions = [];

      for (const product of products) {
        // Get historical sales for this product
        const productOrders = await Order.find({
          'items.name': product.name
        }).sort({ date: -1 }).limit(12);

        if (productOrders.length < 3) {
          demandPredictions.push({
            productId: product._id,
            productName: product.name,
            predictedDemand: product.minStockLevel,
            confidence: 0,
            recommendation: 'insufficient_data'
          });
          continue;
        }

        // Calculate monthly demand
        const monthlyDemand = this.calculateMonthlyDemand(productOrders, product.name);
        
        // Simple moving average prediction
        const avgDemand = ss.mean(monthlyDemand);
        const stdDev = ss.standardDeviation(monthlyDemand);
        
        // Predict next month demand with 95% confidence interval
        const predictedDemand = Math.round(avgDemand + (1.96 * stdDev));
        const confidence = Math.min(95, Math.max(0, 100 - (stdDev / avgDemand) * 100));

        demandPredictions.push({
          productId: product._id,
          productName: product.name,
          predictedDemand,
          confidence: Math.round(confidence),
          currentStock: product.quantity,
          recommendation: this.getDemandRecommendation(predictedDemand, product.quantity, product.minStockLevel)
        });
      }

      return demandPredictions;
    } catch (error) {
      console.error('Demand prediction error:', error);
      return [];
    }
  }

  // Inventory Needs Prediction
  async predictInventoryNeeds() {
    try {
      const demandForecast = await this.predictDemand();
      const inventoryNeeds = [];

      for (const prediction of demandForecast) {
        const product = await Product.findById(prediction.productId);
        if (!product) continue;

        const safetyStock = Math.round(prediction.predictedDemand * 0.2); // 20% safety stock
        const leadTime = 7; // Assume 7 days lead time
        const dailyDemand = prediction.predictedDemand / 30;
        const leadTimeDemand = dailyDemand * leadTime;
        
        const reorderPoint = Math.round(leadTimeDemand + safetyStock);
        const suggestedOrderQuantity = Math.max(0, reorderPoint - product.quantity);

        inventoryNeeds.push({
          productId: prediction.productId,
          productName: prediction.productName,
          currentStock: product.quantity,
          reorderPoint,
          suggestedOrderQuantity,
          urgency: this.getUrgencyLevel(product.quantity, reorderPoint),
          estimatedStockoutDate: this.estimateStockoutDate(product.quantity, dailyDemand)
        });
      }

      return inventoryNeeds;
    } catch (error) {
      console.error('Inventory prediction error:', error);
      return [];
    }
  }

  // Customer Segmentation
  async segmentCustomers() {
    try {
      const customers = await User.find({ role: 'customer' });
      const now = moment();
      const lastMonth = moment().subtract(1, 'month');
      const last3Months = moment().subtract(3, 'months');

      const segments = {
        active: 0,
        new: 0,
        repeat: 0,
        inactive: 0
      };

      for (const customer of customers) {
        const customerOrders = await Order.find({ clientName: customer.name });
        
        if (customerOrders.length === 0) {
          segments.inactive++;
        } else {
          const recentOrders = customerOrders.filter(order => 
            moment(order.date).isAfter(lastMonth.toDate())
          );
          
          if (recentOrders.length > 0) {
            segments.active++;
            if (customerOrders.length > 1) {
              segments.repeat++;
            } else {
              segments.new++;
            }
          } else {
            segments.inactive++;
          }
        }
      }

      return segments;
    } catch (error) {
      console.error('Customer segmentation error:', error);
      return { active: 0, new: 0, repeat: 0, inactive: 0 };
    }
  }

  // Customer Lifetime Value
  async calculateCustomerLTV() {
    try {
      const customers = await User.find({ role: 'customer' });
      const customerLTVs = [];

      for (const customer of customers) {
        const customerOrders = await Order.find({ clientName: customer.name });
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
        const orderCount = customerOrders.length;
        const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
        
        // Simple LTV calculation: avg order value * frequency * customer lifespan
        const frequency = orderCount / Math.max(1, moment().diff(moment(customer.createdAt), 'months'));
        const lifespan = 12; // Assume 12 months average customer lifespan
        const ltv = avgOrderValue * frequency * lifespan;

        customerLTVs.push({
          customerId: customer._id,
          customerName: customer.name,
          totalSpent,
          orderCount,
          avgOrderValue,
          ltv: Math.round(ltv)
        });
      }

      const sortedLTVs = customerLTVs.sort((a, b) => b.ltv - a.ltv);
      const averageLTV = ss.mean(customerLTVs.map(c => c.ltv));

      return {
        average: Math.round(averageLTV),
        top: sortedLTVs.slice(0, 5)
      };
    } catch (error) {
      console.error('Customer LTV error:', error);
      return { average: 0, top: [] };
    }
  }

  // Stock Turnover Analysis
  async calculateStockTurnover() {
    try {
      const products = await Product.find({ isActive: true });
      const turnoverRates = [];

      for (const product of products) {
        const productOrders = await Order.find({
          'items.name': product.name
        });

        const totalSold = productOrders.reduce((sum, order) => {
          const item = order.items.find(item => item.name === product.name);
          return sum + (item ? item.quantity : 0);
        }, 0);

        const avgInventory = product.quantity; // Simplified calculation
        const turnoverRate = avgInventory > 0 ? totalSold / avgInventory : 0;

        turnoverRates.push({
          productId: product._id,
          productName: product.name,
          turnoverRate: Math.round(turnoverRate * 100) / 100,
          totalSold,
          avgInventory
        });
      }

      const avgTurnover = ss.mean(turnoverRates.map(t => t.turnoverRate));
      return {
        average: Math.round(avgTurnover * 100) / 100,
        products: turnoverRates.sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 10)
      };
    } catch (error) {
      console.error('Stock turnover error:', error);
      return { average: 0, products: [] };
    }
  }

  // Smart Reorder Recommendations
  async getReorderRecommendations() {
    try {
      const inventoryNeeds = await this.predictInventoryNeeds();
      const recommendations = [];

      for (const need of inventoryNeeds) {
        if (need.suggestedOrderQuantity > 0) {
          const urgency = need.urgency;
          const priority = urgency === 'critical' ? 1 : urgency === 'high' ? 2 : 3;

          recommendations.push({
            ...need,
            priority,
            estimatedCost: need.suggestedOrderQuantity * 100, // Assume average cost
            reason: this.getReorderReason(need)
          });
        }
      }

      return recommendations.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Reorder recommendations error:', error);
      return [];
    }
  }

  // Helper Methods
  async getHistoricalSalesData() {
    const months = 12;
    const historicalData = [];

    for (let i = months - 1; i >= 0; i--) {
      const startDate = moment().subtract(i, 'months').startOf('month');
      const endDate = moment().subtract(i, 'months').endOf('month');

      const orders = await Order.find({
        date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      });

      const monthlySales = orders.reduce((sum, order) => sum + order.total, 0);
      historicalData.push({
        month: startDate.format('YYYY-MM'),
        sales: monthlySales
      });
    }

    return historicalData;
  }

  calculateMonthlyDemand(orders, productName) {
    const monthlyDemand = new Array(12).fill(0);
    
    orders.forEach(order => {
      const month = moment(order.date).month();
      const item = order.items.find(item => item.name === productName);
      if (item) {
        monthlyDemand[month] += item.quantity;
      }
    });

    return monthlyDemand.filter(demand => demand > 0);
  }

  getDemandRecommendation(predictedDemand, currentStock, minStockLevel) {
    if (currentStock <= minStockLevel) {
      return 'critical_reorder';
    } else if (currentStock <= predictedDemand) {
      return 'reorder_soon';
    } else if (currentStock <= predictedDemand * 1.5) {
      return 'monitor_closely';
    } else {
      return 'sufficient_stock';
    }
  }

  getUrgencyLevel(currentStock, reorderPoint) {
    if (currentStock <= reorderPoint * 0.5) {
      return 'critical';
    } else if (currentStock <= reorderPoint) {
      return 'high';
    } else {
      return 'low';
    }
  }

  estimateStockoutDate(currentStock, dailyDemand) {
    if (dailyDemand <= 0) return null;
    const daysUntilStockout = Math.floor(currentStock / dailyDemand);
    return moment().add(daysUntilStockout, 'days').format('YYYY-MM-DD');
  }

  getReorderReason(need) {
    if (need.urgency === 'critical') {
      return 'Critical stock level - immediate reorder required';
    } else if (need.urgency === 'high') {
      return 'Stock level approaching reorder point';
    } else {
      return 'Preventive reorder to maintain optimal stock levels';
    }
  }

  // Anomaly Detection
  async detectAnomalies() {
    try {
      const orders = await Order.find().sort({ date: -1 }).limit(100);
      const dailySales = {};
      
      orders.forEach(order => {
        const date = moment(order.date).format('YYYY-MM-DD');
        if (!dailySales[date]) {
          dailySales[date] = 0;
        }
        dailySales[date] += order.total;
      });

      const salesValues = Object.values(dailySales);
      const mean = ss.mean(salesValues);
      const stdDev = ss.standardDeviation(salesValues);
      const threshold = 2; // 2 standard deviations

      const anomalies = [];
      Object.entries(dailySales).forEach(([date, sales]) => {
        const zScore = Math.abs((sales - mean) / stdDev);
        if (zScore > threshold) {
          anomalies.push({
            date,
            sales,
            zScore: Math.round(zScore * 100) / 100,
            type: sales > mean ? 'unusually_high' : 'unusually_low'
          });
        }
      });

      return anomalies;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }
}

module.exports = new AnalyticsController();
