import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Package, Check, ShoppingBag, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import TopBarPortal from './TopBarPortal';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const previewModalRef = useRef(null);
  const successModalRef = useRef(null);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('customerCart') || '[]');
    setCart(savedCart);
  }, []);

  // Handle click outside preview modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPreviewModal && previewModalRef.current && event.target === previewModalRef.current) {
        setShowPreviewModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPreviewModal]);

  // Handle click outside success modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuccessToast && successModalRef.current && event.target === successModalRef.current) {
        setShowSuccessToast(false);
        navigate('/Products');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuccessToast, navigate]);

  // Auto-hide success toast
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
        navigate('/Products');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast, navigate]);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      const updatedCart = cart.filter(item => item.id !== itemId);
      setCart(updatedCart);
      localStorage.setItem('customerCart', JSON.stringify(updatedCart));
    } else {
      // Update quantity
      const updatedCart = cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setCart(updatedCart);
      localStorage.setItem('customerCart', JSON.stringify(updatedCart));
    }
  };

  const removeItem = (itemId) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem('customerCart', JSON.stringify(updatedCart));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000);
    const newOrderNumber = `ORD-${dateStr}-${randomNum}`;
    setOrderNumber(newOrderNumber);
    
    setShowPreviewModal(true);
  };

  const handleConfirmPreview = () => {
    setShowPreviewModal(false);
    
    // Create order object
    const order = {
      id: orderNumber,
      orderNumber: orderNumber,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      })),
      totalAmount: getTotalPrice(),
      orderDate: new Date().toISOString(),
      status: 'pending',
      customerName: 'Customer',
      customerEmail: 'customer@example.com'
    };

    // Save order to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    existingOrders.unshift(order);
    localStorage.setItem('customerOrders', JSON.stringify(existingOrders));

    // Clear cart
    setCart([]);
    localStorage.setItem('customerCart', JSON.stringify([]));

    // Show success toast
    setShowSuccessToast(true);
  };

  const handleBack = () => {
    navigate('/Products');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleContinueShopping = () => {
    navigate('/Products');
  };

  const previewModalContent = showPreviewModal ? (
    <div 
      ref={previewModalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Order Preview</h2>
          <p className="text-gray-500 mt-1">Please review your order before confirming</p>
        </div>
        
        {/* Fixed Order Info */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Order Number</h3>
              <p className="text-sm text-gray-900 break-all">{orderNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
              <p className="text-sm text-gray-900">{new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Items Section */}
        <div className="flex-1 overflow-y-auto mr-1.5 my-1.5">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toLocaleString()}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900">${(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-xl font-bold text-gray-900">${getTotalPrice().toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="flex-1 px-4 cursor-pointer py-3 border border-gray-300 text-gray-700 rounded-3xl hover:bg-gray-50 transition-colors"
            >
              Back to Cart
            </button>
            <button
              onClick={handleConfirmPreview}
              className="flex-1 cursor-pointer bg-[#3182ce] text-white px-4 py-3 rounded-3xl font-medium hover:bg-[#2c5282] transition-colors"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const successModalContent = showSuccessToast ? (
    <div 
      ref={successModalRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center"
        style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
            <Check className="w-8 h-8 text-white" />
          </div>
          <div className="absolute inset-0 w-16 h-16 border-2 border-green-300 rounded-full mx-auto animate-ping opacity-75"></div>
          <div className="absolute inset-0 w-16 h-16 border-2 border-green-200 rounded-full mx-auto animate-ping opacity-50" style={{animationDelay: '0.2s'}}></div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3">Order Confirmed!</h3>
        <p className="text-gray-600 mb-4">
          Your order has been successfully placed and is being processed.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Order Number</p>
          <p className="text-lg font-mono font-semibold text-gray-900 break-all">
            {orderNumber}
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-500">
          <p>You'll receive an email confirmation shortly.</p>
          <p>Track your order in the Orders section.</p>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <TopBarPortal />
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 mb-4 sm:mb-0 sm:-mt-4 sm:-mx-1 md:-mx-30 lg:-mx-40 xl:-mx-48">
          <button 
            onClick={() => handleBreadcrumbClick('/Products')}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            Products
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-700 font-medium">Cart</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-6 sm:mt-8 sm:-mx-1 md:-mx-25 lg:-mx-30 xl:-mx-35">
          <button 
            onClick={handleBack}
            className="flex items-center justify-center cursor-pointer bg-[#3182ce] hover:bg-[#4992d6] text-white px-3 py-2 rounded-3xl gap-1 transition-colors whitespace-nowrap w-full sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center sm:text-left sm:-ml-4 -md:ml-2 -lg:ml-2 xl:ml-2">Shopping Cart</h1>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <button
              onClick={handleContinueShopping}
              className="bg-[#3182ce] text-white px-6 py-2 rounded-3xl hover:bg-[#2c5282] transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          /* Cart Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cart Items ({getTotalItems()})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        {/* Product Image Placeholder */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShoppingBag size={24} className="text-gray-400" />
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            ${item.price.toLocaleString()}
                          </p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= (item.stock || 999)}
                                className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-semibold text-gray-900">
                                ${(item.price * item.quantity).toLocaleString()}
                              </span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>${getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total</span>
                      <span>${getTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full cursor-pointer bg-[#3182ce] text-white py-3 rounded-3xl font-medium hover:bg-[#2c5282] transition-colors"
                >
                  Proceed to Checkout
                </button>
                
                <button
                  onClick={handleContinueShopping}
                  className="w-full mt-3 cursor-pointer bg-gray-100 text-gray-700 py-3 rounded-3xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ScrollLock active={showPreviewModal || showSuccessToast} />
      {createPortal(previewModalContent, document.body)}
      {createPortal(successModalContent, document.body)}
    </>
  );
};

export default Cart;
