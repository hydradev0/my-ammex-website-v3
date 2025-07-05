const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes (only load if database is available)
if (process.env.MONGODB_URI) {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/orders', require('./routes/orders'));
} else {
  // Mock routes for development without database
  app.get('/api/auth/me', (req, res) => {
    res.json({
      success: true,
      data: {
        id: 'dev-user-id',
        name: 'Development User',
        email: 'dev@example.com',
        role: 'admin',
        department: 'Administration'
      }
    });
  });
  
  app.post('/api/auth/login', (req, res) => {
    res.json({
      success: true,
      token: 'dev-token',
      user: {
        id: 'dev-user-id',
        name: 'Development User',
        email: 'dev@example.com',
        role: 'admin',
        department: 'Administration'
      }
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 