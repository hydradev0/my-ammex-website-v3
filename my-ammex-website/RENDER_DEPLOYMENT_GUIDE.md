# Render Deployment Guide for Ammex Website

This guide will help you deploy your Ammex Website application to Render using two separate services (recommended approach).

## 🚀 Deployment Architecture

We'll deploy your application as two separate services:
- **Frontend Service**: Static site hosting for React app
- **Backend Service**: Web service for Node.js/Express API

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **PostgreSQL Database**: Set up a PostgreSQL database (Render PostgreSQL add-on recommended)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## 🔧 Step 1: Database Setup

### Option A: Render PostgreSQL (Recommended)
1. In your Render dashboard, click "New +" → "PostgreSQL"
2. Choose a name (e.g., `ammex-database`)
3. Select the **Free** plan for development or **Starter** for production
4. Note down the **External Database URL** - you'll need this later

### Option B: External PostgreSQL
Use any PostgreSQL hosting service (Supabase, Railway, etc.) and get the connection string.

## 🖥️ Step 2: Backend Service Deployment

1. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Choose the repository containing your Ammex Website

2. **Configure Backend Service**:
   - **Name**: `ammex-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (or `Free` for development)

3. **Environment Variables** (Add these in the Environment tab):
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d
   FRONTEND_URL=https://your-frontend-app.onrender.com
   ```

   **Important**: Replace the placeholder values:
   - `DATABASE_URL`: Use the PostgreSQL connection string from Step 1
   - `JWT_SECRET`: Generate a strong secret key (32+ characters)
   - `FRONTEND_URL`: You'll update this after deploying the frontend

4. **Deploy**: Click "Create Web Service"

5. **Note the Backend URL**: After deployment, note your backend service URL (e.g., `https://ammex-backend.onrender.com`)

## 🌐 Step 3: Frontend Service Deployment

1. **Create New Static Site**:
   - Click "New +" → "Static Site"
   - Connect your Git repository

2. **Configure Frontend Service**:
   - **Name**: `ammex-frontend` (or your preferred name)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-app.onrender.com/api
   NODE_ENV=production
   ```

   **Important**: Replace `your-backend-app.onrender.com` with your actual backend service URL from Step 2.

4. **Deploy**: Click "Create Static Site"

## 🔄 Step 4: Update Backend CORS Configuration

After your frontend is deployed:

1. Go to your backend service in Render dashboard
2. Navigate to "Environment" tab
3. Update the `FRONTEND_URL` environment variable with your frontend URL:
   ```
   FRONTEND_URL=https://your-frontend-app.onrender.com
   ```
4. Click "Save Changes" - this will trigger a redeploy

## 🗄️ Step 5: Database Setup

1. **Connect to your database** using a PostgreSQL client (pgAdmin, DBeaver, etc.)
2. **Run the setup script** (you may need to do this locally first):
   ```bash
   cd backend
   npm run setup-db
   npm run create-admin
   npm run seed:roles
   ```

3. **Alternative**: Create a temporary script to run these commands on Render

## 🔍 Step 6: Verification

1. **Test Backend Health**: Visit `https://your-backend-app.onrender.com/api/health`
2. **Test Frontend**: Visit your frontend URL
3. **Test Login**: Try logging in with the admin account you created

## 🛠️ Troubleshooting

### Common Issues:

1. **CORS Errors**: 
   - Ensure `FRONTEND_URL` environment variable is set correctly in backend
   - Check that the URL matches exactly (including https://)

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Ensure your database allows connections from Render's IP ranges
   - Check that SSL is properly configured

3. **Build Failures**:
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

4. **Environment Variables**:
   - Double-check all environment variables are set
   - Ensure no trailing spaces in variable values
   - Redeploy after changing environment variables

### Debug Commands:

```bash
# Check backend logs
# Go to your backend service → "Logs" tab

# Check frontend build logs  
# Go to your frontend service → "Logs" tab
```

## 🔐 Security Considerations

1. **JWT Secret**: Use a strong, random JWT secret (32+ characters)
2. **Database**: Use a strong database password
3. **HTTPS**: Render provides HTTPS by default
4. **Environment Variables**: Never commit sensitive data to Git

## 📈 Scaling

- **Free Tier**: Good for development and small applications
- **Starter Plan**: Better for production with more resources
- **Higher Plans**: For high-traffic applications

## 🔄 Updates and Maintenance

1. **Code Updates**: Push to your Git repository - Render will auto-deploy
2. **Environment Variables**: Update in Render dashboard as needed
3. **Database Backups**: Set up automated backups for production

## 📞 Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Support**: Available through their dashboard
- **Community**: Render Discord and GitHub discussions

---

## 🎉 Congratulations!

Your Ammex Website should now be live on Render! 

**Frontend**: `https://your-frontend-app.onrender.com`
**Backend API**: `https://your-backend-app.onrender.com/api`

Remember to:
- Set up database backups for production
- Monitor your services for performance
- Keep your dependencies updated
- Set up proper monitoring and logging
