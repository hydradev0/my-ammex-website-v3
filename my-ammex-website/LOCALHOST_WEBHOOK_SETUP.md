# 🔧 Localhost Webhook Setup for PayMongo Testing

## The Problem 🚫

PayMongo webhooks cannot reach `http://localhost:5000` because:
- Webhooks require a publicly accessible URL
- Localhost is only accessible from your machine
- PayMongo servers cannot send webhooks to your local development environment

## The Solution ✅

Use a tunneling service to expose your localhost to the internet so PayMongo can send webhooks.

## Option 1: Using ngrok (Recommended)

### Step 1: Install ngrok
```bash
# Download from https://ngrok.com/download
# Or install via package manager
npm install -g ngrok
```

### Step 2: Start your backend server
```bash
cd my-ammex-website/backend
npm start
```

### Step 3: Expose localhost with ngrok
```bash
# In a new terminal
ngrok http 5000
```

You'll see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:5000
```

### Step 4: Configure PayMongo Webhook
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/developers/webhooks)
2. Create a new webhook with URL: `https://abc123.ngrok.io/api/payments/webhook`
3. Select events:
   - ✅ `payment.paid`
   - ✅ `payment.failed`
   - ✅ `source.chargeable`
4. Copy the webhook secret (starts with `whsec_`)

### Step 5: Update Backend Environment
Add to your `backend/.env`:
```env
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 6: Test the Setup
1. Make a test payment
2. Check your backend console for webhook logs:
   ```
   ========================================
   🔔 WEBHOOK RECEIVED
   Time: 2025-01-18T12:00:00.000Z
   Method: POST
   URL: /api/payments/webhook
   ========================================
   ```

## Option 2: Using localtunnel

### Step 1: Install localtunnel
```bash
npm install -g localtunnel
```

### Step 2: Start your backend server
```bash
cd my-ammex-website/backend
npm start
```

### Step 3: Expose localhost with localtunnel
```bash
# In a new terminal
lt --port 5000 --subdomain ammex-test
```

You'll get a URL like: `https://ammex-test.loca.lt`

### Step 4: Configure PayMongo Webhook
Use URL: `https://ammex-test.loca.lt/api/payments/webhook`

## Option 3: Using Cloudflare Tunnel

### Step 1: Install cloudflared
```bash
# Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
```

### Step 2: Create tunnel
```bash
cloudflared tunnel --url http://localhost:5000
```

## Important Notes 📝

### ngrok Considerations
- **Free tier**: URLs change every time you restart ngrok
- **Paid tier**: Can get static URLs
- **Rate limits**: Free tier has request limits

### localtunnel Considerations
- **Free**: No account required
- **URLs change**: Each restart gets new URL
- **Less reliable**: Sometimes has connectivity issues

### Security
- Only use for development/testing
- Never use tunneling services in production
- Webhook signature verification is disabled in development (see webhook handler)

## Testing Webhook Delivery

### Check ngrok Web Interface
1. Go to `http://127.0.0.1:4040` (ngrok web interface)
2. Click on your tunnel
3. See all requests including webhooks

### Backend Logs
Watch for these logs in your backend console:
```
========================================
🔔 WEBHOOK RECEIVED
Time: 2025-01-18T12:00:00.000Z
Method: POST
URL: /api/payments/webhook
Headers: {...}
Body: {...}
========================================
📦 Event Type: payment.paid
📦 Event ID: evt_1234567890
📦 Event Data: {...}
▶️ Processing payment.paid event...
✅ payment.paid processed
```

## Troubleshooting 🔧

### Webhook Not Received
1. Check if ngrok is running: `ngrok http 5000`
2. Verify webhook URL in PayMongo dashboard
3. Check ngrok web interface for requests
4. Ensure backend is running on port 5000

### Webhook Received But Payment Not Updated
1. Check backend console for error logs
2. Verify database connection
3. Check webhook signature (disabled in dev)
4. Ensure payment record exists in database

### URL Changes Frequently
- Use ngrok paid plan for static URLs
- Or update PayMongo webhook URL each time
- Consider using a development server instead

## Production Deployment

For production, you don't need tunneling services:
1. Deploy your backend to a cloud service (Render, Railway, Heroku, etc.)
2. Configure PayMongo webhook to point to your deployed URL
3. Enable webhook signature verification
4. Remove development-only code

## Summary ✅

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| ngrok | Reliable, good debugging tools | Free tier URLs change | Development |
| localtunnel | Free, no account needed | Less reliable | Quick testing |
| Cloudflare | Very reliable | More complex setup | Production-like testing |

**Recommended**: Use ngrok for localhost development with PayMongo webhooks.
