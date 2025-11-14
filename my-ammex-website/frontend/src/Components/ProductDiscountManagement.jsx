import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Search,
  Tag,
  X,
  Calendar,
  Save,
  Filter,
  Sparkles,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Edit
} from 'lucide-react';
import RoleBasedLayout from './RoleBasedLayout';
import SuccessModal from './SuccessModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ScrollLock from './ScrollLock';
import {
  getItemsForDiscount,
  getDiscountedProducts as getDiscountedProductsAPI,
  applyDiscount as applyDiscountAPI,
  removeDiscount as removeDiscountAPI,
  updateDiscount as updateDiscountAPI,
  getDiscountSettings as getDiscountSettingsAPI
} from '../services/discountService';

function ProductDiscountManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingDiscounted, setIsLoadingDiscounted] = useState(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [removingDiscountId, setRemovingDiscountId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [editDiscountPercentage, setEditDiscountPercentage] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isUpdatingDiscount, setIsUpdatingDiscount] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discountTiers, setDiscountTiers] = useState([
    { label: 'Small', value: 5 },
    { label: 'Medium', value: 10 },
    { label: 'Large', value: 15 }
  ]);
  const [error, setError] = useState('');
  const [maxDiscount, setMaxDiscount] = useState(50);
  
  // Browse mode state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('browse'); // 'browse' or 'search'
  const [showFilters, setShowFilters] = useState(false);
  
  // AI suggestion state
  const [isAISuggested, setIsAISuggested] = useState(false);
  const [aiSuggestedProducts, setAiSuggestedProducts] = useState([]);
  
  // Discounted products search state
  const [discountedSearchTerm, setDiscountedSearchTerm] = useState('');
  const [filteredDiscountedProducts, setFilteredDiscountedProducts] = useState([]);
  
  // Pagination with windowed fetching
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const PAGE_WINDOW_MULTIPLIER = 12; // Fetch 12 pages at a time
  const [fetchedBackendPage, setFetchedBackendPage] = useState(1);
  const [fetchedLimit, setFetchedLimit] = useState(itemsPerPage * PAGE_WINDOW_MULTIPLIER);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Windowed fetching - fetch when navigating to a new backend page window
  useEffect(() => {
    const backendPage = Math.floor((currentPage - 1) / PAGE_WINDOW_MULTIPLIER) + 1;
    const limit = itemsPerPage * PAGE_WINDOW_MULTIPLIER;
    
    if (backendPage !== fetchedBackendPage || limit !== fetchedLimit) {
      fetchAllProducts({ page: backendPage, limit, backendPageOverride: backendPage });
    } else if (allProducts.length === 0) {
      // Initial load
      fetchAllProducts({ page: backendPage, limit, backendPageOverride: backendPage });
    }
  }, [currentPage, itemsPerPage]);

  // Load discount settings and discounted products on mount
  useEffect(() => {
    fetchDiscountSettings();
    fetchDiscountedProducts();
  }, []);

  // Handle URL parameters from AI suggestions
  useEffect(() => {
    const suggested = searchParams.get('suggested');
    const productsParam = searchParams.get('products');
    const modelsParam = searchParams.get('models');
    const discountParam = searchParams.get('discount');

    if (suggested === 'ai' && productsParam && modelsParam) {
      setIsAISuggested(true);
      const productNames = productsParam.split(',').map(p => p.trim());
      const modelNos = modelsParam.split(',').map(m => m.trim());
      
      setAiSuggestedProducts(productNames.map((name, idx) => ({
        name,
        modelNo: modelNos[idx] || ''
      })));

      // Set discount if provided
      if (discountParam) {
        setDiscountPercentage(discountParam);
      }
    }
  }, [searchParams]);

  // Auto-select AI suggested products when allProducts is loaded
  useEffect(() => {
    if (isAISuggested && aiSuggestedProducts.length > 0 && allProducts.length > 0) {
      const productsToSelect = allProducts.filter(product => {
        return aiSuggestedProducts.some(aiProduct => {
          const nameMatch = product.name?.toLowerCase().includes(aiProduct.name.toLowerCase());
          const modelMatch = product.modelNo?.toLowerCase().includes(aiProduct.modelNo.toLowerCase());
          return nameMatch || modelMatch;
        });
      });

      if (productsToSelect.length > 0) {
        setSelectedProducts(productsToSelect);
        setViewMode('browse');
      }
    }
  }, [isAISuggested, aiSuggestedProducts, allProducts]);

  // Filter products based on category and search term (client-side filtering on fetched window)
  useEffect(() => {
    let filtered = allProducts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.modelNo?.toLowerCase().includes(term) ||
        p.itemCode?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  }, [allProducts, selectedCategory, searchTerm]);

  const fetchAllProducts = async ({ page = 1, limit = itemsPerPage * PAGE_WINDOW_MULTIPLIER, backendPageOverride } = {}) => {
    setIsLoadingProducts(true);
    setError('');
    try {
      // Fetch products from API with pagination
      const response = await getItemsForDiscount({
        page,
        limit,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined
      });

      if (response.success) {
        setAllProducts(response.data || []);
        const pagination = response.pagination || {};
        setFetchedBackendPage(backendPageOverride || page);
        setFetchedLimit(limit);
        const total = pagination.totalItems || 0;
        setTotalItems(total);
        setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
        
        // Extract unique categories from fetched products
        const uniqueCategories = [...new Set(response.data.map(p => p.category))];
        if (uniqueCategories.length > 0) {
          setCategories(prev => {
            const combined = [...new Set([...prev, ...uniqueCategories])];
            return combined.sort();
          });
        }
        
        console.log(`✅ Fetched page ${page}, limit ${limit}, got ${response.data.length} products`);
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setError(error.message || 'Failed to load products. Please try again.');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchDiscountSettings = async () => {
    try {
      const response = await getDiscountSettingsAPI();
      if (response.success && response.data) {
        setDiscountTiers(response.data.discount_tiers || []);
        setMaxDiscount(response.data.max_discount || 30);
      }
    } catch (error) {
      console.error('Failed to fetch discount settings:', error);
      // Use defaults if fetch fails
      setDiscountTiers([
        { label: 'Small', value: 5 },
        { label: 'Medium', value: 10 },
        { label: 'Large', value: 15 }
      ]);
      setMaxDiscount(30);
    }
  };

  const fetchDiscountedProducts = async () => {
    setIsLoadingDiscounted(true);
    try {
      const response = await getDiscountedProductsAPI();
      if (response.success) {
        const products = response.data || [];
        setDiscountedProducts(products);
        setFilteredDiscountedProducts(products);
      } else {
        setError(response.message || 'Failed to fetch discounted products');
      }
    } catch (error) {
      console.error('Failed to fetch discounted products:', error);
      setError('Failed to fetch discounted products');
    } finally {
      setIsLoadingDiscounted(false);
    }
  };

  // Helper function for currency formatting
  const formatCurrency = (amount) => `₱${Number(amount).toLocaleString()}`;

  // Filter discounted products based on search term
  useEffect(() => {
    if (!discountedSearchTerm.trim()) {
      setFilteredDiscountedProducts(discountedProducts);
      return;
    }

    const term = discountedSearchTerm.toLowerCase();
    const filtered = discountedProducts.filter(product =>
      product.modelNo?.toLowerCase().includes(term) ||
      product.itemCode?.toLowerCase().includes(term) ||
      product.name?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term) ||
      product.discountPercentage?.toString().includes(term) ||
      formatCurrency(product.price).toLowerCase().includes(term) ||
      formatCurrency(product.discountedPrice).toLowerCase().includes(term)
    );
    setFilteredDiscountedProducts(filtered);
  }, [discountedSearchTerm, discountedProducts]);


  const handleProductToggle = (product) => {
    const isSelected = selectedProducts.find(p => p.id === product.id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleSelectAll = () => {
    const paginatedProducts = getPaginatedProducts();
    const allSelected = paginatedProducts.every(p => 
      selectedProducts.find(sp => sp.id === p.id)
    );
    
    if (allSelected) {
      // Deselect all from current page
      const idsToRemove = paginatedProducts.map(p => p.id);
      setSelectedProducts(selectedProducts.filter(p => !idsToRemove.includes(p.id)));
    } else {
      // Select all from current page
      const newSelections = paginatedProducts.filter(p => 
        !selectedProducts.find(sp => sp.id === p.id)
      );
      setSelectedProducts([...selectedProducts, ...newSelections]);
    }
  };

  const getPaginatedProducts = () => {
    // Calculate which products from the current fetched window to display
    const localPage = ((currentPage - 1) % PAGE_WINDOW_MULTIPLIER);
    const startIndex = localPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const handleApplyDiscount = async () => {
    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    const discount = parseFloat(discountPercentage);
    if (isNaN(discount) || discount <= 0 || discount > maxDiscount) {
      setError(`Please enter a valid discount between 1 and ${maxDiscount}%`);
      return;
    }

    // Period validation
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      // Start date should not be in the past
      if (start < today) {
        setError('Start date cannot be in the past');
        return;
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      // End date should not be in the past
      if (end < today) {
        setError('End date cannot be in the past');
        return;
      }

      // If both dates are provided, end date must be after start date
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        if (end < start) {
          setError('End date must be after start date');
          return;
        }
      }
    }

    // If start date is provided but end date is not, that's allowed (ongoing discount)
    // If end date is provided but start date is not, we should require start date
    if (endDate && !startDate) {
      setError('Start date is required when end date is provided');
      return;
    }

    setError('');
    setIsApplyingDiscount(true);
    try {
      const response = await applyDiscountAPI({
        productIds: selectedProducts.map(p => p.id),
        discountPercentage: discount,
        startDate: startDate || null,
        endDate: endDate || null
      });

      if (response.success) {
        setSuccessMessage(response.message || `Discount applied to ${selectedProducts.length} product(s)`);
        setShowSuccessModal(true);
        setSelectedProducts([]);
        setDiscountPercentage('');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        fetchDiscountedProducts();
        
        // Clear URL parameters and AI suggestion state
        setSearchParams({});
        setIsAISuggested(false);
        setAiSuggestedProducts([]);
        
        console.log('✅ Discount applied successfully');
      } else {
        setError(response.message || 'Failed to apply discount');
      }
    } catch (error) {
      console.error('❌ Failed to apply discount:', error);
      setError(error.message || 'Failed to apply discount. Please try again.');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = (productId) => {
    const product = discountedProducts.find(p => p.id === productId) || null;
    setProductToRemove(product);
    setShowConfirmModal(true);
  };

  const handleEditDiscount = (product) => {
    setProductToEdit(product);
    setEditDiscountPercentage(product.discountPercentage?.toString() || '');
    setEditStartDate(product.startDate ? new Date(product.startDate).toISOString().split('T')[0] : '');
    setEditEndDate(product.endDate ? new Date(product.endDate).toISOString().split('T')[0] : '');
    setError('');
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setProductToEdit(null);
    setEditDiscountPercentage('');
    setEditStartDate('');
    setEditEndDate('');
    setError('');
  };

  const handleUpdateDiscount = async () => {
    if (!productToEdit) {
      return;
    }

    const discount = parseFloat(editDiscountPercentage);
    if (isNaN(discount) || discount <= 0 || discount > maxDiscount) {
      setError(`Please enter a valid discount between 1 and ${maxDiscount}%`);
      return;
    }

    // Period validation (same as apply discount)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (editStartDate) {
      const start = new Date(editStartDate);
      start.setHours(0, 0, 0, 0);
      
      if (start < today) {
        setError('Start date cannot be in the past');
        return;
      }
    }

    if (editEndDate) {
      const end = new Date(editEndDate);
      end.setHours(23, 59, 59, 999);
      
      if (end < today) {
        setError('End date cannot be in the past');
        return;
      }

      if (editStartDate) {
        const start = new Date(editStartDate);
        start.setHours(0, 0, 0, 0);
        
        if (end < start) {
          setError('End date must be after start date');
          return;
        }
      }
    }

    if (editEndDate && !editStartDate) {
      setError('Start date is required when end date is provided');
      return;
    }

    setError('');
    setIsUpdatingDiscount(true);
    try {
      const response = await updateDiscountAPI({
        productId: productToEdit.id,
        discountPercentage: discount,
        startDate: editStartDate || null,
        endDate: editEndDate || null
      });

      if (response.success) {
        setSuccessMessage(response.message || 'Discount updated successfully');
        setShowSuccessModal(true);
        handleCloseEditModal();
        fetchDiscountedProducts();
        console.log('✅ Discount updated successfully');
      } else {
        setError(response.message || 'Failed to update discount');
      }
    } catch (error) {
      console.error('❌ Failed to update discount:', error);
      setError(error.message || 'Failed to update discount. Please try again.');
    } finally {
      setIsUpdatingDiscount(false);
    }
  };

  const confirmRemoveDiscount = async () => {
    if (!productToRemove) {
      setShowConfirmModal(false);
      return;
    }
    const productId = productToRemove.id;
    setRemovingDiscountId(productId);
    try {
      const response = await removeDiscountAPI(productId);

      if (response.success) {
        setSuccessMessage(response.message || 'Discount removed successfully');
        setShowSuccessModal(true);
        fetchDiscountedProducts();
        console.log('✅ Discount removed successfully');
      } else {
        setError(response.message || 'Failed to remove discount');
      }
    } catch (error) {
      console.error('❌ Failed to remove discount:', error);
      setError(error.message || 'Failed to remove discount. Please try again.');
    } finally {
      setRemovingDiscountId(null);
      setProductToRemove(null);
      setShowConfirmModal(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const paginatedProducts = getPaginatedProducts();

  return (
    <>
      <RoleBasedLayout />
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Tag className="w-8 h-8 text-blue-600" />
              Product Discount Management
            </h1>
            <p className="text-gray-600 mt-2">
              Browse and select products to apply discounts. Discounted prices will be displayed to customers on product cards.
            </p>
          </div>

          {/* AI Suggestion Banner */}
          {/* {isAISuggested && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <div className="flex-1">
                  <h3 className="font-bold text-purple-900">AI-Suggested Products Selected</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    {selectedProducts.length} product(s) have been pre-selected based on AI insights. 
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAISuggested(false);
                    setAiSuggestedProducts([]);
                    setSearchParams({});
                  }}
                  className="text-purple-600 cursor-pointer hover:text-purple-700 font-medium text-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )} */}

          {/* Apply Discount Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Browse & Select Products</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{filteredProducts.length} products available</span>
              </div>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by product name, model, item code, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1"
                  >
                    {selectedCategory}
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Buttons (shown when filters expanded) */}
              {showFilters && (
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-blue-800 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-blue-800 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product List with Checkboxes */}
            {isLoadingProducts ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                {/* Select All / Deselect All */}
                <div className="mb-4 flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {paginatedProducts.every(p => selectedProducts.find(sp => sp.id === p.id)) ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    {paginatedProducts.every(p => selectedProducts.find(sp => sp.id === p.id))
                      ? 'Deselect All on Page'
                      : 'Select All on Page'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedProducts.length} selected • Page {currentPage} of {totalPages}
                  </span>
                </div>

                {/* Product Grid with Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {paginatedProducts.map((product) => {
                    const isSelected = selectedProducts.find(p => p.id === product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductToggle(product)}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="absolute top-3 right-3">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="pr-8">
                          <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {product.modelNo}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                              {product.category}
                            </span>
                            <span className="font-bold text-lg text-gray-900">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 cursor-pointer border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        // Show first 2, last 2, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === 2 ||
                          pageNum === totalPages ||
                          pageNum === totalPages - 1 ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-4 py-1.5 rounded-lg font-medium ${
                                currentPage === pageNum
                                  ? 'bg-blue-800 text-white'
                                  : 'bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return <span key={pageNum} className="px-2 py-2">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 cursor-pointer border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Discount Configuration Section */}
          {selectedProducts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Configure Discount</h2>
                <span className="text-sm font-medium text-blue-600">
                  {selectedProducts.length} product(s) selected
                </span>
              </div>

              {/* Selected Products Summary */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-blue-900">Selected Products</p>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    Clear all
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 rounded-full text-sm"
                    >
                      <span className="font-medium text-gray-900">{product.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductToggle(product);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Discount Tiers */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Apply Discount
                </label>
                <div className="flex flex-wrap gap-3">
                  {discountTiers.map((tier, index) => (
                    <button
                      key={index}
                      onClick={() => setDiscountPercentage(tier.value.toString())}
                      className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                        discountPercentage === tier.value.toString()
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tier.label}: {tier.value}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Discount Input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (%) *
                  </label>
                  <input
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    min="0"
                    max={maxDiscount}
                    step="0.1"
                    placeholder="Enter discount %"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum: {maxDiscount}%</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">The end date is valid until midnight 11:59 PM (or 23:59).</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Apply Button */}
              <button
                onClick={handleApplyDiscount}
                disabled={selectedProducts.length === 0 || !discountPercentage || isApplyingDiscount}
                className="w-full px-6 py-4 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg transition-all shadow-md hover:shadow-lg"
              >
                {isApplyingDiscount ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Applying Discount...</span>
                  </>
                ) : (
                  <>
                    <Tag className="w-6 h-6" />
                    <span>Apply Discount to {selectedProducts.length} Product(s)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Currently Discounted Products */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Currently Discounted Products</h2>
              <span className="text-sm text-gray-500">
                {filteredDiscountedProducts.length} of {discountedProducts.length} product(s)
              </span>
            </div>

            {/* Search Field for Discounted Products */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search discounted products by name, model, item code, discount, or price..."
                  value={discountedSearchTerm}
                  onChange={(e) => setDiscountedSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {discountedSearchTerm && (
                  <button
                    onClick={() => setDiscountedSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {isLoadingDiscounted ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading discounted products...</p>
              </div>
            ) : discountedProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No products currently have discounts applied</p>
                <p className="text-sm mt-2">Use the search above to find and apply discounts to products</p>
              </div>
            ) : filteredDiscountedProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-2">Try adjusting your search term</p>
                <button
                  onClick={() => setDiscountedSearchTerm('')}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Original Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Discounted Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDiscountedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{product.modelNo}</p>
                            <p className="text-sm text-gray-600 mt-1">{product.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-medium">{formatCurrency(product.price)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                            {product.discountPercentage}% OFF
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-lg text-green-600">{formatCurrency(product.discountedPrice)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <div>{formatDate(product.startDate)}</div>
                            <div className="text-xs text-gray-500">to {formatDate(product.endDate)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEditDiscount(product)}
                              disabled={isUpdatingDiscount}
                              className="text-blue-600 cursor-pointer hover:text-blue-700 font-medium text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Edit
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleRemoveDiscount(product.id)}
                              disabled={removingDiscountId === product.id}
                              className="text-red-600 cursor-pointer hover:text-red-700 font-medium text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {removingDiscountId === product.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  <span>Removing...</span>
                                </>
                              ) : (
                                'Remove'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />

      {/* Confirm Remove Discount */}
      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        title="Remove Discount"
        entityName={productToRemove ? (productToRemove.modelNo || productToRemove.itemCode) : ''}
        description="This action cannot be undone."
        confirmLabel="Remove Discount"
        cancelLabel="Cancel"
        loading={!!(productToRemove && removingDiscountId === productToRemove.id)}
        onCancel={() => {
          setShowConfirmModal(false);
          setProductToRemove(null);
        }}
        onConfirm={confirmRemoveDiscount}
      />

      {/* Edit Discount Modal */}
      {showEditModal && productToEdit && createPortal(
        <>
          <ScrollLock active={showEditModal} />
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
              style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Edit className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Edit Discount</h2>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Product Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-1">Product</p>
                  <p className="text-lg font-bold text-gray-900">{productToEdit.name || productToEdit.modelNo}</p>
                  <p className="text-sm text-gray-600 mt-1">{productToEdit.modelNo}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Original Price:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(productToEdit.price)}</span>
                  </div>
                </div>

                {/* Quick Discount Tiers */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quick Apply Discount
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {discountTiers.map((tier, index) => (
                      <button
                        key={index}
                        onClick={() => setEditDiscountPercentage(tier.value.toString())}
                        className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                          editDiscountPercentage === tier.value.toString()
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tier.label}: {tier.value}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Percentage (%) *
                    </label>
                    <input
                      type="number"
                      value={editDiscountPercentage}
                      onChange={(e) => setEditDiscountPercentage(e.target.value)}
                      min="0"
                      max={maxDiscount}
                      step="0.1"
                      placeholder="Enter discount %"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum: {maxDiscount}%</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        min={editStartDate || new Date().toISOString().split('T')[0]}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">The end date is valid until midnight 11:59 PM (or 23:59).</p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}

                {/* Preview */}
                {editDiscountPercentage && !isNaN(parseFloat(editDiscountPercentage)) && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Preview</p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">New Discounted Price:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(productToEdit.price * (1 - parseFloat(editDiscountPercentage) / 100))}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-gray-600">Savings:</span>
                      <span className="text-lg font-semibold text-red-600">
                        {formatCurrency(productToEdit.price * (parseFloat(editDiscountPercentage) / 100))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 flex justify-end gap-4 flex-shrink-0">
                <button
                  onClick={handleCloseEditModal}
                  disabled={isUpdatingDiscount}
                  className="px-6 cursor-pointer py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDiscount}
                  disabled={!editDiscountPercentage || isUpdatingDiscount}
                  className="px-6 py-3 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2 transition-colors"
                >
                  {isUpdatingDiscount ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Update Discount</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

export default ProductDiscountManagement;

