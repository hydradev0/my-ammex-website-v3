import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ShoppingCart, X, AlertCircle, CreditCard, ExternalLink } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

function TopBar({ cartItemCount = 0 }) {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

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
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 text-white cursor-pointer hover:bg-gray-700 hover:text-white rounded-full transition-colors relative"
          >
            <Bell size={20} className="sm:w-6 sm:h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  )}
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
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              notification.type === 'payment_rejected' 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {notification.type === 'payment_rejected' ? (
                                <CreditCard className="w-4 h-4" />
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
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                              {notification.type === 'payment_rejected' && (
                                <button
                                  onClick={() => {
                                    markAsRead(notification.id);
                                    navigate('/Products/Payment');
                                  }}
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  View Payment
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => navigate('/Products/Payment')}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All Payments
                  </button>
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
                navigate('/Products/Profile');
              }}
            >
              My Profile
            </button>
            <button
              className="w-full text-left px-5 py-3 cursor-pointer hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/Products/Orders');
              }}
            >
              My Orders
            </button>
            <button
              className="w-full text-left px-5 py-3 cursor-pointer hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/Products/Invoices');
              }}
            >
              Invoices
            </button>
          </div>
        </div>

        {/* Cart Button */}
        <button
          onClick={() => navigate('/Products/Cart')}
          className="relative bg-[#3182ce] text-white px-3 py-2 rounded-full flex items-center gap-2 hover:bg-[#4992d6] transition-colors"
        >
          <ShoppingCart size={20} />
          <span className="text-sm">Cart</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default TopBar;