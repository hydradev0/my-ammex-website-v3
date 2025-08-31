import React, { useRef, useEffect, useState } from 'react';
import { Search, ChevronDown, Filter, Calendar } from 'lucide-react';

const InvoiceFilters = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  balanceFilter,
  setBalanceFilter,
  dateRange,
  setDateRange,
  filteredCount,
  totalCount
}) => {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [balanceDropdownOpen, setBalanceDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const balanceDropdownRef = useRef(null);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'overdue', label: 'Overdue' }
  ];

  // Balance filter options
  const balanceOptions = [
    { value: 'all', label: 'All Balances' },
    { value: 'with_balance', label: 'With Balance' },
    { value: 'paid', label: 'Fully Paid' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
      if (balanceDropdownRef.current && !balanceDropdownRef.current.contains(event.target)) {
        setBalanceDropdownOpen(false);
      }
    };

    if (statusDropdownOpen || balanceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusDropdownOpen, balanceDropdownOpen]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setBalanceFilter('all');
    setDateRange({ start: '', end: '' });
  };

  const hasActiveFilters = searchTerm || selectedStatus !== 'all' || balanceFilter !== 'all' || dateRange.start || dateRange.end;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-5 mb-6">
      {/* Search and Primary Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices, customers, order IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            type="button"
            className="px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center min-w-[160px]"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          >
            <span>{statusOptions.find(option => option.value === selectedStatus)?.label || 'All Status'}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusDropdownOpen && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
              {statusOptions.map((option) => (
                <li
                  key={option.value}
                  className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${
                    option.value === selectedStatus 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold' 
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedStatus(option.value);
                    setStatusDropdownOpen(false);
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Balance Filter */}
        <div className="relative" ref={balanceDropdownRef}>
          <button
            type="button"
            className="px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-50 text-left flex justify-between items-center min-w-[160px]"
            onClick={() => setBalanceDropdownOpen(!balanceDropdownOpen)}
          >
            <span>{balanceOptions.find(option => option.value === balanceFilter)?.label || 'All Balances'}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${balanceDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {balanceDropdownOpen && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
              {balanceOptions.map((option) => (
                <li
                  key={option.value}
                  className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${
                    option.value === balanceFilter 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold' 
                      : ''
                  }`}
                  onClick={() => {
                    setBalanceFilter(option.value);
                    setBalanceDropdownOpen(false);
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Date Range and Actions Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Date Range Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Results Count and Clear Filters */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredCount}</span> of <span className="font-medium">{totalCount}</span> invoices
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 font-medium">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Status: {statusOptions.find(opt => opt.value === selectedStatus)?.label}
              </span>
            )}
            {balanceFilter !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Balance: {balanceOptions.find(opt => opt.value === balanceFilter)?.label}
              </span>
            )}
            {(dateRange.start || dateRange.end) && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                Date: {dateRange.start || 'Start'} - {dateRange.end || 'End'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceFilters;

