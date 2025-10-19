const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PayMongoPaymentMethod = sequelize.define('PayMongoPaymentMethod', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    methodKey: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'method_key'
    },
    methodName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'method_name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_enabled'
    },
    processingTime: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Instant',
      field: 'processing_time'
    },
    fees: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'No additional fees'
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'blue'
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'CreditCard'
    },
    minAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1.00,
      field: 'min_amount'
    },
    maxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100000.00,
      field: 'max_amount'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    }
  }, {
    tableName: 'paymongo_payment_methods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['is_enabled']
      },
      {
        fields: ['sort_order']
      }
    ]
  });

  return PayMongoPaymentMethod;
};
