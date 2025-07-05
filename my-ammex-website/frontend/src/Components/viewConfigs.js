// View configurations for different data types
// These can be used with the generic ViewDetailsModal component

export const itemViewConfig = {
  title: 'Item Details',
  sections: [
    {
      title: 'Item Details',
      gridCols: 'grid-cols-1',
      fields: [
        {
          label: 'Vendor',
          key: 'vendor',
          width: 'w-2/3'
        },
        {
          label: 'Item Code',
          key: 'itemCode',
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
      bgColor: 'bg-gray-100',
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
      bgColor: 'bg-gray-100',
      fields: [
        {
          label: 'Unit',
          key: 'unit',
          width: 'w-1/3'
        },
        {
          label: 'Quantity',
          key: 'quantity',
          width: 'w-1/3',
          customRender: (value) => value ? value.toLocaleString() : 'N/A'
        },
        {
          label: 'Minimum Level',
          key: 'minLevel',
          width: 'w-1/3'
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
      bgColor: 'bg-gray-100',
      fields: [
        {
          label: 'Category',
          key: 'category'
        },
        {
          label: 'Description',
          key: 'description',
          isTextArea: true
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
      gridCols: 'grid-cols-1',
      fields: [
        {
          label: 'Customer Name',
          key: 'name',
          width: 'w-2/3'
        },
        {
          label: 'Customer Code',
          key: 'accountCode',
          width: 'w-1/3'
        },
        {
          label: 'Email',
          key: 'email',
          width: 'w-2/3'
        },
        {
          label: 'Phone',
          key: 'telephone',
          width: 'w-1/3'
        }
      ]
    },
    {
      title: 'Address Information',
      gridCols: 'grid-cols-2',
      bgColor: 'bg-gray-100',
      fields: [
        {
          label: 'Street Address',
          key: 'address',
          width: 'w-full'
        },
        {
          label: 'City',
          key: 'city',
          width: 'w-1/2'
        },
        {
          label: 'State/Province',
          key: 'state',
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
      title: 'Additional Information',
      gridCols: 'grid-cols-2',
      bgColor: 'bg-gray-100',
      fields: [
        {
          label: 'Contact Person',
          key: 'contactPerson'
        },
        {
          label: 'Notes',
          key: 'notes',
          isTextArea: true
        }
      ]
    }
  ]
};

export const supplierViewConfig = {
  title: 'Supplier Details',
  sections: [
    {
      title: 'Basic Information',
      gridCols: 'grid-cols-1',
      fields: [
        {
          label: 'Supplier Name',
          key: 'name',
          width: 'w-2/3'
        },
        {
          label: 'Supplier Code',
          key: 'code',
          width: 'w-1/3'
        },
        {
          label: 'Email',
          key: 'email',
          width: 'w-2/3'
        },
        {
          label: 'Phone',
          key: 'phone',
          width: 'w-1/3'
        }
      ]
    },
    {
      title: 'Address Information',
      gridCols: 'grid-cols-2',
      bgColor: 'bg-gray-100',
      fields: [
        {
          label: 'Street Address',
          key: 'address',
          width: 'w-full'
        },
        {
          label: 'City',
          key: 'city',
          width: 'w-1/2'
        },
        {
          label: 'State/Province',
          key: 'state',
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
      title: 'Business Information',
      gridCols: 'grid-cols-2',
      bgColor: 'bg-gray-100',
      fields: [
        {
          label: 'Contact Person',
          key: 'contactPerson'
        },
        {
          label: 'Payment Terms',
          key: 'paymentTerms'
        },
        {
          label: 'Tax ID',
          key: 'taxId'
        },
        {
          label: 'Notes',
          key: 'notes',
          isTextArea: true
        }
      ]
    }
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

