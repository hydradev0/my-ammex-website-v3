# 🚀 Production Webhook Setup Guide

## Overview

This guide will help you set up PayMongo webhooks for production deployment. Webhooks are essential for processing payments automatically when customers complete transactions.

## 🔧 **Step 1: Deploy Your Backend**

### Option A: Using Render (Recommended)
1. **Connect your GitHub repository** to Render
2. **Create a new Web Service**
3. **Configure environment variables** (see Step 3)
4. **Deploy** your backend

### Option B: Using Railway
1. **Connect your GitHub repository** to Railway
2. **Deploy** your backend
3. **Configure environment variables** (see Step 3)

### Option C: Using Heroku
1. **Create a new app** on Heroku
2. **Connect your GitHub repository**
3. **Deploy** your backend
4. **Configure environment variables** (see Step 3)

## 🌐 **Step 2: Get Your Backend URL**

After deployment, you'll get a URL like:
- **Render**: `https://your-app-name.onrender.com`
- **Railway**: `https://your-app-name.railway.app`
- **Heroku**: `https://your-app-name.herokuapp.com`

**Your webhook URL will be**: `https://your-backend-url.com/api/payments/webhook`

## 🔑 **Step 3: Configure Environment Variables**

### Backend Environment Variables

Add these to your production backend environment:

```env
# Environment
NODE_ENV=production
PORT=5000

# Database (use your production database)
DATABASE_URL=postgresql://username:password@host:port/database

# JWT (use strong, unique secrets)
JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Frontend URL (your customer-facing domain)
FRONTEND_URL=https://your-domain.com

# PayMongo Configuration (use LIVE keys for production)
PAYMONGO_SECRET_KEY=sk_live_your_live_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_live_your_live_public_key_here
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Frontend Environment Variables

Add these to your production frontend environment:

```env
# Backend API URL
VITE_API_BASE_URL=https://your-backend-url.com/api

# PayMongo Public Key (use LIVE key for production)
VITE_PAYMONGO_PUBLIC_KEY=pk_live_your_live_public_key_here

# Frontend URL
VITE_FRONTEND_URL=https://your-domain.com
```

## 🔔 **Step 4: Configure PayMongo Webhook**

### 4.1 Access PayMongo Dashboard
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to **Developers** → **Webhooks**

### 4.2 Create New Webhook
1. Click **"Create Webhook"**
2. **Webhook URL**: `https://your-backend-url.com/api/payments/webhook`
3. **Events to listen**:
   - ✅ `payment.paid`
   - ✅ `payment.failed`
   - ✅ `source.chargeable`
4. **Status**: Enabled
5. Click **"Create"**

### 4.3 Copy Webhook Secret
1. After creating, copy the webhook secret (starts with `whsec_`)
2. Add it to your backend environment variables as `PAYMONGO_WEBHOOK_SECRET`

## 🧪 **Step 5: Test Your Setup**

### 5.1 Test Webhook Endpoint
```bash
curl -X POST https://your-backend-url.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"data":{"type":"test"}}'
```

You should see webhook logs in your backend console.

### 5.2 Test Payment Flow
1. **Make a test payment** using PayMongo test cards
2. **Check your backend logs** for webhook events
3. **Verify notifications** appear in your application
4. **Check database** for updated payment records

## 📊 **Step 6: Monitor Webhook Delivery**

### 6.1 PayMongo Dashboard
1. Go to **Developers** → **Webhooks**
2. Click on your webhook
3. Check **"Recent Events"** tab
4. Look for successful deliveries

### 6.2 Backend Logs
Watch for these logs in your production backend:
```
========================================
🔔 WEBHOOK RECEIVED
Time: 2025-01-18T12:00:00.000Z
Method: POST
URL: /api/payments/webhook
========================================
📦 Event Type: payment.paid
📦 Event ID: evt_1234567890
▶️ Processing payment.paid event...
✅ payment.paid processed
```

## 🔒 **Step 7: Security Considerations**

### 7.1 Webhook Signature Verification
Your webhook handler already includes signature verification:
```javascript
// In your webhook handler
if (signature && !paymongoService.verifyWebhookSignature(rawBody, signature)) {
  console.error('❌ Invalid webhook signature');
  return res.status(401).json({
    success: false,
    message: 'Invalid webhook signature'
  });
}
```

### 7.2 Environment Security
- ✅ Use strong, unique secrets
- ✅ Never commit secrets to version control
- ✅ Use environment variables for all sensitive data
- ✅ Regularly rotate your secrets

## 🚨 **Troubleshooting**

### Webhook Not Receiving Events
1. **Check webhook URL** - ensure it's publicly accessible
2. **Verify webhook configuration** in PayMongo dashboard
3. **Check backend logs** for errors
4. **Test webhook endpoint** manually

### Payments Not Being Processed
1. **Check webhook signature verification**
2. **Verify database connection**
3. **Check payment record exists** in database
4. **Review webhook handler logs**

### Notifications Not Appearing
1. **Check notification creation** in webhook handler
2. **Verify customer ID** is correct
3. **Check notification polling** in frontend
4. **Review database** for notification records

## 📋 **Production Checklist**

- [ ] Backend deployed and accessible
- [ ] Environment variables configured
- [ ] PayMongo webhook created and configured
- [ ] Webhook secret added to backend
- [ ] Webhook endpoint tested
- [ ] Payment flow tested end-to-end
- [ ] Notifications working
- [ ] Database updates working
- [ ] Error handling in place
- [ ] Monitoring set up

## 🎯 **Expected Behavior**

### For Card Payments (Non-3DS)
1. Customer enters card details
2. Payment processes immediately
3. PayMongo sends `payment.paid` webhook
4. Backend processes webhook
5. Payment status updated to 'succeeded'
6. Invoice balance updated
7. Notifications created
8. Customer sees success message

### For Card Payments (3DS)
1. Customer enters card details
2. Redirected to 3DS authentication
3. Customer completes authentication
4. PayMongo sends `payment.paid` webhook
5. Backend processes webhook
6. Customer redirected to success page
7. Payment status updated
8. Notifications created

### For E-wallet Payments
1. Customer selects e-wallet (GCash, GrabPay, Maya)
2. Redirected to e-wallet checkout
3. Customer completes payment
4. PayMongo sends `source.chargeable` webhook
5. Backend processes webhook
6. Customer redirected to success page
7. Payment status updated
8. Notifications created

## 🆘 **Support**

If you encounter issues:
1. **Check PayMongo documentation**: https://developers.paymongo.com/
2. **Review webhook logs** in your backend
3. **Test with PayMongo test cards**
4. **Verify environment configuration**

---

**Your production webhook setup is now complete!** 🎉
