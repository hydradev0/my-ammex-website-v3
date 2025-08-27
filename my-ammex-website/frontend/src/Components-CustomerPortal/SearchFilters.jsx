import React, { useState } from "react";
import { Search, ShoppingCart, Filter, X, User } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  cartItemCount,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();


  
  return (
    <div className="bg-white border-b border-gray-400 px-2 sm:px-4 md:px-6 py-3 sm:py-4 shadow-sm sm:top-18 z-40">
      {/* Desktop Layout */}
      <div className="hidden md:flex gap-4 items-center justify-between">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-3xl focus:ring-2 focus:outline-none focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 sm:px-4 py-2 rounded-3xl transition-colors cursor-pointer text-sm whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-[#3182ce] text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        {/* Profile Dropdown Button */}
        <div
          className="relative "
          onMouseEnter={() => setShowProfileDropdown(true)}
          onMouseLeave={() => setShowProfileDropdown(false)}
        >
          <button
            className="text-gray-700 cursor-pointer px-3 py-2 rounded-3xl flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <User size={28} />
          </button>
          <div
            className={`absolute left-0 mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] z-50 transition-all duration-200 ${
              showProfileDropdown
                ? 'opacity-100 visible translate-y-0'
                : 'opacity-0 invisible translate-y-2'
            }`}
          >
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/Products/profile');
              }}
            >
              My Profile
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/Products/orders');
              }}
            >
              My Orders
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
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
          className="relative bg-[#3182ce] mr-2 text-white px-4 py-2 rounded-3xl flex items-center gap-2 hover:bg-[#4992d6] transition-colors whitespace-nowrap"
        >
          <ShoppingCart size={20} />
          <span className="hidden sm:inline">Cart</span>
          <span className="sm:hidden">({cartItemCount})</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Row - Search and Cart */}
        <div className="flex gap-2 items-center mb-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-500 rounded-3xl focus:ring-2 focus:outline-none focus:ring-gray-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Toggle Button Mobile*/}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className=" text-gray-700 p-2 rounded-3xl hover:bg-gray-300 transition-colors"
          >
            <Filter size={21} />
          </button>

          {/* Profile Dropdown Button Mobile */}
          <div className="relative mr-2  inline-block">
            <button
              onClick={() => setShowProfileDropdown((v) => !v)}
              className=" text-gray-700 px-3 py-2 rounded-3xl flex items-center gap-2 hover:bg-gray-300 transition-colors whitespace-nowrap"
            >
              <User size={23} />
            </button>
            {showProfileDropdown && (
              <div className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-50">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/Products/Profile');
                  }}
                >
                  My Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/Products/Orders');
                  }}
                >
                  My Orders
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/Products/Invoices');
                  }}
                >
                  Invoices
                </button>
              </div>
            )}
          </div>

          {/* Cart Button Mobile*/}
          <button
            onClick={() => navigate('/Products/Cart')}
            className="relative bg-[#3182ce] mr-5 text-white hover:bg-[#4992d6] px-3 py-2 rounded-3xl  flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <ShoppingCart size={18} />
            <span className="text-sm">({cartItemCount})</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1  bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Categories:
              </span>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-500 cursor-pointer mr-3 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowMobileFilters(false);
                  }}
                  className={`px-3 py-1.5 rounded-3xl transition-colors cursor-pointer text-xs whitespace-nowrap ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;
