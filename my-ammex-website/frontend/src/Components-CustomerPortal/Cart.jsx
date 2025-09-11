import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Package, Check, ShoppingBag, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import TopBarPortal from './TopBarPortal';
import { updateCartItem, removeFromCart, clearCart, getLocalCart, initializeCartFromDatabase, checkoutPreview, checkoutConfirm } from '../services/cartService';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewWarning, setPreviewWarning] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const previewModalRef = useRef(null);
  const successModalRef = useRef(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const confirmModalRef = useRef(null);
  const [confirmOptions, setConfirmOptions] = useState({ title: '', message: '', onConfirm: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [inputValues, setInputValues] = useState({});

  // Initialize cart on component mount (prefer local, then background-merge DB)
useEffect(() => {
  const init = async () => {
    setIsLoading(true);

    // 1) Show local immediately
    const local = getLocalCart();
    const uniqueLocal = local.filter((it, i, arr) => i === arr.findIndex(t => t.id === it.id));
    setCart(uniqueLocal);
    setSelectedIds(new Set(uniqueLocal.map(it => it.id)));
    setIsLoading(false);

    // 2) Background merge with DB (only add items that aren't in local; don't reduce/overwrite local)
    if (!user?.id) return;
    try {
      const dbCart = await initializeCartFromDatabase(user.id); // returns array, but don't overwrite localStorage here
      if (!Array.isArray(dbCart) || dbCart.length === 0) return;

      const localIds = new Set(uniqueLocal.map(it => it.id));
      const toAppend = dbCart.filter(dbIt => !localIds.has(dbIt.id));
      if (toAppend.length === 0) return;

      const merged = [...uniqueLocal, ...toAppend];
      localStorage.setItem('customerCart', JSON.stringify(merged));
      setCart(merged);
      setSelectedIds(new Set(merged.map(it => it.id)));
    } catch (_) {
      // ignore; keep local
    }
  };

  init();
}, [user?.id]);

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

  // Handle click outside confirm modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (confirmLoading) return;
      if (showConfirmModal && confirmModalRef.current && event.target === confirmModalRef.current) {
        setShowConfirmModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfirmModal, confirmLoading]);

  const openConfirm = ({ title, message, onConfirm }) => {
    setConfirmOptions({ title, message, onConfirm });
    setConfirmLoading(false);
    setShowConfirmModal(true);
  };

  // Keep selection in sync with cart. New items become selected by default.
  useEffect(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const cartIds = new Set(cart.map(item => item.id));
      // Remove ids that no longer exist in cart
      for (const id of Array.from(next)) {
        if (!cartIds.has(id)) next.delete(id);
      }
      // Add any new ids (default selected)
      cart.forEach(item => {
        if (!next.has(item.id)) next.add(item.id);
      });
      return next;
    });
  }, [cart]);

  // Sync input values with cart quantities (for plus/minus button updates)
  useEffect(() => {
    setInputValues(prev => {
      const newValues = { ...prev };
      cart.forEach(item => {
        // Only update if the input value is different from cart quantity
        if (newValues[item.id] === undefined || newValues[item.id] === prev[item.id]) {
          newValues[item.id] = item.quantity;
        }
      });
      return newValues;
    });
  }, [cart]);

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

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      // Find the item to get its stock limit
      const item = cart.find(cartItem => cartItem.id === itemId);
      const maxStock = item?.stock || 999;
      
      // Convert to number and validate
      const quantity = parseInt(newQuantity);
      
      if (isNaN(quantity) || quantity <= 0) {
        openConfirm({
          title: 'Remove Item',
          message: 'Setting quantity to 0 will remove this item from your cart. Continue?',
          onConfirm: async () => {
            const result = await removeFromCart(itemId, user?.id);
            if (result.success) {
              setCart(result.cart);
              setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
              });
            }
          }
        });
        return;
      }
      
      // If quantity exceeds max stock, automatically correct to max stock
      if (quantity > maxStock) {
        const result = await updateCartItem(itemId, maxStock, user?.id);
        if (result.success) {
          setCart(result.cart);
        }
        return;
      }
      
      // Update quantity normally
      const result = await updateCartItem(itemId, quantity, user?.id);
      if (result.success) {
        setCart(result.cart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const result = await removeFromCart(itemId, user?.id);
      if (result.success) {
        setCart(result.cart);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleRemoveItemClick = async (itemId) => {
    try {
      setRemovingItemId(itemId);
      await removeItem(itemId);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      openConfirm({
        title: 'Remove All Items',
        message: 'Are you sure you want to remove all items from your cart?.',
        onConfirm: async () => {
          const result = await clearCart(user?.id);
          if (result.success) {
            setCart(result.cart);
            setSelectedIds(new Set());
          }
        }
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getSelectedItems = () => {
    return cart.filter(item => selectedIds.has(item.id));
  };

  const getSelectedTotalPrice = () => {
    return getSelectedItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getSelectedTotalItems = () => {
    return getSelectedItems().reduce((total, item) => total + item.quantity, 0);
  };

  const toggleItemSelected = (itemId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const allSelected = cart.length > 0 && selectedIds.size === cart.length;
  const handleToggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(cart.map(item => item.id)));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (getSelectedItems().length === 0) return;
    try {
      setPreviewError('');
      setPreviewLoading(true);
      // Preview from backend for accurate totals
      const ids = getSelectedItems().map(i => i.id);
      const preview = await checkoutPreview(user?.id, { itemIds: ids });
      setOrderNumber(preview?.data?.orderNumber || '');
      // Capture soft warnings (e.g., incomplete profile)
      setPreviewWarning(preview?.warnings || null);
      setShowPreviewModal(true);
    } catch (e) {
      console.error('Checkout preview failed:', e);
      setPreviewError(e.message || 'Failed to preview checkout');
    }
    finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmPreview = async () => {
    try {
      setConfirmingCheckout(true);
      const ids = getSelectedItems().map(i => i.id);
      const result = await checkoutConfirm(user?.id, { itemIds: ids });

      // Remove only the selected items locally
      const remaining = cart.filter(item => !selectedIds.has(item.id));
      setCart(remaining);
      localStorage.setItem('customerCart', JSON.stringify(remaining));
      setSelectedIds(new Set(remaining.map(item => item.id)));

      // Show success using server order number
      setOrderNumber(result?.clientView?.orderNumber || result?.data?.orderNumber || '');
      setShowPreviewModal(false);
      setShowSuccessToast(true);
    } catch (e) {
      console.error('Checkout confirm failed:', e);
    } finally {
      setConfirmingCheckout(false);
    }
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
  
// Preview Modal
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
        {previewWarning?.profileIncomplete && (
          <div className="px-6 pt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              <p className="font-semibold mb-1">Profile incomplete</p>
              <p className="text-sm mb-2">Please complete your profile before confirming checkout.</p>
              {Array.isArray(previewWarning.missingFields) && previewWarning.missingFields.length > 0 && (
                <ul className="list-disc list-inside text-sm">
                  {previewWarning.missingFields.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
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
              {getSelectedItems().map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × {item.price.toLocaleString()}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900">₱{(item.price * item.quantity).toLocaleString()}</p>
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
              <span className="text-xl font-bold text-gray-900">₱{getSelectedTotalPrice().toLocaleString()}</span>
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
              onClick={() => {
                if (confirmingCheckout) return;
                if (previewWarning?.profileIncomplete) {
                  setShowPreviewModal(false);
                  navigate('/Products/profile');
                } else {
                  handleConfirmPreview();
                }
              }}
              disabled={confirmingCheckout}
              className={`flex-1 cursor-pointer px-4 py-3 rounded-3xl font-medium transition-colors ${confirmingCheckout ? 'bg-[#6aa3db] text-white cursor-not-allowed' : (previewWarning?.profileIncomplete ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-[#3182ce] text-white hover:bg-[#2c5282]')}`}
            >
              {previewWarning?.profileIncomplete ? 'Go to Profile' : (
                confirmingCheckout ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></span>
                    Placing order...
                  </span>
                ) : 'Confirm Order'
              )}
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

  const confirmModalContent = showConfirmModal ? (
    <div
      ref={confirmModalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}
      >
        <h3 className="text-lg font-semibold text-gray-900">{confirmOptions.title || 'Confirm Action'}</h3>
        <p className="text-gray-600 mt-2">{confirmOptions.message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={() => setShowConfirmModal(false)}
            disabled={confirmLoading}
            className="px-4 py-2 cursor-pointer rounded-3xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                if (typeof confirmOptions.onConfirm === 'function') {
                  setConfirmLoading(true);
                  await confirmOptions.onConfirm();
                }
              } finally {
                setConfirmLoading(false);
                setShowConfirmModal(false);
              }
            }}
            disabled={confirmLoading}
            className={`px-4 py-2 cursor-pointer rounded-3xl text-white transition-colors ${confirmLoading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {confirmLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : 'Confirm'}
          </button>
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

        {isLoading ? (
          /* Loading State */
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading your cart...</h3>
            <p className="text-gray-600">Please wait while we fetch your cart items</p>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <button
              onClick={handleContinueShopping}
              className="bg-[#3182ce] cursor-pointer text-white px-6 py-2 rounded-3xl hover:bg-[#4992d6] transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          /* Cart Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex flex-col items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Cart Items ({getTotalItems()})
                    </h2>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={allSelected}
                        onChange={handleToggleSelectAll}
                      />
                      <span> Select all ({getSelectedTotalItems()}/{getTotalItems()})</span>
                    </label>
                  </div>
                  <button
                    onClick={handleClearCart}
                    className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-3xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                    Remove All
                  </button>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        {/* Select Checkbox */}
                        <div className="pt-2">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleItemSelected(item.id)}
                          />
                        </div>
                        {/* Product Image Placeholder */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShoppingBag size={24} className="text-gray-400" />
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {item.name}
                          </h3>
                          <div className="flex justify-between">
                          <p className="text-gray-600 mb-3">
                            ₱{item.price.toLocaleString()}
                          </p>
                          <p className="text-gray-600 mb-3">
                            Stock: {item.stock} 
                          </p>
                          </div>
                    
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <input 
                              type="number" 
                              className="w-12 h-8 text-center font-medium border border-gray-300 rounded-md focus:outline-none
                              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                              value={inputValues[item.id] !== undefined ? inputValues[item.id] : item.quantity} 
                              onChange={(e) => {
                                // Update local input state for typing
                                setInputValues(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }));
                              }}
                              onBlur={(e) => {
                                // Update quantity only when clicking outside the input
                                const quantity = parseInt(e.target.value);
                                if (isNaN(quantity) || quantity <= 0) {
                                  // Reset to current quantity if invalid
                                  setInputValues(prev => ({
                                    ...prev,
                                    [item.id]: item.quantity
                                  }));
                                } else if (quantity > item.stock) {
                                  // Set to max stock if exceeds limit
                                  setInputValues(prev => ({
                                    ...prev,
                                    [item.id]: item.stock
                                  }));
                                  updateQuantity(item.id, item.stock);
                                } else {
                                  // Update with valid quantity
                                  updateQuantity(item.id, quantity);
                                }
                              }}
                              onKeyDown={(e) => {
                                // Allow Enter key to trigger update
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                }
                              }}
                              min="1"
                              max={item.stock}
                              />
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
                                ₱{(item.price * item.quantity).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleRemoveItemClick(item.id)}
                                disabled={removingItemId === item.id}
                                className={`text-red-500 hover:text-red-700 transition-colors ${removingItemId === item.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                {removingItemId === item.id ? (
                                  <span className="inline-flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-red-500/70 border-t-transparent rounded-full animate-spin"></span>
                                    Removing
                                  </span>
                                ) : (
                                  <Trash2 size={18} />
                                )}
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
                    <span>Selected ({getSelectedTotalItems()} items)</span>
                    <span>₱{getSelectedTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total</span>
                      <span>₱{getSelectedTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={getSelectedItems().length === 0 || previewLoading}
                  className={`w-full cursor-pointer text-white py-3 rounded-3xl font-medium transition-colors ${getSelectedItems().length === 0 || previewLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#3182ce] hover:bg-[#2c5282]'}`}
                >
                  {previewLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></span>
                      Preparing preview...
                    </span>
                  ) : 'Proceed to Checkout'}
                </button>
                {previewError && (
                  <div className="mt-3 text-sm text-red-600">{previewError}</div>
                )}
                
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
      <ScrollLock active={showPreviewModal || showSuccessToast || showConfirmModal} />
      {createPortal(previewModalContent, document.body)}
      {createPortal(successModalContent, document.body)}
      {createPortal(confirmModalContent, document.body)}
    </>
  );
};

export default Cart;
