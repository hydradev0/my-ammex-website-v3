import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Show fewer page numbers on mobile
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex justify-center items-center gap-1 sm:gap-2 mb-4">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 sm:px-3 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded-3xl disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors text-sm"
      >
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden"><ArrowLeft size={16} /></span>
      </button>
      
      {visiblePages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' ? onPageChange(page) : null}
          disabled={typeof page !== 'number'}
          className={`px-5 sm:px-3 py-3 sm:py-2 rounded-3xl cursor-pointer transition-colors text-sm min-w-[2rem] sm:min-w-[2.5rem] ${
            currentPage === page
              ? 'bg-[#3182ce] text-white'
              : typeof page === 'number'
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-transparent text-gray-500 cursor-default'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-3 sm:px-3 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded-3xl disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors text-sm"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden"><ArrowRight size={16} /></span>
      </button>
    </div>
  );
};

export default Pagination; 