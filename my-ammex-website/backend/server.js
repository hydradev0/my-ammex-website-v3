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
      app.use('/api/items', require('./routes/items'));
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

      app.get('/api/items', (req, res) => {
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

      // Mock customer routes
      app.get('/api/customers', (req, res) => {
        res.json({
          success: true,
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10
          }
        });
      });

      app.post('/api/customers', (req, res) => {
        // Mock customer creation with validation
        const { companyName, telephone1, email1 } = req.body;
        
        // Basic validation
        if (!customerName || !telephone1 || !email1) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: [
              ...(!customerName ? [{ field: 'customerName', message: 'Customer name is required' }] : []),
              ...(!telephone1 ? [{ field: 'telephone1', message: 'Telephone 1 is required' }] : []),
              ...(!email1 ? [{ field: 'email1', message: 'Email 1 is required' }] : [])
            ]
          });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email1)) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: [{ field: 'email1', message: 'Please provide a valid email address' }]
          });
        }

        // Success response
        res.status(201).json({
          success: true,
          data: {
            id: Date.now(),
            customerId: `CUST${String(Date.now()).padStart(4, '0')}`,
            customerName,
            telephone1,
            email1,
            ...req.body,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        });
      });

      app.get('/api/customers/stats', (req, res) => {
        res.json({
          success: true,
          data: {
            totalCustomers: 0,
            activeCustomers: 0,
            newCustomersThisMonth: 0
          }
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
    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Mock (No Database)'}`);
      console.log(`📱 Mobile access: http://192.168.1.53:${PORT}`);
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