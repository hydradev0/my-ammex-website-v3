import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';

function SearchFilter({ 
  searchTerm, 
  setSearchTerm, 
  filterValue, 
  setFilterValue, 
  filterOptions,
  placeholder = "Search..."
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {/* Custom Filter Dropdown */}
      <div className="relative flex-grow sm:flex-grow-0" ref={dropdownRef}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Filter className="h-5 w-5 text-gray-600" />
        </div>
        <button
          type="button"
          className="cursor-pointer w-full text-lg sm:w-48 pl-10 pr-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent appearance-none bg-gray-50 text-left flex justify-between items-center"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          <span>{filterValue || filterOptions[0]}</span>
          <ChevronDown className={`h-6 w-6 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {dropdownOpen && (
          <ul className="absolute z-10 mt-1 w-full bg-gray-50 border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
            {filterOptions.map((option) => (
              <li
                key={option}
                className={`px-4 py-2 text-lg cursor-pointer hover:bg-blue-100 hover:text-black ${option === filterValue ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold' : ''}`}
                onClick={() => {
                  setFilterValue(option);
                  setDropdownOpen(false);
                }}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Search Box */}
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <input 
          type="text" 
          className="block w-2xl text-lg pl-10 pr-4 py-2 rounded border border-gray-300 focus:outline-none 
          focus:ring-2 focus:ring-blue-600 focus:border-transparent" 
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
    </div>
  );
}

export default SearchFilter;