import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Filter, User } from 'lucide-react';
import ProductGrid from './ProductGrid';
import CartSidebar from './CartSidebar';
import SearchFilters from './SearchFilters';
import Pagination from './Pagination';
import ScrollLock from '../Components/ScrollLock';

const IndustrialPOS = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);

  // Sample product data - only showing a few items to avoid reaching max length
  const products = [
    { id: 1, name: 'Industrial Drill Press DP-500', category: 'Drills', price: 1299.99, image: '/Resource/icons8-purchase-order-80.png', stock: 5 },
    { id: 2, name: 'CNC Milling Machine XL-200', category: 'Machines', price: 15999.99, image: '⚙️', stock: 2 },
    { id: 3, name: 'Pneumatic Impact Drill', category: 'Drills', price: 459.99, image: '🔨', stock: 12 },
    { id: 4, name: 'Hydraulic Press HP-1000', category: 'Machines', price: 3499.99, image: '🏭', stock: 3 },
    { id: 5, name: 'Carbide Drill Bit Set', category: 'Accessories', price: 89.99, image: '🔩', stock: 25 },
    { id: 6, name: 'Lathe Machine LT-300', category: 'Machines', price: 8999.99, image: '⚡', stock: 1 },
    { id: 7, name: 'Cordless Hammer Drill', category: 'Drills', price: 249.99, image: '🔋', stock: 18 },
    { id: 8, name: 'Band Saw BS-14', category: 'Machines', price: 1899.99, image: '⚔️', stock: 4 },
    { id: 9, name: 'Safety Equipment Bundle', category: 'Safety', price: 199.99, image: '🦺', stock: 30 },
    { id: 10, name: 'Precision Measuring Tools', category: 'Accessories', price: 159.99, image: '📏', stock: 15 },
    { id: 11, name: 'Lathe Machine LT-300', category: 'Machines', price: 8999.99, image: '⚡', stock: 1 },
    { id: 12, name: 'Cordless Hammer Drill', category: 'Drills', price: 249.99, image: '🔋', stock: 18 },
    { id: 13, name: 'Band Saw BS-14', category: 'Machines', price: 1899.99, image: '⚔️', stock: 4 },
    { id: 14, name: 'Safety Equipment Bundle', category: 'Safety', price: 199.99, image: '🦺', stock: 30 },
    { id: 15, name: 'Precision Measuring Tools', category: 'Accessories', price: 159.99, image: '📏', stock: 15 },
    // Note: In real implementation, you would load more products dynamically
  ];

  const categories = ['All', 'Machines', 'Drills', 'Accessories', 'Safety'];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

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
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <>
      <ScrollLock active={showCart} />
      <div className="bg-gray-100 flex flex-col h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Search and Filters */}
          <SearchFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            onCartClick={() => setShowCart(true)}
            cartItemCount={getTotalItems()}
          />

          {/* Product Grid */}
          <div className="flex-1 pt-4 sm:pt-8 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-14">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 text-sm sm:text-base">
                Showing {((currentPage - 1) * productsPerPage) + 1}-{Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </p>
            </div>

            <ProductGrid 
              products={paginatedProducts} 
              onAddToCart={addToCart} 
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

        {/* Cart Sidebar */}
        <CartSidebar
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onClose={() => setShowCart(false)}
          totalPrice={getTotalPrice()}
          isOpen={showCart}
        />
      </div>
    </>
  );
};

export default IndustrialPOS; 