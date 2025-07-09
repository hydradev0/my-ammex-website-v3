import { useState } from 'react';
import { X } from 'lucide-react';
import { useEffect } from 'react';

function RecordsModal({ isOpen = true, onClose, onSubmit, nextAccountCode }) {
  // State for form fields
  const [formData, setFormData] = useState({
    customerId: nextAccountCode,
    customerName: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    contactName: '',
    telephone1: '',
    telephone2: '',
    email1: '',
    email2: ''
  });
  
  // State for validation errors
  const [errors, setErrors] = useState({});
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Clear error when field is edited
    if (errors[id]) {
      setErrors({ ...errors, [id]: null });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerId.trim()) {
      newErrors.customerId = 'Customer ID is required';
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    
    if (!formData.email1.trim()) {
      newErrors.email1 = 'Email 1 is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email1)) {
      newErrors.email1 = 'Email 1 is invalid';
    }
    
    if (formData.email2 && !/\S+@\S+\.\S+/.test(formData.email2)) {
      newErrors.email2 = 'Email 2 is invalid';
    }
    
    if (!formData.telephone1.trim()) {
      newErrors.telephone1 = 'Telephone 1 is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('overflow-hidden');
    } else {
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-0  bg-black/50 flex items-center justify-center z-50"
        // onClick={(e) => {
        //   if (e.target === e.currentTarget) {
        //     onClose(); // close modal only when clicking the backdrop
        //   }
        // }}
    >
      
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl flex flex-col max-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 pl-4 py-4">Add New Customer</h2>
          
          <button 
            onClick={onClose} 
            className="hover:text-gray-400 text-gray-600 mb-4"
            >
            <X className="h-8 w-8" />
          </button>
           
        </div> 
        
        <div className="overflow-y-auto flex-grow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">Account Details</h3>
              <FormField
                className="bg-gray-100 border border-gray-300 text-gray-800 rounded-md px-4 py-2  focus:border-gray-400 focus:outline-none "
                id="customerId"
                label="ID"
                type="text"
                value={formData.customerId}
                onChange={handleInputChange}
                error={errors.customerId}
                width="w-1/3"
                readOnly
              />
              <FormField
                id="customerName"
                label="Customer Name"
                type="text"
                value={formData.customerName}
                onChange={handleInputChange}
                error={errors.customerName}
              />
            </div>
            
            <div>
              <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">Registered Address</h3>
                <div>
                  <FormField
                    id="street"
                    label="Street"
                    type="text"
                    value={formData.street}
                    onChange={handleInputChange}
                    error={errors.street}
                    width="w-2/3"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      id="city"
                      label="City"
                      type="text"
                      value={formData.city}
                      onChange={handleInputChange}
                      error={errors.city}
                      width="w-full"
                    />
                    <FormField
                      id="postalCode"
                      label="Postal Code"
                      type="text"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      error={errors.postalCode}
                      width="w-1/3"
                    />
                  </div>
                </div>
                <div>
                  <FormField
                    id="country"
                    label="Country"
                    type="text"
                    value={formData.country}
                    onChange={handleInputChange}
                    error={errors.country}
                    width="w-2/3"
                  />
                </div>
            </div>
            
            <div>
              <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">Contact Information</h3>
              <FormField
                id="contactName"
                label="Contact Name"
                type="text"
                value={formData.contactName}
                onChange={handleInputChange}
                error={errors.contactName}
                width="w-2/3"
              />
              <FormField
                id="telephone1"
                label="Telephone 1"
                type="tel"
                value={formData.telephone1}
                onChange={handleInputChange}
                error={errors.telephone1}
                width="w-2/3"
              />
              <FormField
                id="telephone2"
                label="Telephone 2"
                type="tel"
                value={formData.telephone2}
                onChange={handleInputChange}
                error={errors.telephone2}
                width="w-2/3"
              />
            </div>
            
            <div>
              <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">Emails</h3>
              <FormField
                id="email1"
                label="Email 1"
                type="email"
                value={formData.email1}
                onChange={handleInputChange}
                error={errors.email1}
                width="w-2/3"
              />
              <FormField
                id="email2"
                label="Email 2"
                type="email"
                value={formData.email2}
                onChange={handleInputChange}
                error={errors.email2}
                width="w-2/3"
              />
            </div>
          </div>
        </div>
        
        <div className="pt-4 mt-2 border-t-2 border-gray-300 flex justify-end gap-3">
          <button 
            type="button" 
            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="cursor-pointer px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            onClick={handleSubmit}
          >
            Add Customer
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ id, label, type, value, onChange, error, prefix, width = 'w-full', ...props }) {
  return (
    <div className="m-4">
      <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className={`relative ${error ? 'mb-1' : ''}`}>
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">{prefix}</span>
          </div>
        )}
        <input 
          type={type} 
          id={id} 
          className={`${prefix ? 'pl-7' : 'px-3'} px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600`}
          value={value}
          onChange={onChange}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-500 text-md mt-1">{error}</p>
      )}
    </div>
  );
}

export default RecordsModal;