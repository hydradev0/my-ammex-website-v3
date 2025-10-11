// View configurations for different data types
// These can be used with the generic ViewDetailsModal and EditDetailsModal component
import { formatPhoneNumber } from '../utils/phoneFormatter';

export const itemViewConfig = {
  title: 'Item Details',
  sections: [
    {
      title: 'Item Details',
      gridCols: 'grid-cols-3',
      fields: [
        {
          label: 'Vendor',
          key: 'vendor',
          width: 'w-2/3'
        },
        // {
        //   label: 'Item Code',
        //   key: 'itemCode',
        //   width: 'w-1/3'
        // },
        {
          label: 'Model No.',
          key: 'modelNo',
          width: 'w-1/3'
        },
        {
          label: 'Item Name',
          key: 'itemName',
          width: 'w-2/3'
        }
      ]
    },
    {
      title: 'Pricing Information',
      gridCols: 'grid-cols-3',
      fields: [
        {
          label: 'Price',
          key: 'price',
          width: 'w-1/3',
          customRender: (value) => value ? `₱${Number(value).toFixed(2)}` : 'N/A'
        },
        {
          label: 'Floor Price',
          key: 'floorPrice',
          width: 'w-1/3',
          customRender: (value) => value ? `₱${Number(value).toFixed(2)}` : 'N/A'
        },
        {
          label: 'Ceiling Price',
          key: 'ceilingPrice',
          width: 'w-1/3',
          customRender: (value) => value ? `₱${Number(value).toFixed(2)}` : 'N/A'
        }
      ]
    },
    {
      title: 'Stock Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Unit',
          key: 'unit',
          width: 'w-1/3',
          getValue: (item) => item.unit?.name || 'N/A'
        },
        {
          label: 'Category',
          key: 'category',
          width: 'w-1/3',
          getValue: (item) => item.category?.name || 'N/A'
        },
        {
          label: 'Subcategory',
          key: 'subcategory',
          width: 'w-1/3',
          getValue: (item) => item.subcategory?.name || 'N/A'
        },
        {
          label: 'Minimum Level',
          key: 'minLevel',
          width: 'w-1/3'
        },
        {
          label: 'Quantity',
          key: 'quantity',
          width: 'w-1/3',
          customRender: (value) => value ? value.toLocaleString() : 'N/A'
        },
        {
          label: 'Maximum Level',
          key: 'maxLevel',
          width: 'w-1/3'
        }
      ]
    },
    {
      title: 'Additional Details',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Description',
          key: 'description',
          isTextArea: true
        }
      ]
    }
  ]
};

export const editItemConfig = {
  title: 'Edit Item',
  includeImages: true,
  sections: [
    {
      title: 'Item Details',
      gridCols: 'grid-cols-3',
      fields: [
        {
          label: 'Vendor',
          key: 'vendor',
          width: 'w-2/3',
          type: 'dropdown',
          required: true,
        },
        {
          label: 'Model No.',
          key: 'modelNo',
          width: 'w-2/3',
          type: 'text',
          required: true
        },
        {
          label: 'Item Name',
          key: 'itemName',
          width: 'w-2/3',
          type: 'text',
        },
      ]
    },
    {
      title: 'Pricing Information',
      gridCols: 'grid-cols-3',
      fields: [
        {
          label: 'Price',
          key: 'price',
          width: 'w-2/3',
          type: 'number',
          prefix: '₱',
          step: '0.01',
          min: '0',
          required: true
        },
        {
          label: 'Floor Price',
          key: 'floorPrice',
          width: 'w-2/3',
          type: 'number',
          prefix: '₱',
          step: '0.01',
          min: '0',
          required: true
        },
        {
          label: 'Ceiling Price',
          key: 'ceilingPrice',
          width: 'w-2/3',
          type: 'number',
          prefix: '₱',
          step: '0.01',
          min: '0',
        }
      ]
    },
    {
      title: 'Stock Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Unit',
          key: 'unit',
          width: 'w-1/2',
          type: 'dropdown',
          required: true
        },
        {
          label: 'Category',
          key: 'category',
          width: 'w-1/2',
          type: 'dropdown',
          required: true
        },
        {
          label: 'Subcategory',
          key: 'subcategory',
          width: 'w-1/2',
          type: 'dropdown',
          required: false
        },
        {
          label: 'Minimum Level',
          key: 'minLevel',
          width: 'w-1/3',
          type: 'number',
          min: '0',
          required: true
        },
        {
          label: 'Quantity',
          key: 'quantity',
          width: 'w-1/3',
          type: 'number',
          min: '0',
          required: true
        },
        {
          label: 'Maximum Level',
          key: 'maxLevel',
          width: 'w-1/3',
          type: 'number',
          min: '0',
          required: true
        }
      ]
    },
    {
      title: 'Additional Details',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Description',
          key: 'description',
          type: 'textarea',
          isTextArea: true,
          width: 'w-full'
        }
      ]
    }
  ]
};

export const customerViewConfig = {
  title: 'Customer Details',
  sections: [
    {
      title: 'Basic Information',
      gridCols: 'grid-cols-3',
      fields: [
        {
          label: 'Customer ID',
          key: 'customerId',
          width: 'w-1/3'
        },
        {
          label: 'Customer Name',
          key: 'customerName',
          width: 'w-2/3'
        },
        {
          label: 'Contact Name',
          key: 'contactName',
          width: 'w-1/2'
        }
      ]
    },
    {
      title: 'Address Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Street',
          key: 'street',
          width: 'w-full'
        },
        {
          label: 'City',
          key: 'city',
          width: 'w-1/2'
        },
        {
          label: 'Postal Code',
          key: 'postalCode',
          width: 'w-1/2'
        },
        {
          label: 'Country',
          key: 'country',
          width: 'w-1/2'
        }
      ]
    },
    {
      title: 'Contact Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Telephone 1',
          key: 'telephone1',
          width: 'w-1/2',
          customRender: (value) => formatPhoneNumber(value)
        },
        {
          label: 'Telephone 2',
          key: 'telephone2',
          width: 'w-1/2',
          customRender: (value) => formatPhoneNumber(value)
        }
      ]
    },
    {
      title: 'Email Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Email 1',
          key: 'email1',
          width: 'w-1/2'
        },
        {
          label: 'Email 2',
          key: 'email2',
          width: 'w-1/2'
        }
      ]
    },
  ]
};



export const editCustomerConfig = {
  title: 'Edit Customer',
  sections: [
    {
      title: 'Basic Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Customer ID',
          key: 'customerId',
          width: 'w-1/3',
          type: 'text',
          disabled: true,
          required: true
        },
        {
          label: 'Customer Name',
          key: 'customerName',
          width: 'w-2/3',
          type: 'text',
          required: true
        },
        {
          label: 'Contact Name',
          key: 'contactName',
          width: 'w-1/2',
          type: 'text'
        }
      ]
    },
    {
      title: 'Address Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Street',
          key: 'street',
          width: 'w-full',
          type: 'text'
        },
        {
          label: 'City',
          key: 'city',
          width: 'w-1/2',
          type: 'cityDropdown'
        },
        {
          label: 'Postal Code',
          key: 'postalCode',
          width: 'w-1/2',
          type: 'text'
        },
        {
          label: 'Country',
          key: 'country',
          width: 'w-1/2',
          type: 'text',
          disabled: true,
        }
      ]
    },
    {
      title: 'Contact Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Telephone 1',
          key: 'telephone1',
          width: 'w-2/3',
          type: 'phoneInput',
        },
        {
          label: 'Telephone 2',
          key: 'telephone2',
          width: 'w-2/3',
          type: 'phoneInput'
        }
      ]
    },
    {
      title: 'Email Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Email 1',
          key: 'email1',
          width: 'w-1/2',
          type: 'email',
          required: true
        },
        {
          label: 'Email 2',
          key: 'email2',
          width: 'w-1/2',
          type: 'email'
        }
      ]
    },
  ]
};

export const orderViewConfig = {
  title: 'Order Details',
  sections: [
    {
      title: 'Order Information',
      gridCols: 'grid-cols-1',
      fields: [
        {
          label: 'Order Number',
          key: 'orderNumber',
          width: 'w-1/3'
        },
        {
          label: 'Order Date',
          key: 'orderDate',
          width: 'w-1/3',
          customRender: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        {
          label: 'Status',
          key: 'status',
          width: 'w-1/3'
        },
        {
          label: 'Customer',
          key: 'customerName',
          width: 'w-2/3'
        },
        {
          label: 'Total Amount',
          key: 'totalAmount',
          width: 'w-1/3',
          customRender: (value) => value ? `₱${Number(value).toFixed(2)}` : 'N/A'
        }
      ]
    },
    {
      title: 'Shipping Information',
      gridCols: 'grid-cols-2',
      bgColor: 'bg-gray-100',
      fields: [
        {
          label: 'Shipping Address',
          key: 'shippingAddress',
          width: 'w-full'
        },
        {
          label: 'Shipping Method',
          key: 'shippingMethod'
        },
        {
          label: 'Expected Delivery',
          key: 'expectedDelivery',
          customRender: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        }
      ]
    },
    {
      title: 'Order Items',
      gridCols: 'grid-cols-1',
      bgColor: 'bg-gray-100',
      fields: [
        {
          label: 'Items',
          key: 'items',
          customRender: (items) => {
            if (!items || !Array.isArray(items)) return 'No items';
            return items.map((item, index) => 
              `${item.name} - Qty: ${item.quantity} | Price: ₱${Number(item.price).toFixed(2)} | Total: ₱${Number(item.quantity * item.price).toFixed(2)}`
            ).join('\n');
          }
        }
      ]
    }
  ]
};

// ==================== SUPPLIER VIEW CONFIGS ====================

export const supplierViewConfig = {
  title: 'Supplier Details',
  sections: [
    {
      title: 'Basic Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Supplier ID',
          key: 'supplierId',
          width: 'w-1/3'
        },
        {
          label: 'Company Name',
          key: 'companyName',
          width: 'w-2/3'
        },
        {
          label: 'Contact Name',
          key: 'contactName',
          width: 'w-1/2'
        }
      ]
    },
    {
      title: 'Address Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Street',
          key: 'street',
          width: 'w-full'
        },
        {
          label: 'City',
          key: 'city',
          width: 'w-1/2'
        },
        {
          label: 'Postal Code',
          key: 'postalCode',
          width: 'w-1/2'
        },
        {
          label: 'Country',
          key: 'country',
          width: 'w-1/2'
        }
      ]
    },
    {
      title: 'Contact Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Telephone 1',
          key: 'telephone1',
          width: 'w-1/2',
          customRender: (value) => formatPhoneNumber(value)
        },
        {
          label: 'Telephone 2',
          key: 'telephone2',
          width: 'w-1/2',
          customRender: (value) => formatPhoneNumber(value)
        }
      ]
    },
    {
      title: 'Email Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Email 1',
          key: 'email1',
          width: 'w-1/2'
        },
        {
          label: 'Email 2',
          key: 'email2',
          width: 'w-1/2'
        }
      ]
    },
    {
      title: 'Status Information',
      gridCols: 'grid-cols-1',
      fields: [
        {
          label: 'Active Status',
          key: 'isActive',
          customRender: (value) => value ? 'Active' : 'Inactive'
        }
      ]
    }
  ]
};

export const editSupplierConfig = {
  title: 'Edit Supplier',
  sections: [
    {
      title: 'Basic Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Supplier ID',
          key: 'supplierId',
          width: 'w-1/3',
          type: 'text',
          disabled: true,
          required: true
        },
        {
          label: 'Company Name',
          key: 'companyName',
          width: 'w-2/3',
          type: 'text',
          required: true
        },
        {
          label: 'Contact Name',
          key: 'contactName',
          width: 'w-1/2',
          type: 'text'
        }
      ]
    },
    {
      title: 'Address Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Street',
          key: 'street',
          width: 'w-full',
          type: 'text'
        },
        {
          label: 'City',
          key: 'city',
          width: 'w-1/2',
          type: 'text'
        },
        {
          label: 'Postal Code',
          key: 'postalCode',
          width: 'w-1/2',
          type: 'text'
        },
        {
          label: 'Country',
          key: 'country',
          width: 'w-1/2',
          type: 'text'
          
        }
      ]
    },
    {
      title: 'Contact Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Telephone 1',
          key: 'telephone1',
          width: 'w-2/3',
          type: 'phoneInput',
        },
        {
          label: 'Telephone 2',
          key: 'telephone2',
          width: 'w-2/3',
          type: 'phoneInput'
        }
      ]
    },
    {
      title: 'Email Information',
      gridCols: 'grid-cols-2',
      fields: [
        {
          label: 'Email 1',
          key: 'email1',
          width: 'w-1/2',
          type: 'email',
          required: true
        },
        {
          label: 'Email 2',
          key: 'email2',
          width: 'w-1/2',
          type: 'email'
        }
      ]
    }
  ]
};

// Helper function to create custom view configs
export const createViewConfig = (title, sections) => ({
  title,
  sections
});

// Helper function to create a simple single-section view config
export const createSimpleViewConfig = (title, fields, gridCols = 'grid-cols-1') => ({
  title,
  sections: [
    {
      fields,
      gridCols,
      bgColor: 'bg-gray-100'
    }
  ]
});


