import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ShoppingCart, X, AlertCircle, ExternalLink, Package, AlertTriangle, NotepadText } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { appealRejectedPayment } from '../services/paymentService';
import { appealRejectedOrder } from '../services/orderService';
import { getLocalCart } from '../services/cartService';
import LogoutMenu from './LogoutMenu';
import ProfileCompletionModal from './ProfileCompletionModal';
import useProfileCompletion from '../hooks/useProfileCompletion';

function TopBarPortal() {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [realTimeCartCount, setRealTimeCartCount] = useState(0);
  const notificationsRef = useRef(null);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, refreshNotifications } = useNotifications();
  
  // Profile completion check
  const {
    showModal: showProfileModal,
    closeModal: closeProfileModal,
    onProfileComplete: handleProfileComplete
  } = useProfileCompletion();

  // Appeal modal state
  const [isAppealOpen, setIsAppealOpen] = useState(false);
  const [appealPaymentId, setAppealPaymentId] = useState(null);
  const [appealOrderId, setAppealOrderId] = useState(null);
  const [appealType, setAppealType] = useState(null); // 'payment' or 'order'
  const [appealNotificationId, setAppealNotificationId] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  // Scroll lock while appeal modal is open
  useEffect(() => {
    if (!isAppealOpen) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const original = {
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      htmlOverflow: document.documentElement.style.overflow,
    };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.documentElement.style.overflow = original.htmlOverflow;
      document.body.style.overflow = original.bodyOverflow;
      document.body.style.position = original.bodyPosition;
      document.body.style.top = original.bodyTop;
      document.body.style.width = original.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isAppealOpen]);

  // Optimized cart count update - only when needed
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = getLocalCart();
        const itemCount = cart.length; // Count of unique items, not total quantity
        
        // Only update state if count actually changed
        setRealTimeCartCount(prevCount => {
          if (prevCount !== itemCount) {
            return itemCount;
          }
          return prevCount;
        });
      } catch (error) {
        console.error('Error updating cart count:', error);
      }
    };

    // Update immediately
    updateCartCount();

    // Listen for storage changes (when cart is updated in other tabs/components)
    const handleStorageChange = (e) => {
      if (e.key === 'customerCart') {
        updateCartCount();
      }
    };

    // Listen for custom cart update events (from same tab)
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Note: We no longer use the cartItemCount prop since we calculate it in real-time
  // This ensures the cart count is always accurate and up-to-date

  // Handle click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (notificationId, silent = false, optimistic = false) => {
    if (!notificationId) return;
    
    // Find the notification to check if it's already read
    const notification = notifications.find(n => n.id === notificationId);
    const isAlreadyRead = notification?.isRead;
    
    // Only show loading state if not silent and not already read
    if (!silent && !isAlreadyRead) {
      setMarkingId(notificationId);
    }
    
    // If optimistic, mark as read immediately in the UI without waiting for API
    if (optimistic) {
      // Optimistically update the notification state
      // The context will handle the actual API call in the background
      markAsRead(notificationId).catch(error => {
        console.error('Failed to mark notification as read:', error);
        // Optionally: revert optimistic update on error
      });
      return;
    }
    
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      if (!silent && !isAlreadyRead) {
        setMarkingId((current) => (current === notificationId ? null : current));
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    // Only show loading state if there are unread notifications
    if (unreadCount > 0) {
      setMarkingAll(true);
    }
    // Fire and forget - optimistic updates handle the UI
    markAllAsRead().catch(error => {
      console.error('Failed to mark all notifications as read:', error);
    }).finally(() => {
      setMarkingAll(false);
    });
  };

  return (
    <div className="bg-[#2c5282] w-full flex items-center px-3 sm:px-5 text-white text-sm h-16 sm:h-18">
      <div className="flex justify-between w-full max-w-7xl">
        <div className="pl-4 sm:pl-8 md:pl-16">
          <button 
            className="text-2xl sm:text-3xl font-bold bg-transparent border-none text-white cursor-pointer"
          >
            Ammex
          </button>
        </div>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center gap-3 absolute right-8 sm:right-8">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
            }}
            className="p-1.5 sm:p-2 text-white cursor-pointer hover:bg-gray-700 hover:text-white rounded-full transition-colors relative"
          >
            <Bell size={20} className="sm:w-6 sm:h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notification) => {
                      const isMarking = markingId === notification.id;

                      return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          isMarking && !notification.isRead ? 'opacity-60 cursor-progress pointer-events-none' : 'cursor-pointer'
                        } ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          // Only show loading state if notification is not already read
                          if (!notification.isRead) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              notification.type === 'order_rejected'
                                ? 'bg-red-100 text-red-600' 
                                : notification.type === 'order_appeal'
                                ? 'bg-orange-100 text-orange-600'
                                : notification.type === 'order_approved'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {notification.type === 'order_rejected' ? (
                                <Package className="w-4 h-4" />
                              ) : notification.type === 'order_appeal' ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : notification.type === 'order_approved' ? (
                                <Package className="w-4 h-4" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${
                                  !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                              <p
                                className="text-sm text-gray-600 mt-1"
                                dangerouslySetInnerHTML={{ __html: notification.message }}
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                              {isMarking && !notification.isRead && (
                                <p className="text-xs text-blue-500 mt-1">Marking as read…</p>
                              )}
                              {notification.type === 'order_rejected' && (
                                <div 
                                  className="mt-2 flex items-center gap-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setAppealOrderId(notification?.data?.orderId || notification?.data?.orderNumber);
                                      setAppealPaymentId(null);
                                      setAppealType('order');
                                      setAppealNotificationId(notification.id);
                                      setAppealReason('');
                                      setIsAppealOpen(true);
                                    }}
                                    className="text-xs cursor-pointer text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition-colors font-medium"
                                  >
                                    Appeal
                                    <NotepadText className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      // Close notifications immediately for instant feedback
                                      setShowNotifications(false);
                                      
                                      // Mark as read optimistically (fire and forget - no await)
                                      // This allows navigation to happen immediately without waiting
                                      if (!notification.isRead) {
                                        handleMarkAsRead(notification.id, true, true);
                                      }
                                      
                                      // Navigate immediately - don't wait for API call
                                      navigate('/products/orders');
                                    }}
                                    className="text-xs cursor-pointer text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                    title="View order details"
                                  >
                                    View Order
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              {notification.type === 'order_approved' && (
                                <div 
                                  className="mt-2 flex items-center gap-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      // Close notifications immediately for instant feedback
                                      setShowNotifications(false);
                                      
                                      // Mark as read optimistically (fire and forget - no await)
                                      // This allows navigation to happen immediately without waiting
                                      if (!notification.isRead) {
                                        handleMarkAsRead(notification.id, true, true);
                                      }
                                      
                                      // Navigate immediately - don't wait for API call
                                      navigate('/products/invoices');
                                    }}
                                    className="text-xs cursor-pointer text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded flex items-center gap-1 transition-colors font-medium"
                                    title="View invoice"
                                  >
                                    View Invoice
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <div
                    className="w-full text-center text-sm"
                  >
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={markingAll || unreadCount === 0}
                      className={`text-sm ${markingAll || unreadCount === 0 ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer text-blue-600 hover:text-blue-800'}`}
                    >
                      {markingAll ? 'Marking…' : unreadCount > 0 ? 'Mark all as read' : ''}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setShowProfileDropdown(true)}
          onMouseLeave={() => setShowProfileDropdown(false)}
        >
          <button className="p-1.5 sm:p-2 text-white cursor-pointer hover:bg-gray-700 hover:text-white rounded-full transition-colors">
            <User size={20} className="sm:w-6 sm:h-6" />
          </button>
          <div
            className={`absolute -right-24 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] z-50 transition-all duration-200 ${
              showProfileDropdown
                ? 'opacity-100 visible translate-y-0'
                : 'opacity-0 invisible translate-y-2'
            }`}
          >
            <button
              className="w-full text-left px-5 py-3 cursor-pointer hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/products/profile');
              }}
            >
              My Profile
            </button>
            <button
              className="w-full text-left px-5 py-3 cursor-pointer hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/products/orders');
              }}
            >
              My Orders
            </button>
            <button
              className="w-full text-left px-5 py-3 cursor-pointer hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/products/invoices');
              }}
            >
              Invoices
            </button>
          </div>
        </div>

        {/* Cart Button */}
        <button
          onClick={() => navigate('/products/cart')}
          className="relative text-white cursor-pointer py-2 rounded-full flex items-center gap-2 transition-colors"
        >
          <ShoppingCart size={22} />
          <span className="text-sm"></span>
          {realTimeCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {realTimeCartCount}
            </span>
          )}
        </button>
        <LogoutMenu />
      </div>
      {/* Appeal Modal (Portal + Scroll Lock) */}
      {isAppealOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-3">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {appealType === 'order' ? 'Appeal Rejected Order' : 'Appeal Rejected Payment'}
              </h3>
              <button
                className="text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setIsAppealOpen(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for appeal</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Provide details or evidence for your appeal"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800"
                onClick={() => setIsAppealOpen(false)}
                disabled={appealSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm cursor-pointer bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-60"
                disabled={appealSubmitting || !appealReason.trim()}
                onClick={async () => {
                  if (appealType === 'payment' && !appealPaymentId) return;
                  if (appealType === 'order' && !appealOrderId) return;
                  try {
                    setAppealSubmitting(true);
                    if (appealType === 'payment') {
                      await appealRejectedPayment(appealPaymentId, appealReason.trim());
                    } else if (appealType === 'order') {
                      await appealRejectedOrder(appealOrderId, appealReason.trim());
                    }
                    setIsAppealOpen(false);
                    // Mark the original notification as read and refresh list
                    if (appealNotificationId) {
                      await markAsRead(appealNotificationId);
                    }
                    await refreshNotifications();
                  } catch (_) {
                  } finally {
                    setAppealSubmitting(false);
                  }
                }}
              >
                {appealSubmitting ? 'Submitting…' : 'Submit Appeal'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={closeProfileModal}
        onComplete={handleProfileComplete}
      />
    </div>
  );
}

export default TopBarPortal;