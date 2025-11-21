import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Info, DollarSign, Boxes, Image, Save, X, ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import { getSubcategories, createItem } from '../services/inventoryService';
import { uploadMultipleImages } from '../services/cloudinaryService';
import ImageUpload from './ImageUpload';
import { createPortal } from 'react-dom';
import ScrollLock from '../Components/ScrollLock';


function NewItem({ 
  categories, 
  units = [], 
  suppliers = [],
  errors: backendErrors = {}
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for form fields
  const [formData, setFormData] = useState({
    modelNo: '',
    itemName: '',
    vendor: '',
    sellingPrice: '',
    supplierPrice: '',
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
  // State for markup settings
  const [markupRate, setMarkupRate] = useState(30); // Default to 30%
  
  // State for draft modal
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const hasUnsavedChanges = useRef(false);
  const previousLocationRef = useRef(location.pathname);
  const isNavigatingAwayRef = useRef(false);
  
  // Helper functions for number formatting with commas
  const formatNumberWithCommas = (value) => {
    if (!value || value === '') return '';
    // Remove commas first, then ensure only digits and one decimal point remain
    let numStr = value.toString().replace(/,/g, '').replace(/[^\d.]/g, '');
    if (numStr === '' || numStr === '.') return numStr;
    
    // Handle multiple decimal points - keep only the first one
    const firstDecimalIndex = numStr.indexOf('.');
    if (firstDecimalIndex !== -1) {
      const beforeDecimal = numStr.substring(0, firstDecimalIndex);
      const afterDecimal = numStr.substring(firstDecimalIndex + 1).replace(/\./g, '');
      numStr = beforeDecimal + '.' + afterDecimal;
    }
    
    // Split into integer and decimal parts
    const parts = numStr.split('.');
    const integerPart = parts[0] || '';
    const decimalPart = parts[1];
    
    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combine with decimal part if it exists
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };
  
  const removeCommas = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
  };
  
  // Use suppliers data for vendor dropdown (deduplicated and alphabetically sorted)
  const vendors = useMemo(() => {
    return suppliers.length > 0 
      ? Array.from(
          // Deduplicate by lowercase display name while preserving original casing
          new Map(
            suppliers
              .map(supplier => supplier.companyName || '')
              .filter(name => name && name.trim() !== '')
              .map(name => [name.toLowerCase(), name])
          ).values()
        ).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
      : ['No suppliers available'];
  }, [suppliers]);
  
  // Dropdown open states and refs
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef(null);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [filteredVendors, setFilteredVendors] = useState([]);
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

  // Sort categories alphabetically for dropdown display
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => 
      (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' })
    );
  }, [categories]);

  // Initialize filtered vendors
  useEffect(() => {
    setFilteredVendors(vendors);
  }, [vendors]);

  // Update errors when backend errors change
  useEffect(() => {
    if (Object.keys(backendErrors).length > 0) {
      setErrors(backendErrors);
    }
  }, [backendErrors]);

  // Check if form has data
  const hasFormData = () => {
    return !!(
      formData.modelNo.trim() ||
      formData.itemName.trim() ||
      formData.vendor.trim() ||
      formData.sellingPrice.trim() ||
      formData.supplierPrice.trim() ||
      formData.unit.trim() ||
      formData.quantity.trim() ||
      formData.category.trim() ||
      formData.subcategory.trim() ||
      formData.description.trim() ||
      formData.minLevel.trim() ||
      formData.maxLevel.trim() ||
      formData.images.length > 0
    );
  };

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      // Only save image preview URLs, not file objects
      const imagesForDraft = formData.images.map(img => ({
        preview: img.preview || img.url || '',
        url: img.url || ''
      }));
      
      const draftData = {
        ...formData,
        images: imagesForDraft,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('newItem_draft', JSON.stringify(draftData));
      hasUnsavedChanges.current = false;
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  };

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draftJson = localStorage.getItem('newItem_draft');
      if (draftJson && categories.length > 0) {
        const draftData = JSON.parse(draftJson);
        // Restore form data but keep images array structure
        setFormData({
          ...draftData,
          images: draftData.images || []
        });
        // Restore category selection to trigger subcategory fetch
        if (draftData.category) {
          const selectedCategory = categories.find(cat => cat.name === draftData.category);
          if (selectedCategory) {
            setSelectedCategoryId(selectedCategory.id);
          }
        }
        hasUnsavedChanges.current = true;
        setDraftLoaded(true);
        // Hide notification after 5 seconds
        setTimeout(() => setDraftLoaded(false), 5000);
        return true;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return false;
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem('newItem_draft');
    hasUnsavedChanges.current = false;
  };

  // Load draft on component mount (after categories are available)
  useEffect(() => {
    if (categories.length > 0) {
      const loaded = loadDraft();
      if (!loaded) {
        setDraftLoaded(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Update hasUnsavedChanges when form data changes
  useEffect(() => {
    hasUnsavedChanges.current = hasFormData();
  }, [
    formData.modelNo,
    formData.itemName,
    formData.vendor,
    formData.sellingPrice,
    formData.supplierPrice,
    formData.unit,
    formData.quantity,
    formData.category,
    formData.subcategory,
    formData.description,
    formData.minLevel,
    formData.maxLevel,
    formData.images.length
  ]);

  // Handle browser beforeunload (tab/window close)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return ''; // Required for some browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Initialize previous location on mount
  useEffect(() => {
    previousLocationRef.current = location.pathname;
  }, []);

  // Intercept navigation by hooking into History API (used by React Router)
  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const handlePushState = (state, title, url) => {
      // Skip if we're intentionally navigating away
      if (isNavigatingAwayRef.current) {
        originalPushState.call(window.history, state, title, url);
        return;
      }

      // Parse the URL to get the pathname (handle both absolute and relative URLs)
      let targetPath;
      try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const urlObj = new URL(url);
          targetPath = urlObj.pathname;
        } else {
          // Relative URL - resolve it
          const baseUrl = window.location.origin + window.location.pathname;
          const resolvedUrl = new URL(url, baseUrl);
          targetPath = resolvedUrl.pathname;
        }
      } catch (e) {
        // Fallback: use the URL as-is if parsing fails
        targetPath = url.startsWith('/') ? url : '/' + url;
      }

      // Skip if navigating to the same path
      if (targetPath === previousLocationRef.current) {
        originalPushState.call(window.history, state, title, url);
        return;
      }

      // Check if navigation state has skipDraftCheck flag
      if (state?.skipDraftCheck) {
        originalPushState.call(window.history, state, title, url);
        previousLocationRef.current = targetPath;
        return;
      }

      // If we have unsaved changes, block navigation
      if (hasUnsavedChanges.current) {
        // Store the intended destination
        setPendingNavigation({
          to: targetPath,
          options: { state: state }
        });
        
        // Show modal
        setShowDraftModal(true);
        
        // Don't call originalPushState - block the navigation
        return;
      }

      // Allow navigation
      originalPushState.call(window.history, state, title, url);
      previousLocationRef.current = targetPath;
    };

    const handleReplaceState = (state, title, url) => {
      // Always allow replaceState (used for redirects, etc.)
      originalReplaceState.call(window.history, state, title, url);
      
      // Update previous location if it's not a skipDraftCheck navigation
      if (!state?.skipDraftCheck) {
        const urlObj = new URL(url, window.location.origin);
        previousLocationRef.current = urlObj.pathname;
      }
    };

    // Override history methods
    window.history.pushState = handlePushState;
    window.history.replaceState = handleReplaceState;

    return () => {
      // Restore original methods on unmount
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [navigate]);

  // Also handle location changes as a fallback
  useEffect(() => {
    // Skip if we're intentionally navigating away
    if (isNavigatingAwayRef.current) {
      previousLocationRef.current = location.pathname;
      isNavigatingAwayRef.current = false;
      return;
    }

    // Skip if location hasn't changed
    if (previousLocationRef.current === location.pathname) {
      return;
    }

    // Check if navigation state has skipDraftCheck flag
    const state = location.state;
    if (state?.skipDraftCheck) {
      previousLocationRef.current = location.pathname;
      isNavigatingAwayRef.current = false;
      return;
    }

    // If we have unsaved changes and location changed, block navigation
    if (hasUnsavedChanges.current && !showDraftModal) {
      // Store the intended destination
      setPendingNavigation({
        to: location.pathname,
        options: { state: location.state }
      });
      
      // Navigate back to previous location using replace to avoid adding to history
      navigate(previousLocationRef.current, { replace: true, state: { skipDraftCheck: true } });
      
      // Show modal
      setShowDraftModal(true);
      
      // Don't update previousLocationRef yet - wait for user decision
      return;
    }

    // Update previous location if navigation is allowed
    previousLocationRef.current = location.pathname;
  }, [location.pathname, location.state, navigate, showDraftModal]);

  // Fetch markup settings on component mount
  useEffect(() => {
    const fetchMarkupSettings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/markup`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.markup_rate) {
            setMarkupRate(data.data.markup_rate);
          }
        }
      } catch (error) {
        console.error('Failed to fetch markup settings:', error);
        // Keep default 30% if fetch fails
      }
    };

    fetchMarkupSettings();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownOpen && vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setVendorDropdownOpen(false);
        setVendorSearchTerm('');
      }
      if (categoryDropdownOpen && categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (subcategoryDropdownOpen && subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(event.target)) {
        setSubcategoryDropdownOpen(false);
      }
      if (unitDropdownOpen && unitDropdownRef.current && !unitDropdownRef.current.contains(event.target)) {
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
    let updatedFormData = { ...formData };
    
    // Handle supplier price with comma formatting and auto-calculate selling price
    if (id === 'supplierPrice') {
      // Remove commas and store the raw numeric value
      const numericValue = removeCommas(value);
      updatedFormData.supplierPrice = numericValue;
      
      // Auto-calculate selling price when supplier price changes
      if (numericValue && !isNaN(parseFloat(numericValue))) {
        const supplierPrice = parseFloat(numericValue);
        const sellingPrice = supplierPrice * (1 + markupRate / 100);
        updatedFormData.sellingPrice = sellingPrice.toFixed(2);
      } else {
        // Clear selling price field when supplier price is empty
        updatedFormData.sellingPrice = '';
      }
    } else {
      // For other fields, store value as-is
      updatedFormData[id] = value;
    }
    
    setFormData(updatedFormData);

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

  // Handle vendor search change
  const handleVendorSearchChange = (value) => {
    setVendorSearchTerm(value);
    if (!value) {
      setFilteredVendors(vendors);
      return;
    }
    const normalized = value.trim().toLowerCase();
    setFilteredVendors(
      vendors.filter((vendor) => vendor.toLowerCase().includes(normalized))
    );
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
      newErrors.vendor = 'Supplier is required';
    }

    if (!formData.sellingPrice.trim()) {
      newErrors.sellingPrice = 'Selling price is required';
    } else {
      const sellingPriceNum = parseFloat(removeCommas(formData.sellingPrice));
      if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
        newErrors.sellingPrice = 'Selling price must be a positive number';
      }
    }

    if (!formData.supplierPrice.trim()) {
      newErrors.supplierPrice = 'Supplier price is required';
    } else {
      const supplierPriceNum = parseFloat(removeCommas(formData.supplierPrice));
      if (isNaN(supplierPriceNum) || supplierPriceNum < 0) {
        newErrors.supplierPrice = 'Supplier price must be a positive number';
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

    // Validate maximum level - now required
    if (!formData.maxLevel.trim()) {
      newErrors.maxLevel = 'Maximum level is required';
    } else if (isNaN(formData.maxLevel) || Number(formData.maxLevel) < 0) {
      newErrors.maxLevel = 'Maximum level must be a positive number';
    } else if (formData.minLevel && Number(formData.maxLevel) <= Number(formData.minLevel)) {
      newErrors.maxLevel = 'Maximum level must be greater than minimum level';
    }

    // Images are now optional
    
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
          setErrors({ images: 'Failed to upload some images. Please try to upload again.' });
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
        
        // Find the selected supplier by company name
        const selectedSupplier = suppliers.find(supplier => supplier.companyName === formData.vendor);
        const selectedUnit = units.find(u => u.name === formData.unit);

        // Validate required selections
        if (!selectedSupplier) {
          setErrors({ vendor: 'Please select a valid supplier' });
          return;
        }

        if (!selectedUnit) {
          setErrors({ unit: 'Please select a valid unit' });
          return;
        }

        if (!selectedCategory) {
          setErrors({ category: 'Please select a valid category' });
          return;
        }

        // Prepare submission data with IDs and image URLs - only send non-null values
        const itemData = {
          modelNo: formData.modelNo,
          vendor: formData.vendor,
          supplierId: selectedSupplier.id,
          sellingPrice: Number(removeCommas(formData.sellingPrice)),
          supplierPrice: Number(removeCommas(formData.supplierPrice)),
          unitId: selectedUnit.id,
          quantity: Number(formData.quantity),
          categoryId: selectedCategory.id,
          minLevel: Number(formData.minLevel),
          maxLevel: Number(formData.maxLevel) || 0,
          images: imageUrls.length > 0 ? imageUrls : []
        };

        // Only add optional fields if they have values
        if (formData.itemName && formData.itemName.trim()) {
          itemData.itemName = formData.itemName.trim();
        }

        if (selectedSubcategory?.id) {
          itemData.subcategoryId = selectedSubcategory.id;
        }

        if (formData.description && formData.description.trim()) {
          itemData.description = formData.description.trim();
        }

        // Debug: Log the data being sent
        console.log('Sending item data:', itemData);

        const response = await createItem(itemData);
        
        if (response.success) {
          // Clear draft on successful submission
          clearDraft();
          // Set flag to allow navigation
          isNavigatingAwayRef.current = true;
          // Navigate immediately with state to show success modal on Items page
          navigate('/inventory/Items', {
            state: {
              showSuccess: true,
              successTitle: 'Item Created Successfully!',
              successMessage: `The item "${formData.itemName || formData.modelNo}" has been successfully added to your inventory.`,
              skipDraftCheck: true
            }
          });
        } else {
          // Handle error - you might want to show error messages
          console.error('Failed to create item:', response.message);
          console.error('Response:', response);
          
          // If there are specific validation errors, display them
          if (response.errors && Array.isArray(response.errors)) {
            const validationErrors = {};
            response.errors.forEach(error => {
              validationErrors[error.field] = error.message;
            });
            setErrors({ ...validationErrors, general: 'Please fix the validation errors below.' });
          } else {
            setErrors({ general: response.message || 'Failed to create item' });
          }
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
    if (hasUnsavedChanges.current) {
      setPendingNavigation({ to: '/inventory/items', options: {} });
      setShowDraftModal(true);
    } else {
      navigate('/inventory/items');
    }
  };

  // Handle draft modal actions
  const handleSaveDraftAndNavigate = async () => {
    setIsSavingDraft(true);
    const saved = saveDraft();
    setIsSavingDraft(false);
    
    if (saved && pendingNavigation) {
      setShowDraftModal(false);
      isNavigatingAwayRef.current = true;
      // Use navigate with skipDraftCheck flag
      navigate(pendingNavigation.to, { 
        state: { 
          ...pendingNavigation.options?.state,
          skipDraftCheck: true 
        }
      });
      setPendingNavigation(null);
    }
  };

  const handleDiscardAndNavigate = () => {
    clearDraft();
    setShowDraftModal(false);
    if (pendingNavigation) {
      isNavigatingAwayRef.current = true;
      // Use navigate with skipDraftCheck flag
      navigate(pendingNavigation.to, { 
        state: { 
          ...pendingNavigation.options?.state,
          skipDraftCheck: true 
        }
      });
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowDraftModal(false);
    setPendingNavigation(null);
    // We're already on the correct page, just need to reset the flag
    isNavigatingAwayRef.current = false;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="-mb-6 mt-6">
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

      {/* Draft Loaded Notification */}
      {draftLoaded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Save className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-blue-800 text-sm">
              <span className="font-semibold">Draft restored!</span> Your previous work has been loaded.
            </p>
            <button
              onClick={() => setDraftLoaded(false)}
              className="ml-auto text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
                  <div className="relative w-full vendor-dropdown-container" ref={vendorDropdownRef}>
                    <div
                      className={`cursor-pointer w-full text-lg pl-4 pr-4 py-3 rounded-lg border ${errors.vendor ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-white text-left flex justify-between items-center`}
                      onClick={() => {
                        setVendorDropdownOpen(!vendorDropdownOpen);
                        if (!vendorDropdownOpen) {
                          setVendorSearchTerm('');
                          setFilteredVendors(vendors);
                        }
                      }}
                    >
                      <span className={formData.vendor ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.vendor || 'Select supplier'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transform transition-transform ${vendorDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {vendorDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 flex flex-col">
                        <div className="p-2 border-b border-gray-200 flex-shrink-0">
                          <input
                            type="text"
                            value={vendorSearchTerm}
                            onChange={(e) => handleVendorSearchChange(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            placeholder="Search supplier"
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="overflow-y-auto flex-1" style={{ maxHeight: '300px' }}>
                          <div
                            className="px-4 py-2 text-lg hover:bg-gray-100 cursor-pointer text-gray-500"
                            onClick={() => {
                              setFormData({ ...formData, vendor: '' });
                              setVendorDropdownOpen(false);
                            }}
                          >
                            Clear selection
                          </div>
                          {filteredVendors.map((option) => (
                            <div
                              key={option}
                              className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${
                                formData.vendor === option ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                              }`}
                              onClick={() => {
                                setFormData({ ...formData, vendor: option });
                                setVendorDropdownOpen(false);
                                setVendorSearchTerm('');
                              }}
                            >
                              {option}
                            </div>
                          ))}
                          {!filteredVendors.length && (
                            <div className="px-4 py-2 text-lg text-gray-500">No suppliers found</div>
                          )}
                        </div>
                      </div>
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
                  label={<span>Item Name <span className="text-red-500">*</span></span>}
                  type="text"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  error={errors.itemName}
                />

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
                      <ChevronDown className={`w-5 h-5 text-gray-500 transform transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {categoryDropdownOpen && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {sortedCategories.map(cat => (
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
                      <ChevronDown className={`w-5 h-5 text-gray-500 transform transition-transform ${subcategoryDropdownOpen ? 'rotate-180' : ''}`} />
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
                      <ChevronDown className={`w-5 h-5 text-gray-500 transform transition-transform ${unitDropdownOpen ? 'rotate-180' : ''}`} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-2/3">
                <FormField
                  id="supplierPrice"
                  label={<span>Supplier Price <span className="text-red-500">*</span></span>}
                  type="text"
                  value={formatNumberWithCommas(formData.supplierPrice)}
                  onChange={handleInputChange}
                  error={errors.supplierPrice}
                  prefix="₱"
                  inputMode="decimal"
                />
                <FormField
                  id="sellingPrice"
                  label={<span>Selling Price <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(Auto-calculated: Supplier Price + {markupRate}%)</span></span>}
                  type="text"
                  value={formatNumberWithCommas(formData.sellingPrice)}
                  error={errors.sellingPrice}
                  prefix="₱"
                  inputMode="decimal"
                  disabled={true}
                  readOnly={true}
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

                <FormField
                  id="minLevel"
                  label={<span>Minimum Level <span className="text-red-500">*</span></span>}
                  type="number"
                  value={formData.minLevel}
                  onChange={handleInputChange}
                  error={errors.minLevel}
                  min="0"
                />
                <FormField
                  id="quantity"
                  label={<span>Quantity <span className="text-red-500">*</span></span>}
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  error={errors.quantity}
                  min="0"
                />
                <FormField
                  id="maxLevel"
                  label={<span>Maximum Level <span className="text-red-500">*</span></span>}
                  type="number"
                  value={formData.maxLevel}
                  onChange={handleInputChange}
                  error={errors.maxLevel}
                  min="0"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300"></div>

            {/* Images Section */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Image className="w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />
                Product Images
              </h3>
              <ImageUpload
                images={formData.images}
                onImagesChange={handleImagesChange}
                maxImages={4}
                required={false}
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

      {/* Draft Save Modal */}
      {showDraftModal && (
        <>
          <ScrollLock active={showDraftModal} />
          {createPortal(
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
                style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Save className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Save as Draft?</h3>
                  </div>
                  <button
                    onClick={handleCancelNavigation}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    You have unsaved changes. Would you like to save your progress as a draft before leaving?
                  </p>
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    Your draft will be automatically loaded when you return to this page.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                  <button
                    onClick={handleDiscardAndNavigate}
                    disabled={isSavingDraft}
                    className="flex-1 px-4 py-3 cursor-pointer border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveDraftAndNavigate}
                    disabled={isSavingDraft}
                    className="flex-1 px-4 py-3 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isSavingDraft ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      'Save Draft'
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
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
