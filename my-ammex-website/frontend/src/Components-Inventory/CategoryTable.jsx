import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { categoryDropdownActions } from '../Components/dropdownActions';
import { createCategory, updateCategory, deleteCategory } from '../services/inventoryService';

function CategoryTable({ categories, setCategories }) {
  // State for new category input
  const [newCategoryName, setNewCategoryName] = useState('');

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  
  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-remove success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-remove error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Define columns for the categories table
  const categoryColumns = [
    { 
      key: 'name', 
      header: 'Name',
      width: 'w-180',
      cellClassName: 'w-180',
      truncate: true
    }
  ];
  
  // Row click handler
  const handleRowClick = (category) => {
    console.log('Category selected:', category);
    // Add navigation or details view here if needed
  };

  // Handle adding new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await createCategory({ name: newCategoryName.trim() });
      
      if (response.success) {
        // Add the new category to the list
        setCategories([...categories, response.data]);
        setNewCategoryName('');
        setSuccess('Category added successfully');
      } else {
        setError(response.message || 'Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  // Handle category update
  const handleUpdateCategory = async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateCategory(id, updatedData);
      
      if (response.success) {
        // Update the category in the list
        const updatedCategories = categories.map(cat => 
          cat.id === id ? response.data : cat
        );
        setCategories(updatedCategories);
        setSuccess('Category updated successfully');
      } else {
        setError(response.message || 'Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await deleteCategory(id);
      
      if (response.success) {
        // Remove the category from the list
        const updatedCategories = categories.filter(cat => cat.id !== id);
        setCategories(updatedCategories);
        setSuccess('Category deleted successfully');
      } else {
        setError(response.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced dropdown actions with API integration
  const enhancedDropdownActions = useMemo(() => {
    return categoryDropdownActions.map(action => {
      if (action.id === 'edit') {
        return {
          ...action,
          onClick: (category) => {
            // For now, just log. You can implement an edit modal later
            console.log('Edit category:', category);
            // TODO: Implement edit modal
          }
        };
      }
      if (action.id === 'delete') {
        return {
          ...action,
          onClick: (category) => {
            if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
              handleDeleteCategory(category.id);
            }
          }
        };
      }
      return action;
    });
  }, []);
  
  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const searchLower = searchTerm.toLowerCase();
      return category.name.toLowerCase().includes(searchLower);
    });
  }, [categories, searchTerm]);

  return (
    <div className="w-full min-h-[calc(100vh-140px)]">
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
                  disabled={loading}
                />
                <button 
                  type="submit"
                  className={`bg-blue-900 cursor-pointer hover:bg-blue-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add'}
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
          dropdownActions={enhancedDropdownActions}
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
