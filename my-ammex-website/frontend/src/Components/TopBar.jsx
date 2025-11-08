import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Settings, Archive, CreditCard, Menu, Upload, UserCog, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import ArchiveModal from './ArchiveModal';
import { useNotifications } from '../contexts/NotificationContext';

function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { triggerRefresh } = useDataRefresh();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const notificationsRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAsRead = async (notificationId, silent = false, optimistic = false) => {
    if (!notificationId) return;
    
    // Find the notification to check if it's already read
    const notification = notifications.find(n => n.id === notificationId);
    const isAlreadyRead = notification?.adminIsRead;
    
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

  const handleDataRestored = (dataType, restoredData) => {
    // Trigger a refresh for the specific data type without page reload
    const refreshType = dataType === 'item' ? 'items' : 
                       dataType === 'customer' ? 'customers' : 
                       dataType === 'supplier' ? 'suppliers' :
                       dataType === 'account' ? 'accounts' : dataType;
    triggerRefresh(refreshType, restoredData);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-blue-900 h-15 w-full flex items-center px-5 text-white text-sm relative">
      <div className="flex justify-between w-full max-w-7xl">
        <div className="pl-16">
          <button 
            onClick={() => navigate('/home/dashboard')} 
            className="text-3xl font-bold bg-transparent border-none text-white cursor-pointer"
          >
            Ammex
          </button>
        </div>
      </div>
      <div className="absolute right-8 flex items-center space-x-2">
        
        {user && (
          <div className="flex items-center space-x-2 text-sm">
            <User size={16} />
            <span>{user.name}</span>
            <span className="text-blue-200">({user.role})</span>
          </div>
        )}
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications((o) => !o)}
            className="p-2 hover:bg-blue-800 cursor-pointer rounded-full transition-colors relative"
            title="Notifications"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]">
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((n) => {
                      const isInventoryAlert = n.type === 'stock_low' || n.type === 'stock_high';
                      const isMarking = markingId === n.id;

                      return (
                      <div
                        key={n.id}
                        className={`p-3 hover:bg-gray-50 transition-colors ${isMarking && !n.adminIsRead ? 'opacity-60 cursor-progress pointer-events-none' : 'cursor-pointer'} ${!n.adminIsRead ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          // Only show loading state if notification is not already read
                          if (!n.adminIsRead) {
                            handleMarkAsRead(n.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${!n.adminIsRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                            <p
                              className="text-xs text-gray-600 mt-1"
                              dangerouslySetInnerHTML={{ __html: n.message }}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            {isMarking && !n.adminIsRead && (
                              <p className="text-[11px] text-blue-600 mt-1">Marking as read…</p>
                            )}
                             {isInventoryAlert && (
                              <div 
                                className="mt-3 flex items-center gap-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    // Close notifications immediately for instant feedback
                                    setShowNotifications(false);
                                    
                                    // Mark as read optimistically (fire and forget - no await)
                                    // This allows navigation to happen immediately without waiting
                                    if (!n.adminIsRead) {
                                      handleMarkAsRead(n.id, true, true);
                                    }
                                    
                                    // Navigate immediately - don't wait for API call
                                    const searchValue = n.data?.itemCode || n.data?.modelNo;
                                    const searchParam = searchValue ? `?search=${encodeURIComponent(searchValue)}` : '';
                                    navigate(`/inventory/Items${searchParam}`);
                                  }}
                                  className="text-xs cursor-pointer text-blue-600 hover:text-blue-800 px-2 py-1 rounded flex items-center gap-1 transition-colors font-medium"
                                  title={n.data?.itemCode || n.data?.modelNo ? `View item: ${n.data?.itemCode || n.data?.modelNo}` : 'View all items'}
                                >
                                  View Item
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    // Close notifications immediately for instant feedback
                                    setShowNotifications(false);
                                    
                                    // Mark as read optimistically (fire and forget - no await)
                                    // This allows navigation to happen immediately without waiting
                                    if (!n.adminIsRead) {
                                      handleMarkAsRead(n.id, true, true);
                                    }
                                    
                                    // Navigate immediately - don't wait for API call
                                    navigate('/home/dashboard');
                                  }}
                                  className="text-xs cursor-pointer text-gray-600 hover:text-black px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                  title="Go to dashboard"
                                >
                                  View Dashboard
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t text-center border-gray-200 bg-gray-50">
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={markingAll || unreadCount === 0}
                      className={`text-sm ${markingAll || unreadCount === 0 ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer text-blue-600 hover:text-blue-800'}`}
                    >
                      {markingAll ? 'Marking…' : unreadCount > 0 ? 'Mark all as read' : ''}
                    </button>
                </div>
              )}
            </div>
          )}
        </div>
        {user && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 hover:bg-blue-800 rounded-full transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-md shadow-lg ring-1 ring-black/5 py-1 z-[9999]">
                {user.role === 'Admin' && (<button
                  onClick={() => navigate('/admin/account-management')}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <UserCog size={16} /> Manage Accounts
                </button>
                )}
                {user.role === 'Admin' && (<button
                  onClick={() => navigate('/admin/import-data')}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Upload size={16} /> Import Data
                </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); setArchiveOpen(true); }}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Archive size={16} /> Archive
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Settings size={16} /> Settings
                </button>
                <div className="my-1 border-t border-gray-200" />
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <ArchiveModal 
        isOpen={archiveOpen} 
        onClose={() => setArchiveOpen(false)} 
        onDataRestored={handleDataRestored}
      />
    </div>
  );
}

export default TopBar;