import React, { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import ProductGrid from './ProductGrid';
import SearchFilters from './SearchFilters';
import Pagination from './Pagination';
import ScrollLock from '../Components/ScrollLock';
import ProductDetailsModal from './ProductDetailsModal';

// Modern Toast Component - Improved for better visibility
const Toast = ({ message, isVisible, onClose }) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Increased duration for better UX
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] animate-slide-up-bounce toast-mobile"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl px-6 py-4 min-w-[380px] max-w-[420px] backdrop-blur-sm transform transition-all duration-300 ease-out hover:shadow-3xl hover:scale-[1.02] toast-hover">
        <div className="flex items-start space-x-4">
          {/* Success Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center ring-4 ring-green-50">
              <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
            </div>
          </div>
          
          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 leading-tight">{message}</p>
            <p className="text-sm text-green-600 font-medium mt-1">Added to cart successfully</p>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-progress-shrink"></div>
        </div>
      </div>
    </div>
  );
};

const IndustrialPOS = ({ items = [], categories = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Transform inventory items to product format
  const products = useMemo(() => {
    return items.map(item => ({
      id: item.id,
      name: item.itemName,
      category: item.category?.name || 'Uncategorized',
      price: parseFloat(item.price) || 0,
      image: '/Resource/icons8-purchase-order-80.png', // Default image
      alt: item.itemName,
      stock: item.quantity || 0,
      itemCode: item.itemCode,
      vendor: item.vendor,
      description: item.description || '',
      unit: item.unit?.name || 'pcs'
    }));
  }, [items]);

  // Get unique categories for filtering
  const availableCategories = useMemo(() => {
    const cats = ['All', ...categories.map(cat => cat.name)];
    return [...new Set(cats)]; // Remove duplicates
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.itemCode?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  const addToCart = (product) => {
    const savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    const existing = savedCart.find(item => item.id === product.id);
    
    let updatedCart;
    if (existing) {
      updatedCart = savedCart.map(item =>
        item.id === product.id 
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item
      );
    } else {
      updatedCart = [...savedCart, { ...product, quantity: 1 }];
    }
    
    setCart(updatedCart);
    localStorage.setItem('customerCart', JSON.stringify(updatedCart));
    
    // Show success toast with enhanced feedback
    setToast({ 
      show: true, 
      message: `${product.name} added to cart!` 
    });
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Load cart from localStorage on component mount
  React.useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    setCart(savedCart);
  }, []);

  const handleCardClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <ScrollLock active={showProductModal} />
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.show}
        onClose={() => setToast({ show: false, message: '' })}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onAddToCart={addToCart}
      />
      
      <div className="bg-gray-50 flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Search and Filters */}
          <SearchFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={availableCategories}
            cartItemCount={getTotalItems()}
          />

          {/* Product Grid */}
          <div className="flex-1 mt-2 sm:pt-8 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-14">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 text-sm sm:text-base">
                Showing {((currentPage - 1) * productsPerPage) + 1}-{Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </p>
            </div>

            <ProductGrid 
              products={paginatedProducts} 
              onCardClick={handleCardClick} 
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500 text-base sm:text-lg">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default IndustrialPOS; 