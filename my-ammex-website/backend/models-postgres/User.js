const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

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
    type: DataTypes.ENUM('admin', 'sales', 'inventory'),
    defaultValue: 'sales'
  },
  department: {
    type: DataTypes.ENUM('Sales', 'Inventory', 'Administration'),
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
  },
  street: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  zipCode: {
    type: DataTypes.STRING
  },
  country: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
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

// Instance method to match password
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User; 