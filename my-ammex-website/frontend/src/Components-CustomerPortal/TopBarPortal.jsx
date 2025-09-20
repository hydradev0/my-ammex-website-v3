import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ShoppingCart } from 'lucide-react';

function TopBar({ cartItemCount = 0 }) {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
        <button className="p-1.5 sm:p-2 text-white hover:bg-gray-700 hover:text-white rounded-full transition-colors">
          <Bell size={20} className="sm:w-6 sm:h-6" />
        </button>

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