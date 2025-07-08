import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ChevronDown } from 'lucide-react';

const PaginationTable = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [7, 10, 20, 30, 40, 50],
  className = '',
  showItemsPerPage = true,
  showPageNumbers = true,
  maxPageNumbers = 5
}) => {
  // Don't return null if we have items per page selector to show
  if (totalPages <= 1 && !showItemsPerPage) return null;

  const [gotoPage, setGotoPage] = useState('');
  const [gotoError, setGotoError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setShowCustomInput(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const halfMax = Math.floor(maxPageNumbers / 2);
    let startPage = Math.max(1, currentPage - halfMax);
    let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);
    if (endPage - startPage < maxPageNumbers - 1) {
      startPage = Math.max(1, endPage - maxPageNumbers + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };
  const pageNumbers = getPageNumbers();

  // Handle go to page
  const handleGotoPage = (e) => {
    e.preventDefault();
    const pageNum = Number(gotoPage);
    if (!pageNum || pageNum < 1 || pageNum > totalPages) {
      setGotoError(`Page must be between 1 and ${totalPages}`);
      return;
    }
    setGotoError('');
    onPageChange(pageNum);
    setGotoPage('');
  };

  // Handle dropdown select
  const handleDropdownSelect = (option) => {
    if (option === 'Custom') {
      setShowCustomInput(true);
      setCustomValue('');
    } else {
      onItemsPerPageChange(option);
      setDropdownOpen(false);
      setShowCustomInput(false);
    }
  };

  // Handle custom input
  const handleCustomInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomValue(value);
  };

  // Handle custom input submit
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const numValue = Number(customValue);
    if (numValue > 0 && numValue <= 1000) { // Reasonable limit
      onItemsPerPageChange(numValue);
      setDropdownOpen(false);
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  // Get display text for dropdown
  const getDisplayText = () => {
    if (itemsPerPageOptions.includes(itemsPerPage)) {
      return `Rows: ${itemsPerPage}`;
    }
    return `Rows: ${itemsPerPage}`;
  };

  return (
    <div className={`flex items-center justify-between px-2 py-3 ${className}`}>
      
      {showItemsPerPage && (
        <div className="flex items-center space-x-4">
          {/* Custom Dropdown for Rows per page */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="cursor-pointer w-24 text-sm px-1.5 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 
              focus:border-transparent appearance-none bg-white text-left flex justify-between items-center"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <span>{getDisplayText()}</span>
              <ChevronDown className={`h-5 w-5 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <ul className="absolute z-10 mt-1 w-full bg-gray-50 border border-gray-300 rounded shadow-lg max-h-70 max-w-20">
                {itemsPerPageOptions.map((option) => (
                  <li
                    key={option}
                    className={`px-4 py-2 text-md cursor-pointer hover:bg-blue-100 hover:text-black 
                      ${option === itemsPerPage ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold' : ''}`}
                    onClick={() => handleDropdownSelect(option)}
                  >
                    {option}
                  </li>
                ))}
                <li
                  className="pl-3 py-2 text-md cursor-pointer hover:bg-blue-100 hover:text-black border-t border-gray-200"
                  onClick={() => handleDropdownSelect('Custom')}
                >
                  Custom
                </li>
                {showCustomInput && (
                  <li className="px-2 py-1 border-t border-gray-200">
                    <form onSubmit={handleCustomSubmit} className="flex items-center space-x-1">  
                      <input
                        type="number"
                        value={customValue}
                        onChange={handleCustomInput}
                        className="w-16 h-8 text-md border border-gray-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-600
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="1"
                        max="1000"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="flex items-center p-1 justify-center rounded border bg-blue-600 text-white hover:bg-blue-700"
                        title="Apply"
                      >
                        <Search className="h-6 w-6" />
                      </button>
                    </form>
                  </li>
                )}
              </ul>
            )}
          </div>
          {/* Go to page */}
          <form className="flex items-center space-x-1" onSubmit={handleGotoPage}>
            <label htmlFor="goto-page" className="text-sm text-gray-700">Go to page</label>
            <input
              id="goto-page"
              type="number"
              value={gotoPage}
              onChange={e => setGotoPage(e.target.value.replace(/[^0-9]/g, ''))}
              className="h-8 w-12 rounded border border-gray-300 bg-white px-2 py-2 text-md focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900 text-center
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </form>
          {gotoError && <span className="text-xs text-red-600 ml-2">{gotoError}</span>}

          {/*Show just the items per page selector when there's only one page*/}
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex w-[150px] items-center justify-center text-md font-bold text-gray-700 whitespace-nowrap">
                All records - ({totalItems})
              </div>
            </div>
        </div>
      )}

      {/* Page info and controls - only show if there are multiple pages */}
      {totalPages > 1 ? (
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          {/* Pagination controls */}
          <div className="flex items-center space-x-2">
            {/* First page */}
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-8 w-8 p-0"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            {/* Previous page */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-8 w-8 p-0"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {/* Page numbers */}
            {showPageNumbers && (
              <div className="flex items-center space-x-1">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 h-8 w-8 p-0 ${
                      currentPage === page
                        ? 'bg-blue-900 text-white hover:bg-blue-800'
                        : 'bg-white hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
            {/* Next page */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-8 w-8 p-0"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {/* Last page */}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-8 w-8 p-0"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PaginationTable;