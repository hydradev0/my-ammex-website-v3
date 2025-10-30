import { useState, useRef, useEffect } from 'react';
import { X, User, MapPin, Mail, Phone } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import PhoneInputField from "../Components/PhoneInputField";

function RecordsModal({ isOpen = true, onClose, onSubmit, title, buttonText, existingSuppliers = [] }) {
  // State for form fields
  const initialFormData = {
    companyName: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    contactName: '',
    telephone1: '',
    telephone2: '',
    email1: '',
    email2: ''
  };
  const [formData, setFormData] = useState(initialFormData);
  
  // State for validation errors
  const [errors, setErrors] = useState({});
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Clear error when field is edited
    if (errors[id]) {
      setErrors({ ...errors, [id]: null });
    }
  };
  
  // Centralized close handler that resets form state
  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsLoading(false);
    onClose && onClose();
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.telephone1 || !formData.telephone1.trim()) {
      newErrors.telephone1 = 'Telephone 1 is required';
    }
    
    if (!formData.email1.trim()) {
      newErrors.email1 = 'Email 1 is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email1)) {
      newErrors.email1 = 'Email 1 is invalid';
    }
    
    if (formData.email2 && !/\S+@\S+\.\S+/.test(formData.email2)) {
      newErrors.email2 = 'Email 2 is invalid';
    }
    
    // Duplicate checks for Supplier (companyName and email1)
    if (title === 'Supplier' && existingSuppliers && Array.isArray(existingSuppliers)) {
      const companyLower = formData.companyName.trim().toLowerCase();
      const emailLower = formData.email1.trim().toLowerCase();
      
      const duplicateName = existingSuppliers.some(s => (s.companyName || '').trim().toLowerCase() === companyLower);
      if (!newErrors.companyName && duplicateName) {
        newErrors.companyName = 'Company name already exists';
      }
      
      const duplicateEmail = existingSuppliers.some(s => (s.email1 || '').trim().toLowerCase() === emailLower);
      if (!newErrors.email1 && duplicateEmail) {
        newErrors.email1 = 'Email already exists';
      }
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

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && modalRef.current && event.target === modalRef.current) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset the form whenever modal is closed via parent state change
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* ScrollLock component to handle scroll locking properly */}
      <ScrollLock active={isOpen} />
      
      <div 
        ref={modalRef}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col max-h-screen overflow-hidden"
          style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800">Add New {title}</h2>
            </div>
            
            <button 
              onClick={handleClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div> 
          
          {/* Content */}
          <div className="overflow-y-auto flex-grow p-6 mr-3 bg-white">
            {/* Error Summary Section */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <h3 className="text-lg font-semibold text-red-800">Please fix the following errors:</h3>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="text-red-700">
                      <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span> {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Basic Information Section */}
            <div className="mb-8">
              {/* Section Header with Icon */}
              <div className="flex items-center gap-2 mb-4">
                <User className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Basic Information</h3>
              </div>
              
              {/* Section Container */}
              <div className="grid grid-cols-2 gap-6 bg-white rounded-xl p-4">
                <FormField
                  id="companyName"
                  label="Company Name"
                  type="text"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  error={errors.companyName}
                  required
                />
                <FormField
                  id="contactName"
                  label="Contact Name"
                  type="text"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  error={errors.contactName}
                  required
                />
              </div>
            </div>

            {/* Address Information Section */}
            <div className="mb-8">
              {/* Section Header with Icon */}
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Address Information</h3>
              </div>
              
              {/* Section Container */}
              <div className="grid grid-cols-2 gap-6 rounded-xl p-4">
                <FormField
                  id="street"
                  label="Street"
                  type="text"
                  value={formData.street}
                  onChange={handleInputChange}
                  error={errors.street}
                  width="w-full"
                  required
                />
                <FormField
                  id="city"
                  label="City"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  error={errors.city}
                  width="w-1/2"
                  required
                />
                <FormField
                  id="postalCode"
                  label="Postal Code"
                  type="text"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  error={errors.postalCode}
                  width="w-0.5/2"
                />
                <FormField
                  id="country"
                  label="Country"
                  type="text"
                  value={formData.country}
                  onChange={handleInputChange}
                  error={errors.country}
                  width="w-1/2"
                  required
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="mb-8">
              {/* Section Header with Icon */}
              <div className="flex items-center gap-2 mb-4">
                <Phone className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Contact Information</h3>
              </div>
              
              {/* Section Container */}
              <div className="grid grid-cols-2 gap-6 bg-white rounded-xl p-4">
                <PhoneInputField
                  id="telephone1"
                  label="Telephone 1"
                  value={formData.telephone1}
                  onChange={handleInputChange}
                  error={errors.telephone1}
                  width="w-2/3"
                  required
                />
                <PhoneInputField
                  id="telephone2"
                  label="Telephone 2"
                  value={formData.telephone2}
                  onChange={handleInputChange}
                  error={errors.telephone2}
                  width="w-2/3"
                />
              </div>
            </div>

            {/* Email Information Section */}
            <div className="mb-8">
              {/* Section Header with Icon */}
              <div className="flex items-center gap-2 mb-4">
                <Mail className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Email Information</h3>
              </div>
              
              {/* Section Container */}
              <div className="grid grid-cols-2 gap-6 rounded-xl p-4">
                <FormField
                  id="email1"
                  label="Email 1"
                  type="email"
                  value={formData.email1}
                  onChange={handleInputChange}
                  error={errors.email1}
                  required
                  width="w-1/2"

                />
                <FormField
                  id="email2"
                  label="Email 2"
                  type="email"
                  value={formData.email2}
                  onChange={handleInputChange}
                  error={errors.email2}
                  width="w-1/2"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-6 py-3 border-2 cursor-pointer border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
                onClick={handleClose}
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
                    <span>Adding {title}...</span>
                  </div>
                ) : (
                  buttonText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

function FormField({ id, label, type, value, onChange, error, prefix, width = 'w-full', required = false, disabled = false, ...props }) {
  return (
    <div className="m-4">
      <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-2">
        {label}{required ? <span className="text-red-500"> *</span> : ''}
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
          className={`${prefix ? 'pl-7' : 'px-3'} px-4 py-1 ${width} text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
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