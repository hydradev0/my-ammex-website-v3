import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { updateItem } from '../services/inventoryService';
import { editItemConfig } from './viewConfigs';

function EditItemModal({
  isOpen = false,
  onClose,
  item,
  categories = [],
  units = [],
  onItemUpdated
}) {
  // State for form fields
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    vendor: '',
    price: '',
    floorPrice: '',
    ceilingPrice: '',
    unit: '',
    quantity: '',
    category: '',
    description: '',
    minLevel: '',
    maxLevel: ''
  });

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

  // State for validation errors and loading
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Dropdown open states and refs
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const unitDropdownRef = useRef(null);

  // Sample vendor list - you can replace this with your actual vendor data
  const vendors = [
    'Vendor A',
    'Vendor B',
    'Vendor C',
    'Vendor D'
  ];

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        vendor: item.vendor || '',
        price: item.price || '',
        floorPrice: item.floorPrice || '',
        ceilingPrice: item.ceilingPrice || '',
        unit: item.unit?.name || item.unit || '',
        quantity: item.quantity || '',
        category: item.category?.name || item.category || '',
        description: item.description || '',
        minLevel: item.minLevel || '',
        maxLevel: item.maxLevel || ''
      });
      setErrors({});
      setSuccessMessage('');
    }
  }, [item]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setVendorDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) {
        setUnitDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }
    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare data for API call
      const updateData = {
        ...formData,
        // Convert string values back to numbers for numeric fields
        price: parseFloat(formData.price),
        floorPrice: formData.floorPrice ? parseFloat(formData.floorPrice) : null,
        ceilingPrice: formData.ceilingPrice ? parseFloat(formData.ceilingPrice) : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        minLevel: formData.minLevel ? parseInt(formData.minLevel) : null,
        maxLevel: formData.maxLevel ? parseInt(formData.maxLevel) : null
      };

      const response = await updateItem(item.id, updateData);
      
      if (response.success) {
        setSuccessMessage('Item updated successfully!');
        // Call the callback to update the parent component
        if (onItemUpdated) {
          onItemUpdated(response.data);
        }
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrors({ submit: response.message || 'Failed to update item' });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setErrors({ submit: error.message || 'An error occurred while updating the item' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dropdown selection
  const handleDropdownSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Close the dropdown
    if (field === 'vendor') setVendorDropdownOpen(false);
    if (field === 'category') setCategoryDropdownOpen(false);
    if (field === 'unit') setUnitDropdownOpen(false);
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Render form field based on configuration
  const renderFormField = (field) => {
    const { key, label, type, width, required, disabled, prefix, step, min, isTextArea } = field;
    const value = formData[key] || '';
    const error = errors[key];
    const isRequired = required ? ' *' : '';

    if (type === 'dropdown') {
      let dropdownOptions = [];
      let dropdownRef = null;
      let isOpen = false;
      let onToggle = () => {};

      if (key === 'vendor') {
        dropdownOptions = vendors;
        dropdownRef = vendorDropdownRef;
        isOpen = vendorDropdownOpen;
        onToggle = () => setVendorDropdownOpen(open => !open);
      } else if (key === 'category') {
        dropdownOptions = categories;
        dropdownRef = categoryDropdownRef;
        isOpen = categoryDropdownOpen;
        onToggle = () => setCategoryDropdownOpen(open => !open);
      } else if (key === 'unit') {
        dropdownOptions = units;
        dropdownRef = unitDropdownRef;
        isOpen = unitDropdownOpen;
        onToggle = () => setUnitDropdownOpen(open => !open);
      }

      return (
        <div className="m-4">
          <label className="block text-lg font-medium text-gray-700 mb-1">
            {label}{isRequired}
          </label>
          <div className={`relative ${width || 'w-full'}`} ref={dropdownRef}>
            <button
              type="button"
              className={`cursor-pointer w-full text-lg pl-4 pr-4 py-2 rounded border ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center`}
              onClick={onToggle}
            >
              <span>{value || `Select ${label.toLowerCase()}`}</span>
              <ChevronDown className={`h-6 w-6 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <ul className="absolute z-10 mt-1 w-full bg-gray-50 border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                {dropdownOptions.map((option) => {
                  const optionValue = option.name || option;
                  const optionKey = option.id || option;
                  return (
                    <li
                      key={optionKey}
                      className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${value === optionValue ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                      onClick={() => handleDropdownSelect(key, optionValue)}
                    >
                      {optionValue}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {error && (
            <p className="text-red-500 text-md mt-1">{error}</p>
          )}
        </div>
      );
    }

    if (type === 'textarea' || isTextArea) {
      return (
        <FormField
          id={key}
          name={key}
          label={label + isRequired}
          type="textarea"
          value={value}
          onChange={handleInputChange}
          error={error}
          width={width}
          disabled={disabled}
        />
      );
    }

    return (
      <FormField
        id={key}
        name={key}
        label={label + isRequired}
        type={type || 'text'}
        value={value}
        onChange={handleInputChange}
        error={error}
        prefix={prefix}
        step={step}
        min={min}
        width={width}
        disabled={disabled}
      />
    );
  };

  if (!isOpen || !item) {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl flex flex-col max-h-screen" style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 pl-4 py-4">{editItemConfig.title}: {item.itemName}</h2>
          
          <button 
            onClick={onClose} 
            className="hover:text-gray-400 cursor-pointer text-gray-600 mb-4"
          >
            <X className="h-8 w-8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow p-6">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          {/* Render form sections based on editItemConfig */}
          {editItemConfig.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {/* Section Header */}
              {section.title && (
                <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">{section.title}</h3>
              )}
              
              {/* Section Container */}
              <div className={`grid ${section.gridCols || 'grid-cols-1'} gap-4 ${section.bgColor || 'bg-white'} rounded-lg p-4`}>
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex}>
                    {renderFormField(field)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </form>

        {/* Action Buttons */}
        <div className="pt-4 mt-2 border-t-2 border-gray-300 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update Item'}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal outside the scaled container
  return createPortal(modalContent, document.body);
}

// Form Field Component
function FormField({ id, name, label, type, value, onChange, error, prefix, width = 'w-full', disabled = false, ...props }) {
  return (
    <div className="m-4">
      <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className={`relative ${error ? 'mb-1' : ''}`}>
        {type === 'textarea' ? (
          <textarea
            id={id}
            name={name}
            className={`px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px] bg-white ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            value={value}
            onChange={onChange}
            disabled={disabled}
            {...props}
          />
        ) : (
          <>
            {prefix && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">{prefix}</span>
              </div>
            )}
            <input 
              type={type} 
              id={id}
              name={name}
              className={`${prefix ? 'pl-7' : 'px-3'} px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600
               bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={value}
              onChange={onChange}
              disabled={disabled}
              {...props}
            />
          </>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-md mt-1">{error}</p>
      )}
    </div>
  );
}

EditItemModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object,
  categories: PropTypes.array,
  units: PropTypes.array,
  onItemUpdated: PropTypes.func
};

export default EditItemModal;
