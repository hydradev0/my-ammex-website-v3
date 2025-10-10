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
        FROM customer_bulk_monthly cf
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

  // Get top performing products data
  getTopProducts = async (req, res) => {
    try {
      const { months = 12, limit = 10 } = req.query || {}; // Default to 12 months, top 10 products
      
      // Get top products for the specified period
      const data = await getSequelize().query(`
        SELECT 
          month_start,
          model_no,
          category_name,
          category_id,
          subcategory_id,
          ranking
        FROM sales_fact_monthly_by_product 
        WHERE month_start >= date_trunc('month', CURRENT_DATE) - INTERVAL '${months} months'
          AND ranking <= ${parseInt(limit)}
        ORDER BY month_start DESC, ranking ASC
      `, { type: QueryTypes.SELECT });

      // Format for frontend consumption
      const formattedData = data.map(item => ({
        month: item.month_start,
        modelNo: item.model_no,
        categoryName: item.category_name,
        categoryId: parseInt(item.category_id),
        subcategoryId: item.subcategory_id ? parseInt(item.subcategory_id) : null,
        ranking: parseInt(item.ranking)
      }));

      // Group by month for easier consumption
      const groupedData = formattedData.reduce((acc, item) => {
        if (!acc[item.month]) {
          acc[item.month] = [];
        }
        acc[item.month].push({
          modelNo: item.modelNo,
          categoryName: item.categoryName,
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId,
          ranking: item.ranking
        });
        return acc;
      }, {});

      res.json({ 
        success: true, 
        data: groupedData,
        totalRecords: formattedData.length,
        dateRange: {
          from: Object.keys(groupedData)[Object.keys(groupedData).length - 1],
          to: Object.keys(groupedData)[0]
        }
      });
    } catch (error) {
      console.error('Error fetching top products data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch top products data',
        details: error.message 
      });
    }
  }

  // Get top bulk customers data
  getTopBulkCustomers = async (req, res) => {
    try {
      const { months = 12, limit = 10 } = req.query || {}; // Default to 12 months, top 10 customers
      
      // Get top bulk customers for the specified period
      const data = await getSequelize().query(`
        SELECT 
          month_start,
          customer_name,
          bulk_orders_count,
          bulk_orders_amount,
          average_bulk_order_value,
          ranking
        FROM customer_bulk_monthly_by_name 
        WHERE month_start >= date_trunc('month', CURRENT_DATE) - INTERVAL '${months} months'
          AND ranking <= ${parseInt(limit)}
        ORDER BY month_start DESC, ranking ASC
      `, { type: QueryTypes.SELECT });

      // Format for frontend consumption
      const formattedData = data.map(item => ({
        month: item.month_start,
        customerName: item.customer_name,
        bulkOrdersCount: parseInt(item.bulk_orders_count),
        bulkOrdersAmount: parseFloat(item.bulk_orders_amount),
        averageBulkOrderValue: parseFloat(item.average_bulk_order_value),
        ranking: parseInt(item.ranking)
      }));

      // Group by month for easier consumption
      const groupedData = formattedData.reduce((acc, item) => {
        if (!acc[item.month]) {
          acc[item.month] = [];
        }
        acc[item.month].push({
          customerName: item.customerName,
          bulkOrdersCount: item.bulkOrdersCount,
          bulkOrdersAmount: item.bulkOrdersAmount,
          averageBulkOrderValue: item.averageBulkOrderValue,
          ranking: item.ranking
        });
        return acc;
      }, {});

      res.json({ 
        success: true, 
        data: groupedData,
        totalRecords: formattedData.length,
        dateRange: {
          from: Object.keys(groupedData)[Object.keys(groupedData).length - 1],
          to: Object.keys(groupedData)[0]
        }
      });
    } catch (error) {
      console.error('Error fetching top bulk customers data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch top bulk customers data',
        details: error.message 
      });
    }
  }

  // Generate AI sales forecast using OpenRouter
  generateSalesForecast = async (req, res) => {
    try {
      const { period = 3, historicalMonths = 36 } = req.body; // Default to 3 years
      
      // Check database connection first
      const sequelize = getSequelize();
      if (!sequelize) {
        throw new Error('Database connection not available');
      }
      
      // Get historical sales data
      console.log('Fetching historical sales data...');
      const salesData = await sequelize.query(`
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
      
      console.log(`Retrieved ${salesData.length} historical records`);

      // Calculate forecast months dynamically (using previous year's same months)
      const currentDate = new Date();
      const forecastMonths = [];
      
      // Generate the months that will be forecasted (same months from previous year)
      for (let i = 0; i < period; i++) {
        const forecastDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth() + i + 1, 1);
        forecastMonths.push(forecastDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
      }
      
      console.log(`Calculated forecast months: ${forecastMonths.join(', ')}`);

      // Get top products data dynamically - try previous year same months first, then fallback to recent months
      console.log('Fetching top products data dynamically...');
      
      // Step 1: Try to get data from corresponding previous year months
      const previousYearMonths = [];
      for (let i = 0; i < period; i++) {
        const forecastDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth() + i + 1, 1);
        previousYearMonths.push(forecastDate.toISOString().split('T')[0]);
      }
      
      console.log(`🎯 Primary lookup: Previous year months ${previousYearMonths.join(', ')}`);
      
      // Build dynamic WHERE clause for previous year months
      const monthConditions = previousYearMonths.map((month, index) => 
        `(EXTRACT(YEAR FROM month_start) = EXTRACT(YEAR FROM '${month}'::date) AND EXTRACT(MONTH FROM month_start) = EXTRACT(MONTH FROM '${month}'::date))`
      ).join(' OR ');
      
      let topProductsData = await sequelize.query(`
        SELECT 
          month_start,
          model_no,
          category_name,
          ranking
        FROM sales_fact_monthly_by_product 
        WHERE (${monthConditions})
        AND ranking <= 5
        ORDER BY month_start DESC, ranking ASC
      `, { 
        type: QueryTypes.SELECT
      });
      
      console.log(`📊 Found ${topProductsData.length} records from previous year months`);
      
      // Step 2: If we don't have enough data, get additional data from recent months
      const monthsFound = new Set(topProductsData.map(item => item.month_start));
      const missingMonths = previousYearMonths.filter(month => 
        !monthsFound.has(month.replace(/-31$/, '-01').replace(/-30$/, '-01'))
      );
      
      if (missingMonths.length > 0) {
        console.log(`🔄 Missing data for ${missingMonths.length} months, fetching from recent data...`);
        
        const fallbackData = await sequelize.query(`
          SELECT 
            month_start,
            model_no,
            category_name,
            ranking
          FROM sales_fact_monthly_by_product 
          WHERE month_start >= date_trunc('month', CURRENT_DATE) - INTERVAL '12 months'
          AND ranking <= 5
          ORDER BY month_start DESC, ranking ASC
          LIMIT 30
        `, { 
          type: QueryTypes.SELECT
        });
        
        // Add fallback data that we don't already have
        const existingMonths = new Set(topProductsData.map(item => item.month_start));
        const additionalData = fallbackData.filter(item => 
          !existingMonths.has(item.month_start) && 
          !previousYearMonths.some(pm => 
            item.month_start === pm.replace(/-31$/, '-01').replace(/-30$/, '-01')
          )
        );
        
        topProductsData = [...topProductsData, ...additionalData];
        console.log(`📈 Added ${additionalData.length} additional records from recent months`);
      }
      
      console.log(`✅ Total top products data: ${topProductsData.length} records`);

      // Format sales data for OpenRouter API consumption
      const formattedSalesData = salesData.map(item => ({
        month: item.month_start,
        sales: parseFloat(item.total_revenue),
        orders: parseInt(item.total_orders),
        customers: parseInt(item.new_customers),
        avgOrderValue: parseFloat(item.avg_order_value)
      }));

      // Format top products data for AI context
      const formattedTopProducts = topProductsData.reduce((acc, item) => {
        if (!acc[item.month_start]) {
          acc[item.month_start] = [];
        }
        acc[item.month_start].push({
          modelNo: item.model_no,
          category: item.category_name,
          ranking: parseInt(item.ranking)
        });
        return acc;
      }, {});

      if (formattedSalesData.length === 0) {
        console.log('No historical data available for forecasting');
        return res.status(400).json({ 
          success: false, 
          error: 'No historical data available for forecasting' 
        });
      }

      // Call OpenRouter API for AI forecasting with top products data
      const { forecast, usage } = await this.callOpenRouterAPISales(
        formattedSalesData,
        period,
        formattedTopProducts
      );
  
      res.json({ 
        success: true, 
        forecast,
        metadata: {
          period: `${period} months`,
          historicalMonths: formattedSalesData.length,
          generatedAt: new Date().toISOString(),
          source: 'openrouter',
          usage: usage || null
        }
      });
    } catch (error) {
      console.error('Error generating sales forecast:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to generate sales forecast';
      let details = error.message;
      
      if (error.message.includes('rate limited') || error.message.includes('429')) {
        errorMessage = 'AI service is temporarily busy. Please wait a moment and try again.';
        details = 'The forecasting service is experiencing high demand. Please try again in a few seconds.';
      } else if (error.message.includes("Model '") && error.message.includes("' not available")) {
        errorMessage = 'AI model is not available.';
        details = 'The selected AI model is not available on the service. Please contact support to update the model configuration.';
      } else if (error.message.includes('OpenRouter API error')) {
        errorMessage = 'AI forecasting service is temporarily unavailable.';
        details = 'The external AI service is experiencing issues. Please try again later.';
      } else if (error.message.includes('AI response is not valid JSON')) {
        errorMessage = 'AI service returned an unexpected response format.';
        details = 'The AI service provided a response that could not be processed. Please try again.';
      } else if (error.message.includes('quota exceeded') || error.message.includes('model unavailable')) {
        errorMessage = 'AI service quota exceeded.';
        details = 'The AI service has reached its usage limit. Please try again later or upgrade your plan.';
      } else if (error.message.includes('Database connection not available')) {
        errorMessage = 'Database service is currently unavailable.';
        details = 'The database connection is not available. Please check the database configuration.';
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        errorMessage = 'Database tables are not properly configured.';
        details = 'Required database tables are missing. Please run the database setup scripts.';
      }
      
      console.log('Sending error response:', { errorMessage, details });
      
      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: details,
        retryable: error.message.includes('rate limited') || error.message.includes('429') || error.message.includes('temporarily')
      });
    }
  }

  // OpenRouter API integration in sales forecasting
  callOpenRouterAPISales = async (historicalData, forecastPeriod, topProductsData = {}) => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Preprocess data for LLM
    const processedData = this.preprocessDataForLLM(historicalData);
    const processedTopProducts = this.preprocessTopProductsForLLM(topProductsData);
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-based to 1-based
    
    const prompt = `You are a business analyst AI specializing in sales forecasting. Analyze this historical sales data and top performing products for Ammex company and provide a detailed ${forecastPeriod}-month forecast.

CURRENT DATE: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-01
FORECAST PERIOD: Generate predictions for the NEXT ${forecastPeriod} months (do NOT include current month)

Historical Sales Data (${processedData.length} months):
${JSON.stringify(processedData, null, 2)}

Historical Top Performing Products by Month (Previous Year Same Months + Recent Fallback):
${JSON.stringify(processedTopProducts, null, 2)}

Based on the historical top products from the same months in the previous year (and recent months as fallback), predict which products will likely be top performers in the forecasted months.

IMPORTANT: You must respond with ONLY valid JSON. Do not include any markdown formatting, explanations, or text outside the JSON. Start your response with { and end with }.

Return this exact JSON structure (month field will be generated automatically):
{
  "period": "${forecastPeriod} months",
  "totalPredicted": number,
  "avgMonthly": number,
  "totalGrowth": number (percentage from 0-100, e.g., 15.5 for 15.5% growth),
  "growthRate": number (decimal rate, e.g., 0.155 for 15.5%),
  "monthlyBreakdown": [
    {
      "predicted": number,
      "seasonalFactor": number
    }
  ],
  "Top Products": [
    "string top product 1 (model no, category)",
    "string top product 2",
    "string top product 3",
    "string top product 4",
    "string top product 5",
  ],
  "insights": [
    "string insight 1",
    "string insight 2",
    "string insight 3",
    "string insight 4",
    "string insight 5"
  ],
  "recommendations": [
    "string recommendation 1",
    "string recommendation 2",
    "string recommendation 3",
    "string recommendation 4",
    "string recommendation 5"
  ],
}

Based on the top products data provided, predict which products will likely continue to perform well in the forecast period. Consider seasonal trends and product category performance. Ensure all monetary values are in the same currency as the historical data (PHP). Be realistic and conservative in your predictions.
    `;

    try {
      // Single attempt only - no retries
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
        if (response.status === 404) {
          throw new Error(`Model not available on OpenRouter. Please try a different model.`);
        }
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        console.error('Invalid response format from OpenRouter API:', result);
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
        if (!aiResponse || aiResponse.length === 0) {
          throw new Error('AI returned empty response - likely quota exceeded or model unavailable');
        }
        
        const forecast = JSON.parse(aiResponse);
        const validated = this.validateForecastResponse(forecast, forecastPeriod, historicalData);
        const usage = result.usage ? {
          prompt_tokens: result.usage.prompt_tokens,
          completion_tokens: result.usage.completion_tokens,
          total_tokens: result.usage.total_tokens
        } : null;
        return { forecast: validated, usage };
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw AI response:', aiResponse);
        console.error('Response length:', aiResponse?.length);
        console.error('First 200 chars:', aiResponse?.substring(0, 200));
        
        if (!aiResponse || aiResponse.length === 0) {
          throw new Error('AI service quota exceeded or model temporarily unavailable. Please try again later.');
        }
        
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

  // Preprocess top products data for LLM consumption
  preprocessTopProductsForLLM(topProductsData) {
    // Convert to array format with recent months first
    const months = Object.keys(topProductsData).sort((a, b) => new Date(b) - new Date(a));
    const recentMonths = months.slice(0, 12); // Get last 12 months for AI context
    
    return recentMonths.map(month => ({
      month,
      topProducts: topProductsData[month].slice(0, 5) // Top 5 products per month
    }));
  }

  // Preprocess top bulk customers data for LLM consumption
  preprocessTopBulkCustomersForLLM(topBulkCustomersData) {
    const months = Object.keys(topBulkCustomersData).sort((a, b) => new Date(b) - new Date(a));
    const recentMonths = months.slice(0, 12);
    return recentMonths.map(month => ({
      month,
      topBulkCustomers: (topBulkCustomersData[month] || []).slice(0, 5)
    }));
  }

  // Validate and clean AI response
  validateForecastResponse(forecast, expectedPeriod, historicalData = []) {
    const requiredFields = ['period', 'totalPredicted', 'avgMonthly', 'totalGrowth', 'monthlyBreakdown'];
    
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

    // Validate and normalize totalGrowth to percentage
    if (typeof forecast.totalGrowth === 'number') {
      // If totalGrowth is > 100, assume it's an absolute value and convert to percentage
      if (forecast.totalGrowth > 100 && historicalData.length > 0) {
        const lastHistoricalValue = historicalData[historicalData.length - 1].sales;
        const totalHistoricalValue = historicalData.reduce((sum, item) => sum + item.sales, 0);
        const avgHistoricalValue = totalHistoricalValue / historicalData.length;
        
        // Calculate proper percentage growth
        const baselineValue = lastHistoricalValue || avgHistoricalValue;
        if (baselineValue > 0) {
          forecast.totalGrowth = Math.round(((forecast.totalPredicted - (baselineValue * forecastPeriod)) / (baselineValue * forecastPeriod)) * 100);
        }
      }
      
      // Ensure totalGrowth is within reasonable bounds (-100% to 1000%)
      forecast.totalGrowth = Math.max(-100, Math.min(1000, forecast.totalGrowth));
    } else {
      forecast.totalGrowth = 0;
    }

    // First pass: generate dynamic month names
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

    // Second pass: calculate MoM (Month-over-Month) changes
    forecast.monthlyBreakdown = forecast.monthlyBreakdown.map((item, index) => {
      const prevMonthValue = index === 0 
        ? (historicalData.length > 0 ? historicalData[historicalData.length - 1].sales : item.predicted)
        : forecast.monthlyBreakdown[index - 1].predicted;
      const momChange = prevMonthValue !== 0 
        ? Math.round(((item.predicted - prevMonthValue) / prevMonthValue) * 100)
        : 0;
      
      return {
        ...item,
        momChange
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
        FROM customer_bulk_monthly 
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

      // Fetch top bulk customers data for AI context
      const currentDate = new Date();
      const previousYearMonths = [];
      for (let i = 0; i < period; i++) {
        const forecastDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth() + i + 1, 1);
        previousYearMonths.push(forecastDate.toISOString().split('T')[0]);
      }
      
      const monthConditions = previousYearMonths.map(month => 
        `(EXTRACT(YEAR FROM month_start) = EXTRACT(YEAR FROM '${month}'::date) AND EXTRACT(MONTH FROM month_start) = EXTRACT(MONTH FROM '${month}'::date))`
      ).join(' OR ');
      
      let topBulkCustomersData = await getSequelize().query(`
        SELECT month_start, customer_name, bulk_orders_amount, ranking
        FROM customer_bulk_monthly_by_name 
        WHERE (${monthConditions}) AND ranking <= 5
        ORDER BY month_start DESC, ranking ASC
      `, { type: QueryTypes.SELECT });
      
      // Fallback logic for missing months
      const monthsFound = new Set(topBulkCustomersData.map(item => item.month_start));
      const missingMonths = previousYearMonths.filter(month => 
        !monthsFound.has(month.replace(/-31$/, '-01').replace(/-30$/, '-01'))
      );
      
      if (missingMonths.length > 0) {
        const fallbackData = await getSequelize().query(`
          SELECT month_start, customer_name, bulk_orders_amount, ranking
          FROM customer_bulk_monthly_by_name 
          WHERE month_start >= date_trunc('month', CURRENT_DATE) - INTERVAL '12 months'
          AND ranking <= 5 ORDER BY month_start DESC, ranking ASC LIMIT 15
        `, { type: QueryTypes.SELECT });
        
        const existingMonths = new Set(topBulkCustomersData.map(item => item.month_start));
        const additionalData = fallbackData.filter(item => 
          !existingMonths.has(item.month_start) && 
          !previousYearMonths.some(pm => item.month_start === pm.replace(/-31$/, '-01').replace(/-30$/, '-01'))
        );
        topBulkCustomersData = [...topBulkCustomersData, ...additionalData];
      }

      // Group top bulk customers data by month for AI processing
      const groupedTopBulkCustomers = topBulkCustomersData.reduce((acc, item) => {
        const monthKey = item.month_start; // month_start is already a string from database
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push({
          customerName: item.customer_name,
          bulkOrdersAmount: parseFloat(item.bulk_orders_amount),
          ranking: parseInt(item.ranking)
        });
        return acc;
      }, {});

      // Format top bulk customers data for AI
      const formattedTopBulkCustomers = this.preprocessTopBulkCustomersForLLM(groupedTopBulkCustomers);

      const { forecast, usage } = await this.callOpenRouterAPIBulk(
        formattedData,
        period,
        groupedTopBulkCustomers
      );

      res.json({ 
        success: true, 
        forecast,
        metadata: {
          period: `${period} months`,
          historicalMonths: formattedData.length,
          generatedAt: new Date().toISOString(),
          source: 'openrouter',
          usage: usage || null
        }
      });
    } catch (error) {
      console.error('Error generating customer bulk forecast:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to generate customer bulk forecast';
      let details = error.message;
      
      if (error.message.includes('rate limited') || error.message.includes('429')) {
        errorMessage = 'AI service is temporarily busy. Please wait a moment and try again.';
        details = 'The forecasting service is experiencing high demand. Please try again in a few seconds.';
      } else if (error.message.includes("Model '") && error.message.includes("' not available")) {
        errorMessage = 'AI model is not available.';
        details = 'The selected AI model is not available on the service. Please contact support to update the model configuration.';
      } else if (error.message.includes('OpenRouter API error')) {
        errorMessage = 'AI forecasting service is temporarily unavailable.';
        details = 'The external AI service is experiencing issues. Please try again later.';
      } else if (error.message.includes('AI response is not valid JSON')) {
        errorMessage = 'AI service returned an unexpected response format.';
        details = 'The AI service provided a response that could not be processed. Please try again.';
      }
      
      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: details,
        retryable: error.message.includes('rate limited') || error.message.includes('429') || error.message.includes('temporarily')
      });
    }
  }
  // OpenRouter API integration in customer bulk forecast
  callOpenRouterAPIBulk = async (historicalBulkData, forecastPeriod, topBulkCustomersData = {}) => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const processedTopBulkCustomers = topBulkCustomersData;
    
    const prompt = `You are a business analyst AI. Forecast BULK ORDERS for Ammex.

CURRENT DATE: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-01
FORECAST PERIOD: Generate predictions for the NEXT ${forecastPeriod} months (do NOT include current month)

Historical Bulk Data (${historicalBulkData.length} months):
${JSON.stringify(historicalBulkData, null, 2)}

Historical Top Bulk Customers by Month (Previous Year Same Months + Recent Fallback):
${JSON.stringify(processedTopBulkCustomers, null, 2)}

Based on the historical top bulk customers from the same months in the previous year (and recent months as fallback), predict which customers will likely be top bulk customers in the forecasted months.

IMPORTANT: Respond with ONLY valid JSON. No markdown.
Return this exact structure:
{
  "period": "${forecastPeriod} months",
  "totalGrowth": number (percentage from 0-100, e.g., 15.5 for 15.5% growth),
  "monthlyBreakdown": [
    {
      "bulkOrdersCount": number,
      "bulkOrdersAmount": number
    }
  ],
  "topBulkCustomers": [
    "string customer name 1",
    "string customer name 2",
    "string customer name 3",
    "string customer name 4",
    "string customer name 5"
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
  ]
}`;

    try {
      // Single attempt only - no retries
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
        if (response.status === 404) {
          throw new Error(`Model not available on OpenRouter. Please try a different model.`);
        }
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        console.error('Invalid response format from OpenRouter API (bulk):', result);
        throw new Error('Invalid response format from OpenRouter API');
      }

      let aiResponse = result.choices[0].message.content;
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

      // Parse and validate JSON response
      try {
        if (!aiResponse || aiResponse.length === 0) {
          throw new Error('AI returned empty response - likely quota exceeded or model unavailable');
        }
        
        const forecast = JSON.parse(aiResponse);
        const validated = this.validateBulkForecastResponse(forecast, forecastPeriod, historicalBulkData);
        const usage = result.usage ? {
          prompt_tokens: result.usage.prompt_tokens,
          completion_tokens: result.usage.completion_tokens,
          total_tokens: result.usage.total_tokens
        } : null;
        return { forecast: validated, usage };
      } catch (parseError) {
        console.error('Failed to parse AI response (bulk):', parseError);
        console.error('Raw AI response (bulk):', aiResponse);
        console.error('Response length (bulk):', aiResponse?.length);
        console.error('First 200 chars (bulk):', aiResponse?.substring(0, 200));
        
        if (!aiResponse || aiResponse.length === 0) {
          throw new Error('AI service quota exceeded or model temporarily unavailable. Please try again later.');
        }
        
        throw new Error(`AI response is not valid JSON. Raw response: ${aiResponse?.substring(0, 500)}`);
      }
    } catch (error) {
      console.error('OpenRouter API call (bulk) failed:', error);
      throw error;
    }
  }

  validateBulkForecastResponse = (forecast, expectedPeriod, historicalData = []) => {
    if (!forecast || !Array.isArray(forecast.monthlyBreakdown)) {
      throw new Error('Invalid bulk forecast response');
    }

    // Validate and normalize totalGrowth to percentage
    if (typeof forecast.totalGrowth === 'number') {
      // If totalGrowth is > 100, assume it's an absolute value and convert to percentage
      if (forecast.totalGrowth > 100 && historicalData.length > 0) {
        const lastHistoricalValue = historicalData[historicalData.length - 1].bulkOrdersAmount;
        const totalHistoricalValue = historicalData.reduce((sum, item) => sum + item.bulkOrdersAmount, 0);
        const avgHistoricalValue = totalHistoricalValue / historicalData.length;
        
        // Calculate proper percentage growth
        const baselineValue = lastHistoricalValue || avgHistoricalValue;
        if (baselineValue > 0) {
          const totalPredicted = forecast.monthlyBreakdown.reduce((sum, item) => sum + item.bulkOrdersAmount, 0);
          forecast.totalGrowth = Math.round(((totalPredicted - (baselineValue * forecastPeriod)) / (baselineValue * forecastPeriod)) * 100);
        }
      }
      
      // Ensure totalGrowth is within reasonable bounds (-100% to 1000%)
      forecast.totalGrowth = Math.max(-100, Math.min(1000, forecast.totalGrowth));
    } else {
      forecast.totalGrowth = 0;
    }
    // First pass: generate dynamic month names
    const currentDate = new Date();
    forecast.monthlyBreakdown = forecast.monthlyBreakdown.map((item, index) => {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(currentDate.getMonth() + index + 1);
      const monthLabel = forecastDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        month: monthLabel,
        bulkOrdersCount: Math.max(0, Math.round(item.bulkOrdersCount || 0)),
        bulkOrdersAmount: Math.max(0, Math.round(item.bulkOrdersAmount || 0))
      };
    });

    // Second pass: calculate MoM (Month-over-Month) changes
    forecast.monthlyBreakdown = forecast.monthlyBreakdown.map((item, index) => {
      const prevMonthValue = index === 0 
        ? (historicalData.length > 0 ? historicalData[historicalData.length - 1].bulkOrdersAmount : item.bulkOrdersAmount)
        : forecast.monthlyBreakdown[index - 1].bulkOrdersAmount;
      const momChange = prevMonthValue !== 0 
        ? Math.round(((item.bulkOrdersAmount - prevMonthValue) / prevMonthValue) * 100)
        : 0;
      
      return {
        ...item,
        momChange
      };
    });
    forecast.insights = forecast.insights || [];
    forecast.recommendations = forecast.recommendations || [];
    return forecast;
  }


  // Get dashboard metrics (cached)
  async getDashboardMetrics(req, res) {
    try {
      const data = await getSequelize().query(`
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
      await getSequelize().query('SELECT refresh_sales_fact_monthly()', { type: QueryTypes.SELECT });
      
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