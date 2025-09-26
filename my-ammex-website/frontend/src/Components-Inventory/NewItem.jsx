import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, DollarSign, Boxes, Image } from 'lucide-react';
import PropTypes from 'prop-types';
import { getSubcategories, createItem } from '../services/inventoryService';
import { uploadMultipleImages } from '../services/cloudinaryService';
import ImageUpload from './ImageUpload';


function NewItem({ 
  categories, 
  units = [], 
  suppliers = [],
  errors: backendErrors = {}
}) {
  const navigate = useNavigate();
  
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
    subcategory: '',
    description: '',
    minLevel: '',
    maxLevel: '',
    images: [] // Add images field
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
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const subcategoryDropdownRef = useRef(null);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const unitDropdownRef = useRef(null);

  // State for subcategories
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

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
      if (subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(event.target)) {
        setSubcategoryDropdownOpen(false);
      }
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) {
        setUnitDropdownOpen(false);
      }
    };
    if (vendorDropdownOpen || categoryDropdownOpen || subcategoryDropdownOpen || unitDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [vendorDropdownOpen, categoryDropdownOpen, subcategoryDropdownOpen, unitDropdownOpen]);

  // Fetch subcategories when category is selected
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategoryId) {
        setLoadingSubcategories(true);
        try {
          const response = await getSubcategories(selectedCategoryId);
          if (response.success) {
            setSubcategories(response.data || []);
          } else {
            console.error('Failed to fetch subcategories:', response.message);
            setSubcategories([]);
          }
        } catch (error) {
          console.error('Error fetching subcategories:', error);
          setSubcategories([]);
        } finally {
          setLoadingSubcategories(false);
        }
      } else {
        setSubcategories([]);
        setLoadingSubcategories(false);
      }
    };

    fetchSubcategories();
  }, [selectedCategoryId]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Clear error when field is edited
    if (errors[id]) {
      setErrors({ ...errors, [id]: null });
    }
  };

  // Handle image changes
  const handleImagesChange = (newImages) => {
    setFormData({ ...formData, images: newImages });
    
    // Clear image error when images are added
    if (errors.images) {
      setErrors({ ...errors, images: null });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.modelNo.trim()) {
      newErrors.modelNo = 'Model number is required';
    }

    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Supplier is required';
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

    // Only require subcategory if there are subcategories available for the selected category
    if (selectedCategoryId && subcategories.length > 0 && !formData.subcategory.trim()) {
      newErrors.subcategory = 'Subcategory is required';
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

    // Validate images (required)
    if (!formData.images || formData.images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Upload images to Cloudinary first
        const imageFiles = formData.images.map(img => img.file);
        const uploadResults = await uploadMultipleImages(imageFiles, {
          folder: 'ammex-products'
        });

        // Check if all uploads were successful
        const failedUploads = uploadResults.filter(result => !result.success);
        if (failedUploads.length > 0) {
          console.error('Some images failed to upload:', failedUploads);
          setErrors({ images: 'Failed to upload some images. Please try again.' });
          setIsLoading(false);
          return;
        }

        // Extract successful upload URLs
        const imageUrls = uploadResults
          .filter(result => result.success)
          .map(result => result.url);

        // Find the selected category and subcategory IDs
        const selectedCategory = categories.find(cat => cat.name === formData.category);
        const selectedSubcategory = subcategories.find(sub => sub.name === formData.subcategory);
        
        // Prepare submission data with IDs and image URLs
        const itemData = {
          modelNo: formData.modelNo,
          itemName: formData.itemName,
          vendor: formData.vendor,
          price: Number(formData.price),
          floorPrice: Number(formData.floorPrice),
          ceilingPrice: Number(formData.ceilingPrice),
          unitId: units.find(u => u.name === formData.unit)?.id,
          quantity: Number(formData.quantity),
          categoryId: selectedCategory?.id,
          subcategoryId: selectedSubcategory?.id || null,
          description: formData.description,
          minLevel: Number(formData.minLevel),
          maxLevel: Number(formData.maxLevel),
          images: imageUrls // Include Cloudinary URLs
        };

        const response = await createItem(itemData);
        
        if (response.success) {
          // Navigate back to items list
          navigate('/inventory/Items');
        } else {
          // Handle error - you might want to show error messages
          console.error('Failed to create item:', response.message);
          setErrors({ general: response.message || 'Failed to create item' });
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigate('/inventory/items');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="-mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-12 -ml-22">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-300 cursor-pointer rounded-full transition-colors duration-200"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Add New Item</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          
          {/* General Error Display */}
          {errors.general && (
            <div className="p-6 border-b border-gray-200">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <h3 className="text-lg font-semibold text-red-800">Error</h3>
                </div>
                <p className="text-red-700">{errors.general}</p>
              </div>
            </div>
          )}

          <div className="p-6 space-y-8">
            {/* Item Details Section */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                Item Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Vendor Dropdown */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">Supplier <span className="text-red-500">*</span></label>
                  <div className="relative w-full" ref={vendorDropdownRef}>
                    <button
                      type="button"
                      className={`cursor-pointer w-full text-lg pl-4 pr-4 py-3 rounded-lg border ${errors.vendor ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center`}
                      onClick={() => setVendorDropdownOpen((open) => !open)}
                    >
                      <span>{formData.vendor || 'Select supplier'}</span>
                      <svg className={`h-5 w-5 ml-2 transition-transform ${vendorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
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
                    <p className="text-red-500 text-sm mt-1">{errors.vendor}</p>
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
                />

                {/* Item Name */}
                <FormField
                  id="itemName"
                  label={<span>Item Name</span>}
                  type="text"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  error={errors.itemName}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300"></div>

            {/* Pricing Information Section */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                Pricing Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  id="price"
                  label={<span>Price <span className="text-red-500">*</span></span>}
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  error={errors.price}
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
                  prefix="₱"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300"></div>

            {/* Stock Information Section */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Boxes className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                Stock Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <div className="relative w-full" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      className={`cursor-pointer w-full text-lg pl-4 pr-4 py-3 rounded-lg border ${errors.category ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center`}
                      onClick={() => setCategoryDropdownOpen((open) => !open)}
                    >
                      <span>{formData.category || 'Select category'}</span>
                      <svg className={`h-5 w-5 ml-2 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {categoryDropdownOpen && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {categories.map(cat => (
                          <li
                            key={cat.id}
                            className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${formData.category === cat.name ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                            onClick={() => {
                              setFormData({ ...formData, category: cat.name, subcategory: '' });
                              setSelectedCategoryId(cat.id);
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
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>
                
                {/* Subcategory Dropdown */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Subcategory 
                    {selectedCategoryId && subcategories.length > 0 && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative w-full" ref={subcategoryDropdownRef}>
                    <button
                      type="button"
                      className={`cursor-pointer w-full text-lg pl-4 pr-4 py-3 rounded-lg border ${errors.subcategory ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center ${!selectedCategoryId || loadingSubcategories || subcategories.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      onClick={() => selectedCategoryId && !loadingSubcategories && subcategories.length > 0 && setSubcategoryDropdownOpen((open) => !open)}
                      disabled={!selectedCategoryId || loadingSubcategories || subcategories.length === 0}
                    >
                      <span>
                        {loadingSubcategories 
                          ? 'Loading subcategories...' 
                          : formData.subcategory || (selectedCategoryId 
                              ? (subcategories.length > 0 ? 'Select subcategory' : 'No subcategories available')
                              : 'Select category first')
                        }
                      </span>
                      <svg className={`h-5 w-5 ml-2 transition-transform ${subcategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {subcategoryDropdownOpen && subcategories.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {subcategories.map(subcat => (
                          <li
                            key={subcat.id}
                            className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${formData.subcategory === subcat.name ? 'bg-blue-600 text-white hover:bg-blue-400 hover:text-white font-semibold' : ''}`}
                            onClick={() => {
                              setFormData({ ...formData, subcategory: subcat.name });
                              setSubcategoryDropdownOpen(false);
                            }}
                          >
                            {subcat.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {errors.subcategory && (
                    <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>
                  )}
                </div>

                {/* Unit Dropdown */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">Unit <span className="text-red-500">*</span></label>
                  <div className="relative w-full" ref={unitDropdownRef}>
                    <button
                      type="button"
                      className={`cursor-pointer w-full text-lg pl-4 pr-4 py-3 rounded-lg border ${errors.unit ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center`}
                      onClick={() => setUnitDropdownOpen((open) => !open)}
                    >
                      <span>{formData.unit || 'Select unit'}</span>
                      <svg className={`h-5 w-5 ml-2 transition-transform ${unitDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
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
                    <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
                  )}
                </div>

                <FormField
                  id="minLevel"
                  label={<span>Minimum Level <span className="text-red-500">*</span></span>}
                  type="number"
                  value={formData.minLevel}
                  onChange={handleInputChange}
                  error={errors.minLevel}
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
                  min="0"
                  step="1"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300"></div>

            {/* Images Section */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Image className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                Product Images <span className="text-red-500">*</span>
              </h3>
              <ImageUpload
                images={formData.images}
                onImagesChange={handleImagesChange}
                maxImages={4}
                required={true}
                className="mb-4"
              />
              {errors.images && (
                <p className="text-red-500 text-sm mt-2">{errors.images}</p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300"></div>

            {/* Additional Details Section */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                Additional Details
              </h3>
              <div className="grid grid-cols-1 gap-6">
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

          {/* Error Summary Section */}
          {Object.keys(errors).length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
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
            </div>
          )}
          
          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
            <button 
              type="button" 
              className="px-6 py-3 border cursor-pointer border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              onClick={handleBack}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`px-8 py-3 cursor-pointer rounded-lg font-medium focus:outline-none focus:ring-4 transition-all duration-200 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white focus:ring-blue-200 hover:from-blue-700 hover:to-blue-800'
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
    </div>
  );
}

NewItem.propTypes = {
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
  errors: PropTypes.object
};

function FormField({ id, label, type, value, onChange, error, prefix, disabled = false, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className={`relative ${error ? 'mb-1' : ''}`}>
        {type === 'textarea' ? (
          <textarea
            id={id}
            className={`w-full text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[120px] bg-white p-3 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
              className={`${prefix ? 'pl-8' : 'pl-3'} w-full text-lg border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white py-3 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={value}
              onChange={onChange}
              disabled={disabled}
              {...props}
            />
          </>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

export default NewItem;
