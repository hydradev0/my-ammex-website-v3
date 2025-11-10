import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckCircle, ShoppingCart } from 'lucide-react';
import { createPortal } from 'react-dom';
import ProductGrid from './ProductGrid';
import SearchFilters from './SearchFilters';
import FiltersPanel from './FiltersPanel';
import Pagination from './Pagination';
import ScrollLock from '../Components/ScrollLock';
import ProductDetailsModal from './ProductDetailsModal';
import { addToCart, getLocalCart, initializeCartFromDatabase, cleanCart } from '../services/cartService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sendWebsiteEvent } from '../services/websiteAnalytics';


const IndustrialPOS = ({ items = [], categories = [], onCartCountChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAddToCartNotification, setShowAddToCartNotification] = useState(false);
  const [isAddToCartNotificationAnimating, setIsAddToCartNotificationAnimating] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');

  // Transform inventory items to product format
  const products = useMemo(() => {
   
    return items.map(item => {
      // Get the first image from images array or fallback to single image
      const displayImage = (item.images && Array.isArray(item.images) && item.images.length > 0) 
        ? item.images[0] 
        : item.image || '📦';
      
      return {
        id: item.id,
        modelNo: item.modelNo,
        name: item.itemName,
        category: item.category?.name || 'Uncategorized',
        subcategory: item.subcategory?.name || null,
        price: parseFloat(item.sellingPrice || item.price) || 0,
        image: displayImage,
        images: item.images || [], // Include full images array
        alt: item.modelNo,
        stock: item.quantity || 0,
        itemCode: item.itemCode,
        vendor: item.vendor,
        description: item.description || '',
        unit: item.unit?.name || 'pcs'
      };
    });
  }, [items]);

  // Get unique categories and subcategories for filtering (for backward compatibility with SearchFilters)
  const availableCategories = useMemo(() => {
    const cats = ['All'];
    
    // Add main categories
    categories.forEach(cat => {
      cats.push(cat.name);
      
      // Add subcategories
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach(sub => {
          cats.push(sub.name);
        });
      }
    });
    
    return [...new Set(cats)]; // Remove duplicates
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Check if selectedCategory is a subcategory by looking in all subcategories
      const isSubcategory = categories.some(cat => 
        cat.subcategories && cat.subcategories.some(sub => sub.name === selectedCategory)
      );
      
      let matchesCategory;
      if (selectedCategory === 'All') {
        matchesCategory = true;
      } else if (isSubcategory) {
        // Filter by subcategory
        matchesCategory = product.subcategory === selectedCategory;
      } else {
        // Filter by main category
        matchesCategory = product.category === selectedCategory;
      }
      
      const matchesSearch = product.modelNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
      const meetsMin = priceRange.min == null || product.price >= priceRange.min;
      const meetsMax = priceRange.max == null || product.price <= priceRange.max;
      return matchesCategory && matchesSearch && meetsMin && meetsMax;
    });
  }, [products, selectedCategory, searchTerm, priceRange.min, priceRange.max, categories]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, priceRange.min, priceRange.max]);

  const handleAddToCart = async (product) => {
    try {
      if (!user?.id) {
        setToast({ 
          show: true, 
          message: 'Please log in to add items to cart' 
        });
        return;
      }

      // Use main cart service 
      console.log('🛒 [CART SERVICE] Adding item via main service:', { itemId: product.id, quantity: product.quantity, name: product.name });
      const result = await addToCart(user.id, product.id, product.quantity, product);
      
      if (result.success) {
        console.log('🛒 [CART SERVICE] Item added successfully:', result.cart.length, 'items');
        setCart(result.cart);

        // Track add to cart event for analytics
        try {
          await sendWebsiteEvent({
            event_type: 'add_to_cart',
            product_id: product.id.toString(),
            product_name: product.name,
            model_no: product.modelNo,
            category: product.category,
            value_cents: Math.round(product.price * 100),
            currency: 'PHP',
            page_path: window.location.pathname,
            session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: user?.id?.toString() || null,
            properties: {
              quantity: product.quantity || 1,
              item_code: product.itemCode,
              vendor: product.vendor,
              total_cart_items: result.cart.length,
              source: 'industrial_pos'
            }
          });
        } catch (error) {
          // Silently fail analytics tracking to avoid disrupting user experience
          console.warn('Analytics tracking failed for add_to_cart:', error);
        }

        // Show success notification
        setAddedProductName(product.modelNo);
        setShowAddToCartNotification(true);

        // Start animation after a small delay
        setTimeout(() => {
          setIsAddToCartNotificationAnimating(true);
        }, 50);

        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setIsAddToCartNotificationAnimating(false);
          setTimeout(() => {
            setShowAddToCartNotification(false);
          }, 300); // Match animation duration
        }, 5000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      // You can add error notification here if needed
    }
  };

  const getItemCount = () => {
    return cart.length;
  };

  // Notify parent component when cart count changes
  useEffect(() => {
    if (onCartCountChange) {
      onCartCountChange(cart.length);
    }
  }, [cart.length, onCartCountChange]);
  

  // Initialize cart on component mount
  useEffect(() => {
    const initializeCart = async () => {
      if (user?.id) {
        try {
          // Try to load from database first, fallback to localStorage
          const dbCart = await initializeCartFromDatabase(user.id);
          if (dbCart.length > 0) {
            const cleanedCart = cleanCart(dbCart);
            setCart(cleanedCart);
            // Update localStorage with cleaned cart
            localStorage.setItem('customerCart', JSON.stringify(cleanedCart));
          } else {
            // Fallback to localStorage
            console.log('🛒 [CART SERVICE] Fallback to localStorage');
            const localCart = getLocalCart();
            setCart(localCart);
          }
        } catch (error) {
          console.error('Error initializing cart:', error);
          // Fallback to localStorage
          console.log('🛒 [CART SERVICE] Error fallback to localStorage');
          const localCart = getLocalCart();
          setCart(localCart);
        }
      } else {
        // No user logged in, use localStorage
        console.log('🛒 [CART SERVICE] No user, using localStorage');
        const localCart = getLocalCart();
        setCart(localCart);
      }
    };

    initializeCart();
  }, [user?.id]);

  // Clean up cart on unmount
  useEffect(() => {
    return () => {
      // Ensure cart is cleaned before component unmounts
      if (cart.length > 0) {
        const cleanedCart = cleanCart(cart);
        localStorage.setItem('customerCart', JSON.stringify(cleanedCart));
      }
    };
  }, [cart]);

  const handleCardClick = async (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);

    // Track product click event for analytics
    try {
      await sendWebsiteEvent({
        event_type: 'product_click',
        product_id: product.id.toString(),
        product_name: product.name,
        model_no: product.modelNo,
        category: product.category,
        page_path: window.location.pathname,
        referrer: document.referrer || null,
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user?.id?.toString() || null,
        properties: {
          item_code: product.itemCode,
          vendor: product.vendor,
          price_cents: Math.round(product.price * 100),
          source: 'product_grid_click'
        }
      });
    } catch (error) {
      // Silently fail analytics tracking to avoid disrupting user experience
      console.warn('Analytics tracking failed:', error);
    }
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleViewCart = () => {
    // Navigate to cart page or show cart modal
    // You can implement this based on your routing setup
    navigate('/products/cart');
  };

  const handleCloseAddToCartNotification = () => {
    setIsAddToCartNotificationAnimating(false);
    setTimeout(() => {
      setShowAddToCartNotification(false);
    }, 300); // Match animation duration
  };

  return (
    <>
      <ScrollLock active={showProductModal} />
      
      {/* Add to Cart Success Notification */}
      {showAddToCartNotification && createPortal(
        <div className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ease-out ${
          isAddToCartNotificationAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
        }`}>
          <div className="bg-white rounded-lg shadow-2xl border-l-4 border-green-500 p-4 max-w-md transform transition-all duration-300 ease-out hover:shadow-3xl hover:scale-[1.02]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Item Added to Cart!
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">{addedProductName}</span> has been successfully added to your cart.
                </p>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleViewCart}
                    className="flex items-center cursor-pointer gap-1 bg-[#3182ce] text-white px-3 py-1.5 rounded-lg hover:bg-[#2c5282] transition-colors text-xs font-medium"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    View Cart ({cart.length})
                  </button>
                </div>
              </div>
              <button
                onClick={handleCloseAddToCartNotification}
                className="flex-shrink-0 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onAddToCart={handleAddToCart}
        cart={cart}
      />
      
      <div className="flex flex-col min-h-screen">
        {/* Search and Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={availableCategories}
          onPriceInputChange={({ min, max }) => setPriceRange({ min, max })}
        />

        {/* Main Content Area */}
        <div className="flex-1 bg-gray-50">
          <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-14 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters Panel */}
              <FiltersPanel
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />

              {/* Products Section */}
              <div className="flex-1">
                {/* Results Header */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-gray-600 text-sm sm:text-base">
                    Showing {((currentPage - 1) * productsPerPage) + 1}-{Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </p>
                </div>

                {/* Product Grid */}
                <ProductGrid 
                  products={paginatedProducts} 
                  onCardClick={handleCardClick} 
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}

                {/* No Results */}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <p className="text-gray-500 text-lg mb-2">No products found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IndustrialPOS; 