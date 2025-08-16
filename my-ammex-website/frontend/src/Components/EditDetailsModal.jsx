import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Boxes, DollarSign, Info, User, MapPin, Shield } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { updateItem } from '../services/inventoryService';
import { editItemConfig } from './viewConfigs';
import ScrollLock from './ScrollLock';

function EditDetailsModal({
  isOpen = false,
  onClose,
  data,
  categories = [],
  units = [],
  onDataUpdated,
  config,
  updateService
}) {
  // State for form fields
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});

  // State for validation errors and loading
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Dropdown open states and refs
  const [dropdownStates, setDropdownStates] = useState({});
  const dropdownRefs = useRef({});

  // Initialize form data when data changes
  useEffect(() => {
    if (data && config) {
      const initialFormData = {};
      config.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.key) {
            // Handle nested objects for dropdown fields (category, unit)
            if (field.type === 'dropdown' && field.key === 'category' && data[field.key] && typeof data[field.key] === 'object') {
              initialFormData[field.key] = data[field.key].name || '';
              initialFormData[`${field.key}Id`] = data[field.key].id || '';
            } else if (field.type === 'dropdown' && field.key === 'unit' && data[field.key] && typeof data[field.key] === 'object') {
              initialFormData[field.key] = data[field.key].name || '';
              initialFormData[`${field.key}Id`] = data[field.key].id || '';
            } else {
              initialFormData[field.key] = data[field.key] || '';
            }
          }
        });
      });
      
      setFormData(initialFormData);
      setInitialData(initialFormData);
      setErrors({});
      setSuccessMessage('');
    }
  }, [data, config]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs.current).forEach(key => {
        if (dropdownRefs.current[key] && !dropdownRefs.current[key].contains(event.target)) {
          setDropdownStates(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    if (Object.values(dropdownStates).some(isOpen => isOpen)) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownStates]);

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
    
    if (config && config.sections) {
      config.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.required && field.key) {
            const value = formData[field.key];
            if (!value || (typeof value === 'string' && !value.trim())) {
              newErrors[field.key] = `${field.label} is required`;
            }
          }
        });
      });
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
      // Prepare data for submission - use IDs for category and unit
      const submissionData = { ...formData };
      
      // Convert category and unit names back to IDs for backend
      if (submissionData.category && submissionData.categoryId) {
        submissionData.categoryId = submissionData.categoryId;
        delete submissionData.category; // Remove the name, keep only ID
      }
      if (submissionData.unit && submissionData.unitId) {
        submissionData.unitId = submissionData.unitId;
        delete submissionData.unit; // Remove the name, keep only ID
      }

      // Use the provided update service
      const response = await updateService(data.id, submissionData);
      
      if (response.success) {
        setSuccessMessage('Updated successfully!');
        // Call the callback to update the parent component
        if (onDataUpdated) {
          onDataUpdated(response.data);
        }
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrors({ submit: response.message || 'Failed to update' });
      }
    } catch (error) {
      console.error('Error updating:', error);
      setErrors({ submit: error.message || 'An error occurred while updating' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dropdown selection
  const handleDropdownSelect = (field, value, option) => {
    // Store the name for display and ID for submission
    if (field === 'category' || field === 'unit') {
      setFormData(prev => ({
        ...prev,
        [field]: value, // Store the name for display
        [`${field}Id`]: option.id // Store the ID for submission
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Close the dropdown
    setDropdownStates(prev => ({ ...prev, [field]: false }));
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Get dropdown options based on field type
  const getDropdownOptions = (field) => {
    if (field.key === 'vendor') {
      return ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D'];
    } else if (field.key === 'category') {
      return categories;
    } else if (field.key === 'unit') {
      return units;
    }
    return field.options || [];
  };

  // Render form field based on configuration
  const renderFormField = (field) => {
    const { key, label, type, width, required, disabled, prefix, step, min, isTextArea, options } = field;
    const value = formData[key] || '';
    const error = errors[key];
    const isRequired = required ? ' *' : '';

    if (type === 'dropdown') {
      const dropdownOptions = getDropdownOptions(field);
      const dropdownRef = dropdownRefs.current[key] || { current: null };
      const isOpen = dropdownStates[key] || false;
      const onToggle = () => setDropdownStates(prev => ({ ...prev, [key]: !prev[key] }));

      return (
        <div className="m-4">
          <label className="block text-lg font-medium text-gray-700 mb-2">
            {label}{isRequired}
          </label>
          <div className={`relative ${width || 'w-full'}`} ref={el => dropdownRefs.current[key] = el}>
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
                      onClick={() => handleDropdownSelect(key, optionValue, option)}
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

  if (!isOpen || !data || !config) {
    return null;
  }

  const modalContent = (
    <>
      {/* ScrollLock component to handle scroll locking properly */}
      <ScrollLock active={isOpen} />
      
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col max-h-screen overflow-hidden" 
        style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">{config.title || 'Edit Details'}: {data.name || data.itemName || 'Item'}</h2>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow p-6 mr-3 bg-white">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-medium">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Render form sections based on config */}
          {config.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              {/* Section Header with Icon */}
              {section.title && (
                <div className="flex items-center gap-2 mb-4">
                  {section.title === 'Item Details' && <Info className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Pricing Information' && <DollarSign className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Stock Information' && <Boxes className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Additional Information' && <Info className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Basic Information' && <User className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Address Information' && <MapPin className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Status Information' && <Shield className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Customer Details' && <User className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Contact Information' && <Info className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  {section.title === 'Business Information' && <Info className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h3>
                </div>
              )}
              
              {/* Section Container - removed borders and shadows */}
              <div className={`grid ${section.gridCols || 'grid-cols-1'} gap-6 ${section.bgColor || 'bg-white'} rounded-xl p-4`}>
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex}>
                    {renderFormField(field)}
                  </div>
                ))}
              </div>

              {/* Add divider after each section except the last one */}
              {sectionIndex < config.sections.length - 1 && (
                <div className="border-t border-gray-300 mb-4 md:mb-6 mt-8"></div>
              )}
            </div>
          ))}
        </form>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="px-6 py-3 border-2 cursor-pointer border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r cursor-pointer from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );

  // Use portal to render modal outside the scaled container
  return createPortal(modalContent, document.body);
}

// Form Field Component
function FormField({ id, name, label, type, value, onChange, error, prefix, width = 'w-full', disabled = false, ...props }) {
  return (
    <div className="m-4">
      <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-2">
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

EditDetailsModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
  categories: PropTypes.array,
  units: PropTypes.array,
  onDataUpdated: PropTypes.func,
  config: PropTypes.object,
  updateService: PropTypes.func
};

export default EditDetailsModal;