const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Function to initialize models after sequelize is connected
const initializeModels = (sequelize) => {
  // User Model
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Please add a name' }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please add a valid email' },
        notEmpty: { msg: 'Please add an email' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [6],
          msg: 'Password must be at least 6 characters long'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Client', 'Warehouse Supervisor', 'Sales Marketing'),
      defaultValue: 'Client'
    },
    department: {
      type: DataTypes.ENUM('Sales', 'Warehouse', 'Administration', 'Client Services'),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Item Model
  const Item = sequelize.define('Item', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    itemCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Item code is required' }
      }
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: true,
    
    },
    modelNo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Model number is required' }
      }
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vendor is required' }
      }
    },
    supplierId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Supplier',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Supplier is required' }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Price is required' },
        min: { args: [0], msg: 'Price must be a positive number' }
      }
    },
    floorPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Floor price is required' },
        min: { args: [0], msg: 'Floor price must be a positive number' }
      }
    },
    ceilingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Ceiling price must be a positive number' }
      }
    },
    unitId: {
       type: DataTypes.INTEGER,
       references: {
         model: 'Unit',
         key: 'id'
       },
       allowNull: false,
       validate: {
         notEmpty: { msg: 'Unit is required' }
       }
     },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notEmpty: { msg: 'Quantity is required' },
        min: { args: [0], msg: 'Quantity must be a positive number' }
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Category',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Category is required' }
      }
    },
    subcategoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Category',
        key: 'id'
      },
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    minLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notEmpty: { msg: 'Minimum level is required' },
        min: { args: [0], msg: 'Minimum level must be a positive number' }
      }
    },
    maxLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Maximum level must be a positive number' }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    archivedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      }
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    }
  }, {
    timestamps: true,
    hooks: {
      beforeValidate: (item) => {
        // Validate that ceiling price is greater than floor price (only if both are provided)
        if (item.ceilingPrice && item.floorPrice && 
            Number(item.ceilingPrice) <= Number(item.floorPrice)) {
          throw new Error('Ceiling price must be greater than floor price');
        }
        
        // Validate that price is within floor and ceiling range (only if ceiling is provided)
        if (item.price && item.floorPrice && item.ceilingPrice) {
          const price = Number(item.price);
          const floorPrice = Number(item.floorPrice);
          const ceilingPrice = Number(item.ceilingPrice);
          
          if (price < floorPrice || price > ceilingPrice) {
            throw new Error('Price must be between floor price and ceiling price');
          }
        }
        
        // Validate that max level is greater than min level (only if both are provided)
        if (item.maxLevel && item.minLevel && 
            Number(item.maxLevel) <= Number(item.minLevel)) {
          throw new Error('Maximum level must be greater than minimum level');
        }
      }
    }
  });

  // Unit Model
  const Unit = sequelize.define('Unit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Unit name is required' }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  }, {
    timestamps: true
  });
  /* ================================ */
  // Category Model
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Category name is required' }
      }
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Category',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
    
  }, {
    timestamps: true
  });

  // Order Model
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Customer',
        key: 'id'
      }
    },
    orderNumber: {
      type: DataTypes.STRING,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    orderDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    shippingAddress: {
      type: DataTypes.TEXT
    },
    billingAddress: {
      type: DataTypes.TEXT
    },
    notes: {
      type: DataTypes.TEXT
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    finalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    timestamps: true
  });

  // OrderItem Model
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    itemId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Item',
        key: 'id'
      },
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    timestamps: true
  });

  // Customer Model
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // Will be set automatically
    },
    customerName: {
      type: DataTypes.STRING,
      field: 'customer_name',
      allowNull: true,
      validate: {
        notEmpty: { msg: 'Company name is required' }
      }
    },
    street: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactName: {
      type: DataTypes.STRING,
      field: 'contact_name',
      allowNull: true
    },
    telephone1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telephone2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email1: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: { msg: 'Please add a valid email' },
        notEmpty: { msg: 'Email 1 is required' }
      }
    },
    email2: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmailOrEmpty: function(value) {
          if (value && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Please add a valid email');
            }
          }
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    profileCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    hooks: {
      afterCreate: async (customer, options) => {
        if (!customer.customerId) {
          const paddedId = String(customer.id).padStart(4, '0');
          customer.customerId = `CUST${paddedId}`;
          await customer.save({ transaction: options.transaction });
        }
      }
    }
  });

  // Supplier Model
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    supplierId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // Will be set automatically
    },
    companyName: {
      type: DataTypes.STRING,
      field: 'company_name',
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Company name is required' }
      }
    },
    street: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    telephone1: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Telephone 1 is required' }
      }
    },
    telephone2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email1: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: { msg: 'Please add a valid email' },
        notEmpty: { msg: 'Email 1 is required' }
      }
    },
    email2: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmailOrEmpty: function(value) {
          if (value && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Please add a valid email');
            }
          }
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    archivedAt: {
      type: DataTypes.DATE,
      field: 'archived_at',
      allowNull: true
    },
    archivedBy: {
      type: DataTypes.INTEGER,
      field: 'archived_by',
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    hooks: {
      afterCreate: async (supplier, options) => {
        if (!supplier.supplierId) {
          const paddedId = String(supplier.id).padStart(4, '0');
          supplier.supplierId = `SUP${paddedId}`;
          await supplier.save({ transaction: options.transaction });
        }
      }
    }
  });

  // Cart Model
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      field: 'customer_id',
      references: {
        model: 'Customer',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Customer ID is required' }
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'converted', 'abandoned'),
      defaultValue: 'active'
    },
    lastUpdated: {
      type: DataTypes.DATE,
      field: 'last_updated',
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  // CartItem Model
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cartId: {
      type: DataTypes.INTEGER,
      field: 'cart_id',
      references: {
        model: 'Cart',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Cart ID is required' }
      }
    },
    itemId: {
      type: DataTypes.INTEGER,
      field: 'item_id',
      references: {
        model: 'Item',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Item ID is required' }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Quantity must be a positive number' }
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'unit_price',
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Unit price must be a positive number' }
      }
    },
    addedAt: {
      type: DataTypes.DATE,
      field: 'added_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true
  });

  // Invoice Model
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    orderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Order',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Order ID is required' }
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Customer',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Customer ID is required' }
      }
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Total amount is required' },
        min: { args: [0], msg: 'Total amount must be a positive number' }
      }
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'Paid amount must be non-negative' }
      }
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: { args: [0], msg: 'Remaining balance must be non-negative' }
      }
    },
    status: {
      type: DataTypes.ENUM('awaiting payment', 'partially paid', 'completed', 'rejected', 'overdue'),
      defaultValue: 'awaiting payment'
    },
    paymentTerms: {
      type: DataTypes.STRING,
      defaultValue: '30 days'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User',
        key: 'id'
      },
      allowNull: false
    }
  }, {
    timestamps: true
  });

  // InvoiceItem Model
  const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Invoice',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Invoice ID is required' }
      }
    },
    itemId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Item',
        key: 'id'
      },
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Item ID is required' }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Quantity must be at least 1' }
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Unit price must be a positive number' }
      }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Total price must be a positive number' }
      }
    }
  }, {
    timestamps: true
  });

  /* ================================ */

  // PaymentMethod Model
  const PaymentMethod = sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Payment method name is required' }
      }
    },
    accountName: {
      type: DataTypes.STRING,
      field: 'account_name',
      allowNull: true
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    requiresReference: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    qrCodeBase64: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  // Bank Model (for Bank Transfer)
  const Bank = sequelize.define('Bank', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Bank name is required' }
      }
    },
    accountName: {
      type: DataTypes.STRING,
      field: 'account_name',
      allowNull: true
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Account number is required' }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    qrCodeBase64: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  // Payment Model (Customer Payment Submissions)
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    paymentNumber: {
      type: DataTypes.STRING,
      field: 'payment_number',
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Payment number is required' }
      }
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      field: 'invoice_id',
      allowNull: false,
      references: {
        model: 'Invoice',
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      field: 'customer_id',
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0.01], msg: 'Payment amount must be greater than 0' }
      }
    },
    paymentMethod: {
      type: DataTypes.STRING,
      field: 'payment_method',
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Payment method is required' }
      }
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending_approval', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending_approval'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: 'rejection_reason',
      allowNull: true
    },
    submittedAt: {
      type: DataTypes.DATE,
      field: 'submitted_at',
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reviewedAt: {
      type: DataTypes.DATE,
      field: 'reviewed_at',
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      field: 'reviewed_by',
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      }
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    }
  }, {
    tableName: 'Payment',
    timestamps: true
  });

  // PaymentHistory Model (for tracking all payment activities)
  const PaymentHistory = sequelize.define('PaymentHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    paymentId: {
      type: DataTypes.INTEGER,
      field: 'payment_id',
      allowNull: true,
      references: {
        model: 'Payment',
        key: 'id'
      }
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      field: 'invoice_id',
      allowNull: false,
      references: {
        model: 'Invoice',
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      field: 'customer_id',
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM('submitted', 'approved', 'rejected', 'manual_entry', 'refund'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      field: 'payment_method',
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    performedBy: {
      type: DataTypes.INTEGER,
      field: 'performed_by',
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      }
    }
  }, {
    tableName: 'PaymentHistory',
    timestamps: true
  });

  // Notification Model (for customer notifications)
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      field: 'customer_id',
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('payment_rejected', 'payment_approved', 'invoice_overdue', 'order_rejected', 'order_appeal', 'general'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      field: 'is_read',
      allowNull: false,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      field: 'read_at',
      allowNull: true
    },
    // Admin/Sales read tracking (separate from client read state)
    adminIsRead: {
      type: DataTypes.BOOLEAN,
      field: 'admin_is_read',
      allowNull: false,
      defaultValue: false
    },
    adminReadAt: {
      type: DataTypes.DATE,
      field: 'admin_read_at',
      allowNull: true
    }
  }, {
    tableName: 'Notification',
    timestamps: true
  });

  // Define relationships
  User.hasMany(Order, {
    foreignKey: 'userId',
    as: 'orders'
  });

  Order.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // Category relationships
  Category.hasMany(Item, {
    foreignKey: 'categoryId',
    as: 'items'
  });

  Item.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category'
  });

  Item.belongsTo(Category, {
    foreignKey: 'subcategoryId',
    as: 'subcategory'
  });

  // Category self-referential relationships for subcategories
  Category.hasMany(Category, {
    foreignKey: 'parentId',
    as: 'subcategories'
  });

  Category.belongsTo(Category, {
    foreignKey: 'parentId',
    as: 'parent'
  });

  // Unit relationships
  Unit.hasMany(Item, {
    foreignKey: 'unitId',
    as: 'items'
  });
  Item.belongsTo(Unit, {
    foreignKey: 'unitId',
    as: 'unit'
  });

  Item.hasMany(OrderItem, {
    foreignKey: 'itemId',
    as: 'orderItems'
  });

  OrderItem.belongsTo(Item, {
    foreignKey: 'itemId',
    as: 'item'
  });

  Order.hasMany(OrderItem, {
    foreignKey: 'orderId',
    as: 'items'
  });

  OrderItem.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
  });

  // Customer relationships
  User.hasOne(Customer, {
    foreignKey: 'userId',
    as: 'customer'
  });

  Customer.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  Customer.hasMany(Order, {
    foreignKey: 'customerId',
    as: 'orders'
  });

  Order.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
  });

  // Cart relationships
  Customer.hasOne(Cart, {
    foreignKey: 'customerId',
    as: 'cart'
  });

  Cart.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
  });

  Cart.hasMany(CartItem, {
    foreignKey: 'cartId',
    as: 'items'
  });

  CartItem.belongsTo(Cart, {
    foreignKey: 'cartId',
    as: 'cart'
  });

  Item.hasMany(CartItem, {
    foreignKey: 'itemId',
    as: 'cartItems'
  });

  CartItem.belongsTo(Item, {
    foreignKey: 'itemId',
    as: 'item'
  });

  // Supplier relationships
  Supplier.hasMany(Item, {
    foreignKey: 'supplierId',
    as: 'items'
  });

  Item.belongsTo(Supplier, {
    foreignKey: 'supplierId',
    as: 'supplier'
  });

  // Invoice relationships
  Order.hasOne(Invoice, {
    foreignKey: 'orderId',
    as: 'invoice'
  });

  Invoice.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
  });

  Customer.hasMany(Invoice, {
    foreignKey: 'customerId',
    as: 'invoices'
  });

  Invoice.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
  });

  User.hasMany(Invoice, {
    foreignKey: 'createdBy',
    as: 'createdInvoices'
  });

  Invoice.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });

  Invoice.hasMany(InvoiceItem, {
    foreignKey: 'invoiceId',
    as: 'items'
  });

  InvoiceItem.belongsTo(Invoice, {
    foreignKey: 'invoiceId',
    as: 'invoice'
  });

  Item.hasMany(InvoiceItem, {
    foreignKey: 'itemId',
    as: 'invoiceItems'
  });

  InvoiceItem.belongsTo(Item, {
    foreignKey: 'itemId',
    as: 'item'
  });

  // Payment relationships
  Invoice.hasMany(Payment, {
    foreignKey: 'invoiceId',
    as: 'payments'
  });

  Payment.belongsTo(Invoice, {
    foreignKey: 'invoiceId',
    as: 'invoice'
  });

  Customer.hasMany(Payment, {
    foreignKey: 'customerId',
    as: 'payments'
  });

  Payment.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
  });

  User.hasMany(Payment, {
    foreignKey: 'reviewedBy',
    as: 'reviewedPayments'
  });

  Payment.belongsTo(User, {
    foreignKey: 'reviewedBy',
    as: 'reviewer'
  });

  // PaymentHistory relationships
  Payment.hasMany(PaymentHistory, {
    foreignKey: 'paymentId',
    as: 'history'
  });

  PaymentHistory.belongsTo(Payment, {
    foreignKey: 'paymentId',
    as: 'payment'
  });

  Invoice.hasMany(PaymentHistory, {
    foreignKey: 'invoiceId',
    as: 'paymentHistory'
  });

  PaymentHistory.belongsTo(Invoice, {
    foreignKey: 'invoiceId',
    as: 'invoice'
  });

  Customer.hasMany(PaymentHistory, {
    foreignKey: 'customerId',
    as: 'paymentHistory'
  });

  PaymentHistory.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
  });

  User.hasMany(PaymentHistory, {
    foreignKey: 'performedBy',
    as: 'performedPaymentHistory'
  });

  PaymentHistory.belongsTo(User, {
    foreignKey: 'performedBy',
    as: 'performer'
  });

  // Notification relationships
  Customer.hasMany(Notification, {
    foreignKey: 'customerId',
    as: 'notifications'
  });

  Notification.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
  });

  // Instance method to match password
  User.prototype.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  return {
    User,
    Item,
    Category,
    Order,
    OrderItem,
    Customer,
    Supplier,
    Unit,
    Cart,
    CartItem,
    Invoice,
    InvoiceItem,
    PaymentMethod,
    Bank,
    Payment,
    PaymentHistory,
    Notification
  };
};



module.exports = { initializeModels }; 