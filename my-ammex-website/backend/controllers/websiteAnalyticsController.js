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

      // Create prompt for AI
      const prompt = `You are a business analyst AI specializing in e-commerce website analytics and conversion optimization for Ammex company. Analyze the following website traffic data and provide actionable insights and recommendations.

DATA PERIOD: ${dateRange?.start || 'N/A'} to ${dateRange?.end || 'N/A'}

CATEGORY TRAFFIC (Total clicks: ${totalClicks}):
${JSON.stringify(totalCategoryData, null, 2)}

TOP CLICKED PRODUCTS:
${JSON.stringify(topItemsData, null, 2)}

MOST ADDED TO CART:
${JSON.stringify(cartData, null, 2)}

CRITICAL ANALYSIS FOCUS:
1. **Conversion Funnel Issues**: Compare products in "Top Clicked" vs "Most Added to Cart"
   - Identify items with HIGH CLICKS but LOW/NO cart additions → Price issues? Out of stock? Poor product description?
   - Identify items with HIGH cart additions → Potential for upselling, bundling, or checkout optimization

2. **Category Performance**: Analyze click-through rates and conversion patterns by category

3. **Revenue Opportunities**: Find underperforming high-interest items that need optimization

Based on this data, provide:
- Key trends focusing on conversion funnel drop-offs and opportunities
- Actionable recommendations for improving conversions, especially for high-click-low-cart items

IMPORTANT: Respond with ONLY valid JSON. No markdown formatting, no explanations outside the JSON.

Return this exact JSON structure:
{
  "trends": [
    "First key trend (mention specific products with numbers - e.g., 'Product X has 450 clicks but only 12 cart additions (2.7% conversion) - suggests pricing or availability issues')",
    "Second key trend (conversion funnel insight)",
    "Third key trend (category performance insight)",
    "Fourth key trend (revenue opportunity insight)"
  ],
  "recommendations": [
    "First recommendation (specific action for high-click-low-cart items)",
    "Second recommendation (specific action for high-cart items - discounts, urgency, etc.)",
    "Third recommendation (category or marketing specific)",
    "Fourth recommendation (product optimization specific)",
    "Fifth recommendation (checkout or conversion improvement)"
  ]
}

Rules:
- ALWAYS compare clicked items vs cart additions to find conversion issues
- Mention specific product names and model numbers
- Include actual numbers and percentages from the data
- Focus on actionable insights that can improve revenue
- Identify both problems (high click, low cart) AND opportunities (high cart additions)
- Keep each point concise but data-driven`;

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
          !insights.recommendations || !Array.isArray(insights.recommendations)) {
        throw new Error('Invalid insights structure from AI');
      }

      console.log('✅ AI insights generated successfully');
      console.log(`   - ${insights.trends.length} trends identified`);
      console.log(`   - ${insights.recommendations.length} recommendations provided`);

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


