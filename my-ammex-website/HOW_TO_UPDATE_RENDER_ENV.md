# 🔧 How to Update Environment Variables on Render

## 🚨 **IMPORTANT: Your Current Issue**

GCash payments are redirecting to `https://app-ammex.onrender.com` instead of `http://ammexmachinetools.com` because:

1. ❌ **Backend environment variable `FRONTEND_URL` is still set to `http://localhost:5173` on Render**
2. ❌ **Frontend environment variable `VITE_FRONTEND_URL` needs to be set to `http://ammexmachinetools.com`**

**The local `.env` files you edited are NOT used by Render!** You need to update the environment variables **directly on Render's dashboard**.

---

## 📋 **Step-by-Step: Update Backend Environment Variables on Render**

### **Step 1: Go to Your Backend Service on Render**

1. Go to: https://dashboard.render.com/
2. Click on your **backend service** (the one running your Node.js API)
3. You should see your service dashboard

### **Step 2: Navigate to Environment Variables**

1. In the left sidebar, click on **"Environment"**
2. You'll see a list of all your current environment variables

### **Step 3: Update `FRONTEND_URL`**

1. **Find the `FRONTEND_URL` variable**
   - If it exists, click the **Edit** button (pencil icon)
   - If it doesn't exist, click **"Add Environment Variable"**

2. **Set the value:**
   ```
   Key: FRONTEND_URL
   Value: http://ammexmachinetools.com
   ```

3. **Click "Save Changes"**

### **Step 4: Trigger a Redeploy**

After updating environment variables, Render usually **auto-deploys**. If not:

1. Go to the **"Manual Deploy"** section
2. Click **"Deploy latest commit"**
3. Wait for the deployment to complete (you'll see logs)

### **Step 5: Verify the Change**

Once deployed, you can verify by checking the logs:

1. Go to **"Logs"** tab
2. Look for startup logs
3. You should see `FRONTEND_URL` being used

---

## 📋 **Step-by-Step: Update Frontend Environment Variables on Render**

### **Option A: If Frontend is on Render (Static Site)**

1. Go to your **frontend service** on Render dashboard
2. Click on **"Environment"** in the left sidebar
3. Add/update these variables:
   ```
   VITE_API_BASE_URL=https://app-ammex.onrender.com/api
   VITE_FRONTEND_URL=http://ammexmachinetools.com
   VITE_PAYMONGO_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
   ```
4. **Click "Save Changes"**
5. Render will **automatically rebuild** your site with the new variables
6. Wait for the build to complete

### **Option B: If Frontend is NOT on Render (Vercel, Netlify, etc.)**

Skip to the section for your hosting provider below.

---

## 📋 **Alternative: Update via `render.yaml` (Optional)**

If you're using a `render.yaml` file for infrastructure as code:

```yaml
services:
  - type: web
    name: ammex-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: FRONTEND_URL
        value: http://ammexmachinetools.com  # <-- Update this
      - key: DATABASE_URL
        sync: false  # Set manually in dashboard for security
      - key: JWT_SECRET
        sync: false  # Set manually in dashboard for security
      - key: PAYMONGO_SECRET_KEY
        sync: false  # Set manually in dashboard for security
      - key: PAYMONGO_PUBLIC_KEY
        value: pk_test_YOUR_PUBLIC_KEY_HERE
      - key: PAYMONGO_WEBHOOK_SECRET
        sync: false  # Set manually in dashboard for security
```

**Note:** Sensitive values should be set manually in the dashboard, not in `render.yaml`.

---

## 🌐 **If Frontend is on Other Platforms**

### **Vercel:**

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/update:
   ```
   VITE_API_BASE_URL=https://app-ammex.onrender.com/api
   VITE_FRONTEND_URL=http://ammexmachinetools.com
   VITE_PAYMONGO_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
   ```
5. **Redeploy** from the Deployments tab

### **Netlify:**

1. Go to: https://app.netlify.com/
2. Select your site
3. Go to **Site settings** → **Build & deploy** → **Environment**
4. Add/update the same variables as above
5. **Trigger a new deploy**

---

## ✅ **After Updating - Verification Steps**

### **Step 1: Check Backend Logs**

1. Go to your backend service on Render
2. Check the **Logs** tab
3. Look for any startup errors

### **Step 2: Test API Health**

```bash
curl https://app-ammex.onrender.com/api/health
```

Should return: `{"status":"ok"}`

### **Step 3: Test Frontend Environment Variables**

1. Open http://ammexmachinetools.com in your browser
2. Open **Browser Console** (F12)
3. Type:
   ```javascript
   console.log(import.meta.env.VITE_FRONTEND_URL)
   console.log(import.meta.env.VITE_API_BASE_URL)
   ```
4. Should show:
   ```
   http://ammexmachinetools.com
   https://app-ammex.onrender.com/api
   ```

### **Step 4: Test GCash Payment**

1. Go to http://ammexmachinetools.com
2. Make a test GCash payment (₱1.00)
3. Complete payment in GCash
4. **Check the redirect URL** - Should be:
   ```
   http://ammexmachinetools.com/Products/Invoices?payment=success
   ```
   NOT:
   ```
   https://app-ammex.onrender.com/Products/Invoices?payment=success
   ```

---

## 🔍 **Troubleshooting**

### **Issue: Changes Not Reflecting**

**Cause:** Build cache or deployment not triggered

**Solution:**
1. Force a new build:
   - Backend: Click "Manual Deploy" → "Clear build cache & deploy"
   - Frontend: Same process
2. Wait for deployment to complete (5-10 minutes)
3. Hard refresh your browser (Ctrl + Shift + R)

### **Issue: Environment Variables Not Showing in Logs**

**Cause:** Variables not saved properly

**Solution:**
1. Go back to Environment tab
2. Verify variables are listed
3. Click "Save Changes" again
4. Manually trigger a deploy

### **Issue: Frontend Still Shows Old Values**

**Cause:** Vite environment variables are embedded at build time

**Solution:**
1. **Must rebuild frontend** after changing env vars
2. On Render: Trigger a new build
3. On Vercel/Netlify: Redeploy
4. Clear browser cache (Ctrl + Shift + Delete)

### **Issue: Backend Still Redirecting to Wrong URL**

**Cause:** Old backend instance still running

**Solution:**
1. Go to backend service on Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for new instance to start
4. Old instance will be terminated automatically

---

## 📊 **Summary: Your Specific Configuration**

### **Backend Environment Variables on Render:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...  # Your existing database URL
JWT_SECRET=...  # Your existing JWT secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# ⚠️ CRITICAL: Set this to your custom domain
FRONTEND_URL=http://ammexmachinetools.com

PAYMONGO_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
PAYMONGO_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
PAYMONGO_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### **Frontend Environment Variables (wherever hosted):**
```env
VITE_CLOUDINARY_CLOUD_NAME=duxs1wonz
VITE_CLOUDINARY_UPLOAD_PRESET=ammex-upload-preset
VITE_CLOUDINARY_API_KEY=129618191869762

# ⚠️ CRITICAL: Set these for production
VITE_API_BASE_URL=https://app-ammex.onrender.com/api
VITE_FRONTEND_URL=http://ammexmachinetools.com
VITE_PAYMONGO_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
```

---

## 🎯 **Next Steps**

1. ✅ Update `FRONTEND_URL` on Render backend service
2. ✅ Update `VITE_FRONTEND_URL` on your frontend hosting
3. ✅ Wait for deployments to complete
4. ✅ Test GCash payment
5. ✅ Verify redirect goes to `http://ammexmachinetools.com`
6. ✅ Check if payment deducts from invoice
7. ✅ Check if notifications appear

**After these steps, your GCash payments should redirect to the correct domain and process successfully!**

---

## 💡 **Pro Tip: Test Before Production**

Before deploying to production:

1. **Test with PayMongo test keys** (you're already doing this ✅)
2. **Test with small amounts** (₱1.00)
3. **Verify webhooks are being delivered** in PayMongo dashboard
4. **Check all flows**: Card, GCash, GrabPay
5. **Once everything works**, switch to live keys

---

## 📞 **Still Having Issues?**

If after updating environment variables on Render, GCash still redirects to the wrong URL:

1. **Check Render logs** for the actual `FRONTEND_URL` being used
2. **Verify deployment completed** successfully
3. **Test with `curl`**:
   ```bash
   curl -X POST https://app-ammex.onrender.com/api/payments/create-payment-source \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"type":"gcash","amount":1,"invoiceId":1}'
   ```
   Check the `checkoutUrl` in the response

4. **Contact Render support** if environment variables aren't being applied

