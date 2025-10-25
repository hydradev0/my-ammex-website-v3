import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Settings, Archive, CreditCard, Menu, X, Upload, UserCog } from 'lucide-react';
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
  const notificationsRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, refreshNotifications } = useNotifications();

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
            onClick={() => navigate('/Homepage/index.html')} 
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
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 hover:bg-gray-50 ${!n.adminIsRead ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${!n.adminIsRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                            <p
                              className="text-xs text-gray-600 mt-1"
                              dangerouslySetInnerHTML={{ __html: n.message }}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                          {!n.adminIsRead && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-[11px] cursor-pointer text-blue-600 hover:text-blue-800 flex-shrink-0"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(n.id)}
                            className="text-gray-400 cursor-pointer hover:text-gray-600 text-sm flex-shrink-0"
                            title="Dismiss"
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
                <div className="p-3 border-t text-center border-gray-200 bg-gray-50">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm cursor-pointer text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  )}
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
              <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-md shadow-lg ring-1 ring-black/5 py-1">
                {user.role === 'Admin' && (<button
                  onClick={() => navigate('/Admin/AccountManagement')}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <UserCog size={16} /> Manage Accounts
                </button>
                )}
                {user.role === 'Admin' && (<button
                  onClick={() => navigate('/Admin/ImportData')}
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
                  onClick={() => navigate('/Settings')}
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