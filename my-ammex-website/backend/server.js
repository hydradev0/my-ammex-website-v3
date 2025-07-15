const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'PostgreSQL' : 'Mock (No Database)'
  });
});

// Initialize server function
const initializeServer = async () => {
  try {
    // Connect to Database (PostgreSQL)
    await connectDB();

    // API Routes - Use PostgreSQL routes if database is available, otherwise use mock routes
    if (process.env.DATABASE_URL) {
      // Production/Development with database
      app.use('/api/auth', require('./routes/auth'));
      app.use('/api/products', require('./routes/products'));
      app.use('/api/categories', require('./routes/categories'));
      app.use('/api/units', require('./routes/units'));
      app.use('/api/customers', require('./routes/customers'));
      
      app.use('/api/orders', require('./routes/orders'));
      app.use('/api/analytics', require('./routes/analytics'));
    } else {
      // Development without database - mock routes
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

      app.get('/api/products', (req, res) => {
        res.json({
          success: true,
          data: []
        });
      });

      app.get('/api/orders', (req, res) => {
        res.json({
          success: true,
          data: []
        });
      });

      app.get('/api/analytics', (req, res) => {
        res.json({
          success: true,
          data: {}
        });
      });
    }

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    });

    // Global error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      
      // Default error
      let error = { ...err };
      error.message = err.message;

      // Sequelize validation error
      if (err.name === 'SequelizeValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error.message = message;
        error.statusCode = 400;
      }

      // Sequelize unique constraint error
      if (err.name === 'SequelizeUniqueConstraintError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error.message = message;
        error.statusCode = 400;
      }

      // JWT errors
      if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.statusCode = 401;
      }

      if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.statusCode = 401;
      }

      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Mock (No Database)'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated');
      });
    });

  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer();

module.exports = app; 