import { useState } from 'react';
import PropTypes from 'prop-types';
import OrdersModal from '../Components/OrdersModal';

// Add print styles
const printStyles = `
  @media print {
    button {
      display: none !important;
    }
    .no-print {
      display: none !important;
    }
    .border-b {
      border-bottom: none !important;
    }
    .border-gray-300 {
      border-color: transparent !important;
    }
    /* Remove all shadows */
    * {
      box-shadow: none !important;
    }
    .shadow-md, .shadow, .shadow-lg, .shadow-xl {
      box-shadow: none !important;
    }
    /* Keep table borders */
    table, th, td {
      border: 1px solid #000 !important;
    }
    table {
      border-collapse: collapse !important;
    }
    /* Change modal title when printing */
    .modal-title {
      visibility: hidden !important;
      position: relative !important;
    }
    .modal-title::before {
      content: "Purchase Order" !important;
      visibility: visible !important;
      position: absolute !important;
      left: 0 !important;
      font-size: 24px !important;
      font-weight: bold !important;
    }
  }
`;

export default function PurchaseOrderForm({ onSubmit, onClose, nextDocNo }) {
  // Form state
  const [supplier, setSupplier] = useState('');
  const [orderNumber, setOrderNumber] = useState(nextDocNo || '');
  const [orderDate, setOrderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
  }, 0);

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!supplier.trim()) {
      errors.supplier = 'Supplier name is required';
    }
    
    if (!orderNumber.trim()) {
      errors.orderNumber = 'Order number is required';
    }
    
    if (!orderDate) {
      errors.orderDate = 'Order date is required';
    }
    
    if (!deliveryDate) {
      errors.deliveryDate = 'Delivery date is required';
    } else if (new Date(deliveryDate) < new Date(orderDate)) {
      errors.deliveryDate = 'Delivery date must be after order date';
    }
    
    if (items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      items.forEach((item, index) => {
        if (!item.name.trim()) {
          errors[`item${index}Name`] = 'Item name is required';
        }
        if (!item.unit.trim()) {
          errors[`item${index}Unit`] = 'Unit is required';
        }
        if (!item.quantity || item.quantity < 1) {
          errors[`item${index}Quantity`] = 'Quantity must be at least 1';
        }
        if (!item.price || item.price < 0) {
          errors[`item${index}Price`] = 'Price must be greater than 0';
        }
      });
    }
    
    return errors;
  };

  // Add new item to the items list
  const addItem = () => {
    setItems([
      ...items,
      { 
        id: Date.now(), 
        name: '', 
        description: '', 
        quantity: 1, 
        unit: '', 
        price: 0 
      }
    ]);
  };

  // Remove item from the items list
  const removeItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Handle item field changes
  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    const formData = {
      supplierName: supplier,
      docNo: orderNumber,
      amount: totalAmount,
      items: items,
      date: orderDate,
      deliveryDate: deliveryDate
    };
    onSubmit(formData);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{printStyles}</style>
      <form onSubmit={handleSubmit} className="p-1">
        <div className="w-full max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
          {formErrors.items && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {formErrors.items}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-x-14 gap-y-6 ">
            {/* Left side - takes 3/5 of width */}
            <div className="md:col-span-3 grid gap-y-6">
              <div>
                <label className="block text-md font-medium">Supplier Name</label>
                <input 
                  type="text" 
                  className={`w-full max-w-xl p-2 border ${formErrors.supplier ? 'border-red-500' : 'border-gray-300'} rounded focus:border-gray-400 focus:outline-none`}
                  placeholder="Enter Supplier Name"
                  value={supplier}
                  onChange={(e) => {
                    setSupplier(e.target.value);
                    setFormErrors(prev => ({ ...prev, supplier: null }));
                  }}
                />
                {formErrors.supplier && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.supplier}</p>
                )}
              </div>
              <div>
                <label className="block text-md font-medium">Purchase Order No.</label>
                <input 
                  type="text" 
                  className={`w-full max-w-xs p-2 border ${formErrors.orderNumber ? 'border-red-500' : 'border-gray-300'} rounded focus:border-gray-400 focus:outline-none bg-gray-100`}
                  placeholder="PO-XXXX"
                  value={orderNumber}
                  readOnly
                />
                {formErrors.orderNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.orderNumber}</p>
                )}
              </div>
            </div>
            
            {/* Right side - takes 2/5 of width */}
            <div className="md:col-span-2 grid gap-y-6">
              <div>
                <label className="block text-md font-medium">PO Date</label>
                <input 
                  type="date" 
                  className={`w-full p-2 border ${formErrors.orderDate ? 'border-red-500' : 'border-gray-300'} rounded focus:border-gray-400 focus:outline-none`}
                  value={orderDate}
                  onChange={(e) => {
                    setOrderDate(e.target.value);
                    setFormErrors(prev => ({ ...prev, orderDate: null }));
                  }}
                />
                {formErrors.orderDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.orderDate}</p>
                )}
              </div>
              <div>
                <label className="block text-md font-medium">Delivery Date</label>
                <input 
                  type="date" 
                  className={`w-full p-2 border ${formErrors.deliveryDate ? 'border-red-500' : 'border-gray-300'} rounded focus:border-gray-400 focus:outline-none`}
                  value={deliveryDate}
                  onChange={(e) => {
                    setDeliveryDate(e.target.value);
                    setFormErrors(prev => ({ ...prev, deliveryDate: null }));
                  }}
                />
                {formErrors.deliveryDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.deliveryDate}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-md font-medium">Items</label>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 mt-2">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 w-1/6">Item</th>
                    <th className="p-2 w-2/6">Description</th>
                    <th className="p-2 w-1/12">Quantity</th>
                    <th className="p-2 w-1/12">Unit</th>
                    <th className="p-2 w-1/6">Unit Price</th>
                    <th className="p-2 w-1/6">Total</th>
                    <th className="p-2 w-1/12">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
                    
                    return (
                      <tr key={item.id}>
                        <td>
                          <input 
                            type="text" 
                            className={`w-full p-1 border ${formErrors[`item${index}Name`] ? 'border-red-500' : 'border-gray-300'} rounded focus:border-gray-400 focus:outline-none`}
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) => {
                              handleItemChange(item.id, 'name', e.target.value);
                              setFormErrors(prev => ({ ...prev, [`item${index}Name`]: null }));
                            }}
                          />
                          {formErrors[`item${index}Name`] && (
                            <p className="mt-1 text-sm text-red-600">{formErrors[`item${index}Name`]}</p>
                          )}
                        </td> 
                        <td>
                          <input 
                            type="text" 
                            className="w-full p-1 border border-gray-300 rounded focus:border-gray-400 focus:outline-none"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className={`w-full p-1 border ${formErrors[`item${index}Quantity`] ? 'border-red-500' : 'border-gray-300'} rounded focus:border-gray-400 focus:outline-none`}
                            value={item.quantity}
                            min="1"
                            onChange={(e) => {
                              handleItemChange(item.id, 'quantity', e.target.value);
                              setFormErrors(prev => ({ ...prev, [`item${index}Quantity`]: null }));
                            }}
                          />
                          {formErrors[`item${index}Quantity`] && (
                            <p className="mt-1 text-sm text-red-600">{formErrors[`item${index}Quantity`]}</p>
                          )}
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className={`w-full p-1 border ${formErrors[`item${index}Unit`] ? 'border-red-500' : 'border-gray-300'} rounded focus:border-gray-400 focus:outline-none`}
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => {
                              handleItemChange(item.id, 'unit', e.target.value);
                              setFormErrors(prev => ({ ...prev, [`item${index}Unit`]: null }));
                            }}
                          />
                          {formErrors[`item${index}Unit`] && (
                            <p className="mt-1 text-sm text-red-600">{formErrors[`item${index}Unit`]}</p>
                          )}
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className={`w-full p-1 border ${formErrors[`item${index}Price`] ? 'border-red-500' : 'border-gray-300'} rounded focus:border-gray-400 focus:outline-none`}
                            step="0.01" 
                            value={item.price}
                            onChange={(e) => {
                              handleItemChange(item.id, 'price', e.target.value);
                              setFormErrors(prev => ({ ...prev, [`item${index}Price`]: null }));
                            }}
                          />
                          {formErrors[`item${index}Price`] && (
                            <p className="mt-1 text-sm text-red-600">{formErrors[`item${index}Price`]}</p>
                          )}
                        </td>
                        <td className="p-2">{itemTotal.toFixed(2)}</td>
                        <td>
                          <button 
                            type="button"
                            onClick={() => removeItem(item.id)} 
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button 
              type="button" 
              onClick={addItem} 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add Item
            </button>
          </div>

          <div className="mt-4 flex justify-between">
            <span className="text-lg font-bold">Total: ₱{totalAmount.toFixed(2)}</span>
            <div className="space-x-2">
              <button 
                type="button" 
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Preview
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        <OrdersModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Purchase Order Preview"
          titleClassName="modal-title"
        >
          <div className="mt-2">
            <h3 className="text-lg font-bold preview-title">Ammex Machine Tools Inc.</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p><strong>Supplier:</strong> {supplier}</p>
                <p className="mt-2"><strong>PO Number:</strong> {orderNumber}</p>
              </div>
              <div>
                <p><strong>Date:</strong> {orderDate}</p>
                <p className="mt-2"><strong>Delivery Date:</strong> {deliveryDate}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto mt-4">
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Item</th>
                    <th className="p-2 border">Description</th>
                    <th className="p-2 border">Quantity</th>
                    <th className="p-2 border">Unit</th>
                    <th className="p-2 border">Unit Price</th>
                    <th className="p-2 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
                    
                    return (
                      <tr key={item.id}>
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2">{item.description}</td>
                        <td className="border p-2">{item.quantity}</td>
                        <td className="border p-2">{item.unit}</td>
                        <td className="border p-2">{item.price}</td>
                        <td className="border p-2">{itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <p className="text-lg font-bold mt-4">Total: ₱{totalAmount.toFixed(2)}</p>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button 
                onClick={handlePrint} 
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
              >
                Print
              </button>
              <button 
                onClick={() => setIsPreviewOpen(false)} 
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </OrdersModal>
      </form>
    </>
  );
}

PurchaseOrderForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  nextDocNo: PropTypes.string
}; 