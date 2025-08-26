import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Info, DollarSign, Boxes } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";

function NewItemModal({ 
  isOpen = false, 
  onClose, 
  onSubmit, 
  categories, 
  units = [], 
  suppliers = [],
  width = 'w-[1200px]',
  maxHeight = 'max-h-[100vh]',
  errors: backendErrors = {}
}) {
  
  // State for form fields
  const [formData, setFormData] = useState({
    modelNo: '',
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
  
  // State for validation errors
  const [errors, setErrors] = useState({});
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // Use suppliers data for vendor dropdown
  const vendors = suppliers.length > 0 
    ? suppliers.map(supplier => supplier.companyName)
    : ['No suppliers available'];
  
  // Dropdown open states and refs
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const unitDropdownRef = useRef(null);
  const modalRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Resetting form for new item');
      setFormData({
        modelNo: '',
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
      setErrors({});
    }
  }, [isOpen]);

  // Update errors when backend errors change
  useEffect(() => {
    if (Object.keys(backendErrors).length > 0) {
      setErrors(backendErrors);
    }
  }, [backendErrors]);

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
    if (vendorDropdownOpen || categoryDropdownOpen || unitDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [vendorDropdownOpen, categoryDropdownOpen, unitDropdownOpen]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && modalRef.current && event.target === modalRef.current) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
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
    
    if (!formData.modelNo.trim()) {
      newErrors.modelNo = 'Model number is required';
    }

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }

    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    }

    if (!formData.floorPrice.trim()) {
      newErrors.floorPrice = 'Floor price is required';
    } else if (isNaN(formData.floorPrice) || Number(formData.floorPrice) < 0) {
      newErrors.floorPrice = 'Floor price must be a positive number';
    }

    if (!formData.ceilingPrice.trim()) {
      newErrors.ceilingPrice = 'Ceiling price is required';
    } else if (isNaN(formData.ceilingPrice) || Number(formData.ceilingPrice) < 0) {
      newErrors.ceilingPrice = 'Ceiling price must be a positive number';
    }

    // Validate that ceiling price is greater than floor price
    if (formData.floorPrice && formData.ceilingPrice && 
        Number(formData.ceilingPrice) <= Number(formData.floorPrice)) {
      newErrors.ceilingPrice = 'Ceiling price must be greater than floor price';
    }

    // Validate that price is within floor and ceiling range
    if (formData.price && formData.floorPrice && formData.ceilingPrice) {
      const price = Number(formData.price);
      const floorPrice = Number(formData.floorPrice);
      const ceilingPrice = Number(formData.ceilingPrice);
      
      if (price < floorPrice || price > ceilingPrice) {
        newErrors.price = 'Price must be between floor price and ceiling price';
      }
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    // Validate minimum level
    if (!formData.minLevel.trim()) {
      newErrors.minLevel = 'Minimum level is required';
    } else if (isNaN(formData.minLevel) || Number(formData.minLevel) < 0) {
      newErrors.minLevel = 'Minimum level must be a positive number';
    }

    // Validate maximum level
    if (!formData.maxLevel.trim()) {
      newErrors.maxLevel = 'Maximum level is required';
    } else if (isNaN(formData.maxLevel) || Number(formData.maxLevel) < 0) {
      newErrors.maxLevel = 'Maximum level must be a positive number';
    }

    // Validate that max level is greater than min level
    if (formData.minLevel && formData.maxLevel && 
        Number(formData.maxLevel) <= Number(formData.minLevel)) {
      newErrors.maxLevel = 'Maximum level must be greater than minimum level';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
       <div
        className={`bg-white rounded-lg p-6 ${width} flex flex-col ${maxHeight} overflow-hidden`}
        style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 pl-4 py-4">
            Add New Item
          </h2>
          
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div> 
        
        <div className="overflow-y-auto flex-grow p-6">
          {/* Item Details Section */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
              <Info className=" w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
              Item Details
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {/* Vendor Dropdown */}
              <div className="m-4">
                <label className="block text-lg font-medium text-gray-700 mb-1">Vendor <span className="text-red-500">*</span></label>
                <div className="relative w-full" ref={vendorDropdownRef}>
                  <button
                    type="button"
                    className={`cursor-pointer w-full text-lg pl-4 pr-4 py-2 rounded-lg border ${errors.vendor ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center`}
                    onClick={() => setVendorDropdownOpen((open) => !open)}
                  >
                    <span>{formData.vendor || 'Select vendor'}</span>
                    <ChevronDown className={`h-6 w-6 ml-2 transition-transform ${vendorDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {vendorDropdownOpen && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {vendors.map((option) => (
                        <li
                          key={option}
                          className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${formData.vendor === option ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                          onClick={() => {
                            setFormData({ ...formData, vendor: option });
                            setVendorDropdownOpen(false);
                          }}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.vendor && (
                  <p className="text-red-500 text-md mt-1">{errors.vendor}</p>
                )}
              </div>
              {/* Model No. */}
              <FormField
                id="modelNo"
                label={<span>Model No. <span className="text-red-500">*</span></span>}
                type="text"
                value={formData.modelNo}
                onChange={handleInputChange}
                error={errors.modelNo}
                width="w-2/3"
              />
              {/* Item Name */}
              <FormField
                id="itemName"
                label={<span>Item Name <span className="text-red-500">*</span></span>}
                type="text"
                value={formData.itemName}
                onChange={handleInputChange}
                error={errors.itemName}
                width="w-full"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 mb-4 md:mb-6"></div>

          {/* Pricing Information Section */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
              <DollarSign className=" w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
              Pricing Information
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <FormField
                id="price"
                label={<span>Price <span className="text-red-500">*</span></span>}
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                error={errors.price}
                width="w-2/3"
                prefix="₱"
                step="0.01"
                min="0"
              />
              <FormField
                id="floorPrice"
                label={<span>Floor Price <span className="text-red-500">*</span></span>}
                type="number"
                value={formData.floorPrice}
                onChange={handleInputChange}
                error={errors.floorPrice}
                width="w-2/3"
                prefix="₱"
                step="0.01"
                min="0"
              />
              <FormField
                id="ceilingPrice"
                label={<span>Ceiling Price <span className="text-red-500">*</span></span>}
                type="number"
                value={formData.ceilingPrice}
                onChange={handleInputChange}
                error={errors.ceilingPrice}
                width="w-2/3"
                prefix="₱"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 mb-4 md:mb-6"></div>

          {/* Stock Information Section */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
              <Boxes className=" w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
              Stock Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Unit Dropdown */}
              <div className="m-4">
                <label className="block text-lg font-medium text-gray-700 mb-1">Unit <span className="text-red-500">*</span></label>
                <div className="relative w-1/2" ref={unitDropdownRef}>
                  <button
                    type="button"
                    className={`cursor-pointer w-full text-lg pl-4 pr-4 py-2 rounded-lg border ${errors.unit ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center`}
                    onClick={() => setUnitDropdownOpen((open) => !open)}
                  >
                    <span>{formData.unit || 'Select unit'}</span>
                    <ChevronDown className={`h-6 w-6 ml-2 transition-transform ${unitDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {unitDropdownOpen && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {units.map((unit) => (
                        <li
                          key={unit.id}
                          className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${formData.unit === unit.name ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                          onClick={() => {
                            setFormData({ ...formData, unit: unit.name });
                            setUnitDropdownOpen(false);
                          }}
                        >
                          {unit.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.unit && (
                  <p className="text-red-500 text-md mt-1">{errors.unit}</p>
                )}
              </div>
              {/* Category Dropdown */}
              <div className="m-4">
                <label className="block text-lg font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <div className="relative w-1/2" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    className={`cursor-pointer w-full text-lg pl-4 pr-4 py-2 rounded-lg border ${errors.category ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center`}
                    onClick={() => setCategoryDropdownOpen((open) => !open)}
                  >
                    <span>{formData.category || 'Select category'}</span>
                    <ChevronDown className={`h-6 w-6 ml-2 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {categoryDropdownOpen && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {categories.map(cat => (
                        <li
                          key={cat.id}
                          className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${formData.category === cat.name ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                          onClick={() => {
                            setFormData({ ...formData, category: cat.name });
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          {cat.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.category && (
                  <p className="text-red-500 text-md mt-1">{errors.category}</p>
                )}
              </div>
              <FormField
                id="minLevel"
                label={<span>Minimum Level <span className="text-red-500">*</span></span>}
                type="number"
                value={formData.minLevel}
                onChange={handleInputChange}
                error={errors.minLevel}
                width="w-1/3"
                min="0"
                step="1"
              />
              <FormField
                id="quantity"
                label={<span>Quantity <span className="text-red-500">*</span></span>}
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                error={errors.quantity}
                width="w-1/3"
                min="0"
                step="1"
              />
              <FormField
                id="maxLevel"
                label={<span>Maximum Level <span className="text-red-500">*</span></span>}
                type="number"
                value={formData.maxLevel}
                onChange={handleInputChange}
                error={errors.maxLevel}
                width="w-1/3"
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 mb-4 md:mb-6"></div>

          {/* Additional Details Section */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
              Additional Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Description */}
              <FormField
                id="description"
                label="Description"
                type="textarea"
                value={formData.description}
                onChange={handleInputChange}
                error={errors.description}
                width="w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="pt-4 mt-2 border-t-2 border-gray-300 flex justify-end gap-3">
          <button 
            type="button" 
            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-6 py-3 rounded-xl cursor-pointer font-medium focus:outline-none focus:ring-4 transition-all duration-200 ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-200'
            }`}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding Item...</span>
              </div>
            ) : (
              'Add Item'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ScrollLock active={isOpen} />
      {isOpen && createPortal(modalContent, document.body)}
    </>
  );
}

NewItemModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  units: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      companyName: PropTypes.string.isRequired,
      contactName: PropTypes.string,
      email1: PropTypes.string,
      telephone1: PropTypes.string
    })
  ),
  width: PropTypes.string,
  maxHeight: PropTypes.string,
  errors: PropTypes.object
};  

function FormField({ id, label, type, value, onChange, error, prefix, width = 'w-full', disabled = false, ...props }) {
  return (
    <div className="m-4">
      <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className={`relative ${error ? 'mb-1' : ''}`}>
        {type === 'textarea' ? (
          <textarea
            id={id}
            className={`px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px] bg-white ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
              className={`${prefix ? 'pl-7' : 'px-3'} px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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

export default NewItemModal; 