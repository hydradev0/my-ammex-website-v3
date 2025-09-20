import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, ShoppingCart, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";

const ProductDetailsModal = ({ product, isOpen, onClose, onAddToCart, cart = [],
  width = 'w-[800px]',
  maxHeight = 'max-h-[110vh]',
 }) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [inputQuantity, setInputQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [quantityError, setQuantityError] = useState(false);
  const [quantityErrorMessage, setQuantityErrorMessage] = useState('');
  const modalRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const setQuantityErrorWithTimeout = (error, message) => {
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
    setQuantityError(error);
    setQuantityErrorMessage(message);
    
    // Set timeout to revert to max available quantity after 3 seconds for quantity exceeded errors
    if (error && message.includes('exceeded the maximum quantity')) {
      errorTimeoutRef.current = setTimeout(() => {
        // Revert to max available quantity
        const maxQuantity = Math.max(1, getAvailableQuantity());
        setSelectedQuantity(maxQuantity);
        setInputQuantity(maxQuantity);
        setQuantityError(false);
        setQuantityErrorMessage('');
        // Clear the timeout reference
        errorTimeoutRef.current = null;
      }, 5000);
    }
  };

  const clearQuantityError = () => {
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setQuantityError(false);
    setQuantityErrorMessage('');
  };

  // Get current quantity of this product in cart
  const getCurrentCartQuantity = () => {
    const cartItem = cart.find(item => item.id === product.id);
    return cartItem ? cartItem.quantity : 0;
  };

  // Get available quantity (stock - current cart quantity)
  const getAvailableQuantity = () => {
    const currentCartQuantity = getCurrentCartQuantity();
    return Math.max(0, product.stock - currentCartQuantity);
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setInputQuantity(1);
      clearQuantityError();
    }
  }, [isOpen]);

  // Keep the input field in sync when quantity changes via buttons
  useEffect(() => {
    setInputQuantity(selectedQuantity);
    clearQuantityError();
  }, [selectedQuantity]);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen || !product) return null;

  // Mock variations data - in real app this would come from the product
  const variations = [
    { id: 1, name: 'Model', options: ['ER32', 'BT40', 'CR2'] },
    { id: 2, name: 'Accessories', options: ['4" disc', '5" disc', '6" disc'] },
  ];

  const handleAddToCart = () => {
    const productToAdd = {
      ...product,
      quantity: selectedQuantity,
      variation: selectedVariation
    };
    onAddToCart(productToAdd);
    onClose();
  };

  const handleQuantityChange = (change) => {
    const availableQuantity = getAvailableQuantity();
    const newQuantity = Math.max(1, Math.min(availableQuantity, selectedQuantity + change));
    setSelectedQuantity(newQuantity);
    setInputQuantity(newQuantity);
    clearQuantityError();
  };

  const handleClose = () => {
    setIsAnimating(false);
    clearQuantityError();
    setTimeout(() => {
      setSelectedQuantity(1);
      setSelectedVariation(null);
      onClose();
    }, 300); // Match the animation duration
  };

  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
      style={{ opacity: isAnimating ? 1 : 0 }}
      
    >
      {/* Mobile-First Modal */}
      <div className="flex items-end lg:items-center justify-center h-full lg:p-4">
        <div 
          className={`bg-white w-full h-11/12 lg:h-auto lg:${maxHeight} lg:${width} lg:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out 
          ${isAnimating ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'} lg:scale-65`}
          style={{ transformOrigin: 'center' }}
        >
          {/* Drag Handle - Mobile Only */}
          <div className="flex lg:hidden justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-10 h-0.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-3 lg:px-6 py-3 lg:py-6 border-b border-gray-200">
            <h2 className="text-base lg:text-xl font-semibold lg:font-bold text-gray-900">Product Details</h2>
            <button
              onClick={handleClose}
              className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="w-8 h-8 text-gray-500 cursor-pointer" />
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto h-[calc(100vh-180px)] lg:h-[calc(100vh)] mr-2 mb-4">
            <div className="flex flex-col lg:flex-row">
              {/* Product Images */}
              <div className="w-full lg:w-1/2 p-3 lg:p-6">
                <div className="aspect-[4/3] bg-gray-100 rounded-lg lg:rounded-xl overflow-hidden mb-3 lg:mb-4">
                  {product.image.startsWith('/') || product.image.startsWith('http') ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl lg:text-6xl">
                      {product.image}
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Gallery (mock) */}
                <div className="flex space-x-2 mb-3 lg:mb-6">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="w-10 h-10 lg:w-16 lg:h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs lg:text-lg cursor-pointer hover:bg-gray-300 transition-colors">
                      {product.image}
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="w-full lg:w-1/2 p-3 lg:p-6 flex-1">
                <div className="space-y-3 lg:space-y-6 pb-3 lg:pb-6">
                  {/* Product Title and Category */}
                  <div>
                    <h1 className="text-lg lg:text-2xl font-bold text-gray-900 mb-1 lg:mb-2">{product.name}</h1>
                    <p className="text-xs lg:text-sm text-gray-500">{product.category}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <span className="text-xl lg:text-3xl font-bold text-[#2c5282]">₱{product.price.toLocaleString()}</span>
                    {/* Discounted Price */}
                    {/* <span className="text-sm text-gray-500 line-through">${(product.price * 1.2).toLocaleString()}</span>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">20% OFF</span> */}
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs lg:text-sm font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                      {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                    <span className="text-xs lg:text-lg text-gray-500">({product.stock} available)</span>
                  </div>

                  {/* Variations */}
                  {variations.map((variation) => (
                    <div key={variation.id} className="space-y-1.5 lg:space-y-2">
                      <label className="text-sm lg:text-lg font-medium text-gray-700">{variation.name}</label>
                      <div className="flex flex-wrap gap-1.5 lg:gap-2">
                        {variation.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => setSelectedVariation({ ...selectedVariation, [variation.name]: option })}
                            className={`px-2 py-1.5 lg:px-3 lg:py-2 cursor-pointer border rounded-md lg:rounded-lg text-sm lg:text-lg transition-colors ${
                              selectedVariation?.[variation.name] === option
                                ? 'border-[#2c5282] bg-[#2c5282] text-white'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Quantity Selector */}
                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-sm lg:text-lg font-medium text-gray-700">Quantity</label>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={selectedQuantity <= 1}
                        className="w-8 h-8 lg:w-12 lg:h-12 border cursor-pointer border-gray-300 rounded-md lg:rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      <input
                        type="number"
                        className={`w-10 h-8 lg:w-14 lg:h-12 text-center font-medium text-sm lg:text-lg border rounded-md 
                        lg:rounded-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        ${quantityError ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300'}`}
                        value={inputQuantity}
                        onChange={(e) => {
                          setInputQuantity(e.target.value);
                          if (quantityError) {
                            clearQuantityError();
                          }
                        }}
                        onBlur={(e) => {
                          const parsed = parseInt(e.target.value);
                          const availableQuantity = getAvailableQuantity();
                          const currentCartQuantity = getCurrentCartQuantity();
                          
                          if (isNaN(parsed) || parsed < 1) {
                            // Show error for invalid input
                            setQuantityErrorWithTimeout(true, "Quantity must be at least 1");
                            setInputQuantity(e.target.value); // Keep the invalid input visible
                            return;
                          }
                          if (parsed > availableQuantity) {
                            // Show error for exceeding available quantity
                            const errorMessage = currentCartQuantity > 0 
                              ? `You have exceeded the maximum quantity. You already have ${currentCartQuantity} in cart, only ${availableQuantity} more available.`
                              : `You have exceeded the maximum quantity of ${availableQuantity}`;
                            setQuantityErrorWithTimeout(true, errorMessage);
                            setInputQuantity(e.target.value); // Keep the invalid input visible
                            return;
                          }
                          const clamped = Math.max(1, Math.min(availableQuantity, parsed));
                          setSelectedQuantity(clamped);
                          setInputQuantity(clamped);
                          clearQuantityError();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        min="1"
                        max={getAvailableQuantity()}
                        disabled={product.stock === 0 || getAvailableQuantity() === 0}
                      />
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={selectedQuantity >= getAvailableQuantity() || quantityError}
                        className={`w-8 h-8 lg:w-12 lg:h-12 border cursor-pointer rounded-md lg:rounded-lg flex items-center justify-center transition-colors ${
                          selectedQuantity >= getAvailableQuantity() || quantityError
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                        title={selectedQuantity >= getAvailableQuantity() ? 'Maximum quantity reached' : 'Increase quantity'}
                      >
                        <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                    {quantityError && (
                      <p className="text-red-500 text-xs lg:text-sm mt-1">
                        {quantityErrorMessage}
                      </p>
                    )}
                    {!quantityError && selectedQuantity === product.stock && (
                      <p className="text-red-600 text-xs lg:text-sm mt-1">
                        You have reached the maximun quantity of {product.stock}
                      </p>
                    )}
                    {!quantityError && getCurrentCartQuantity() >= 0 && product.stock > 0 && (
                      <p className="text-blue-600 text-xs lg:text-sm mt-1">
                        {getCurrentCartQuantity()} in the cart • {getAvailableQuantity()} more available
                      </p>
                    )}
                    {!quantityError && getAvailableQuantity() === 0 && getCurrentCartQuantity() === 0 && (
                      <p className="text-gray-500 text-xs lg:text-sm mt-1">
                        Out of stock
                      </p>
                    )}
                    {!quantityError && getAvailableQuantity() === 0 && getCurrentCartQuantity() > 0 && (
                      <p className="text-orange-600 text-xs lg:text-sm mt-1">
                        Maximum quantity reached ({getCurrentCartQuantity()}/{product.stock})
                      </p>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || quantityError || getAvailableQuantity() === 0}
                    className="w-full bg-[#48bb78] hover:bg-[#38a169] text-white py-2.5 lg:py-4 px-4 lg:px-6 rounded-lg lg:rounded-xl font-semibold lg:font-bold text-base lg:text-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span>
                      {product.stock === 0 ? 'Out of Stock' : 
                       getAvailableQuantity() === 0 ? 'Maximum quantity reached' :
                       quantityError ? 'Cannot add to cart' : 'Add to Cart'}
                    </span>
                  </button>

                  {/* Features */}
                  <div className="space-y-2 lg:space-y-3 pt-2 lg:pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <RotateCcw className="w-3 h-3 lg:w-5 lg:h-5 text-orange-600" />
                     <span className="text-xs lg:text-sm text-gray-600"></span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="pt-2 lg:pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-1.5 lg:mb-2 text-sm lg:text-xl">Description</h3>
                    <p className="text-xs lg:text-lg text-gray-600 leading-relaxed">
                      This high-quality industrial product is designed for professional use in demanding environments. 
                      Built with premium materials and engineered for durability, it provides reliable performance 
                      for your industrial applications. Features include advanced safety mechanisms, ergonomic design, 
                      and compatibility with standard industrial protocols.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ScrollLock active={isOpen} />
      {createPortal(modalContent, document.body)}
    </>
  );
};

export default ProductDetailsModal;