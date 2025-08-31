import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Calendar, RotateCcw, ChevronDown, X } from 'lucide-react';

/**
 * Reusable SearchFilters Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.searchTerm - Current search term
 * @param {function} props.setSearchTerm - Function to update search term
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {Array} props.dropdownFilters - Array of dropdown filter configurations
 * @param {Object} props.dateRange - Date range object with start and end properties
 * @param {function} props.setDateRange - Function to update date range
 * @param {boolean} props.showDateRange - Whether to show date range filters
 * @param {number} props.filteredCount - Number of filtered results
 * @param {number} props.totalCount - Total number of items
 * @param {string} props.itemLabel - Label for items (e.g., 'invoices', 'orders', 'payments')
 */
const ModernSearchFilter = ({
  searchTerm = '',
  setSearchTerm,
  searchPlaceholder = 'Search...',
  dropdownFilters = [],
  dateRange = { start: '', end: '' },
  setDateRange,
  showDateRange = false,
  filteredCount = 0,
  totalCount = 0,
  itemLabel = 'items'
}) => {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const dropdownRefs = useRef({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs.current).forEach(key => {
        if (dropdownRefs.current[key] && !dropdownRefs.current[key].contains(event.target)) {
          setOpenDropdowns(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    const hasOpenDropdowns = Object.values(openDropdowns).some(isOpen => isOpen);
    if (hasOpenDropdowns) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdowns]);

  const toggleDropdown = (filterId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [filterId]: !prev[filterId]
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    dropdownFilters.forEach(filter => {
      filter.setValue('all');
    });
    if (showDateRange && setDateRange) {
      setDateRange({ start: '', end: '' });
    }
  };

  const clearSpecificFilter = (filterType, filterId = null) => {
    switch(filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'dropdown':
        const filter = dropdownFilters.find(f => f.id === filterId);
        if (filter) filter.setValue('all');
        break;
      case 'dateRange':
        if (setDateRange) setDateRange({ start: '', end: '' });
        break;
      default:
        break;
    }
  };

  const hasActiveFilters = () => {
    const hasSearch = searchTerm;
    const hasDropdownFilters = dropdownFilters.some(filter => filter.value !== 'all');
    const hasDateFilter = showDateRange && (dateRange.start || dateRange.end);
    return hasSearch || hasDropdownFilters || hasDateFilter;
  };

  const getActiveFilterColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'bg-green-100 text-green-800 hover:bg-green-200',
      'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="mb-4">
      {/* Main Filters Row - Left and Right Layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
        {/* Left side - Main Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 bg-white"
            />
          </div>

          {/* Dropdown Filters */}
          {dropdownFilters.map((filter) => (
            <div 
              key={filter.id} 
              className="relative min-w-[180px]" 
              ref={el => dropdownRefs.current[filter.id] = el}
            >
              <button
                type="button"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 text-left flex justify-between items-center transition-colors duration-200"
                onClick={() => toggleDropdown(filter.id)}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 text-sm">
                    {filter.options.find(option => option.value === filter.value)?.label || filter.options[0]?.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${openDropdowns[filter.id] ? 'rotate-180' : ''}`} />
              </button>
              
              {openDropdowns[filter.id] && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {filter.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors duration-150 text-sm ${
                          option.value === filter.value 
                            ? 'bg-blue-50 text-blue-700 font-medium' 
                            : 'text-gray-700'
                        }`}
                        onClick={() => {
                          filter.setValue(option.value);
                          setOpenDropdowns(prev => ({ ...prev, [filter.id]: false }));
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Date Range Inputs */}
          {showDateRange && setDateRange && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 bg-white text-sm"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200 bg-white text-sm"
              />
            </div>
          )}
        </div>

        {/* Right side - Results Count */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Showing <span className="font-medium">{filteredCount}</span> of <span className="font-medium">{totalCount}</span> {itemLabel}
          </div>
        </div>
      </div>

      {/* Active Filters Row */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              
              {searchTerm && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  <Search className="w-3 h-3" />
                  <span>"{searchTerm}"</span>
                  <button
                    onClick={() => clearSpecificFilter('search')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-150"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
              
              {dropdownFilters.map((filter, index) => (
                filter.value !== 'all' && (
                  <div 
                    key={filter.id} 
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getActiveFilterColor(index + 1)}`}
                  >
                    <Filter className="w-3 h-3" />
                    <span>{filter.options.find(opt => opt.value === filter.value)?.label}</span>
                    <button
                      onClick={() => clearSpecificFilter('dropdown', filter.id)}
                      className={`ml-1 rounded-full p-0.5 transition-colors duration-150 ${getActiveFilterColor(index + 1).split(' ')[2]}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )
              ))}
              
              {showDateRange && (dateRange.start || dateRange.end) && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>{dateRange.start || 'Start'} - {dateRange.end || 'End'}</span>
                  <button
                    onClick={() => clearSpecificFilter('dateRange')}
                    className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors duration-150"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernSearchFilter;
