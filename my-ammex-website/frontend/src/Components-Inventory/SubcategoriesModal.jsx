import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import ScrollLock from '../Components/ScrollLock';
import { createCategory, deleteCategory } from '../services/inventoryService';

const SubcategoriesModal = ({ 
  isOpen, 
  onClose, 
  selectedCategory, 
  subcategories, 
  onSubcategoriesChange 
}) => {
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle adding new subcategory
  const handleAddSubcategory = useCallback(async (e) => {
    e.preventDefault();
    if (!newSubcategoryName.trim()) {
      setError('Subcategory name cannot be empty');
      return;
    }

    // Check for duplicate names within this parent category
    const isDuplicate = subcategories.some(cat => 
      cat.name.toLowerCase() === newSubcategoryName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setError('A subcategory with this name already exists');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await createCategory({ 
        name: newSubcategoryName.trim(),
        parentId: selectedCategory.id
      });
      
      if (response.success) {
        // Add the new subcategory to the list
        onSubcategoriesChange([...subcategories, response.data]);
        setNewSubcategoryName('');
        setSuccess(`Subcategory "${response.data.name}" added successfully`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to add subcategory');
      }
    } catch (err) {
      console.error('Error adding subcategory:', err);
      setError(err.message || 'Failed to add subcategory');
    } finally {
      setLoading(false);
    }
  }, [newSubcategoryName, subcategories, selectedCategory, onSubcategoriesChange]);

  // Handle deleting subcategory
  const handleDeleteSubcategory = useCallback(async (subcategory) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await deleteCategory(subcategory.id);
      
      if (response.success) {
        // Remove the subcategory from the list
        const updatedSubcategories = subcategories.filter(cat => cat.id !== subcategory.id);
        onSubcategoriesChange(updatedSubcategories);
        setSuccess(`Subcategory "${subcategory.name}" deleted successfully`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to delete subcategory');
      }
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      setError(err.message || 'Failed to delete subcategory');
    } finally {
      setLoading(false);
    }
  }, [subcategories, onSubcategoriesChange]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setNewSubcategoryName('');
    setError(null);
    setSuccess(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <ScrollLock active={isOpen} />
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        style={{ transform: 'scale(0.95)', transformOrigin: 'center' }}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Subcategories for "{selectedCategory?.name}"
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage subcategories under this category
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Success/Error Messages */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {/* Add Subcategory Form */}
            <form onSubmit={handleAddSubcategory} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder="Add new subcategory..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={loading || !newSubcategoryName.trim()}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </div>
                  ) : (
                    'Add Subcategory'
                  )}
                </button>
              </div>
            </form>

            {/* Subcategories List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading subcategories...</span>
                </div>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No subcategories yet</h3>
                <p className="text-gray-500">Add your first subcategory using the form above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subcategories.map((subcategory) => (
                  <div key={subcategory.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">{subcategory.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Subcategory
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteSubcategory(subcategory)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        disabled={loading}
                        title="Delete subcategory"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

SubcategoriesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedCategory: PropTypes.object,
  subcategories: PropTypes.array.isRequired,
  onSubcategoriesChange: PropTypes.func.isRequired,
};

export default SubcategoriesModal;
