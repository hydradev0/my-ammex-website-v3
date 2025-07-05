import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import Table from './Table';
import { MoreHorizontal } from 'lucide-react';

function CategoryTable({ categories, setCategories }) {
  // State for new category input
  const [newCategoryName, setNewCategoryName] = useState('');

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  
  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Auto-remove success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Define columns for the categories table
  const categoryColumns = [
    { 
      key: 'name', 
      header: 'Name'
    }
  ];
  
  // Custom row action for categories table
  const customRowAction = (category) => (
    <button 
      className="cursor-pointer text-blue-900 hover:text-blue-600"
      onClick={(e) => {
        e.stopPropagation();
        console.log('Category actions:', category);
      }}
    >
      <MoreHorizontal className="h-6 w-6" />
    </button>
  );
  
  // Row click handler
  const handleRowClick = (category) => {
    console.log('Category selected:', category);
    // Add navigation or details view here if needed
  };

  // Handle adding new category
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    
    const newCategory = {
      id: categories.length + 1,
      name: newCategoryName.trim()
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setSuccess('Category added successfully');
    setError(null);
  };
  
  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const searchLower = searchTerm.toLowerCase();
      return category.name.toLowerCase().includes(searchLower);
    });
  }, [categories, searchTerm]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-5 py-8">   
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Category</h1>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="w-full">
            <div className="flex items-center gap-2">
              <SearchFilter 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterValue={filterValue}
                setFilterValue={setFilterValue}
                customerCount={filteredCategories.length}
                filterOptions={['Filter by...']}
                placeholder="Search categories..."
              />
            </div>
          </div>
          
          {/* New Category Input Field and Success Message */}
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <form onSubmit={handleAddCategory} className="w-full sm:w-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter new category..."
                  className="flex-1 w-xs px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <button 
                  type="submit"
                  className="bg-blue-900 cursor-pointer hover:bg-blue-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
            {success && (
              <div className="p-2 bg-green-100 border border-green-400 text-green-700 rounded animate-fade-in">
                {success}
              </div>
            )}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Table for Categories */}
        <div className="w-full">
          <Table 
            data={filteredCategories}
            onRowClick={handleRowClick}
            customRowAction={customRowAction}
            pagination={true}
            itemsPerPage={10}
            emptyMessage="No categories found"
            className="mb-8"
            alternateRowColors={true}
          />
        </div>
      </div>
    </div>
  );
}

CategoryTable.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  setCategories: PropTypes.func.isRequired
};

export default CategoryTable;
