import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Package, Check, ShoppingBag, ChevronRight, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import ErrorModal from "../Components/ErrorModal";
import TopBarPortal from './TopBarPortal';
import { updateCartItem, removeFromCart, clearCart, getLocalCart, setLocalCart, initializeCartFromDatabase, checkoutPreview, checkoutConfirm, recoverCartFromDatabase, preventDatabaseSync } from '../services/cartService';
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
  const [checkoutSelection, setCheckoutSelection] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [inputValues, setInputValues] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [quantityErrors, setQuantityErrors] = useState({});
  const errorTimeouts = useRef({});
  const [paymentTerms, setPaymentTerms] = useState('30 days');
  const [showPaymentTermsDropdown, setShowPaymentTermsDropdown] = useState(false);
  const paymentTermsOptions = ['30 days', '60 days', '90 days'];
  const paymentTermsDropdownRef = useRef(null);

  const refreshCartData = async (updateSelection = false) => {
    try {
      if (!user?.id) {
        const local = getLocalCart();
        const uniqueLocal = local.filter((it, i, arr) => i === arr.findIndex(t => t.id === it.id));
        setLocalCart(uniqueLocal); // Use setLocalCart to sync global state
        setCart(uniqueLocal);
        if (updateSelection) {
          setSelectedIds(new Set(uniqueLocal.map(it => it.id)));
        }
        return uniqueLocal;
      }

      const dbCart = await initializeCartFromDatabase(user.id);
      if (!Array.isArray(dbCart)) return cart;

      const localIds = new Set(cart.map(i => i.id));

      // Update stock, prices, and discounts for existing items and append any new ones from DB
      const merged = cart.map(localItem => {
        const serverItem = dbCart.find(d => d.id === localItem.id);
        return serverItem ? {
          ...localItem,
          stock: serverItem.stock,
          sellingPrice: serverItem.sellingPrice,
          price: serverItem.price,
          discountedPrice: serverItem.discountedPrice || null,
          discountPercentage: serverItem.discountPercentage || 0
        } : localItem;
      });

      dbCart.forEach(serverItem => {
        if (!localIds.has(serverItem.id)) {
          merged.push(serverItem);
        }
      });

      setLocalCart(merged); // Use setLocalCart to sync global state
      setCart(merged);
      if (updateSelection) {
        setSelectedIds(new Set(merged.map(it => it.id)));
      }
      return merged;
    } catch (_) {
      // silently ignore; user can adjust manually
      return cart;
    }
  };

  const getStockIssues = (items) => {
    const insufficient = items.filter(item => (item.quantity || 0) > (item.stock || 0));
    if (insufficient.length === 0) return { hasIssues: false, message: "" };

    const details = insufficient
      .map(i => `${i.modelNo || 'Unknown Item'} : ordered ${i.quantity}, available ${i.stock || 0}`)
      .join('\n');

    return {
      hasIssues: true,
      message: `The following items exceed available stock. Please adjust quantities and try again.\n\n${details}`
    };
  };

  const validateQuantity = (itemId, quantity, stock) => {
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      return { isValid: false, error: "Quantity must be at least 1" };
    }
    if (parsedQuantity > stock) {
      return { isValid: false, error: `You have exceeded the maximum quantity of ${stock}` };
    }
    return { isValid: true, error: null };
  };

  const setQuantityError = (itemId, error, item) => {
    // Clear any existing timeout for this item
    if (errorTimeouts.current[itemId]) {
      clearTimeout(errorTimeouts.current[itemId]);
    }
    
    setQuantityErrors(prev => ({
      ...prev,
      [itemId]: error
    }));

    // Set timeout to revert to max stock after 3 seconds
    if (item && error.includes('maximum quantity')) {
      errorTimeouts.current[itemId] = setTimeout(() => {
        // Revert to max stock
        setInputValues(prev => ({
          ...prev,
          [itemId]: item.stock
        }));
        updateQuantity(itemId, item.stock);
        // Clear the error
        setQuantityErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[itemId];
          return newErrors;
        });
        // Clear the timeout reference
        delete errorTimeouts.current[itemId];
      }, 5000);
    }
  };

  const clearQuantityError = (itemId) => {
    // Clear any existing timeout for this item
    if (errorTimeouts.current[itemId]) {
      clearTimeout(errorTimeouts.current[itemId]);
      delete errorTimeouts.current[itemId];
    }
    
    setQuantityErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[itemId];
      return newErrors;
    });
  };

  // Initialize cart using the consolidated cartService
  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true);
      
      let cart = getLocalCart();
      
      // If we have a user, always try to fetch fresh data from database
      if (user?.id) {
        try {
          const recoveredCart = await recoverCartFromDatabase(user.id);
          if (recoveredCart.length > 0) {
            cart = recoveredCart;
            // Ensure global state is synced when recovering from database
            setLocalCart(cart);
          }
        } catch (error) {
          console.error('Database recovery failed:', error);
        }
      }
      
      setCart(cart);
      setSelectedIds(new Set(cart.map(it => it.id)));
      setIsLoading(false);
      
      // Refresh cart data immediately after initial load to get latest prices
      if (user?.id && cart.length > 0) {
        refreshCartData(true); // Update selection to include any new items from database
      }
    };

    initializeCart();
  }, [user?.id]); // Re-run if user changes

  // Event-driven cart monitoring (no more polling!)
  useEffect(() => {
    const handleCartUpdate = () => {
      const currentCart = getLocalCart();
      
      if (currentCart.length !== cart.length) {
        setCart(currentCart);
        setSelectedIds(new Set(currentCart.map(it => it.id)));
      }
    };

    // Listen for custom cart update events
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Listen for storage changes (cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'customerCart') {
        handleCartUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [cart.length]);

  // Handle click outside preview modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPreviewModal && previewModalRef.current && event.target === previewModalRef.current) {
        setShowPreviewModal(false);
        setCheckoutSelection(new Set());
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
        navigate('/products/orders');
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

  // Keep selection in sync with cart. Only remove items that no longer exist.
  useEffect(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const cartIds = new Set(cart.map(item => item.id));
      // Remove ids that no longer exist in cart
      for (const id of Array.from(next)) {
        if (!cartIds.has(id)) next.delete(id);
      }
      // Don't automatically select new items during cart updates - only during initialization
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
        navigate('/products/orders');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast, navigate]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(errorTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Handle click outside payment terms dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paymentTermsDropdownRef.current && !paymentTermsDropdownRef.current.contains(event.target)) {
        setShowPaymentTermsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset payment terms dropdown when modal closes
  useEffect(() => {
    if (!showPreviewModal) {
      setShowPaymentTermsDropdown(false);
      setPaymentTerms('30 days');
    }
  }, [showPreviewModal]);

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
      
      // Validate quantity against stock
      const validation = validateQuantity(itemId, quantity, maxStock);
      if (!validation.isValid) {
        setQuantityError(itemId, validation.error, item);
        return;
      }
      
      // Clear any existing error
      clearQuantityError(itemId);
      
      // Update quantity normally
      const result = await updateCartItem(itemId, quantity, user?.id);
      if (result.success) {
        setCart(result.cart);
      } else {
        console.error('Failed to update quantity');
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
        // Clear quantity error for removed item
        clearQuantityError(itemId);
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
            // Clear all quantity errors and timeouts
            setQuantityErrors({});
            Object.values(errorTimeouts.current).forEach(timeout => {
              if (timeout) clearTimeout(timeout);
            });
            errorTimeouts.current = {};
          }
        }
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + ((item.discountedPrice || item.sellingPrice || item.price || 0) * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getSelectedItems = () => {
    return cart.filter(item => selectedIds.has(item.id));
  };

  const getCheckoutItems = () => {
    return cart.filter(item => checkoutSelection.has(item.id));
  };

  const getSelectedTotalPrice = () => {
    return getSelectedItems().reduce((total, item) => total + ((item.discountedPrice || item.sellingPrice || item.price || 0) * item.quantity), 0);
  };

  const getCheckoutTotalPrice = () => {
    return getCheckoutItems().reduce((total, item) => total + ((item.discountedPrice || item.sellingPrice || item.price || 0) * item.quantity), 0);
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

  const hasQuantityErrors = () => {
    return Object.keys(quantityErrors).length > 0;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (getSelectedItems().length === 0) return;
    if (hasQuantityErrors()) return;

    try {
      // Immediate UX feedback
      setPreviewError('');
      setPreviewLoading(true);

      // Capture current selection before refreshing (to avoid async state issues)
      const currentSelection = new Set(selectedIds);
      setCheckoutSelection(currentSelection);

      // Refresh cart data to get latest prices and stock from database (don't change selection)
      const latestCart = await refreshCartData(false);
      const selectedItems = latestCart.filter(i => currentSelection.has(i.id));
      
      // Fast client-side validation using refreshed cart data
      const { hasIssues, message } = getStockIssues(selectedItems);
      if (hasIssues) {
        setErrorModalMessage(message);
        setShowErrorModal(true);
        return;
      }
      // Preview from backend for accurate totals
      const ids = selectedItems.map(i => i.id);
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
       // Final safeguard: refetch latest stock and block if insufficient
       setConfirmingCheckout(true);
       const currentSelection = new Set(checkoutSelection);
       const latestCart = await refreshCartData();
       const selectedItems = latestCart.filter(i => currentSelection.has(i.id));
       const { hasIssues, message } = getStockIssues(selectedItems);
       if (hasIssues) {
         setErrorModalMessage(message);
         setShowErrorModal(true);
         setConfirmingCheckout(false);
         return;
       }
 
      const ids = selectedItems.map(i => i.id);
      const result = await checkoutConfirm(user?.id, { itemIds: ids, paymentTerms });

      // Prevent database sync for 2 seconds to avoid race conditions
      preventDatabaseSync(4000);

      // Remove only the selected items locally using setLocalCart to ensure global state sync
      const remaining = cart.filter(item => !selectedIds.has(item.id));
      setLocalCart(remaining); // This updates localStorage, global state, and backup
      setCart(remaining);
      setSelectedIds(new Set(remaining.map(item => item.id)));

      // Show success using server order number
      setOrderNumber(result?.clientView?.orderNumber || result?.data?.orderNumber || '');
      setShowSuccessToast(true);
      setShowPreviewModal(false);
    } catch (e) {
      console.error('Checkout confirm failed:', e);
    } finally {
      setConfirmingCheckout(false);
    }
  };

  const handleBack = () => {
    navigate('/products');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };
  
// Preview Modal
  const previewModalContent = showPreviewModal ? (
    <div 
      ref={previewModalRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full h-[120vh] flex flex-col"
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
              
              {/* Payment Terms Dropdown */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                <div className="relative" ref={paymentTermsDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowPaymentTermsDropdown(!showPaymentTermsDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3182ce] focus:border-[#3182ce] transition-colors"
                  >
                    <span className="text-gray-900">{paymentTerms}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showPaymentTermsDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showPaymentTermsDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {paymentTermsOptions.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setPaymentTerms(term);
                            setShowPaymentTermsDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors ${
                            paymentTerms === term ? 'bg-blue-50 text-[#3182ce]' : 'text-gray-900'
                          }`}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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

        {/* Stock warning if needed */}
        {(() => {
          const selected = getCheckoutItems();
          const { hasIssues, message } = getStockIssues(selected);
          if (!hasIssues) return null;
          return (
            <div className="px-6 pt-4">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 whitespace-pre-line">
                <p className="font-semibold mb-1">Stock issue</p>
                <p className="text-sm mb-2">{message}</p>
              </div>
            </div>
          );
        })()}

        {/* Fixed Order Items Header */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
        </div>

        {/* Scrollable Items Section */}
        <div className="flex-1 overflow-y-auto mr-1.5 my-1.5">
          <div className="px-3 pb-6">
            <div className="space-y-3">
              {getCheckoutItems().map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {/* Product Image */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {(() => {
                      // Get the first image from images array or fallback to single image
                      const displayImage = (item.images && Array.isArray(item.images) && item.images.length > 0)
                        ? item.images[0]
                        : item.image;

                      if (displayImage && (displayImage.startsWith('/') || displayImage.startsWith('http'))) {
                        return (
                          <img
                            src={displayImage}
                            alt={item.modelNo || 'Product'}
                            className="object-contain w-full h-full"
                          />
                        );
                      } else {
                        return <ShoppingBag size={16} className="text-gray-400" />;
                      }
                    })()}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{item.modelNo}</h4>
                    <p className="text-sm text-gray-500">{item.subcategory || item.category}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × ₱{(item.discountedPrice || item.sellingPrice || item.price || 0).toLocaleString()}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className={`font-semibold ${item.discountPercentage > 0 ? 'text-red-600' : 'text-gray-900'}`}>₱{((item.discountedPrice || item.sellingPrice || item.price || 0) * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-xl font-bold text-gray-900">₱{getCheckoutTotalPrice().toLocaleString()}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-sm text-amber-700 mb-6 bg-amber-100 rounded-lg p-4 border border-amber-300">
            <p className="font-semibold">Disclaimer:</p>
            <p>• All orders are subject to approval.</p>
            <p>• Once the order is approved, it can no longer be canceled.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPreviewModal(false);
                setCheckoutSelection(new Set());
              }}
              className="flex-1 px-4 cursor-pointer py-3 border border-gray-300 text-gray-700 rounded-3xl hover:bg-gray-50 transition-colors"
            >
              Back to Cart
            </button>
            <button
              onClick={() => {
                if (confirmingCheckout) return;
                const { hasIssues } = getStockIssues(getCheckoutItems());
                if (hasIssues) return;
                if (previewWarning?.profileIncomplete) {
                  setShowPreviewModal(false);
                  setCheckoutSelection(new Set());
                  navigate('/products/profile');
                } else {
                  handleConfirmPreview();
                }
              }}
              disabled={confirmingCheckout || getStockIssues(getCheckoutItems()).hasIssues}
              className={`flex-1 cursor-pointer px-4 py-3 rounded-3xl font-medium transition-colors ${
                confirmingCheckout
                  ? 'bg-[#6aa3db] text-white cursor-not-allowed'
                  : getStockIssues(getCheckoutItems()).hasIssues
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : (previewWarning?.profileIncomplete ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-[#3182ce] text-white hover:bg-[#2c5282]')
              }`}
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
            onClick={() => handleBreadcrumbClick('/products')}
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
                      Cart Quantity ({getTotalItems()})
                    </h2>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={allSelected}
                        onChange={handleToggleSelectAll}
                      />
                      <span> Select all ({selectedIds.size}/{cart.length})</span>
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
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {(() => {
                            // Get the first image from images array or fallback to single image
                            const displayImage = (item.images && Array.isArray(item.images) && item.images.length > 0) 
                              ? item.images[0] 
                              : item.image;
                            
                            if (displayImage && (displayImage.startsWith('/') || displayImage.startsWith('http'))) {
                              return (
                                <img 
                                  src={displayImage} 
                                  alt={item.modelNo || 'Product'}
                                  className="object-contain w-full h-full"
                                />
                              );
                            } else {
                              return <ShoppingBag size={24} className="text-gray-400" />;
                            }
                          })()}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                        
                          <div className='flex justify-between'>
                            <div className='flex flex-col'>
                              <div className="text-sm text-gray-500 mb-1">
                                <span className="font-medium">Model No:</span> {item.modelNo || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500 mb-1">
                                <span className="font-medium">Item Name:</span> {item.name || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <div className="mb-3">
                              {item.discountPercentage > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600 font-bold text-lg">
                                    ₱{(item.discountedPrice || item.sellingPrice || item.price || 0).toLocaleString()}
                                  </span>
                                  <span className="text-gray-500 line-through text-sm">
                                    ₱{(item.sellingPrice || item.price || 0).toLocaleString()}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                    -{item.discountPercentage}%
                                  </span>
                                </div>
                              ) : (
                                <p className="text-gray-600">
                                  ₱{(item.sellingPrice || item.price || 0).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                    
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 bg-gray-100 cursor-pointer text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <input 
                              type="number" 
                              className={`w-12 h-8 text-center font-medium border rounded-md focus:outline-none
                              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                              ${quantityErrors[item.id] ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300'}`}
                              value={inputValues[item.id] !== undefined ? inputValues[item.id] : item.quantity} 
                              onChange={(e) => {
                                // Update local input state for typing
                                setInputValues(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }));
                                // Clear error when user starts typing
                                if (quantityErrors[item.id]) {
                                  clearQuantityError(item.id);
                                }
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
                                  setQuantityError(item.id, "Quantity must be at least 1", item);
                                } else if (quantity > item.stock) {
                                  // Show error instead of auto-correcting
                                  setQuantityError(item.id, `You have exceeded the maximum quantity of ${item.stock}`, item);
                                  setInputValues(prev => ({
                                    ...prev,
                                    [item.id]: e.target.value // Keep the invalid input visible
                                  }));
                                } else {
                                  // Update with valid quantity
                                  clearQuantityError(item.id);
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
                                disabled={item.quantity >= (item.stock || 999) || quantityErrors[item.id]}
                                className={`w-8 h-8 cursor-pointer rounded-lg flex items-center justify-center transition-colors ${
                                  item.quantity >= (item.stock || 999) || quantityErrors[item.id]
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={item.quantity >= (item.stock || 999) ? 'Maximum quantity reached' : 'Increase quantity'}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            {quantityErrors[item.id] && (
                              <p className="text-red-500 text-xs mt-1">
                                {quantityErrors[item.id]}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4">
                              <span className={`text-lg font-semibold ${item.discountPercentage > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                ₱{((item.discountedPrice || item.sellingPrice || item.price || 0) * item.quantity).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleRemoveItemClick(item.id)}
                                disabled={removingItemId === item.id}
                                className={`text-red-500 cursor-pointer hover:text-red-700 transition-colors ${removingItemId === item.id ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                  {/* <div className="flex justify-between text-gray-600">
                    <span>Selected ({selectedIds.size} items)</span>
                    <span>₱{getSelectedTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div> */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total</span>
                      <span>₱{getSelectedTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={getSelectedItems().length === 0 || previewLoading || hasQuantityErrors()}
                  className={`w-full cursor-pointer text-white py-3 rounded-3xl font-medium transition-colors ${getSelectedItems().length === 0 || previewLoading || hasQuantityErrors() ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#3182ce] hover:bg-[#4992d6]'}`}
                >
                  {previewLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></span>
                      Preparing preview...
                    </span>
                  ) : hasQuantityErrors() ? 'Cannot proceed to checkout' : 'Proceed to Checkout'}
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
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => { setShowErrorModal(false); refreshCartData(); }}
        title="Insufficient stock"
        message={errorModalMessage}
      />
    </>
  );
};

export default Cart;
