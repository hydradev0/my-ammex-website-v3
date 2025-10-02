import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function LogoutMenu() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setMenuOpen((o) => !o)}
        className="p-2 hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
        title="Menu"
      >
        <Menu size={20} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-md shadow-lg ring-1 ring-black/5 py-1">
          <button
            onClick={() => { setMenuOpen(false); logout(); }}
            className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default LogoutMenu;
