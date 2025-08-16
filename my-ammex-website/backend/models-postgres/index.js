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
      type: DataTypes.ENUM('admin', 'sales', 'logistics'),
      defaultValue: 'sales'
    },
    department: {
      type: DataTypes.ENUM('Sales', 'Logistics', 'Administration'),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    phoneNumber: {
      type: DataTypes.STRING,
      validate: {
        is: {
          args: /^[0-9+\-() ]+$/,
          msg: 'Please add a valid phone number'
        }
      }
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
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Item name is required' }
      }
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vendor is required' }
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
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Ceiling price is required' },
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
      allowNull: false,
      defaultValue: 0,
      validate: {
        notEmpty: { msg: 'Maximum level is required' },
        min: { args: [0], msg: 'Maximum level must be a positive number' }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    hooks: {
      beforeValidate: (item) => {
        // Validate that ceiling price is greater than floor price
        if (item.ceilingPrice && item.floorPrice && 
            Number(item.ceilingPrice) <= Number(item.floorPrice)) {
          throw new Error('Ceiling price must be greater than floor price');
        }
        
        // Validate that price is within floor and ceiling range
        if (item.price && item.floorPrice && item.ceilingPrice) {
          const price = Number(item.price);
          const floorPrice = Number(item.floorPrice);
          const ceilingPrice = Number(item.ceilingPrice);
          
          if (price < floorPrice || price > ceilingPrice) {
            throw new Error('Price must be between floor price and ceiling price');
          }
        }
        
        // Validate that max level is greater than min level
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
      unique: true,
      validate: {
        notEmpty: { msg: 'Category name is required' }
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
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
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








  /* ================================ */

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
  Customer.hasMany(Order, {
    foreignKey: 'customerId',
    as: 'orders'
  });

  Order.belongsTo(Customer, {
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
    Unit
  };
};



module.exports = { initializeModels }; 