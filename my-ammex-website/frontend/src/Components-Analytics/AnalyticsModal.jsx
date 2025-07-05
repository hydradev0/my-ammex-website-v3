import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Filter } from 'lucide-react';
import PaginationModal from '../Components/PaginationModal';

const AnalyticsModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = 'w-[800px]',
  maxHeight = 'max-h-[90vh]',
  // Pagination props
  items = [],
  itemsPerPage = 10,
  renderItem = null,
  showPagination = false,
  // Sorting props
  showSortFilter = false,
  onSortChange = null
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('lowestToHighest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Reset to first page when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen]);

  // Close dropdown when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsSortDropdownOpen(false);
    }
  }, [isOpen]);

  // Handle click outside dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSortDropdownOpen && !event.target.closest('.sort-dropdown')) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortDropdownOpen]);

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setIsSortDropdownOpen(false);
    if (onSortChange) {
      onSortChange(newSortBy);
    }
  };

  // Sort items by units sold based on selected option
  const sortedItems = useMemo(() => {
    if (!showSortFilter) return items;
    
    const sorted = [...items];
    if (sortBy === 'highestToLowest') {
      return sorted.sort((a, b) => b.unitsSold - a.unitsSold); // Highest to lowest units sold
    } else {
      return sorted.sort((a, b) => a.unitsSold - b.unitsSold); // Lowest to highest units sold
    }
  }, [items, sortBy, showSortFilter]);

  // Calculate pagination
  const paginationData = useMemo(() => {
    if (!showPagination || !sortedItems.length) {
      return null;
    }

    const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = sortedItems.slice(startIndex, endIndex);

    return {
      totalPages,
      currentPage,
      startIndex,
      endIndex,
      currentItems,
      totalItems: sortedItems.length
    };
  }, [sortedItems, currentPage, itemsPerPage, showPagination]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const PaginationControls = () => {
    if (!paginationData) return null;

    const { totalPages, currentPage, totalItems } = paginationData;

    return (
      <PaginationModal
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    );
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 ${width} flex flex-col ${maxHeight}`} style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 pl-4 py-4">{title}</h2>
            
            {/* Sort Filter Dropdown */}
            {showSortFilter && (
              <div className="relative sort-dropdown">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-md font-medium text-gray-700 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Sort by Units Sold:
                  <ChevronDown className={`h-6 w-6 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                  
                {isSortDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <button
                      onClick={() => handleSortChange('lowestToHighest')}
                      className={`w-full text-left px-4 py-2 text-md hover:bg-gray-50 ${
                        sortBy === 'lowestToHighest' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Lowest to Highest
                    </button>
                    <button
                      onClick={() => handleSortChange('highestToLowest')}
                      className={`w-full text-left px-4 py-2 text-md hover:bg-gray-50 ${
                        sortBy === 'highestToLowest' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Highest to Lowest
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button 
            className="hover:text-white hover:bg-red-800 text-gray-500 mb-4"
            onClick={onClose} 
          >
            <X className="h-8 w-8" />
          </button>
        </div> 
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-grow">
          <div className="p-4">
            {showPagination && renderItem && paginationData ? (
              <div className="space-y-4">
                {paginationData.currentItems.map((item, pageIndex) => {
                  const globalIndex = paginationData.startIndex + pageIndex;
                  return renderItem(item, globalIndex, {
                    allItems: items,
                    currentPage: paginationData.currentPage,
                    itemsPerPage: itemsPerPage,
                    startIndex: paginationData.startIndex,
                    endIndex: paginationData.endIndex
                  });
                })}
              </div>
            ) : (
              children
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        <PaginationControls />
      </div>
    </div>
  );

  // Use portal to render modal outside the scaled container
  return createPortal(modalContent, document.body);
};

export default AnalyticsModal; 