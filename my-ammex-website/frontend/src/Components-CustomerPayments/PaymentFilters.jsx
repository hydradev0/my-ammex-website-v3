import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Calendar, RotateCcw, ChevronDown } from 'lucide-react';

const PaymentFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedPaymentMethod, 
  setSelectedPaymentMethod, 
  dateRange, 
  setDateRange, 
  paymentMethods,
  filteredCount,
  totalCount
}) => {
  const [paymentMethodDropdownOpen, setPaymentMethodDropdownOpen] = useState(false);
  const paymentMethodDropdownRef = useRef(null);

  // Close payment method dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paymentMethodDropdownRef.current && !paymentMethodDropdownRef.current.contains(event.target)) {
        setPaymentMethodDropdownOpen(false);
      }
    };

    if (paymentMethodDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [paymentMethodDropdownOpen]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPaymentMethod('all');
    setDateRange({ start: '', end: '' });
  };

  const hasActiveFilters = searchTerm || selectedPaymentMethod !== 'all' || dateRange.start || dateRange.end;

  // Create payment method options
  const paymentMethodOptions = [
    { value: 'all', label: 'All Payment Methods' },
    ...paymentMethods.map(method => ({
      value: method.name.toLowerCase().replace(/\s+/g, '_'),
      label: method.name
    }))
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 -mx-38 relative"
    style={{ transform: 'translateX(1.5%)', zIndex: 200 }}>
      <div className="grid grid-cols-12 gap-4">
        {/* Search - takes up more space */}
        <div className="relative col-span-12 md:col-span-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer, invoice, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Payment Method Filter - positioned to the right */}
        <div className="relative col-span-12 md:col-span-2 md:col-start-5" ref={paymentMethodDropdownRef} style={{ zIndex: 201 }}>
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <button
            type="button"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center text-[15px]"
            onClick={() => setPaymentMethodDropdownOpen((open) => !open)}
          >
            <span>{paymentMethodOptions.find(option => option.value === selectedPaymentMethod)?.label || 'All Payment Methods'}</span>
            <ChevronDown className={`w-6 h-6 transition-transform ${paymentMethodDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {paymentMethodDropdownOpen && (
            <ul className="absolute z-[300] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                style={{ position: 'absolute', top: '100%', left: '0' }}>
              {paymentMethodOptions.map((option) => (
                <li
                  key={option.value}
                  className={`px-5 py-3 text-[15px] font-medium cursor-pointer hover:bg-blue-100 hover:text-black leading-relaxed ${option.value === selectedPaymentMethod ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold' : 'text-gray-800'}`}
                  onClick={() => {
                    setSelectedPaymentMethod(option.value);
                    setPaymentMethodDropdownOpen(false);
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative col-span-6 md:col-span-3">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
            placeholder="Start date"
          />
        </div>

        <div className="relative col-span-6 md:col-span-3">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
            placeholder="End date"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[15px] text-gray-700 ">
            Showing {filteredCount} of {totalCount} payments
          </p>
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-800 text-[15px] flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentFilters;