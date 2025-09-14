import React, { useState } from "react";
import { Search, ShoppingCart, Filter, X, User, SlidersHorizontal } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from "react";

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  cartItemCount,
  onPriceInputChange,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const desktopDropdownRef = useRef(null);
  const desktopTriggerRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const mobileTriggerRef = useRef(null);

  useEffect(() => {
    const handleGlobal = (event) => {
      // Desktop outside click
      if (showDesktopFilters) {
        const dd = desktopDropdownRef.current;
        const bt = desktopTriggerRef.current;
        if (dd && !dd.contains(event.target) && bt && !bt.contains(event.target)) {
          setShowDesktopFilters(false);
        }
      }
      // Mobile outside click
      if (showMobileFilters) {
        const md = mobileDropdownRef.current;
        const mb = mobileTriggerRef.current;
        if (md && !md.contains(event.target) && mb && !mb.contains(event.target)) {
          setShowMobileFilters(false);
        }
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (showDesktopFilters) setShowDesktopFilters(false);
        if (showMobileFilters) setShowMobileFilters(false);
      }
    };

    if (showDesktopFilters || showMobileFilters) {
      document.addEventListener('mousedown', handleGlobal);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleGlobal);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showDesktopFilters, showMobileFilters]);

  const handleApplyFilters = () => {
    // Interpret as inclusive range between min and max
    const min = priceMin !== '' ? Number(priceMin) : null;
    const max = priceMax !== '' ? Number(priceMax) : null;
    let appliedMin = min;
    let appliedMax = max;
    if (appliedMin !== null && appliedMax !== null && appliedMin > appliedMax) {
      const tmp = appliedMin; appliedMin = appliedMax; appliedMax = tmp;
      setPriceMin(String(appliedMin));
      setPriceMax(String(appliedMax));
    }
    if (typeof onPriceInputChange === 'function') {
      onPriceInputChange({ min: appliedMin, max: appliedMax });
    }
    setShowDesktopFilters(false);
    setShowMobileFilters(false);
  };

  const normalizedCategory = (selectedCategory || '').trim();
  const hasActiveFilters = (
    priceMin !== '' ||
    priceMax !== '' ||
    (normalizedCategory !== '' && normalizedCategory.toLowerCase() !== 'all')
  );


  
  return (
    <div className="bg-white border-b border-gray-400 px-2 sm:px-4 md:px-6 py-3 sm:py-4 shadow-sm sm:top-18 z-40">
      {/* Desktop Layout */}
      <div className="hidden md:flex gap-4 items-center justify-between">
        <div className="flex ml-4 gap-4 items-center flex-1">
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
          {/* Desktop Filter Dropdown Trigger (icon + label) */}
          <div className="relative">
            <button
              ref={desktopTriggerRef}
              onClick={() => setShowDesktopFilters((v) => !v)}
              className="flex cursor-pointer items-center gap-2 pr-4 py-2 rounded-3xl text-gray-700 border border-gray-400 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal className="ml-4 w-5 h-5" />
              <span className="text-[16px] font-medium flex items-center gap-1">
                Filter
                {hasActiveFilters && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setPriceMin('');
                      setPriceMax('');
                      setSelectedCategory('All');
                      if (typeof onPriceInputChange === 'function') {
                        onPriceInputChange({ min: null, max: null });
                      }
                    }}
                    className="ml-4 inline-flex items-center justify-center rounded-full hover:bg-gray-300"
                    aria-label="Clear filters"
                    title="Clear filters"
                  >
                    <X size={16} className="text-gray-600 m-1" />
                  </span>
                )}
              </span>
            </button>

            {showDesktopFilters && (
              <div ref={desktopDropdownRef} className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[320px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-[15px] font-semibold text-gray-800">Categories</span>
                  <button
                    onClick={() => setShowDesktopFilters(false)}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-3 max-h-[60vh] overflow-auto">
                  <div className="flex gap-2 flex-wrap mb-3">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowDesktopFilters(false);
                        }}
                        className={`px-3 py-2 rounded-3xl transition-colors cursor-pointer text-[14px] whitespace-nowrap ${
                          selectedCategory === category
                            ? "bg-[#3182ce] text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="mb-2">
                      <span className="text-[15px] font-semibold text-gray-800">Price Range</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:outline-none focus:ring-gray-500 focus:border-transparent text-sm
                        appearance-textfield [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:outline-none focus:ring-gray-500 focus:border-transparent text-sm
                        appearance-textfield [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 bg-[#3182ce] text-white rounded-3xl hover:bg-[#2c5282] text-sm cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Profile Dropdown Button */}
        <div
          className="relative "
          onMouseEnter={() => setShowProfileDropdown(true)}
          onMouseLeave={() => setShowProfileDropdown(false)}
        >
          <button
            className="text-gray-600 cursor-pointer px-3 py-2 rounded-3xl flex items-center gap-2 transition-colors whitespace-nowrap"
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
              className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/Products/Profile');
              }}
            >
              My Profile
            </button>
            <button
              className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
              onClick={() => {
                setShowProfileDropdown(false);
                navigate('/Products/Orders');
              }}
            >
              My Orders
            </button>
            <button
              className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
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

          {/* Filter Toggle Button Mobile (icon only) with anchored dropdown */}
          <div className="relative">
            <button
              ref={mobileTriggerRef}
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className=" text-gray-700 p-2 rounded-3xl hover:bg-gray-300 transition-colors"
            >
              <span className="flex items-center gap-1">
                <Filter size={21} />
                {hasActiveFilters && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setPriceMin('');
                      setPriceMax('');
                      setSelectedCategory('All');
                      if (typeof onPriceInputChange === 'function') {
                        onPriceInputChange({ min: null, max: null });
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-full hover:bg-gray-200 p-0.5"
                    aria-label="Clear filters"
                    title="Clear filters"
                  >
                    <X size={14} className="text-gray-600" />
                  </span>
                )}
              </span>
            </button>

            {showMobileFilters && (
              <div ref={mobileDropdownRef} className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[92vw] max-w-[360px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-[15px] font-semibold text-gray-800">Filters</span>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-3 max-h-[70vh] overflow-auto">
                  <div className="mb-2">
                    <span className="text-[14px] font-semibold text-gray-800">Categories</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowMobileFilters(false);
                        }}
                        className={`px-3 py-2 rounded-3xl transition-colors cursor-pointer text-[13px] whitespace-nowrap ${
                          selectedCategory === category
                            ? "bg-[#3182ce] text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="mb-2">
                      <span className="text-[14px] font-semibold text-gray-800">Price Range</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:outline-none focus:ring-gray-500 focus:border-transparent text-sm
                        appearance-textfield [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-3xl focus:ring-2 focus:outline-none focus:ring-gray-500 focus:border-transparent text-sm
                        appearance-textfield [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 bg-[#3182ce] text-white rounded-3xl hover:bg-[#2c5282] text-sm cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/Products/Profile');
                  }}
                >
                  My Profile
                </button>
                <button
                  className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/Products/Orders');
                  }}
                >
                  My Orders
                </button>
                <button
                  className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-[15px] font-medium leading-relaxed"
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

        {/* The old mobile full-width panel has been replaced by the anchored dropdown above */}
      </div>
    </div>
  );
};

export default SearchFilters;
