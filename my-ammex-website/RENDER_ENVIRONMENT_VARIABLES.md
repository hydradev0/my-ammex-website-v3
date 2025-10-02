# 🔐 Render Environment Variables Configuration

## **Backend Service Environment Variables**

Copy these exact values to your Render backend service:

```
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=f8b3a3fcef2ee384eaf1ec994b3145cd2e13e29cb5f86289cf2eaa474936dcdef0146a6460486d713e6116da98b3f7e14df24845d361b81cf7be782c6a0e5650
JWT_EXPIRE=30d
FRONTEND_URL=https://app-ammex.onrender.com
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_REFERER=https://app-ammex.onrender.com
```

⚠️ **CRITICAL**: The server will NOT start without `JWT_SECRET` being properly configured!

## **Frontend Service Environment Variables**

Copy these exact values to your Render frontend service:

```
VITE_API_URL=https://ammex.onrender.com/api
NODE_ENV=production
```

## **🔧 How to Set These in Render:**

### **Backend Service:**
1. Go to your backend service dashboard
2. Click "Environment" tab
3. Add each variable one by one:
   - **Key**: `NODE_ENV` **Value**: `production`
   - **Key**: `PORT` **Value**: `5000`
   - **Key**: `HOST` **Value**: `0.0.0.0`
   - **Key**: `DATABASE_URL` **Value**: `your-postgresql-connection-string`
   - **Key**: `JWT_SECRET` **Value**: `f8b3a3fcef2ee384eaf1ec994b3145cd2e13e29cb5f86289cf2eaa474936dcdef0146a6460486d713e6116da98b3f7e14df24845d361b81cf7be782c6a0e5650`
   - **Key**: `JWT_EXPIRE` **Value**: `30d`
   - **Key**: `FRONTEND_URL` **Value**: `https://app-ammex.onrender.com`

### **Frontend Service:**
1. Go to your frontend service dashboard
2. Click "Environment" tab
3. Add each variable:
   - **Key**: `VITE_API_URL` **Value**: `https://your-backend-app.onrender.com/api`
   - **Key**: `NODE_ENV` **Value**: `production`

## **⚠️ Important Notes:**

1. **Replace Placeholders:**
   - `your-postgresql-connection-string` → Your actual database URL
   - `your-backend-app.onrender.com` → Your actual backend service URL
   - `your-frontend-app.onrender.com` → Your actual frontend service URL

2. **JWT Secret:**
   - The secret I generated is cryptographically secure
   - Never share this secret publicly
   - Keep it the same across all environments for consistency

3. **Order of Deployment:**
   - Deploy backend first
   - Get backend URL
   - Update frontend environment variables
   - Deploy frontend
   - Update backend FRONTEND_URL
   - Redeploy backend

## **✅ Verification:**

After setting these variables:
- Backend health check: `https://your-backend.onrender.com/api/health`
- Frontend should load and connect to backend
- Login should work properly
- All API requests should be authenticated
