import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';

function ItemModal({ isOpen = true, onClose, onSubmit, categories }) {
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
  
  // State for validation errors
  const [errors, setErrors] = useState({});
  
  // Sample vendor list - you can replace this with your actual vendor data
  const vendors = [
    'Vendor A',
    'Vendor B',
    'Vendor C',
    'Vendor D'
  ];
  
  // Dropdown open states and refs
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setVendorDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    if (vendorDropdownOpen || categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [vendorDropdownOpen, categoryDropdownOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
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
    
    if (!formData.itemCode.trim()) {
      newErrors.itemCode = 'Item code is required';
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
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl flex flex-col max-h-11/12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 pl-4 py-4">Add New Item</h2>
          
          <button 
            className="hover:text-white hover:bg-red-800 text-gray-500 mb-4"
            onClick={onClose} 
          >
            <X className="h-8 w-8" />
          </button>
        </div> 
        
        <div className="overflow-y-auto flex-grow p-6">
          {/* First Container */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4 ">Item Details</h3>
              {/* Vendor Dropdown */}
              <div className="m-4">
                <label className="block text-lg font-medium text-gray-700 mb-1">Vendor</label>
                <div className="relative w-2/3" ref={vendorDropdownRef}>
                  <button
                    type="button"
                    className={`cursor-pointer w-full text-lg pl-4 pr-4 py-2 rounded border ${errors.vendor ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center`}
                    onClick={() => setVendorDropdownOpen((open) => !open)}
                  >
                    <span>{formData.vendor || 'Select vendor'}</span>
                    <ChevronDown className={`h-6 w-6 ml-2 transition-transform ${vendorDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {vendorDropdownOpen && (
                    <ul className="absolute z-10 mt-1 w-full bg-gray-50 border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
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
              {/* Item Code and Item Name */}
              <FormField
                id="itemCode"
                label="Item Code"
                type="text"
                value={formData.itemCode}
                onChange={handleInputChange}
                error={errors.itemCode}
                width="w-1/3"
              />
              <FormField
                id="itemName"
                label="Item Name"
                type="text"
                value={formData.itemName}
                onChange={handleInputChange}
                error={errors.itemName}
                width="w-2/3"
              />
            </div>
          </div>

          {/* Second Container */}
          <div className="grid grid-cols-2 gap-4 bg-white border border-gray-300 shadow-sm rounded-lg p-4">
            <div>
              <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">Pricing Information</h3>
              <FormField
                id="price"
                label="Price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                error={errors.price}
                width="w-1/3"
                prefix="₱"
              />
              <FormField
                id="floorPrice"
                label="Floor Price"
                type="number"
                value={formData.floorPrice}
                onChange={handleInputChange}
                error={errors.floorPrice}
                width="w-1/3"
                prefix="₱"
              />
              <FormField
                id="ceilingPrice"
                label="Ceiling Price"
                type="number"
                value={formData.ceilingPrice}
                onChange={handleInputChange}
                error={errors.ceilingPrice}
                width="w-1/3"
                prefix="₱"
              />
            </div>
            <div>
              <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">Stock Information</h3>
              <FormField
                id="unit"
                label="Unit"
                type="text"
                value={formData.unit}
                onChange={handleInputChange}
                error={errors.unit}
                width="w-1/3"
              />
              <FormField
                id="quantity"
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                error={errors.quantity}
                width="w-1/3"
              />
              <FormField
                id="minLevel"
                label="Minimum Level"
                type="number"
                value={formData.minLevel}
                onChange={handleInputChange}
                error={errors.minLevel}
                width="w-1/3"
              />
              <FormField
                id="maxLevel"
                label="Maximum Level"
                type="number"
                value={formData.maxLevel}
                onChange={handleInputChange}
                error={errors.maxLevel}
                width="w-1/3"
              />
            </div>
          </div>

          {/* Third Container */}
          <div className="grid grid-cols-1 gap-4 mt-6 bg-white border border-gray-300 shadow-sm rounded-lg p-4">
            <div>
              <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">Additional Details</h3>
              {/* Category Dropdown */}
              <div className="m-4">
                <label className="block text-lg font-medium text-gray-700 mb-1">Category</label>
                <div className="relative w-1/2" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    className={`cursor-pointer w-full text-lg pl-4 pr-4 py-2 rounded border ${errors.category ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center`}
                    onClick={() => setCategoryDropdownOpen((open) => !open)}
                  >
                    <span>{formData.category || 'Select category'}</span>
                    <ChevronDown className={`h-6 w-6 ml-2 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {categoryDropdownOpen && (
                    <ul className="absolute z-10 mt-1 w-full bg-gray-50 border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                      {categories.map(cat => (
                        <li
                          key={cat.name}
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
              {/* Description */}
              <FormField
                id="description"
                label="Description"
                type="textarea"
                value={formData.description}
                onChange={handleInputChange}
                error={errors.description}
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
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

ItemModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired
};

function FormField({ id, label, type, value, onChange, error, prefix, width = 'w-full', ...props }) {
  return (
    <div className="m-4">
      <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className={`relative ${error ? 'mb-1' : ''}`}>
        {type === 'textarea' ? (
          <textarea
            id={id}
            className={`px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px] bg-white`}
            value={value}
            onChange={onChange}
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
              className={`${prefix ? 'pl-7' : 'px-3'} px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600
               bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              value={value}
              onChange={onChange}
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

export default ItemModal; 