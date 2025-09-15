# 🌐 Frontend Environment Configuration

## **Environment Variables for Frontend**

### **Production (Render Static Site)**
```
VITE_API_URL=https://your-backend-app.onrender.com/api
NODE_ENV=production
```

### **Development (Local)**
```
VITE_API_URL=http://localhost:5000/api
NODE_ENV=development
```

## **🔧 Production-Ready Features Added**

### **1. URL Validation**
- ✅ Validates `VITE_API_URL` format
- ✅ Throws clear error for invalid URLs
- ✅ Graceful fallback to relative path

### **2. Enhanced Error Handling**
- ✅ Timeout handling (30 seconds default)
- ✅ Retry mechanism (2 retries with exponential backoff)
- ✅ Proper error classification (timeout, network, client errors)
- ✅ Conditional logging (dev vs production)

### **3. Network Resilience**
- ✅ AbortController for request cancellation
- ✅ Automatic retry for network failures
- ✅ No retry for client errors (4xx status codes)
- ✅ Exponential backoff between retries

### **4. Security & Performance**
- ✅ No hardcoded URLs in production
- ✅ Environment-specific configuration
- ✅ Proper error boundaries
- ✅ Health check functionality

## **🚀 How to Use**

### **In Service Files:**
```javascript
import { apiCall, checkApiHealth } from '../utils/apiConfig';

// Make API calls
const data = await apiCall('/users');

// Check API health
const isHealthy = await checkApiHealth();
```

### **Custom Configuration:**
```javascript
// Custom timeout and retries
const data = await apiCall('/users', {
  timeout: 60000,  // 60 seconds
  retries: 3,      // 3 retries
  method: 'POST',
  body: JSON.stringify(userData)
});
```

## **⚠️ Important Notes**

1. **Environment Variables**: Must be set in Render dashboard
2. **URL Format**: Must be complete URL (https://domain.com/api)
3. **CORS**: Backend must allow your frontend domain
4. **Health Check**: Uses `/api/health` endpoint

## **🔍 Troubleshooting**

### **Common Issues:**
- **Invalid URL Error**: Check `VITE_API_URL` format
- **CORS Errors**: Verify backend CORS configuration
- **Timeout Errors**: Check network connectivity
- **Retry Exhausted**: Check backend service status

### **Debug Mode:**
Set `NODE_ENV=development` to see detailed error logs.

## **✅ Production Checklist**

- [ ] `VITE_API_URL` set correctly in Render
- [ ] Backend CORS allows frontend domain
- [ ] Health check endpoint working
- [ ] No console errors in production
- [ ] API calls working properly
- [ ] Error handling working as expected
