import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Minus, Check, ArrowLeft, Package } from 'lucide-react';

const CartSidebar = ({ cart, onUpdateQuantity, onClose, totalPrice, isOpen, onCheckout }) => {
  const sidebarRef = useRef(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle click outside if no modals are open
      if (isOpen && !showPreviewModal && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, showPreviewModal]);

  // Disable scroll when preview modal is open
  useEffect(() => {
    if (showPreviewModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showPreviewModal]);

  // Auto-hide success toast
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // "20250729"
    const randomNum = Math.floor(Math.random() * 1000);
    const newOrderNumber = `ORD-${dateStr}-${randomNum}`;
    setOrderNumber(newOrderNumber);
    
    // Show preview modal first
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
      totalAmount: totalPrice,
      orderDate: new Date().toISOString(),
      status: 'pending',
      customerName: 'Customer', // In a real app, this would come from user profile
      customerEmail: 'customer@example.com' // In a real app, this would come from user profile
    };

    // Save order to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    existingOrders.unshift(order); // Add new order at the beginning
    localStorage.setItem('customerOrders', JSON.stringify(existingOrders));

    // Show success toast and proceed with checkout
    setShowSuccessToast(true);
    onCheckout(); // This will clear cart and close sidebar
  };

  const handleBackToCart = () => {
    setShowPreviewModal(false);
  };

  // Always render but control visibility with transforms and mobile-specific hiding
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        data-closed={!isOpen}
        className={`
          fixed top-0 right-0 h-full bg-gray-100 flex flex-col z-[1000]
          w-full sm:w-[500px] md:w-[500px] lg:w-[600px]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${!isOpen ? 'pointer-events-none' : 'pointer-events-auto'}
        `}
      >
        <div className="p-3 sm:p-4  border-b border-gray-400 flex items-center justify-between bg-[#2c5282]">
          <h2 className="text-lg bg-[#2c5282] text-white sm:text-xl font-bold">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 cursor-pointer p-1 transition-colors duration-200"
          >
            <X size={22} />
          </button>
        </div>

        {cart.length === 0 ? (
          
          <div className=" flex-1 flex flex-col items-center justify-center p-4">
            <div className="flex items-center justify-center">
              <Package className="w-16 h-16 mb-2 text-gray-700 p-2" />
            </div>
            <p className="text-gray-700 text-center text-sm sm:text-base">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="border border-gray-400 rounded-lg p-2 sm:p-3 bg-white">
                    <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base leading-tight">{item.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">${item.price.toLocaleString()}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 w-6 h-6 sm:w-8 sm:h-8 rounded-3xl flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <Minus size={12} className="sm:w-4 sm:h-4" />
                        </button>
                        <span className="w-6 sm:w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="bg-gray-200 text-gray-700 w-6 h-6 sm:w-8 sm:h-8 rounded-3xl flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={12} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <span className="font-semibold text-sm sm:text-base">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-400 p-3 sm:p-4 bg-white">
              <div className="mb-3 sm:mb-4">
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span>Total:</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-[#3182ce] text-white py-2 sm:py-3 rounded-3xl font-semibold hover:bg-[#2c5282] transition-colors text-sm sm:text-base"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>

      {/* Checkout Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-2 sm:p-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Order Preview</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Please review your order before confirming</p>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500">Order Number</h3>
                  <p className="text-xs sm:text-sm text-gray-900 break-all">{orderNumber}</p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500">Order Date</h3>
                  <p className="text-xs sm:text-sm text-gray-900">{new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Order Items</h3>
                <div className="space-y-2 sm:space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-start sm:items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{item.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">${(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 sm:pt-4 mb-4 sm:mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleBackToCart}
                  className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-3xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  Back to Cart
                </button>
                <button
                  onClick={handleConfirmPreview}
                  className="flex-1 bg-[#3182ce] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-3xl font-semibold hover:bg-[#2c5282] transition-colors text-sm sm:text-base"
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {showSuccessToast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center transform animate-scale-in">
            {/* Success Animation */}
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
                <Check className="w-8 h-8 text-white" />
              </div>
              {/* Animated rings */}
              <div className="absolute inset-0 w-16 h-16 border-2 border-green-300 rounded-full mx-auto animate-ping opacity-75"></div>
              <div className="absolute inset-0 w-16 h-16 border-2 border-green-200 rounded-full mx-auto animate-ping opacity-50" style={{animationDelay: '0.2s'}}></div>
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Order Confirmed!</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Your order has been successfully placed and is being processed.
            </p>

            {/* Order Number */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Order Number</p>
              <p className="text-lg font-mono font-semibold text-gray-900 break-all">
                {orderNumber}
              </p>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 text-sm text-gray-500">
              <p>You'll receive an email confirmation shortly.</p>
              <p>Track your order in the Orders section.</p>
            </div>

            {/* Progress indicator */}
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartSidebar; 