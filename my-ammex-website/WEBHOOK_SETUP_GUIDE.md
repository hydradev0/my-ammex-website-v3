# 🔔 PayMongo Webhook Setup Guide (Production)

## ❗ **Current Issue**
Payments are not being processed because PayMongo webhooks are not configured or not reaching your server.

## ✅ **Step 1: Configure Webhook in PayMongo Dashboard**

### 1.1 Log in to PayMongo Dashboard
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to **Developers** → **Webhooks**

### 1.2 Create New Webhook
1. Click **"Create Webhook"**
2. **Webhook URL**: Enter your deployed backend URL + `/api/payments/webhook`
   - Example: `https://your-backend-domain.com/api/payments/webhook`
   - **Important**: Use `/api/payments/webhook` (NOT `/api/payments/webhook/paymongo`)
3. **Events to listen**: Select the following events:
   - ✅ `payment.paid`
   - ✅ `payment.failed`
   - ✅ `source.chargeable`
4. **Status**: Make sure it's **enabled**
5. Click **"Create"**

### 1.3 Copy Webhook Secret
1. After creating, you'll see the webhook secret
2. Copy it (starts with `whsec_`)
3. Update your backend `.env` file:
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## 🔍 **Step 2: Verify Webhook URL**

### 2.1 Check Your Webhook URL
Your webhook URL should be publicly accessible:
- ✅ **CORRECT**: `https://your-backend-domain.com/api/payments/webhook`
- ❌ **WRONG**: `http://localhost:5000/api/payments/webhook`
- ❌ **WRONG**: `http://127.0.0.1:5000/api/payments/webhook`

### 2.2 Test Webhook Endpoint
Test if your webhook endpoint is accessible:
```bash
curl -X POST https://your-backend-domain.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"data":{"type":"test"}}'
```

You should see logs in your backend console.

## 📊 **Step 3: Monitor Webhook Logs**

### 3.1 Enable Webhook Logs (Already Added)
I've added comprehensive logging to your webhook handler. You'll see:
```
========================================
🔔 WEBHOOK RECEIVED
Time: 2025-10-18T12:00:00.000Z
Method: POST
URL: /api/payments/webhook
Headers: {...}
Body: {...}
========================================
```

### 3.2 Check Backend Logs
After making a payment, check your backend logs for:
- `🔔 WEBHOOK RECEIVED` - Webhook was called
- `✅ Signature verified` - Signature is valid
- `📦 Event Type: payment.paid` or `source.chargeable` - Event type
- `✅ payment.paid processed` - Payment was processed successfully

### 3.3 PayMongo Dashboard Webhook Logs
1. Go to PayMongo Dashboard → Webhooks
2. Click on your webhook
3. View **"Recent Deliveries"**
4. Check if webhooks are being sent and their status:
   - ✅ **200 OK** - Webhook received and processed
   - ❌ **4xx/5xx** - Webhook failed

## 🚨 **Step 4: Troubleshooting**

### Issue 1: Webhook Not Receiving Events
**Symptoms**: No logs in backend console after payment

**Solutions**:
1. **Check Webhook URL**: Make sure it's correct in PayMongo dashboard
2. **Check Firewall**: Ensure your backend allows incoming POST requests
3. **Check HTTPS**: PayMongo webhooks require HTTPS in production
4. **Check Deployment**: Make sure your backend is running

### Issue 2: Webhook Returns 401 (Unauthorized)
**Symptoms**: Webhook logs show "❌ Invalid webhook signature"

**Solutions**:
1. **Update Webhook Secret**: Copy the correct secret from PayMongo dashboard
2. **Update .env**: Make sure `PAYMONGO_WEBHOOK_SECRET` is set correctly
3. **Restart Backend**: Restart your backend after updating `.env`

### Issue 3: Webhook Returns 500 (Server Error)
**Symptoms**: Webhook logs show errors in processing

**Solutions**:
1. **Check Database**: Ensure database connection is working
2. **Check Payment Record**: Verify payment exists in database
3. **Check Error Logs**: Review full error stack trace in logs

## 🧪 **Step 5: Test the Webhook**

### 5.1 Make a Test Payment
1. Go to your deployed frontend
2. Select an invoice
3. Click "Pay Now"
4. Choose a payment method (GCash or Card)
5. Complete the payment

### 5.2 Check Backend Logs
You should see:
```
========================================
🔔 WEBHOOK RECEIVED
Time: 2025-10-18T12:00:00.000Z
📦 Event Type: source.chargeable
▶️ Processing source.chargeable event...
✅ source.chargeable processed
✅ Webhook processed successfully
========================================
```

### 5.3 Verify Payment Status
1. **Customer Side**: Check if invoice balance was deducted
2. **Customer Side**: Check if notification was received
3. **Admin Side**: Check if payment appears in Balance Tracking
4. **Database**: Check if payment status changed to `succeeded`

## 📋 **Quick Checklist**

- [ ] Webhook URL configured in PayMongo dashboard
- [ ] Webhook URL is publicly accessible (HTTPS)
- [ ] Webhook secret copied to `.env`
- [ ] Backend restarted after `.env` update
- [ ] Webhook events selected: `payment.paid`, `payment.failed`, `source.chargeable`
- [ ] Webhook status is **enabled** in dashboard
- [ ] Test payment completed
- [ ] Backend logs show webhook received
- [ ] Payment processed successfully
- [ ] Invoice balance deducted
- [ ] Customer notification sent
- [ ] Admin sees payment in dashboard

## 🆘 **Still Not Working?**

### Check These:
1. **Webhook URL**: Is it correct in PayMongo dashboard?
2. **Backend Running**: Is your backend server running?
3. **HTTPS**: Is your backend using HTTPS (required for webhooks)?
4. **Firewall**: Does your hosting provider block incoming webhooks?
5. **Recent Deliveries**: Check PayMongo dashboard for webhook delivery status

### Next Steps:
1. Share your backend logs (webhook section)
2. Share PayMongo webhook delivery status
3. Share your backend URL (webhook endpoint)
4. Check if backend is accessible from public internet

---

## ✅ **Expected Flow (Production)**

### Card Payment Flow:
1. User enters card details → PayMongo creates payment intent
2. 3DS authentication (if required) → User completes authentication
3. **PayMongo sends `payment.paid` webhook** → Your backend processes webhook
4. Backend updates payment status → `succeeded`
5. Backend updates invoice balance → Deducts payment amount
6. Backend sends customer notification → "Payment Successful"
7. Admin sees payment in Balance Tracking tab

### E-wallet (GCash) Flow:
1. User clicks GCash → PayMongo creates source
2. User redirected to GCash app → User completes payment
3. **PayMongo sends `source.chargeable` webhook** → Your backend processes webhook
4. Backend updates payment status → `succeeded`
5. Backend updates invoice balance → Deducts payment amount
6. Backend sends customer notification → "Payment Successful"
7. User redirected back to your app → Sees success message
8. Admin sees payment in Balance Tracking tab

**🔑 Key Point**: The webhook is critical. Without it, payments won't be processed!
