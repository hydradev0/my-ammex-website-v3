import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, ShoppingCart, Package, TrendingDown, Check, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";

const ProductDetailsModal = ({ product, isOpen, onClose, onAddToCart, cart = [],
  width = 'w-[800px]',
  maxHeight = 'max-h-[110vh]',
 }) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [inputQuantity, setInputQuantity] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [quantityError, setQuantityError] = useState(false);
  const [quantityErrorMessage, setQuantityErrorMessage] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const modalRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const setQuantityErrorWithTimeout = (error, message) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
    setQuantityError(error);
    setQuantityErrorMessage(message);
    
    if (error && message.includes('exceeded the maximum quantity')) {
      errorTimeoutRef.current = setTimeout(() => {
        const maxQuantity = Math.max(1, getAvailableQuantity());
        setSelectedQuantity(maxQuantity);
        setInputQuantity(maxQuantity);
        setQuantityError(false);
        setQuantityErrorMessage('');
        errorTimeoutRef.current = null;
      }, 3000);
    }
    else if (error && message.includes('Quantity must')) {
      errorTimeoutRef.current = setTimeout(() => {
      setSelectedQuantity(1);
      setInputQuantity(1);
        setQuantityError(false);
        setQuantityErrorMessage('');
        errorTimeoutRef.current = null;
      }, 3000);
    }
  };

  const clearQuantityError = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setQuantityError(false);
    setQuantityErrorMessage('');
  };

  const getCurrentCartQuantity = () => {
    const cartItem = cart.find(item => item.id === product.id);
    return cartItem ? cartItem.quantity : 0;
  };

  const getAvailableQuantity = () => {
    const currentCartQuantity = getCurrentCartQuantity();
    return Math.max(0, product.stock - currentCartQuantity);
  };

  const getStockStatus = () => {
    if (product.stock > 10) return { text: 'In Stock', color: 'text-emerald-600', bg: 'bg-emerald-500' };
    if (product.stock > 0) return { text: 'Low Stock', color: 'text-amber-600', bg: 'bg-amber-500' };
    return { text: 'Out of Stock', color: 'text-red-500', bg: 'bg-red-500' };
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setInputQuantity(1);
      setSelectedImageIndex(0);
      clearQuantityError();
    }
  }, [isOpen]);

  useEffect(() => {
    setInputQuantity(selectedQuantity);
    clearQuantityError();
  }, [selectedQuantity]);

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

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen || !product) return null;

  const stockStatus = getStockStatus();
  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;

  const handleAddToCart = () => {
    const productToAdd = {
      ...product,
      quantity: selectedQuantity,
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
      onClose();
    }, 300);
  };

  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-300"
      style={{ opacity: isAnimating ? 1 : 0 }}
      
    >
      <div className="flex items-end lg:items-center justify-center h-full lg:p-4">
        <div 
          className={`bg-white w-full h-11/12 lg:h-auto lg:${maxHeight} lg:${width} lg:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out 
          ${isAnimating ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'} lg:scale-65`}
          style={{ transformOrigin: 'center' }}
        >
          {/* Drag Handle - Mobile Only */}
          <div className="flex lg:hidden justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
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
              <div className="w-full lg:w-1/2 p-4 lg:p-6 bg-gradient-to-br from-white to-blue-50">
                {/* Main Image Display */}
                <div className="aspect-[4/3] bg-gray-100 rounded-lg lg:rounded-xl overflow-hidden mb-3 lg:mb-4">
                  {(() => {
                    // Get images array or fallback to single image
                    const images = product.images && Array.isArray(product.images) && product.images.length > 0 
                      ? product.images 
                      : product.image 
                        ? [product.image] 
                        : [];
                    
                    const currentImage = images[selectedImageIndex] || images[0];
                    
                    if (currentImage && (currentImage.startsWith('/') || currentImage.startsWith('http'))) {
                      return (
                        <img 
                          src={currentImage} 
                          alt={product.name}
                          className="w-full h-full object-contain p-4"
                        />
                      );
                    } else {
                      return (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="w-24 h-24 lg:w-32 lg:h-32" />
                        </div>
                      );
                    }
                  })()}
                </div>
                
                {/* Thumbnail Gallery */}
                {(() => {
                  const images = product.images && Array.isArray(product.images) && product.images.length > 0 
                    ? product.images 
                    : product.image 
                      ? [product.image] 
                      : [];
                  
                  if (images.length > 1) {
                    return (
                      <div className="flex space-x-2 mb-3 lg:mb-6">
                        {images.map((image, index) => (
                          <button 
                            key={index} 
                            className={`flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                              selectedImageIndex === index 
                                ? 'ring-2 ring-orange-500 ring-offset-2' 
                                : 'ring-1 ring-slate-200 hover:ring-slate-300'
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            {image && (image.startsWith('/') || image.startsWith('http')) ? (
                              <img 
                                src={image} 
                                alt={`${product.name} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Product Info */}
              <div className="w-full lg:w-1/2 p-4 lg:p-6 flex-1">
                <div className="space-y-4 lg:space-y-5">
                  {/* Product Model and Category */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {product.category}
                      </span>
                      {product.subcategory && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {product.subcategory}
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900 mb-1">{product.modelNo}</h1>
                    <p className="text-base lg:text-lg text-slate-600">{product.name}</p>
                  </div>

                  {/* Price */}
                  <div className="p-4 rounded-xl">
                    {hasDiscount ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl lg:text-3xl font-bold text-orange-500">
                            ₱{(product.discountedPrice || product.price).toLocaleString()}
                          </span>
                          <span className="discount-badge flex items-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                            <TrendingDown className="w-3 h-3" />
                            {product.discountPercentage}% OFF
                          </span>
                        </div>
                        <span className="text-base text-slate-400 line-through">
                          ₱{(product.price || 0).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl lg:text-3xl font-bold text-slate-900">
                        ₱{(product.price || 0).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className={`w-3 h-3 rounded-full ${stockStatus.bg} stock-indicator`}></div>
                    <span className={`text-sm font-semibold ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                    <span className="text-sm text-slate-500">
                      ({product.stock} {product.unit ? product.unit.toLowerCase() : 'units'} available)
                    </span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Quantity {product.unit ? `(${product.unit})` : ''}
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={selectedQuantity <= 1}
                        className="w-10 h-10 lg:w-12 lg:h-12 border-2 cursor-pointer border-slate-200 rounded-lg flex items-center justify-center 
                          hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </button>
                      <input
                        type="number"
                        className={`w-16 h-10 lg:w-20 lg:h-12 text-center font-semibold text-lg border-2 rounded-lg 
                          focus:outline-none focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                          ${quantityError ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200'}`}
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
                          
                          if (parsed < 1) {
                            setQuantityErrorWithTimeout(true, "Quantity must be at least 1");
                            setInputQuantity(e.target.value);
                            return;
                          }
                          if (isNaN(parsed)) {
                            setQuantityErrorWithTimeout(true, "Quantity must not be empty");
                            setInputQuantity(e.target.value);
                            return;
                          }
                          if (parsed > availableQuantity) {
                            const unitText = product.unit ? ` ${product.unit.toLowerCase()}` : '';
                            const errorMessage = currentCartQuantity > 0 
                              ? `You have exceeded the maximum quantity. You already have ${currentCartQuantity}${unitText} in cart, only ${availableQuantity} more available.`
                              : `You have exceeded the maximum quantity of ${availableQuantity}${unitText}`;
                            setQuantityErrorWithTimeout(true, errorMessage);
                            setInputQuantity(e.target.value);
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
                        className={`w-10 h-10 lg:w-12 lg:h-12 border-2 cursor-pointer rounded-lg flex items-center justify-center transition-all ${
                          selectedQuantity >= getAvailableQuantity() || quantityError
                            ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        title={selectedQuantity >= getAvailableQuantity() ? 'Maximum quantity reached' : 'Increase quantity'}
                      >
                        <Plus className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                    
                    {/* Quantity Messages */}
                    {quantityError && (
                      <p className="text-red-500 text-xs lg:text-sm bg-red-50 p-2 rounded-lg">
                        {quantityErrorMessage}
                      </p>
                    )}
                    {!quantityError && getCurrentCartQuantity() > 0 && product.stock > 0 && (
                      <p className="text-slate-600 text-xs lg:text-sm flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded">
                          <ShoppingCart className="w-3 h-3" />
                          {getCurrentCartQuantity()} in cart
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>{getAvailableQuantity()} more available</span>
                      </p>
                    )}
                    {!quantityError && getAvailableQuantity() === 0 && getCurrentCartQuantity() > 0 && (
                      <p className="text-amber-600 text-xs lg:text-sm bg-amber-50 p-2 rounded-lg">
                        Maximum quantity reached ({getCurrentCartQuantity()}/{product.stock})
                      </p>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || quantityError || getAvailableQuantity() === 0}
                    className="btn-ripple w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 
                      text-white py-3 lg:py-4 px-6 rounded-xl font-bold text-base lg:text-lg transition-all duration-300 
                      disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed 
                      flex items-center justify-center gap-2 shadow-lg hover:shadow-xl cursor-pointer"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>
                      {product.stock === 0 ? 'Out of Stock' : 
                       getAvailableQuantity() === 0 ? 'Maximum in Cart' :
                       quantityError ? 'Fix Quantity Error' : 'Add to Cart'}
                    </span>
                  </button>

                  {/* Features */}
                  <div className="space-y-2 lg:space-y-3 pt-2 lg:pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                     <span className="text-xs lg:text-sm text-gray-600"></span>
                    </div>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <div className="pt-4 border-t border-slate-200">
                      <h3 className="font-semibold text-slate-800 mb-2 text-sm lg:text-base">Description</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}
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
