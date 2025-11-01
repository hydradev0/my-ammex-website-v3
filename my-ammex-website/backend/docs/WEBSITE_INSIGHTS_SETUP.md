# Website Analytics AI Insights - Setup Guide

## Overview

The AI Insights feature analyzes your website analytics data (category traffic, top clicked items, cart additions) and generates actionable business insights and recommendations using OpenRouter AI.

---

## Prerequisites

### 1. OpenRouter API Key

You need an OpenRouter API key. Get one from [OpenRouter.ai](https://openrouter.ai/)

### 2. Environment Variables

Add to your `.env` file:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_REFERER=http://localhost:3000  # Or your production URL
```

### 3. Website Analytics Data

Make sure you have:
- Analytics materialized views set up (see `backend/scripts/createWebsiteAnalytics.sql`)
- Event data being tracked (product clicks, cart additions)
- Materialized views refreshed with data

---

## How It Works

### Backend Flow:

1. **User clicks** "Generate AI Insights & Recommendations" button
2. **Backend fetches** all analytics data for selected date range:
   - Category traffic with percentages
   - Top 10 clicked products
   - Top 10 cart additions with values
3. **Data is sent to OpenRouter AI** (Qwen 2.5 model)
4. **AI analyzes** patterns and generates:
   - Key trends (4+ insights)
   - Actionable recommendations (5+ items)
5. **Results returned** as JSON to frontend
6. **Frontend displays** insights in beautiful cards

### API Endpoint:

```
POST /api/analytics/website/generate-insights
```

**Request Body:**
```json
{
  "start": "2025-10-01",
  "end": "2025-11-01"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      "Specific insight based on data...",
      "Another trend observation...",
      ...
    ],
    "recommendations": [
      "Actionable recommendation 1...",
      "Actionable recommendation 2...",
      ...
    ]
  },
  "metadata": {
    "dateRange": {
      "start": "2025-10-01",
      "end": "2025-11-01"
    },
    "dataPoints": {
      "categories": 5,
      "topItems": 10,
      "cartItems": 8,
      "totalClicks": 1250
    }
  }
}
```

---

## Testing

### 1. Check Environment Setup

```bash
# In backend directory
node -e "console.log(process.env.OPENROUTER_API_KEY ? '✅ API Key configured' : '❌ API Key missing')"
```

### 2. Test with curl

```bash
curl -X POST http://localhost:5000/api/analytics/website/generate-insights \
  -H "Content-Type: application/json" \
  -d '{"start":"2025-10-01","end":"2025-11-01"}' \
  --cookie "your_session_cookie"
```

### 3. Check Backend Logs

When generating insights, you should see:
```
📊 Generating AI insights for website analytics...
📅 Date range: 2025-10-01 to 2025-11-01
🤖 Calling OpenRouter AI...
📄 Raw AI response: {...}
✅ AI insights generated successfully
   - 4 trends identified
   - 5 recommendations provided
```

### 4. Test in Frontend

1. Go to Website Analytics page
2. Select date range
3. Click "Generate AI Insights & Recommendations"
4. Wait 3-10 seconds (depending on API response time)
5. View insights cards

---

## Troubleshooting

### Error: "OpenRouter API key not configured"

**Solution:**
```bash
# Add to .env file
OPENROUTER_API_KEY=sk-or-v1-...your-key...
```

Restart your backend server.

### Error: "Failed to generate insights"

**Check:**
1. OpenRouter API key is valid
2. You have credits/quota remaining on OpenRouter
3. Backend logs for specific error messages
4. Network connectivity

### Error: "Failed to parse AI response as JSON"

This means the AI returned invalid JSON. Check backend logs for the raw response.

**Solutions:**
- Usually resolves on retry
- Try with a different date range
- Check if data is valid (no null/undefined categories)

### Error: "DB not connected"

**Solution:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database connection

### No Data / Empty Insights

**Causes:**
- No analytics data for selected date range
- Materialized views not refreshed
- No events tracked yet

**Solutions:**
```sql
-- Check if data exists
SELECT * FROM mv_category_traffic_daily 
WHERE event_date >= CURRENT_DATE - INTERVAL '30 days';

-- Refresh materialized views
SELECT refresh_website_analytics();
```

---

## Configuration

### Change AI Model

Edit `backend/controllers/websiteAnalyticsController.js`:

```javascript
model: 'qwen/qwen2.5-vl-32b-instruct:free',  // Change this
```

Available models on OpenRouter:
- `qwen/qwen2.5-vl-32b-instruct:free` (Free, good quality)
- `openai/gpt-3.5-turbo` (Paid, very good)
- `openai/gpt-4` (Paid, excellent)
- `anthropic/claude-3-sonnet` (Paid, excellent)

### Adjust Temperature

Lower = more consistent, Higher = more creative

```javascript
temperature: 0.3,  // Range: 0.0 to 1.0
```

### Adjust Max Tokens

More tokens = longer responses

```javascript
max_tokens: 1500,  // Default
```

---

## Cost Considerations

### Free Model (Qwen 2.5)
- ✅ No cost
- ✅ Good quality insights
- ⚠️ Rate limited
- ⚠️ May have occasional downtime

### Paid Models (GPT-4, Claude)
- ✅ Higher quality
- ✅ More reliable
- ✅ Better rate limits
- ❌ Costs per request

**Typical Cost per Request:**
- Input: ~500-1000 tokens
- Output: ~300-500 tokens
- Total cost (GPT-4): $0.01-0.03 per request
- Total cost (GPT-3.5): $0.001-0.003 per request

---

## Security

### API Key Protection

✅ **Good:**
- Store in .env file
- Never commit to git
- Use environment variables

❌ **Bad:**
- Hardcode in source code
- Expose in frontend
- Share in logs

### Rate Limiting

Consider implementing rate limiting:

```javascript
// Example with express-rate-limit
const rateLimit = require('express-rate-limit');

const insightsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 requests per window
  message: 'Too many requests, please try again later'
});

router.post('/website/generate-insights', insightsLimiter, websiteAnalyticsController.generateInsights);
```

---

## Advanced Usage

### Custom Prompts

Edit the prompt in `backend/controllers/websiteAnalyticsController.js` to get different insights:

```javascript
const prompt = `You are a business analyst AI specializing in e-commerce website analytics for Ammex company. Analyze the following website traffic data and provide actionable insights and recommendations.

DATA PERIOD: ${startDate.toISOString().slice(0,10)} to ${endDate.toISOString().slice(0,10)}

CATEGORY TRAFFIC (Total clicks: ${totalClicks}):
${JSON.stringify(totalCategoryData, null, 2)}

TOP CLICKED PRODUCTS:
${JSON.stringify(topItemsData, null, 2)}

MOST ADDED TO CART:
${JSON.stringify(cartData, null, 2)}

Based on this data, provide:
1. Key trends and patterns in user behavior
2. Actionable recommendations for improving conversions, product placement, and marketing

// ... customize this prompt for your needs
`;
```

### Caching Results

To reduce API costs, consider caching insights:

```javascript
const NodeCache = require('node-cache');
const insightsCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

// In generateInsights method:
const cacheKey = `insights_${startParam}_${endParam}`;
const cachedInsights = insightsCache.get(cacheKey);

if (cachedInsights) {
  return res.json({ success: true, data: cachedInsights, cached: true });
}

// ... generate insights ...

insightsCache.set(cacheKey, insights);
```

---

## Files Modified

**Backend:**
- `controllers/websiteAnalyticsController.js` - Added `generateInsights()` method
- `routes/analytics.js` - Added POST `/website/generate-insights` route

**Frontend:**
- `services/websiteAnalytics.js` - Added `generateAIInsights()` function
- `Components-Analytics/WebsiteData.jsx` - Updated to call real API

---

## Next Steps

1. ✅ Set up OpenRouter API key
2. ✅ Test the endpoint
3. ✅ Generate your first insights!
4. 📊 Monitor usage and costs
5. 🎨 Customize prompts for your business needs
6. 🔒 Add rate limiting for production

---

## Support

**OpenRouter Documentation:**
- https://openrouter.ai/docs

**Questions?**
- Check backend logs for detailed error messages
- Review the prompt and AI response in logs
- Test with smaller date ranges first

---

**Last Updated:** November 2025
**Version:** 1.0

