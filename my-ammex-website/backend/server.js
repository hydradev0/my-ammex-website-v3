const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

// Validate critical environment variables on startup
const validateEnvironment = () => {
  const requiredVars = ['JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('💡 Please set the following environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('📖 See RENDER_ENVIRONMENT_VARIABLES.md for configuration details');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated successfully');
};

// Validate environment before starting server
validateEnvironment();

// Create Express app
const app = express();

// CORS Configuration for Production
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://app-ammex.onrender.com',
      "https://www.ammexmachinetools.com",
      "https://ammexmachinetools.com",
    ].filter(Boolean);
    
    // Allow localhost only in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
// Ensure Express responds to preflight requests for all routes
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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
      app.use('/api/suppliers', require('./routes/suppliers'));
      app.use('/api/cart', require('./routes/cart'));
      app.use('/api/checkout', require('./routes/checkout'));
      
      app.use('/api/orders', require('./routes/orders'));
      app.use('/api/invoices', require('./routes/invoices'));
      app.use('/api/payments', require('./routes/payments'));
      app.use('/api/paymongo-payment-methods', require('./routes/paymongoPaymentMethods'));
      app.use('/api/analytics', require('./routes/analytics'));
      app.use('/api/dashboard', require('./routes/dashboard'));
      app.use('/api/import', require('./routes/import'));
      app.use('/api/notifications', require('./routes/notifications'));
    } else {
      // Development without database - mock routes
      app.get('/api/auth/me', (req, res) => {
        res.json({
          success: true,
          data: {
            id: 'dev-user-id',
            name: 'Development User',
            email: 'dev@example.com',
            role: 'Admin',
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
            role: 'Admin',
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
      
      // Mock checkout routes in no-DB mode
      app.post('/api/checkout/:customerId/preview', (req, res) => {
        res.json({ success: true, data: { items: [], totalAmount: 0, orderNumber: 'ORD-DEV-0000', status: 'pending', orderDate: new Date().toISOString() } });
      });
      app.post('/api/checkout/:customerId/confirm', (req, res) => {
        res.status(201).json({ success: true, data: { id: 'dev-order', items: [], totalAmount: 0, status: 'pending', orderNumber: 'ORD-DEV-0000', orderDate: new Date().toISOString() }, clientView: { id: 'dev-order', items: [], totalAmount: 0, status: 'pending', orderNumber: 'ORD-DEV-0000', orderDate: new Date().toISOString() } });
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