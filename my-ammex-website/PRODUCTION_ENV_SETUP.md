# 🔧 Production Environment Variables Setup

## 🚨 **CRITICAL: Your Issue**

You're experiencing the problem because:
1. ❌ `FRONTEND_URL` in backend `.env` is set to `http://localhost:5173`
2. ❌ `VITE_API_BASE_URL` in frontend `.env` is set to `http://localhost:5000/api`
3. ❌ PayMongo redirects users to the hosting domain instead of your custom domain
4. ❌ Webhooks are not configured or pointing to the wrong URL

## ✅ **Solution**

### **Backend Environment Variables** (`my-ammex-website/backend/.env`)

```env
# Environment
NODE_ENV=production
PORT=5000

# Database - KEEP YOUR CURRENT VALUE
DATABASE_URL=postgresql://neondb_owner:npg_MyDi9NqJt4SV@ep-billowing-dew-a1db7b08-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT - KEEP YOUR CURRENT VALUES
JWT_SECRET=f8b3a3fcef2ee384eaf1ec994b3145cd2e13e29cb5f86289cf2eaa474936dcdef0146a6460486d713e6116da98b3f7e14df24845d361b81cf7be782c6a0e5650
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# ⚠️ CRITICAL: Change this to your ACTUAL customer-facing domain
# This is where PayMongo will redirect customers after GCash/e-wallet payments
FRONTEND_URL=https://ammexmachinetools.com

# OpenRouter (if needed)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# PayMongo Configuration
# ⚠️ IMPORTANT: Use LIVE keys for production, TEST keys for development
PAYMONGO_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
PAYMONGO_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
PAYMONGO_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### **Frontend Environment Variables** (`my-ammex-website/frontend/.env`)

```env
# Cloudinary - KEEP YOUR CURRENT VALUES
VITE_CLOUDINARY_CLOUD_NAME=duxs1wonz
VITE_CLOUDINARY_UPLOAD_PRESET=ammex-upload-preset
VITE_CLOUDINARY_API_KEY=129618191869762

# ⚠️ CRITICAL: Change this to your ACTUAL backend API URL
# This should be your backend server's public URL
VITE_API_BASE_URL=https://your-backend-api.com/api

# PayMongo Configuration
# ⚠️ IMPORTANT: Use LIVE key for production, TEST key for development
VITE_PAYMONGO_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE

# ⚠️ CRITICAL: Change this to your ACTUAL customer-facing domain
# This is where PayMongo will redirect customers after payments
VITE_FRONTEND_URL=https://ammexmachinetools.com
```

---

## 🌐 **Example Configurations**

### **Scenario 1: Using Render (Backend) + Vercel (Frontend)**

#### Backend `.env` on Render:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=https://ammexmachinetools.com
PAYMONGO_SECRET_KEY=sk_live_your_live_key_here
PAYMONGO_PUBLIC_KEY=pk_live_your_live_key_here
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Frontend `.env` on Vercel:
```env
VITE_API_BASE_URL=https://your-app.onrender.com/api
VITE_PAYMONGO_PUBLIC_KEY=pk_live_your_live_key_here
VITE_FRONTEND_URL=https://ammexmachinetools.com
```

### **Scenario 2: Custom Domain Setup**

If `ammexmachinetools.com` points to your frontend and `api.ammexmachinetools.com` points to your backend:

#### Backend `.env`:
```env
FRONTEND_URL=https://ammexmachinetools.com
```

#### Frontend `.env`:
```env
VITE_API_BASE_URL=https://api.ammexmachinetools.com/api
VITE_FRONTEND_URL=https://ammexmachinetools.com
```

---

## 🔗 **PayMongo Webhook Configuration**

### **1. Get Your Backend Webhook URL**

Your webhook URL should be:
```
https://your-backend-api.com/api/payments/webhook
```

**Example:**
- If backend is on Render: `https://your-app.onrender.com/api/payments/webhook`
- If using custom domain: `https://api.ammexmachinetools.com/api/payments/webhook`

### **2. Configure Webhook in PayMongo Dashboard**

1. Go to: https://dashboard.paymongo.com/developers/webhooks
2. Click "Create Webhook"
3. Enter webhook URL: `https://your-backend-api.com/api/payments/webhook`
4. Select events:
   - ✅ `payment.paid`
   - ✅ `payment.failed`
   - ✅ `source.chargeable`
5. Click "Create"
6. Copy the **Webhook Signing Secret** (starts with `whsec_`)
7. Add it to your backend `.env` as `PAYMONGO_WEBHOOK_SECRET`

---

## 🧪 **Testing Your Configuration**

### **Step 1: Test Backend API**
```bash
curl https://your-backend-api.com/api/health
```
Should return: `{"status":"ok"}`

### **Step 2: Test Frontend Connection**
Open browser console and check:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env.VITE_FRONTEND_URL);
```

### **Step 3: Test Payment Flow**
1. Make a test payment with GCash
2. After payment, you should be redirected to:
   ```
   https://ammexmachinetools.com/Products/Invoices?payment=success
   ```
3. Check webhook logs in PayMongo dashboard

### **Step 4: Verify Webhook Delivery**
1. Go to PayMongo dashboard
2. Check "Webhooks" section
3. View delivery logs
4. Ensure webhooks are being delivered successfully

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Redirects to hosting domain instead of custom domain**
**Cause:** `VITE_FRONTEND_URL` not set or incorrect
**Solution:** Set `VITE_FRONTEND_URL=https://ammexmachinetools.com` in frontend `.env`

### **Issue 2: Payment not deducting from invoice**
**Cause:** Webhooks not configured or not reaching backend
**Solution:** 
1. Configure webhook in PayMongo dashboard
2. Ensure webhook URL is publicly accessible
3. Check webhook delivery logs

### **Issue 3: No notifications on customer side**
**Cause:** Webhook processing failed
**Solution:**
1. Check backend logs for webhook errors
2. Verify `PAYMONGO_WEBHOOK_SECRET` is correct
3. Test webhook endpoint manually

### **Issue 4: CORS errors**
**Cause:** Backend not allowing frontend domain
**Solution:** Update CORS configuration in backend to allow your custom domain

---

## 📋 **Deployment Checklist**

### **Before Deploying:**
- [ ] Update `FRONTEND_URL` in backend `.env` to production domain
- [ ] Update `VITE_API_BASE_URL` in frontend `.env` to production API URL
- [ ] Update `VITE_FRONTEND_URL` in frontend `.env` to production domain
- [ ] Switch to PayMongo LIVE keys (not test keys)
- [ ] Configure webhook in PayMongo dashboard
- [ ] Update `PAYMONGO_WEBHOOK_SECRET` in backend `.env`
- [ ] Test webhook delivery
- [ ] Rebuild frontend with new environment variables
- [ ] Restart backend with new environment variables

### **After Deploying:**
- [ ] Test payment with real GCash account (small amount)
- [ ] Verify redirect URL is correct
- [ ] Verify payment deducts from invoice
- [ ] Verify customer receives notification
- [ ] Verify admin sees payment in dashboard
- [ ] Check webhook logs in PayMongo dashboard

---

## 💡 **Quick Fix for Your Current Issue**

1. **Update Backend `.env`:**
   ```env
   FRONTEND_URL=https://ammexmachinetools.com
   ```

2. **Update Frontend `.env`:**
   ```env
   VITE_API_BASE_URL=https://your-backend-url.com/api
   VITE_FRONTEND_URL=https://ammexmachinetools.com
   ```

3. **Rebuild & Redeploy:**
   ```bash
   # Frontend
   npm run build
   
   # Backend - restart with new env vars
   ```

4. **Configure PayMongo Webhook:**
   - URL: `https://your-backend-url.com/api/payments/webhook`
   - Events: `payment.paid`, `payment.failed`, `source.chargeable`
   - Copy webhook secret to backend `.env`

5. **Test Payment Flow:**
   - Make GCash payment
   - Should redirect to `ammexmachinetools.com`
   - Payment should process via webhook
   - Invoice should update automatically

---

## 🎯 **Important Notes**

1. **Environment variables must be set BEFORE building/deploying**
2. **Frontend env vars are embedded during build time** (not runtime)
3. **Backend env vars are read at runtime**
4. **Always restart services after changing env vars**
5. **Webhooks are CRITICAL for production** - without them, payments won't process

---

## 📞 **Still Having Issues?**

Check:
1. Backend logs for webhook processing
2. PayMongo dashboard webhook delivery logs
3. Browser console for frontend errors
4. Network tab for API requests

**Need Help?** Check the `PRODUCTION_DEPLOYMENT_GUIDE.md` for more details.

