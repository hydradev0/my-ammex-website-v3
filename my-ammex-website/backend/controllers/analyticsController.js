const { QueryTypes } = require('sequelize');
const { getSequelize } = require('../config/db');

class AnalyticsController {
  // Get historical sales data for AI forecasting
  getHistoricalSalesForAI = async (req, res) => {
    try {
      const { months = 36 } = req.query || {}; // Default to 3 years
      
            const data = await getSequelize().query(`
              SELECT 
                month_start,
                total_revenue,
                total_orders,
                total_units,
                avg_order_value,
                new_customers
              FROM sales_fact_monthly 
              WHERE month_start >= date_trunc('month', CURRENT_DATE) - INTERVAL '${months} months'
              ORDER BY month_start
            `, { type: QueryTypes.SELECT });

      // Format for OpenRouter API consumption
      const formattedData = data.map(item => ({
        month: item.month_start,
        sales: parseFloat(item.total_revenue),
        orders: parseInt(item.total_orders),
        customers: parseInt(item.new_customers),
        avgOrderValue: parseFloat(item.avg_order_value)
      }));

      res.json({ 
        success: true, 
        data: formattedData,
        totalMonths: formattedData.length,
        dateRange: {
          from: formattedData[0]?.month,
          to: formattedData[formattedData.length - 1]?.month
        }
      });
    } catch (error) {
      console.error('Error fetching historical sales data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch historical sales data',
        details: error.message 
      });
    }
  }

  // Get historical customer purchase data
  getHistoricalCustomerData = async (req, res) => {
    try {
      const { months = 12 } = req.query || {}; // Default to 12 months
      
      const data = await getSequelize().query(`
        SELECT 
          cf.month_start,
          COALESCE(sf.new_customers, 0) AS new_customers,
          cf.bulk_orders_count,
          cf.bulk_orders_amount
        FROM customer_fact_monthly cf
        LEFT JOIN sales_fact_monthly sf ON sf.month_start = cf.month_start
        WHERE cf.month_start >= date_trunc('month', CURRENT_DATE) - INTERVAL '${months} months'
        ORDER BY cf.month_start
      `, { type: QueryTypes.SELECT });

      // Format for frontend consumption
      const formattedData = data.map(item => ({
        month: item.month_start,
        newCustomers: parseInt(item.new_customers || 0),
        bulkOrdersCount: parseInt(item.bulk_orders_count || 0),
        bulkOrdersAmount: parseFloat(item.bulk_orders_amount || 0)
      }));

      res.json({ 
        success: true, 
        data: formattedData,
        totalMonths: formattedData.length,
        dateRange: {
          from: formattedData[0]?.month,
          to: formattedData[formattedData.length - 1]?.month
        }
      });
    } catch (error) {
      console.error('Error fetching historical customer data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch historical customer data',
        details: error.message 
      });
    }
  }

  // Generate AI sales forecast using OpenRouter
  generateSalesForecast = async (req, res) => {
    try {
      const { period = 3, historicalMonths = 36 } = req.body; // Default to 3 years
      
      // Get historical data directly
            // Get all available data (since the sample data is from 2023-2025)
            const data = await getSequelize().query(`
              SELECT 
                month_start,
                total_revenue,
                total_orders,
                total_units,
                avg_order_value,
                new_customers
              FROM sales_fact_monthly 
              ORDER BY month_start
            `, { type: QueryTypes.SELECT });

      // Format for OpenRouter API consumption
      const formattedData = data.map(item => ({
        month: item.month_start,
        sales: parseFloat(item.total_revenue),
        orders: parseInt(item.total_orders),
        customers: parseInt(item.new_customers),
        avgOrderValue: parseFloat(item.avg_order_value)
      }));

      if (formattedData.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No historical data available for forecasting' 
        });
      }


            // Call OpenRouter API for AI forecasting
            const forecast = await this.callOpenRouterAPI(formattedData, period);
  
            res.json({ 
              success: true, 
              forecast,
              metadata: {
                period: `${period} months`,
                historicalMonths: formattedData.length,
                generatedAt: new Date().toISOString(),
                source: 'openrouter'
              }
            });
    } catch (error) {
      console.error('Error generating sales forecast:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate sales forecast',
        details: error.message 
      });
    }
  }

  // OpenRouter API integration
  callOpenRouterAPI = async (historicalData, forecastPeriod) => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Preprocess data for LLM
    const processedData = this.preprocessDataForLLM(historicalData);
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-based to 1-based
    
    const prompt = `You are a business analyst AI specializing in sales forecasting. Analyze this historical sales data for Ammex company and provide a detailed ${forecastPeriod}-month forecast.

CURRENT DATE: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-01
FORECAST PERIOD: Generate predictions for the NEXT ${forecastPeriod} months (do NOT include current month)

Historical Sales Data (${processedData.length} months):
${JSON.stringify(processedData, null, 2)}

IMPORTANT: You must respond with ONLY valid JSON. Do not include any markdown formatting, explanations, or text outside the JSON. Start your response with { and end with }.

Return this exact JSON structure (month field will be generated automatically):
{
  "period": "${forecastPeriod} months",
  "totalPredicted": number,
  "avgMonthly": number,
  "confidence": number,
  "growthRate": number,
  "monthlyBreakdown": [
    {
      "predicted": number,
      "confidence": number,
      "trend": "up|down|stable",
      "seasonalFactor": number
    }
  ],
  "insights": [
    "string insight 1",
    "string insight 2",
    "string insight 3"
  ],
  "recommendations": [
    "string recommendation 1",
    "string recommendation 2",
    "string recommendation 3"
  ],
  "riskFactors": [
    "string risk 1",
    "string risk 2"
  ]
}

Ensure all monetary values are in the same currency as the historical data (PHP). Be realistic and conservative in your predictions.
    `;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
          'X-Title': 'Ammex Sales Forecasting'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { 
              role: 'system', 
              content: `You are a professional business analyst specializing in sales forecasting. Always respond with valid JSON format. TODAY'S DATE IS ${currentYear}-${currentMonth.toString().padStart(2, '0')}-01. Generate forecasts for the NEXT months only (do not include current month).` 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      let aiResponse = result.choices[0].message.content;
      
      // Clean the response to extract JSON
      aiResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (aiResponse.startsWith('```json')) {
        aiResponse = aiResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (aiResponse.startsWith('```')) {
        aiResponse = aiResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Find JSON object boundaries
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        aiResponse = aiResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      // Parse and validate JSON response
      try {
        const forecast = JSON.parse(aiResponse);
        return this.validateForecastResponse(forecast, forecastPeriod);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw AI response:', aiResponse);
        console.error('Response length:', aiResponse?.length);
        console.error('First 200 chars:', aiResponse?.substring(0, 200));
        throw new Error(`AI response is not valid JSON. Raw response: ${aiResponse?.substring(0, 500)}`);
      }
    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      throw error;
    }
  }

  // Preprocess data for LLM consumption
  preprocessDataForLLM(data) {
    return data.map(item => ({
      month: item.month,
      sales: Math.round(item.sales),
      orders: item.orders,
      customers: item.customers,
      avgOrderValue: Math.round(item.avgOrderValue)
    }));
  }

  // Validate and clean AI response
  validateForecastResponse(forecast, expectedPeriod) {
    const requiredFields = ['period', 'totalPredicted', 'avgMonthly', 'confidence', 'monthlyBreakdown'];
    
    for (const field of requiredFields) {
      if (!forecast[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure monthlyBreakdown has correct number of months
    if (forecast.monthlyBreakdown.length !== expectedPeriod) {
      console.warn(`Expected ${expectedPeriod} months, got ${forecast.monthlyBreakdown.length}`);
    }

    // Add fallback values if missing
    forecast.insights = forecast.insights || ['No specific insights available'];
    forecast.recommendations = forecast.recommendations || ['Continue monitoring sales trends'];
    forecast.riskFactors = forecast.riskFactors || ['Market volatility'];

    // Generate dynamic month names for each prediction (starting from NEXT month)
    const currentDate = new Date();
    forecast.monthlyBreakdown = forecast.monthlyBreakdown.map((item, index) => {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(currentDate.getMonth() + index + 1); // +1 to start from next month
      const monthLabel = forecastDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        ...item,
        month: monthLabel
      };
    });

    return forecast;
  }

  // Generate AI customer bulk forecast using OpenRouter (class-level)
  generateCustomerBulkForecast = async (req, res) => {
    try {
      const { period = 3 } = req.body || {};

      const data = await getSequelize().query(`
        SELECT 
          month_start,
          bulk_orders_count,
          bulk_orders_amount
        FROM customer_fact_monthly 
        ORDER BY month_start
      `, { type: QueryTypes.SELECT });

      const formattedData = data.map(item => ({
        month: item.month_start,
        bulkOrdersCount: parseInt(item.bulk_orders_count || 0),
        bulkOrdersAmount: parseFloat(item.bulk_orders_amount || 0),
        avgBulkOrderSize: item.bulk_orders_count ? Math.round(item.bulk_orders_amount / item.bulk_orders_count) : 0
      }));

      if (formattedData.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No historical bulk data available for forecasting' 
        });
      }

      const forecast = await this.callOpenRouterAPIBulk(formattedData, period);

      res.json({ 
        success: true, 
        forecast,
        metadata: {
          period: `${period} months`,
          historicalMonths: formattedData.length,
          generatedAt: new Date().toISOString(),
          source: 'openrouter'
        }
      });
    } catch (error) {
      console.error('Error generating customer bulk forecast:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate customer bulk forecast',
        details: error.message 
      });
    }
  }

  callOpenRouterAPIBulk = async (historicalBulkData, forecastPeriod) => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const prompt = `You are a business analyst AI. Forecast BULK ORDERS for Ammex.

CURRENT DATE: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-01
FORECAST PERIOD: Generate predictions for the NEXT ${forecastPeriod} months (do NOT include current month)

Historical Bulk Data (${historicalBulkData.length} months):
${JSON.stringify(historicalBulkData, null, 2)}

IMPORTANT: Respond with ONLY valid JSON. No markdown.
Return this exact structure:
{
  "period": "${forecastPeriod} months",
  "monthlyBreakdown": [
    {
      "bulkOrdersCount": number,
      "bulkOrdersAmount": number,
      "trend": "up|down|stable"
    }
  ],
  "insights": ["string"],
  "recommendations": ["string"]
}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
          'X-Title': 'Ammex Customer Bulk Forecast'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: `You are a professional business analyst specializing in forecasting. Always return valid JSON. TODAY'S DATE IS ${currentYear}-${currentMonth.toString().padStart(2, '0')}-01. Generate forecasts for NEXT months only.` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1600
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      let aiResponse = result?.choices?.[0]?.message?.content || '';
      aiResponse = aiResponse.trim();
      if (aiResponse.startsWith('```json')) {
        aiResponse = aiResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (aiResponse.startsWith('```')) {
        aiResponse = aiResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        aiResponse = aiResponse.substring(jsonStart, jsonEnd + 1);
      }

      const forecast = JSON.parse(aiResponse);
      return this.validateBulkForecastResponse(forecast, forecastPeriod);
    } catch (error) {
      console.error('OpenRouter API call (bulk) failed:', error);
      throw error;
    }
  }

  validateBulkForecastResponse = (forecast, expectedPeriod) => {
    if (!forecast || !Array.isArray(forecast.monthlyBreakdown)) {
      throw new Error('Invalid bulk forecast response');
    }
    const currentDate = new Date();
    forecast.monthlyBreakdown = forecast.monthlyBreakdown.map((item, index) => {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(currentDate.getMonth() + index + 1);
      const monthLabel = forecastDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      return {
        month: monthLabel,
        bulkOrdersCount: Math.max(0, Math.round(item.bulkOrdersCount || 0)),
        bulkOrdersAmount: Math.max(0, Math.round(item.bulkOrdersAmount || 0)),
        trend: item.trend || 'stable'
      };
    });
    forecast.insights = forecast.insights || [];
    forecast.recommendations = forecast.recommendations || [];
    return forecast;
  }

  // Get dashboard metrics (cached)
  async getDashboardMetrics(req, res) {
    try {
      const data = await sequelize.query(`
        SELECT 
          month_start,
          total_revenue,
          total_orders,
          total_units,
          avg_order_value,
          new_customers
        FROM sales_fact_monthly 
        WHERE month_start >= CURRENT_DATE - INTERVAL '12 months'
        ORDER BY month_start DESC
        LIMIT 12
      `, { type: QueryTypes.SELECT });

      // Calculate summary metrics
      const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0);
      const totalOrders = data.reduce((sum, item) => sum + parseInt(item.total_orders), 0);
      const avgMonthlyRevenue = totalRevenue / data.length;
      const currentMonth = data[0];
      const previousMonth = data[1];

      const metrics = {
        currentMonth: {
          revenue: parseFloat(currentMonth?.total_revenue || 0),
          orders: parseInt(currentMonth?.total_orders || 0),
          customers: parseInt(currentMonth?.new_customers || 0)
        },
        previousMonth: {
          revenue: parseFloat(previousMonth?.total_revenue || 0),
          orders: parseInt(previousMonth?.total_orders || 0),
          customers: parseInt(previousMonth?.new_customers || 0)
        },
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          avgMonthlyRevenue: Math.round(avgMonthlyRevenue),
          revenueGrowth: previousMonth ? 
            Math.round(((currentMonth?.total_revenue - previousMonth.total_revenue) / previousMonth.total_revenue) * 100) : 0
        },
        historicalData: data.reverse() // Return in chronological order
      };

      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch dashboard metrics',
        details: error.message 
      });
    }
  }

  // Refresh sales fact table (for maintenance)
  async refreshSalesFactTable(req, res) {
    try {
      await sequelize.query('SELECT refresh_sales_fact_monthly()', { type: QueryTypes.SELECT });
      
      res.json({ 
        success: true, 
        message: 'Sales fact table refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error refreshing sales fact table:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to refresh sales fact table',
        details: error.message 
      });
    }
  }

}

module.exports = new AnalyticsController();