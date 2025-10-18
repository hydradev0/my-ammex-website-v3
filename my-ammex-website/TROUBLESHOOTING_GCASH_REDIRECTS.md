# 🔧 Troubleshooting: GCash Redirects to Wrong Domain

## 🚨 **Your Current Problem**

When you pay with GCash, you're being redirected to your **hosting domain** (e.g., `your-app.vercel.app` or `your-app.onrender.com`) instead of your **custom domain** (`ammexmachinetools.com`).

Additionally, payments are **not deducting from invoices** and there are **no notifications** showing up.

---

## ✅ **Root Cause**

The issue is caused by **incorrect environment variable configuration**:

1. `FRONTEND_URL` in backend is set to `http://localhost:5173`
2. `VITE_FRONTEND_URL` in frontend is not set (defaults to hosting domain)
3. PayMongo webhooks are either:
   - Not configured
   - Pointing to the wrong URL
   - Not being delivered successfully

---

## 🛠️ **Step-by-Step Fix**

### **Step 1: Update Backend Environment Variables**

**File:** `my-ammex-website/backend/.env`

**Change this:**
```env
FRONTEND_URL=http://localhost:5173
```

**To this:**
```env
FRONTEND_URL=https://ammexmachinetools.com
```

**Important:** Replace `ammexmachinetools.com` with your actual custom domain.

### **Step 2: Update Frontend Environment Variables**

**File:** `my-ammex-website/frontend/.env`

**Add these lines:**
```env
# Your backend API URL (replace with your actual backend URL)
VITE_API_BASE_URL=https://your-backend-api.com/api

# Your custom domain (where customers should be redirected)
VITE_FRONTEND_URL=https://ammexmachinetools.com
```

**Examples of backend URLs:**
- Render: `https://your-app.onrender.com/api`
- Railway: `https://your-app.railway.app/api`
- Custom domain: `https://api.ammexmachinetools.com/api`

### **Step 3: Configure PayMongo Webhook**

1. **Go to PayMongo Dashboard:**
   https://dashboard.paymongo.com/developers/webhooks

2. **Create a new webhook:**
   - **URL:** `https://your-backend-api.com/api/payments/webhook`
   - **Events to listen for:**
     - ✅ `payment.paid`
     - ✅ `payment.failed`
     - ✅ `source.chargeable`

3. **Copy the Webhook Signing Secret** (starts with `whsec_`)

4. **Add to backend `.env`:**
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsec_your_copied_secret_here
   ```

### **Step 4: Rebuild and Redeploy**

#### **Frontend (Very Important!):**
```bash
# Environment variables are EMBEDDED during build
# You MUST rebuild after changing .env

npm run build

# Then redeploy the new build to your hosting service
```

#### **Backend:**
```bash
# Backend reads env vars at runtime
# Just restart the service after updating .env
```

**On Render/Railway/Heroku:**
- Go to your dashboard
- Update environment variables
- Trigger a redeploy or restart

---

## 🧪 **Testing the Fix**

### **Test 1: Check Environment Variables**

**Frontend:**
Open your deployed site and check browser console:
```javascript
// Should show your custom domain, not localhost
console.log(import.meta.env.VITE_FRONTEND_URL);

// Should show your backend API URL, not localhost
console.log(import.meta.env.VITE_API_BASE_URL);
```

**Expected output:**
```
https://ammexmachinetools.com
https://your-backend-api.com/api
```

### **Test 2: Make a Test Payment**

1. **Start a GCash payment** (use a small amount like ₱1.00)
2. **Complete payment in GCash app**
3. **Check the redirect URL** - Should go to:
   ```
   https://ammexmachinetools.com/Products/Invoices?payment=success
   ```
4. **Check invoice balance** - Should be deducted
5. **Check notifications** - Should show payment success

### **Test 3: Verify Webhook Delivery**

1. **Go to PayMongo Dashboard:**
   https://dashboard.paymongo.com/developers/webhooks

2. **Click on your webhook**

3. **Check "Recent Events" tab**

4. **You should see:**
   - Event type: `source.chargeable` (for GCash)
   - Status: `✅ Delivered` (green checkmark)
   - Response code: `200`

**If webhook shows as failed:**
- Check your backend URL is publicly accessible
- Check firewall settings
- Check backend logs for errors

---

## 🔍 **Debugging Steps**

### **If redirects are still wrong:**

1. **Clear browser cache**
2. **Verify frontend was rebuilt after env changes**
3. **Check browser console for the correct `VITE_FRONTEND_URL`**

### **If payments are not processing:**

1. **Check backend logs** for webhook processing errors
2. **Check PayMongo dashboard** webhook delivery status
3. **Verify webhook URL** is correct and publicly accessible
4. **Test webhook endpoint manually:**
   ```bash
   curl -X POST https://your-backend-api.com/api/payments/webhook
   ```
   Should return 400 (not 404 or 500)

### **If no notifications appear:**

1. **Check webhook was delivered successfully**
2. **Check backend logs** for notification creation errors
3. **Check database** - query `Notification` table:
   ```sql
   SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 10;
   ```

---

## 📊 **Quick Diagnostic Table**

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Redirects to hosting domain | `VITE_FRONTEND_URL` not set | Update frontend `.env` and rebuild |
| Payment not deducting | Webhook not configured | Configure webhook in PayMongo dashboard |
| No notifications | Webhook not being delivered | Check webhook URL and backend logs |
| 404 on redirect | Wrong URL format | Check `VITE_FRONTEND_URL` format (include `https://`) |
| CORS errors | Backend not allowing domain | Update backend CORS configuration |

---

## ⚡ **Quick Command Reference**

### **Check Current Environment Variables**

**Backend (SSH into server):**
```bash
printenv | grep FRONTEND_URL
printenv | grep PAYMONGO
```

**Frontend (browser console):**
```javascript
Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
```

### **Test Backend Webhook Endpoint**

```bash
curl -X POST https://your-backend-api.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `400 Bad Request` (webhook signature missing)
Not expected: `404 Not Found` or `500 Internal Server Error`

### **View Recent Payments**

```bash
# Connect to your database
psql $DATABASE_URL

# Check recent payments
SELECT id, amount, status, "gatewayStatus", "gatewayPaymentId" 
FROM "Payment" 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

---

## 🎯 **Summary: What You Need to Do**

1. ✅ Update `FRONTEND_URL` in backend `.env` to `https://ammexmachinetools.com`
2. ✅ Add `VITE_FRONTEND_URL` to frontend `.env` with value `https://ammexmachinetools.com`
3. ✅ Add `VITE_API_BASE_URL` to frontend `.env` with your backend API URL
4. ✅ Configure PayMongo webhook with URL: `https://your-backend-api.com/api/payments/webhook`
5. ✅ Copy webhook secret to backend `.env` as `PAYMONGO_WEBHOOK_SECRET`
6. ✅ **Rebuild frontend** (this is critical!)
7. ✅ Restart backend
8. ✅ Test with a small GCash payment

**After these steps, GCash payments should:**
- ✅ Redirect to `ammexmachinetools.com`
- ✅ Deduct from invoice automatically
- ✅ Show notifications to customer
- ✅ Appear in admin dashboard

---

## 📞 **Still Not Working?**

If you've followed all steps and it's still not working:

1. **Share these details:**
   - Frontend URL (custom domain)
   - Backend API URL
   - Webhook delivery status from PayMongo dashboard
   - Backend logs (error messages)
   - Browser console errors

2. **Check files:**
   - `PRODUCTION_ENV_SETUP.md` - Detailed environment variable guide
   - `PRODUCTION_DEPLOYMENT_GUIDE.md` - Full deployment guide
   - Backend logs for webhook processing errors

3. **Verify basics:**
   - Backend is deployed and running
   - Frontend is rebuilt with new env vars
   - Webhook URL is publicly accessible
   - Using correct PayMongo keys (test vs live)


