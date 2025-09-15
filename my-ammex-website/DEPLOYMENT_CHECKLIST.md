# 🚀 Render Deployment Checklist

Use this checklist to ensure a smooth deployment of your Ammex Website to Render.

## ✅ Pre-Deployment Checklist

### 📁 Repository Setup
- [ ] Code is pushed to Git repository (GitHub/GitLab/Bitbucket)
- [ ] All files are committed and pushed
- [ ] No sensitive data (passwords, API keys) in code
- [ ] `.env` files are in `.gitignore`

### 🗄️ Database Preparation
- [ ] PostgreSQL database is set up (Render PostgreSQL add-on or external)
- [ ] Database connection string is ready
- [ ] Database is accessible from external connections
- [ ] SSL connection is configured (for production)

### 🔐 Security Preparation
- [ ] Strong JWT secret generated (32+ characters)
- [ ] Database password is strong and secure
- [ ] No hardcoded secrets in code

## 🖥️ Backend Service Deployment

### 📋 Service Configuration
- [ ] Service type: Web Service
- [ ] Environment: Node
- [ ] Build Command: `cd backend && npm install`
- [ ] Start Command: `npm start`
- [ ] Plan selected (Free/Starter/Pro)

### 🌍 Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `DATABASE_URL=<your-postgresql-connection-string>`
- [ ] `JWT_SECRET=<your-strong-jwt-secret>`
- [ ] `JWT_EXPIRE=30d`
- [ ] `FRONTEND_URL=<will-be-updated-after-frontend-deployment>`

### 🚀 Deployment
- [ ] Backend service deployed successfully
- [ ] Health check endpoint working: `https://your-backend.onrender.com/api/health`
- [ ] Backend URL noted for frontend configuration

## 🌐 Frontend Service Deployment

### 📋 Service Configuration
- [ ] Service type: Static Site
- [ ] Build Command: `cd frontend && npm install && npm run build`
- [ ] Publish Directory: `frontend/dist`
- [ ] Plan selected (Free/Starter/Pro)

### 🌍 Environment Variables
- [ ] `VITE_API_URL=https://your-backend.onrender.com/api`
- [ ] `NODE_ENV=production`

### 🚀 Deployment
- [ ] Frontend service deployed successfully
- [ ] Frontend URL noted for backend CORS update

## 🔄 Post-Deployment Configuration

### 🔧 Backend CORS Update
- [ ] Updated `FRONTEND_URL` environment variable in backend service
- [ ] Backend service redeployed with new CORS settings
- [ ] CORS errors resolved

### 🗄️ Database Setup
- [ ] Database tables created
- [ ] Admin user created
- [ ] Role users seeded
- [ ] Database connection tested

### 🧪 Testing
- [ ] Frontend loads correctly
- [ ] Backend API responds correctly
- [ ] User login works
- [ ] Database operations work
- [ ] CORS issues resolved

## 🔍 Verification Tests

### 🌐 Frontend Tests
- [ ] Home page loads
- [ ] Navigation works
- [ ] Login page accessible
- [ ] Dashboard loads after login

### 🔌 Backend API Tests
- [ ] Health endpoint: `GET /api/health`
- [ ] Auth endpoints working
- [ ] Database operations working
- [ ] CORS headers present

### 🔐 Security Tests
- [ ] HTTPS enabled (Render default)
- [ ] JWT tokens working
- [ ] Protected routes secured
- [ ] No sensitive data exposed

## 🚨 Troubleshooting Checklist

### ❌ Common Issues
- [ ] **Build Failures**: Check build logs, verify dependencies
- [ ] **CORS Errors**: Verify FRONTEND_URL environment variable
- [ ] **Database Connection**: Check DATABASE_URL and SSL settings
- [ ] **Environment Variables**: Ensure all required vars are set
- [ ] **Memory Issues**: Consider upgrading plan if needed

### 🔧 Debug Steps
- [ ] Check Render service logs
- [ ] Verify environment variables
- [ ] Test API endpoints directly
- [ ] Check database connectivity
- [ ] Review browser console for errors

## 📊 Performance Monitoring

### 📈 Metrics to Watch
- [ ] Response times
- [ ] Memory usage
- [ ] Database connection pool
- [ ] Error rates
- [ ] Uptime

### 🔄 Maintenance Tasks
- [ ] Regular dependency updates
- [ ] Database backup verification
- [ ] Log monitoring
- [ ] Performance optimization
- [ ] Security updates

## 🎉 Deployment Complete!

Once all items are checked:
- [ ] Frontend URL: `https://your-frontend.onrender.com`
- [ ] Backend URL: `https://your-backend.onrender.com`
- [ ] Application fully functional
- [ ] Users can access and use the system

---

## 📞 Support Resources

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Status**: [status.render.com](https://status.render.com)
- **Community Support**: Render Discord and GitHub discussions

**Remember**: Keep your deployment secure, monitor performance, and maintain regular backups!
