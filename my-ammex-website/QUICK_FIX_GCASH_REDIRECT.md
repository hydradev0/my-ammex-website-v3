# ⚡ Quick Fix: GCash Redirecting to Wrong URL

## 🚨 **Your Problem**
GCash payments redirect to `https://app-ammex.onrender.com` instead of `http://ammexmachinetools.com`

## ✅ **The Solution** (5 Minutes)

### **Step 1: Update Backend on Render**

1. **Go to:** https://dashboard.render.com/
2. **Click:** Your backend service (ammex-backend or similar)
3. **Click:** "Environment" in left sidebar
4. **Find/Add:** `FRONTEND_URL`
5. **Set to:** `http://ammexmachinetools.com`
6. **Click:** "Save Changes"
7. **Wait:** For auto-deploy to complete (~3-5 minutes)

### **Step 2: Configure PayMongo Webhook**

1. **Go to:** https://dashboard.paymongo.com/developers/webhooks
2. **Create webhook with:**
   - **URL:** `https://app-ammex.onrender.com/api/payments/webhook`
   - **Events:** `payment.paid`, `payment.failed`, `source.chargeable`
3. **Copy:** Webhook signing secret (starts with `whsec_`)
4. **Add to Render:**
   - Go back to Render dashboard
   - Add environment variable:
     - Key: `PAYMONGO_WEBHOOK_SECRET`
     - Value: `whsec_your_copied_secret`
   - Save and wait for redeploy

### **Step 3: Test**

1. Make a test GCash payment (₱1.00)
2. After payment, you should be redirected to:
   ```
   http://ammexmachinetools.com/Products/Invoices?payment=success
   ```
3. Check if:
   - ✅ Invoice balance deducted
   - ✅ Customer notification appears
   - ✅ Payment shows in admin dashboard

---

## 🎯 **Expected Results**

**Before Fix:**
- ❌ Redirects to: `https://app-ammex.onrender.com/Products/Invoices?payment=success`
- ❌ No payment processing
- ❌ No notifications

**After Fix:**
- ✅ Redirects to: `http://ammexmachinetools.com/Products/Invoices?payment=success`
- ✅ Payment processes automatically via webhook
- ✅ Invoice balance deducts
- ✅ Customer notification appears
- ✅ Shows in admin dashboard

---

## 🔍 **How to Verify Environment Variable Updated**

After saving on Render, check the logs:

1. Go to your backend service on Render
2. Click "Logs" tab
3. Look for recent deployment logs
4. You should see the new service starting up

---

## ⏱️ **Timeline**

- Saving env variable: **Instant**
- Auto-deploy trigger: **30 seconds**
- Build & deploy: **3-5 minutes**
- Total time: **~5 minutes**

---

## 📞 **Still Not Working?**

Check:
1. ✅ Did you update `FRONTEND_URL` on **Render dashboard** (not just local file)?
2. ✅ Did deployment complete successfully?
3. ✅ Is webhook configured in PayMongo dashboard?
4. ✅ Is webhook secret added to Render?

**Need more help?** See: `HOW_TO_UPDATE_RENDER_ENV.md` for detailed instructions.


