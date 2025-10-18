# Fixing API Connection Error: "Unexpected end of JSON input"

## Problem
When changing `VITE_API_URL` to `https://www.ammexmachinetools.com/api`, you get:
```
API Error (/auth/login) - Attempt 3: {
  message: "Failed to execute 'json' on 'Response': Unexpected end of JSON input",
  status: undefined,
  isTimeout: false,
  isNetworkError: true
}
```

## Root Cause
The backend server is **not deployed or not responding** at `https://www.ammexmachinetools.com/api`. When visiting the URL, it returns empty content instead of a valid API response.

## Solution Steps

### 1. Verify Backend Deployment Status

First, check if your backend is actually deployed and running:

```bash
# Test the health endpoint
curl https://www.ammexmachinetools.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "database": "PostgreSQL"
}
```

**If you get an empty response or error**, your backend isn't deployed properly.

### 2. Check Your Backend Hosting

Where is your backend hosted?
- **Render.com** - Check if the service is running
- **Heroku** - Check if dyno is running
- **VPS/Cloud Server** - Check if the process is running
- **Same server as frontend** - Check if Express is configured correctly

### 3. Backend Deployment Checklist

#### If Using Render.com:
1. Go to your Render dashboard: https://dashboard.render.com
2. Check if your backend service shows "Live" (green)
3. View the logs to see any errors
4. Verify environment variables are set:
   - `NODE_ENV=production`
   - `DATABASE_URL=<your-postgres-url>`
   - `JWT_SECRET=<your-secret>`
   - `FRONTEND_URL=https://www.ammexmachinetools.com`

#### If Backend Needs Deployment:
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add all environment variables from `backend/.env`

### 4. Check CORS Configuration

Your backend already has CORS configured for your domain in `backend/server.js`:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://app-ammex.onrender.com',
  "https://www.ammexmachinetools.com",
  "https://ammexmachinetools.com",
].filter(Boolean);
```

**Important:** Make sure your backend's `FRONTEND_URL` environment variable is set to `https://www.ammexmachinetools.com` (with HTTPS and www).

### 5. Test Backend Endpoints

Once your backend is deployed, test these endpoints:

```bash
# 1. Health check
curl https://www.ammexmachinetools.com/api/health

# 2. Test login endpoint (should return 400 for invalid credentials)
curl -X POST https://www.ammexmachinetools.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

### 6. Frontend Environment Variables

For **development** (local testing):
```env
VITE_API_URL=http://localhost:5000/api
```

For **production** (deployed frontend):
```env
VITE_API_URL=https://www.ammexmachinetools.com/api
```

**Note:** You'll need to rebuild your frontend after changing environment variables:
```bash
cd frontend
npm run build
```

### 7. Common Issues & Solutions

#### Issue: "Not allowed by CORS"
**Solution:** Update backend `FRONTEND_URL` environment variable to match your frontend domain exactly (including https://).

#### Issue: Backend returns 404
**Solution:** 
- Check if your backend is using `/api` prefix in routes
- Verify nginx/server configuration isn't stripping the `/api` path
- Check if backend is running on the correct port

#### Issue: Backend crashes on startup
**Solution:**
- Check backend logs for errors
- Verify DATABASE_URL is correct
- Verify JWT_SECRET is set
- Check if all required npm packages are installed

### 8. Recommended Architecture

#### Option A: Separate Deployments (Current)
- **Frontend:** Deployed at `https://www.ammexmachinetools.com`
- **Backend:** Should be deployed at a separate URL (e.g., `https://api.ammexmachinetools.com`)
- **Pro:** Better separation of concerns
- **Con:** Need to manage CORS

#### Option B: Same Server Deployment
- Deploy both frontend and backend on the same server
- Use nginx to proxy `/api/*` requests to backend
- **Pro:** No CORS issues
- **Con:** More complex nginx configuration

### 9. Quick Fix for Testing

If you need to test locally while fixing deployment:

1. Keep backend running locally:
```bash
cd backend
npm start
```

2. Update frontend `.env.local` (create if doesn't exist):
```env
VITE_API_URL=http://localhost:5000/api
```

3. Rebuild frontend:
```bash
cd frontend
npm run build
```

### 10. Nginx Configuration (If Applicable)

If your domain uses nginx, you need a proxy configuration:

```nginx
server {
    listen 80;
    server_name www.ammexmachinetools.com;
    
    # Frontend
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Next Steps

1. ✅ **First:** Verify where your backend should be deployed
2. ✅ **Second:** Deploy backend to production (Render, Heroku, VPS)
3. ✅ **Third:** Test backend endpoints with curl
4. ✅ **Fourth:** Update frontend VITE_API_URL to point to deployed backend
5. ✅ **Fifth:** Rebuild and redeploy frontend

## Need Help?

Check these files for more information:
- `backend/RENDER_DEPLOYMENT_GUIDE.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`
- `RENDER_ENVIRONMENT_VARIABLES.md`

## Verification Checklist

- [ ] Backend is deployed and running
- [ ] Health endpoint returns valid JSON
- [ ] Backend FRONTEND_URL env var matches your frontend domain
- [ ] CORS is properly configured
- [ ] Database is connected
- [ ] JWT_SECRET is set
- [ ] Frontend VITE_API_URL points to deployed backend
- [ ] Frontend is rebuilt after env changes

