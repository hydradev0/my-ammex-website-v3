# 🔍 PayMongo Webhook Diagnostics

## ✅ **Your Setup:**
- **Deployed URL**: `https://ammex.onrender.com`
- **Webhook URL**: `https://ammex.onrender.com/api/payments/webhook`
- **Status**: Webhook already configured in PayMongo ✅

---

## 🧪 **Step 1: Test Webhook Endpoint Accessibility**

### Test if your webhook endpoint is publicly accessible:
```bash
curl https://ammex.onrender.com/api/payments/webhook/test
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Webhook endpoint is accessible",
  "timestamp": "2025-10-18T12:00:00.000Z",
  "url": "/api/payments/webhook/test"
}
```

---

## 🔍 **Step 2: Check PayMongo Webhook Delivery**

### In PayMongo Dashboard:
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click on your webhook
4. Check **"Recent Deliveries"**

### Look for:
- **✅ 200 OK**: Webhook was received and processed successfully
- **❌ 401 Unauthorized**: Webhook signature verification failed
- **❌ 404 Not Found**: Webhook URL is incorrect
- **❌ 500 Server Error**: Backend error during processing
- **⏱️ Timeout**: Backend took too long to respond

---

## 📋 **Step 3: Verify Webhook Configuration**

### In PayMongo Dashboard, verify:
- [ ] **Webhook URL**: `https://ammex.onrender.com/api/payments/webhook`
- [ ] **Status**: Enabled
- [ ] **Events Selected**:
  - [ ] `payment.paid`
  - [ ] `payment.failed`
  - [ ] `source.chargeable`

### In Your Backend `.env`:
- [ ] `PAYMONGO_SECRET_KEY` is set (starts with `sk_test_` or `sk_live_`)
- [ ] `PAYMONGO_PUBLIC_KEY` is set (starts with `pk_test_` or `pk_live_`)
- [ ] `PAYMONGO_WEBHOOK_SECRET` is set (starts with `whsec_`)

---

## 🧪 **Step 4: Make a Test Payment**

### 4.1 Make a Payment
1. Go to your deployed frontend
2. Login as a customer
3. Select an invoice with a balance
4. Click "Pay Now"
5. Choose **GCash** (easiest to test)
6. Complete the payment in GCash

### 4.2 Check Backend Logs (Render Dashboard)
After payment, check your Render backend logs for:

```
========================================
🔔 WEBHOOK RECEIVED
Time: 2025-10-18T12:00:00.000Z
Method: POST
URL: /api/payments/webhook
Headers: {...}
Body: {...}
========================================
✅ Signature verified (or skipped)
📦 Event Type: source.chargeable
📦 Event ID: evt_xxx
📦 Event Data: {...}
▶️ Processing source.chargeable event...
✅ source.chargeable processed
✅ Webhook processed successfully
========================================
```

**If you see this**, webhook is working! ✅

**If you DON'T see this**, webhook is NOT reaching your backend! ❌

---

## 🚨 **Troubleshooting**

### Problem 1: No Webhook Logs in Backend
**Meaning**: PayMongo is not sending webhooks to your backend OR they're not reaching it

**Check**:
1. **Webhook URL in PayMongo**: Is it `https://ammex.onrender.com/api/payments/webhook`?
2. **Webhook Status**: Is it **Enabled** in PayMongo dashboard?
3. **Render Logs**: Are there ANY incoming requests to `/api/payments/webhook`?
4. **Recent Deliveries**: Check PayMongo dashboard for delivery status

**Fix**:
- Update webhook URL in PayMongo dashboard
- Restart your Render backend service
- Check Render firewall/network settings

---

### Problem 2: Webhook Logs Show "❌ Invalid webhook signature"
**Meaning**: Webhook is reaching your backend but signature verification is failing

**Check**:
1. **Webhook Secret**: Is `PAYMONGO_WEBHOOK_SECRET` set correctly in Render?
2. **Webhook Secret Value**: Does it match the one in PayMongo dashboard?

**Fix**:
1. Go to PayMongo Dashboard → Webhooks → Your Webhook
2. Copy the webhook secret (starts with `whsec_`)
3. Go to Render Dashboard → Your Backend Service → Environment
4. Update `PAYMONGO_WEBHOOK_SECRET=whsec_your_secret_here`
5. Save and restart backend

---

### Problem 3: Webhook Processed but Payment Not Updated
**Meaning**: Webhook is working but database updates are failing

**Check Backend Logs for**:
- Database connection errors
- Payment record not found errors
- Invoice update errors

**Common Causes**:
1. **Payment Record Missing**: Payment wasn't created during payment initiation
2. **Gateway Payment ID Mismatch**: Payment record has wrong `gatewayPaymentId`
3. **Database Connection**: Database is unreachable

**Fix**:
- Check if payment record exists in database
- Check if `gatewayPaymentId` matches PayMongo's payment/source ID
- Check database connection in Render logs

---

## 🔎 **Step 5: Manual Verification**

### Check Database Directly
After a test payment, check your database:

```sql
-- Check latest payment
SELECT 
  id, 
  amount, 
  status, 
  gateway_payment_id, 
  gateway_status,
  created_at
FROM "Payment"
ORDER BY created_at DESC
LIMIT 5;

-- Check if payment was processed
SELECT 
  p.id,
  p.status AS payment_status,
  p.gateway_status,
  i.invoice_number,
  i.remaining_amount
FROM "Payment" p
JOIN "Invoice" i ON p.invoice_id = i.id
WHERE p.gateway_payment_id = 'src_xxx' -- Replace with your source ID
```

### Expected After Successful Webhook:
- `payment.status` = `'succeeded'`
- `payment.gateway_status` = `'succeeded'`
- `invoice.remaining_amount` = (original amount - payment amount)
- Customer has a notification in `Notification` table
- Record exists in `PaymentHistory` table

---

## ✅ **Quick Checklist**

After making a test payment, verify:

**Backend Logs**:
- [ ] Webhook received log appears
- [ ] Event type is `source.chargeable` or `payment.paid`
- [ ] No errors in processing
- [ ] Success message logged

**Database**:
- [ ] Payment status changed to `succeeded`
- [ ] Invoice balance reduced
- [ ] Customer notification created
- [ ] PaymentHistory record created

**Customer Side**:
- [ ] Invoice shows reduced balance
- [ ] Notification received
- [ ] Payment appears in payment history

**Admin Side**:
- [ ] Payment appears in Balance Tracking
- [ ] Payment appears in Payment History
- [ ] Correct amount and date shown

---

## 🆘 **Still Not Working?**

### Next Steps:
1. **Share Render Backend Logs**: Copy the logs from Render dashboard (especially around the time you made the payment)
2. **Share PayMongo Webhook Status**: Screenshot of "Recent Deliveries" in PayMongo dashboard
3. **Share Database Status**: Run the SQL queries above and share results
4. **Share Error Messages**: Any error messages you see in logs or UI

### Common Render.com Issues:
1. **Cold Start**: Render free tier has cold starts (server sleeps). First request might timeout.
2. **Environment Variables**: Make sure all env vars are set in Render dashboard
3. **Build Settings**: Make sure start command is correct (`npm start` or `node server.js`)

---

## 📞 **What to Share for Debugging**

If webhook still isn't working, share:
1. ✅ Render backend logs (last 50 lines)
2. ✅ PayMongo webhook "Recent Deliveries" status
3. ✅ Payment record from database (`SELECT * FROM "Payment" WHERE id = X`)
4. ✅ Any error messages you see

This will help identify exactly where the issue is! 🔍
