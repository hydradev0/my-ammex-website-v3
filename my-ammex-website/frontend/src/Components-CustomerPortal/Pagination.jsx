import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 sm:px-4 py-2.5 bg-white text-slate-700 rounded-lg border border-slate-200 
          disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed disabled:border-slate-100
          hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-sm font-medium shadow-sm cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>
      
      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={typeof page !== 'number'}
            className={`px-3 sm:px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium min-w-[2.5rem] sm:min-w-[2.75rem] ${
              currentPage === page
                ? 'bg-slate-800 text-white shadow-lg'
                : typeof page === 'number'
                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                : 'bg-transparent text-slate-400 cursor-default'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      
      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 sm:px-4 py-2.5 bg-white text-slate-700 rounded-lg border border-slate-200 
          disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed disabled:border-slate-100
          hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-sm font-medium shadow-sm cursor-pointer"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
