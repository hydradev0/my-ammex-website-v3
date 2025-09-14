import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Settings, Archive, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ArchiveModal from './ArchiveModal';

function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
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
      <div className="absolute right-8 flex items-center space-x-4">
        
        {user && (
          <div className="flex items-center space-x-2 text-sm">
            <User size={16} />
            <span>{user.name}</span>
            <span className="text-blue-200">({user.role})</span>
          </div>
        )}
        <button className="p-2 hover:bg-blue-800 rounded-full transition-colors">
          <Bell size={20} />
        </button>
        {user && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 hover:bg-blue-800 rounded-full transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-md shadow-lg ring-1 ring-black/5 py-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <User size={16} /> Profile
                </button>

                {user.role === 'Admin' && (<button
                  onClick={() => navigate('/Admin/AccountManagement')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Settings size={16} /> Manage Accounts
                </button>
                )}
                {(user.role === 'Sales Marketing' || user.role === 'Admin') && (<button
                  onClick={() => navigate('/Sales/ManagePaymentMethods')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                > 
                  <CreditCard size={16} />Payment Methods
                </button>
                )}

                <button
                  onClick={() => { setMenuOpen(false); setArchiveOpen(true); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Archive size={16} /> Archive
                </button>
                <div className="my-1 border-t border-gray-200" />
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <ArchiveModal isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} />
    </div>
  );
}

export default TopBar;