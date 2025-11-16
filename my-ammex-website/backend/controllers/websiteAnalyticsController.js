const { QueryTypes } = require('sequelize');
const { getSequelize } = require('../config/db');

const parseDate = (value, fallback) => {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
};

class WebsiteAnalyticsController {
  async getCategoryTraffic(req, res) {
    try {
      const sequelize = getSequelize();
      if (!sequelize) return res.status(500).json({ success: false, error: 'DB not connected' });

      const { start, end } = req.query || {};
      const endDate = parseDate(end, new Date());
      const startDate = parseDate(start, new Date(endDate.getFullYear(), endDate.getMonth() - 2, endDate.getDate()));

      const rows = await sequelize.query(
        `SELECT category, SUM(clicks)::bigint AS clicks
         FROM mv_category_traffic_daily
         WHERE event_date BETWEEN :start::date AND :end::date
         GROUP BY category
         ORDER BY clicks DESC`,
        { type: QueryTypes.SELECT, replacements: { start: startDate.toISOString().slice(0,10), end: endDate.toISOString().slice(0,10) } }
      );

      const total = rows.reduce((s, r) => s + Number(r.clicks || 0), 0) || 1;
      const data = rows.map(r => ({
        category: r.category,
        clicks: Number(r.clicks),
        percentage: Math.round((Number(r.clicks) / total) * 100)
      }));
      return res.json({ success: true, data });
    } catch (err) {
      console.error('Category traffic error:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch category traffic' });
    }
  }

  async getTopClickedItems(req, res) {
    try {
      const sequelize = getSequelize();
      if (!sequelize) return res.status(500).json({ success: false, error: 'DB not connected' });

      const { start, end, limit = 5 } = req.query || {};
      const endDate = parseDate(end, new Date());
      const startDate = parseDate(start, new Date(endDate.getFullYear(), endDate.getMonth() - 2, endDate.getDate()));

      const rows = await sequelize.query(
        `SELECT product_name AS name, model_no, SUM(clicks)::bigint AS clicks
         FROM mv_top_clicked_items_daily
         WHERE event_date BETWEEN :start::date AND :end::date
         GROUP BY product_name, model_no
         ORDER BY clicks DESC
         LIMIT :limit`,
        { type: QueryTypes.SELECT, replacements: { start: startDate.toISOString().slice(0,10), end: endDate.toISOString().slice(0,10), limit: Number(limit) } }
      );

      const data = rows.map(r => ({ name: r.name, modelNo: r.model_no, clicks: Number(r.clicks) }));
      return res.json({ success: true, data });
    } catch (err) {
      console.error('Top clicked items error:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch top clicked items' });
    }
  }

  async getCartAdditions(req, res) {
    try {
      const sequelize = getSequelize();
      if (!sequelize) return res.status(500).json({ success: false, error: 'DB not connected' });

      const { start, end } = req.query || {};
      const endDate = parseDate(end, new Date());
      const startDate = parseDate(start, new Date(endDate.getFullYear(), endDate.getMonth() - 2, endDate.getDate()));

      const rows = await sequelize.query(
        `SELECT product_name AS name,
                model_no,
                SUM(additions)::bigint AS additions,
                SUM(value_cents_total)::bigint AS value_cents_total
         FROM mv_cart_additions_daily
         WHERE event_date BETWEEN :start::date AND :end::date
         GROUP BY product_name, model_no
         ORDER BY additions DESC`,
        { type: QueryTypes.SELECT, replacements: { start: startDate.toISOString().slice(0,10), end: endDate.toISOString().slice(0,10) } }
      );

      const data = rows.map(r => ({
        name: r.name,
        modelNo: r.model_no,
        additions: Number(r.additions),
        value: Math.round(Number(r.value_cents_total || 0) / 100)
      }));
      return res.json({ success: true, data });
    } catch (err) {
      console.error('Cart additions error:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch cart additions' });
    }
  }

  async refresh(req, res) {
    try {
      const sequelize = getSequelize();
      if (!sequelize) return res.status(500).json({ success: false, error: 'DB not connected' });
      await sequelize.query('SELECT refresh_website_analytics()');
      return res.json({ success: true, message: 'Website analytics refreshed' });
    } catch (err) {
      console.error('Refresh website analytics error:', err);
      return res.status(500).json({ success: false, error: 'Failed to refresh website analytics' });
    }
  }

  async ingestEvent(req, res) {
    try {
      const sequelize = getSequelize();
      if (!sequelize) return res.status(500).json({ success: false, error: 'DB not connected' });

      const eventData = req.body;

      // Validate required fields
      if (!eventData.event_type) {
        return res.status(400).json({ success: false, error: 'event_type is required' });
      }

      // Set defaults
      const event = {
        event_type: eventData.event_type,
        occurred_at: eventData.occurred_at || new Date().toISOString(),
        user_id: eventData.user_id || null,
        session_id: eventData.session_id || null,
        product_id: eventData.product_id || null,
        product_name: eventData.product_name || null,
        model_no: eventData.model_no || null,
        category: eventData.category || null,
        value_cents: eventData.value_cents || null,
        currency: eventData.currency || 'USD',
        page_path: eventData.page_path || null,
        referrer: eventData.referrer || null,
        user_agent: eventData.user_agent || req.headers['user-agent'] || null,
        properties: eventData.properties || {}
      };

      // Insert event
      await sequelize.query(`
        INSERT INTO "Event" (event_type, occurred_at, user_id, session_id, product_id, product_name, model_no, category, value_cents, currency, page_path, referrer, user_agent, properties)
        VALUES (:event_type, :occurred_at, :user_id, :session_id, :product_id, :product_name, :model_no, :category, :value_cents, :currency, :page_path, :referrer, :user_agent, :properties::jsonb)
      `, {
        replacements: {
          ...event,
          properties: JSON.stringify(event.properties)
        },
        type: require('sequelize').QueryTypes.INSERT
      });

      return res.json({ success: true, message: 'Event ingested successfully' });
    } catch (err) {
      console.error('❌ Ingest event error:', err);
      return res.status(500).json({ success: false, error: 'Failed to ingest event' });
    }
  }

  async generateInsights(req, res) {
    try {
      // Check for OpenRouter API key
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        return res.status(500).json({ success: false, error: 'OpenRouter API key not configured' });
      }

      // Get data from request body (already loaded in frontend)
      const { categoryTraffic, topClickedItems, cartAdditions, dateRange } = req.body || {};

      if (!categoryTraffic || !topClickedItems || !cartAdditions) {
        return res.status(400).json({ success: false, error: 'Missing analytics data' });
      }

      console.log('📊 Generating AI insights for website analytics...');
      console.log(`📅 Date range: ${dateRange?.start || 'N/A'} to ${dateRange?.end || 'N/A'}`);
      console.log(`📈 Data received: ${categoryTraffic.length} categories, ${topClickedItems.length} items, ${cartAdditions.length} cart items`);

      // Data is already processed by frontend, just clean it up for AI
      const totalCategoryData = categoryTraffic;
      const topItemsData = topClickedItems;
      const cartData = cartAdditions;

      const totalClicks = totalCategoryData.reduce((sum, cat) => sum + (cat.clicks || 0), 0);

      // Fetch stock information for all products in the analytics data
      const sequelize = getSequelize();
      if (!sequelize) {
        return res.status(500).json({ success: false, error: 'DB not connected' });
      }

      // Collect all unique model_no values from topClickedItems and cartAdditions
      const modelNos = new Set();
      topItemsData.forEach(item => {
        if (item.modelNo) modelNos.add(item.modelNo);
      });
      cartData.forEach(item => {
        if (item.modelNo) modelNos.add(item.modelNo);
      });

      // Fetch stock information for all products
      let stockMap = {};
      if (modelNos.size > 0) {
        try {
          const modelNoArray = Array.from(modelNos);
          // Create placeholders for IN clause
          const placeholders = modelNoArray.map((_, index) => `:modelNo${index}`).join(',');
          const replacements = {};
          modelNoArray.forEach((modelNo, index) => {
            replacements[`modelNo${index}`] = modelNo;
          });

          const stockRows = await sequelize.query(
            `SELECT model_no, quantity, min_level, is_active, selling_price, supplier_price
             FROM "Item"
             WHERE model_no IN (${placeholders})`,
            {
              type: QueryTypes.SELECT,
              replacements: replacements
            }
          );

          // Create a map of model_no to stock and pricing info
          stockRows.forEach(row => {
            const supplierPrice = Number(row.supplier_price || 0);
            const sellingPrice = Number(row.selling_price || 0);
            const margin = sellingPrice - supplierPrice;
            const marginPercentage = supplierPrice > 0 ? ((sellingPrice - supplierPrice) / supplierPrice) * 100 : 0;
            
            stockMap[row.model_no] = {
              quantity: Number(row.quantity || 0),
              minLevel: Number(row.min_level || 0),
              isActive: row.is_active !== false,
              stockStatus: row.quantity === 0 ? 'OUT OF STOCK' : 
                          row.quantity <= (row.min_level || 0) ? 'LOW STOCK' : 'IN STOCK',
              pricing: {
                supplierPrice: supplierPrice,
                sellingPrice: sellingPrice,
                margin: margin,
                marginPercentage: Math.round(marginPercentage * 100) / 100 // Round to 2 decimal places
              }
            };
          });

          // Enhance topItemsData with stock and pricing information
          topItemsData.forEach(item => {
            if (stockMap[item.modelNo]) {
              item.stock = stockMap[item.modelNo];
            } else {
              // Product not found in Item table
              item.stock = { quantity: null, stockStatus: 'UNKNOWN', pricing: null };
            }
          });

          // Enhance cartData with stock and pricing information
          cartData.forEach(item => {
            if (stockMap[item.modelNo]) {
              item.stock = stockMap[item.modelNo];
            } else {
              // Product not found in Item table
              item.stock = { quantity: null, stockStatus: 'UNKNOWN', pricing: null };
            }
          });

          console.log(`📦 Stock data fetched for ${Object.keys(stockMap).length} products`);
        } catch (stockError) {
          console.error('⚠️ Error fetching stock data:', stockError);
          // Continue without stock data rather than failing completely
        }
      }

      // Create prompt for AI
      const prompt = `You are a business analyst AI specializing in e-commerce website analytics and conversion optimization for Ammex company. Analyze the following website traffic data and provide actionable insights and recommendations.

DATA PERIOD: ${dateRange?.start || 'N/A'} to ${dateRange?.end || 'N/A'}

CATEGORY TRAFFIC (Total clicks: ${totalClicks}):
${JSON.stringify(totalCategoryData, null, 2)}

TOP CLICKED PRODUCTS (with stock information):
${JSON.stringify(topItemsData, null, 2)}

MOST ADDED TO CART (with stock information):
${JSON.stringify(cartData, null, 2)}

NOTE: Each product in the data above includes a "stock" object with:
- quantity: Current stock quantity (0 = OUT OF STOCK)
- minLevel: Minimum stock level threshold
- stockStatus: "OUT OF STOCK", "LOW STOCK", "IN STOCK", or "UNKNOWN"
- isActive: Whether the product is currently active
- pricing: Object containing pricing information (if available):
  - supplierPrice: Cost price from supplier (₱)
  - sellingPrice: Current selling price (₱)
  - margin: Profit margin (sellingPrice - supplierPrice) in ₱

CRITICAL ANALYSIS FOCUS:
1. **Conversion Funnel Issues**: Compare products in "Top Clicked" vs "Most Added to Cart"
   - Identify items with HIGH CLICKS but LOW/NO cart additions → Price issues? Out of stock? Poor product description?
   - Identify items with HIGH cart additions → Potential for upselling, bundling, or checkout optimization

2. **Stock Availability Analysis**: Analyze stock levels as a key factor in conversion drop-offs
   - Stock data is AVAILABLE in the product data above - CHECK the "stock" object for each product
   - Products with HIGH CLICKS but LOW/NO cart additions may be OUT OF STOCK or have LOW STOCK - CHECK stock.quantity and stock.stockStatus
   - Stock availability is a critical factor - customers cannot add out-of-stock items to cart
   - ALWAYS mention stock status (OUT OF STOCK, LOW STOCK, IN STOCK) in your analysis when discussing products
   - For products with high interest but no cart additions, PRIORITIZE stock issues FIRST (if stock.quantity = 0 or stock.stockStatus = "OUT OF STOCK", that's the primary issue)
   - Use actual stock numbers from stock.quantity in your analysis (e.g., "Product X has 0 stock units - out of stock")

3. **Category Performance**: Analyze click-through rates and conversion patterns by category

4. **Revenue Opportunities**: Find underperforming high-interest items that need optimization

5. **DISCOUNT SUGGESTIONS**: Identify products that would benefit from promotional discounts to boost conversions
   - **CRITICAL**: Pricing data is AVAILABLE in stock.pricing object - USE IT to determine safe discount percentages!
   - **Margin Analysis**: Check stock.pricing.marginPercentage for each product. Products with higher margins can safely have larger discounts.
   - **Discount Safety Rules**:
     * DO NOT recommend discounts that would reduce selling price below supplier price (stock.pricing.supplierPrice)
     * Maximum safe discount = stock.pricing.marginPercentage (e.g., if margin is 30%, max safe discount is ~25% to leave small buffer)
     * Typical margin is ~30%, so safe discount range is usually 5-25% depending on margin
     * For products with lower margins (<20%), suggest smaller discounts (5-10%)
     * For products with higher margins (>30%), can suggest larger discounts (15-25%)
   - Stock data is AVAILABLE - CHECK stock.stockStatus for each product before suggesting discounts
   - ONLY suggest discounts for products with stock.stockStatus = "IN STOCK" or stock.quantity > 0
   - DO NOT suggest discounts for products with stock.stockStatus = "OUT OF STOCK" (they need stock replenishment, not discounts)
   - For products with stock.stockStatus = "LOW STOCK", discounts may help move remaining inventory
   - Strategic discounts to move inventory or increase cart additions
   - Maximum 5 products to discount

Based on this data, provide:
- Key trends focusing on conversion funnel drop-offs and opportunities
- Actionable recommendations for improving conversions, especially for high-click-low-cart items
- SPECIFIC PRODUCTS TO DISCOUNT with recommended discount percentages (max 5 products)

IMPORTANT: Respond with ONLY valid JSON. No markdown formatting, no explanations outside the JSON.

Return this exact JSON structure:
{
  "trends": [
    "First key trend (mention specific products with numbers - e.g., 'Product X has 450 clicks but only 12 cart additions (2.7% conversion) - suggests pricing or stock availability issues)",
    "Second key trend (conversion funnel insight - prioritize stock availability when analyzing high-click-low-cart items, use stock.stockStatus from data)",
    "Third key trend (category performance insight)",
    "Fourth key trend (revenue opportunity insight - mention stock status for products discussed)"
  ],
  "recommendations": [
    "First recommendation (specific action for high-click-low-cart items - check stock availability first, then price)",
    "Second recommendation (specific action for high-cart items - discounts, urgency, etc.)",
    "Third recommendation (category or marketing specific)",
    "Fourth recommendation (product optimization specific - may include stock replenishment if out of stock)",
    "Fifth recommendation (checkout or conversion improvement)"
  ],
  "suggestedDiscounts": [
    {
      "productName": "Exact product name from data",
      "modelNo": "Exact model number from data",
      "reason": "Brief reason why this product needs discount (e.g., 'High cart additions (120) but low orders (5) - price sensitivity at checkout. Current margin: 30%, safe discount range: 10-25%. NOTE: Only suggest discount if product is IN STOCK')",
      "expectedImpact": "Brief expected impact (e.g., 'Could improve cart-to-checkout conversion by 30-40%, boosting orders significantly')"
      "recommendedDiscount": 15,
      "maxSafeDiscount": 25,
      "currentMargin": 30,
      "sellingPrice": 1000,
      "discountedPrice": 850,
    }
  ]
}

Rules:
- ALWAYS compare clicked items vs cart additions to find conversion issues
- Stock data is INCLUDED in the product data above - USE IT! Check the "stock" object for each product
- When analyzing high clicks but low/no cart additions, PRIORITIZE checking stock.stockStatus FIRST before assuming price issues
- If stock.quantity = 0 or stock.stockStatus = "OUT OF STOCK", that's the PRIMARY issue - mention it explicitly in analysis
- Stock availability is critical - customers cannot add out-of-stock items to cart, which directly causes conversion drop-offs
- ALWAYS mention stock status (OUT OF STOCK, LOW STOCK, IN STOCK) when discussing products in trends and recommendations
- Include actual stock quantities in your analysis (e.g., "Product X has 450 clicks but 0 stock units - out of stock issue")
- Mention specific product names and model numbers
- Include actual numbers (₱ use this before the number, example: ₱1000) and percentages from the data
- Focus on actionable insights that can improve revenue (NOT WITH WEBSITE PERFORMANCE)
- Identify both problems (high click, low cart) AND opportunities (high cart additions)
- Keep each point concise but data-driven
- For suggestedDiscounts: Choose UP TO 5 products max from the provided data
- **CRITICAL**: Use stock.pricing data to determine safe discount percentages:
  * Check stock.pricing.marginPercentage for each product
  * recommendedDiscount must be LESS THAN marginPercentage (leave at least 2-5% buffer)
  * maxSafeDiscount = marginPercentage - 2% (minimum buffer to avoid loss)
  * Calculate discountedPrice = sellingPrice * (1 - recommendedDiscount / 100)
  * ALWAYS include currentMargin, sellingPrice, and discountedPrice in response
  * Example: If margin is 30%, max safe discount is ~25-28%, so recommend 15-20%
- Only suggest discounts for products that actually exist in the TOP CLICKED or CART data
- ONLY suggest discounts for products where stock.stockStatus = "IN STOCK" or stock.quantity > 0
- DO NOT suggest discounts for products where stock.stockStatus = "OUT OF STOCK" - they need stock replenishment, not discounts
- DO NOT suggest discounts for products without pricing data (stock.pricing is null)
- Focus on cart-to-checkout conversion (high cart additions but low orders), NOT click-to-cart conversion
- If no products need discounts, return empty array []`;

      console.log('🤖 Calling OpenRouter AI...');

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
          'X-Title': 'Ammex Website Analytics Insights'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional e-commerce business analyst specializing in conversion optimization. Always respond with valid JSON format only. Focus on identifying conversion funnel issues by comparing product clicks vs cart additions. Provide specific, data-driven insights with actual numbers.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response structure from OpenRouter');
      }

      let aiResponse = result.choices[0].message.content;
      console.log('📄 Raw AI response:', aiResponse);

      // Clean up response (remove markdown if present)
      aiResponse = aiResponse.trim();
      if (aiResponse.startsWith('```json')) {
        aiResponse = aiResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      } else if (aiResponse.startsWith('```')) {
        aiResponse = aiResponse.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }

      // Parse AI response
      let insights;
      try {
        insights = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError);
        console.error('Raw response:', aiResponse);
        throw new Error('Failed to parse AI response as JSON');
      }

      // Validate structure
      if (!insights.trends || !Array.isArray(insights.trends) || 
          !insights.recommendations || !Array.isArray(insights.recommendations) ||
          !insights.suggestedDiscounts || !Array.isArray(insights.suggestedDiscounts)) {
        throw new Error('Invalid insights structure from AI');
      }

      console.log('✅ AI insights generated successfully');
      console.log(`   - ${insights.trends.length} trends identified`);
      console.log(`   - ${insights.recommendations.length} recommendations provided`);
      console.log(`   - ${insights.suggestedDiscounts.length} products suggested for discount`);

      return res.json({ 
        success: true, 
        data: insights,
        metadata: {
          dateRange: dateRange,
          dataPoints: {
            categories: totalCategoryData.length,
            topItems: topItemsData.length,
            cartItems: cartData.length,
            totalClicks: totalClicks
          }
        }
      });
    } catch (err) {
      console.error('❌ Generate insights error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate insights',
        details: err.message 
      });
    }
  }
}

module.exports = new WebsiteAnalyticsController();


