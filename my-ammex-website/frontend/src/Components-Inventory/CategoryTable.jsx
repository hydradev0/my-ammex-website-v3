import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { categoryDropdownActions } from '../Components/dropdownActions';

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
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-5 py-8">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Category</h1>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col gap-4 mb-6">
          <SearchFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            customerCount={filteredCategories.length}
            filterOptions={['Filter by...']}
            placeholder="Search categories..."
          />
          
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
        
        {/* Generic Table for Categories */}
        <GenericTable 
          data={filteredCategories}
          columns={categoryColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No categories found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={categoryDropdownActions}
          width="max-w-7xl"
        />
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
