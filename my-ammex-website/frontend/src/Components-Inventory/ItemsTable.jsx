import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { Plus, } from 'lucide-react';
import ViewDetailsModal from '../Components/ViewDetailsModal';
import EditDetailsModal from '../Components/EditDetailsModal';
import SuccessModal from '../Components/SuccessModal';
import StockAdjustmentModal from './StockAdjustmentModal';
import PriceAdjustmentModal from './PriceAdjustmentModal';
import { itemViewConfig, editItemConfig } from '../Components/viewConfigs';
import { itemsDropdownActions } from '../Components/dropdownActions';
import { getItems, createItem, updateItem, deleteItem, updateItemStock, updateItemPrice } from '../services/inventoryService';
import { useAuth } from '../contexts/AuthContext';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';

// // Constants for category styling
// const CATEGORY_STYLES = {
//   'Hammer': 'bg-blue-100 text-blue-800',
//   'Machines': 'bg-green-100 text-green-800',
//   'Drivers': 'bg-purple-100 text-purple-800',
//   'Drill': 'bg-orange-100 text-orange-800',
//   'Tools': 'bg-red-100 text-red-800',
// };

function mapStockDataToItemTableFormat(stockItem) {
  // Map StockMovement item to ItemsTable item structure
  return {
    itemCode: stockItem.id ? (stockItem.category?.substring(0,2).toUpperCase() || 'IT') + String(stockItem.id).padStart(3, '0') : '',
    itemName: stockItem.name || '',
    quantity: stockItem.currentStock || 0,
    unit: 'pcs', // Default, as StockMovement doesn't specify unit
    price: stockItem.price || 0,
    floorPrice: stockItem.price ? (stockItem.price * 0.9) : 0, // Example: 10% below price
    ceilingPrice: stockItem.price ? (stockItem.price * 1.1) : 0, // Example: 10% above price
    category: stockItem.category || '',
    vendor: '', // Not available in StockMovement
    description: '', // Not available in StockMovement
    minLevel: 0, // Not available in StockMovement
    maxLevel: 0  // Not available in StockMovement
  };
}

function ItemsTable({ categories, setCategories, units, suppliers = [], subcategories = [] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshTriggers } = useDataRefresh();
  const role = user?.role;
  const isReadOnly = role === 'Sales Marketing';
  // State for items data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingItem, setCreatingItem] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemName: '',
    itemId: null
  });
  
  // State for success modals
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // State for stock adjustment modal
  const [stockAdjustmentModal, setStockAdjustmentModal] = useState({
    isOpen: false,
    item: null
  });
  const [adjustingStock, setAdjustingStock] = useState(false);

  // State for price adjustment modal
  const [priceAdjustmentModal, setPriceAdjustmentModal] = useState({
    isOpen: false,
    item: null
  });
  const [adjustingPrice, setAdjustingPrice] = useState(false);

  // Windowed fetching (fetch 10 UI pages at a time)
  const PAGE_WINDOW_MULTIPLIER = 10;
  const [fetchedBackendPage, setFetchedBackendPage] = useState(1);
  const [fetchedLimit, setFetchedLimit] = useState(itemsPerPage * PAGE_WINDOW_MULTIPLIER);

  // Fetch items on mount, when navigating to a new backend window, or when rows-per-page changes
  useEffect(() => {
    const backendPage = Math.floor((currentPage - 1) / PAGE_WINDOW_MULTIPLIER) + 1;
    const limit = itemsPerPage * PAGE_WINDOW_MULTIPLIER;
    if (backendPage !== fetchedBackendPage || limit !== fetchedLimit) {
      fetchItems({ page: backendPage, limit, backendPageOverride: backendPage });
    } else if (items.length === 0) {
      // initial load
      fetchItems({ page: backendPage, limit, backendPageOverride: backendPage });
    }
  }, [currentPage, itemsPerPage]);

  // Listen for data refresh events
  useEffect(() => {
    const itemsRefreshTrigger = refreshTriggers.items;
    if (itemsRefreshTrigger) {
      // Refresh the current data window when items are restored
      const backendPage = Math.floor((currentPage - 1) / PAGE_WINDOW_MULTIPLIER) + 1;
      const limit = itemsPerPage * PAGE_WINDOW_MULTIPLIER;
      fetchItems({ page: backendPage, limit, backendPageOverride: backendPage });
    }
  }, [refreshTriggers.items, currentPage, itemsPerPage]);

  // Fetch items from API (fetch window of 3 UI pages)
  const fetchItems = async ({ page = 1, limit = itemsPerPage * PAGE_WINDOW_MULTIPLIER, backendPageOverride } = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getItems({ page, limit });
      
      if (response.success) {
        setItems(response.data || []);
        const p = response.pagination || {};
        // Maintain the current UI page; update fetched backend page window & limit
        setFetchedBackendPage(backendPageOverride || page);
        setFetchedLimit(limit);
        const total = p.totalItems || (response.data ? response.data.length : 0);
        setTotalItems(total);
        setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
      } else {
        setError(response.message || 'Failed to fetch items');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  

  // Define columns for the items table
  const itemColumns = [
    { 
      key: 'itemCode', 
      header: 'Item Code',
      width: 'w-64',
      cellClassName: 'w-64',
      truncate: true
    },
    { 
      key: 'itemName', 
      header: 'Item Name',
      render: (value) => value || '',
      width: 'w-80',
      cellClassName: 'w-80',
      truncate: true
    },
    { 
      key: 'modelNo', 
      header: 'Model No.',
      width: 'w-80',
      cellClassName: 'w-80',
      truncate: true
    },
    { 
      key: 'quantity', 
      header: 'Quantity',
      render: (value) => value.toLocaleString(),
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'unit', 
      header: 'Unit',
      render: (value, item) => item.unit?.name || value,
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'price', 
      header: 'Price',
      render: (value) => `₱${Number(value).toFixed(2)}`,
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'category', 
      header: 'Category',
      render: (value, item) => (
        <span className={`px-2 py-1 rounded-full text-sm font-thin bg-gray-200 text-gray-900`}>
          {item.category?.name || value}
        </span>
      ),
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    }
  ];

  // Choose data source based on toggle and filter by search and filter value
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (item.itemName || '').toLowerCase().includes(searchLower) ||
        (item.itemCode || '').toLowerCase().includes(searchLower) ||
        (item.category?.name || '').toLowerCase().includes(searchLower);
      
      const matchesFilter = filterValue === 'Filter by...' || (item.category?.name || item.category) === filterValue;
      
      return matchesSearch && matchesFilter;
    });
  }, [items, searchTerm, filterValue]);

  // Slice current window into UI page-sized chunk
  const displayItems = useMemo(() => {
    const pageIndexWithinWindow = (currentPage - 1) % PAGE_WINDOW_MULTIPLIER;
    const start = pageIndexWithinWindow * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Server-side pagination handlers
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    const value = Number(newItemsPerPage) || 10;
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Handle new item submission
  const handleNewItem = async (newItem) => {
    try {
      setCreatingItem(true);
      setError(null);
      setFieldErrors({});
      
      // Transform form data to match API structure
      const itemData = {
        modelNo: newItem.modelNo,
        itemName: newItem.itemName,
        vendor: newItem.vendor,
        price: Number(newItem.price),
        floorPrice: Number(newItem.floorPrice),
        ceilingPrice: Number(newItem.ceilingPrice),
        unitId: units.find(u => u.name === newItem.unit)?.id,
        quantity: Number(newItem.quantity),
        categoryId: categories.find(c => c.name === newItem.category)?.id,
        subcategoryId: newItem.subcategoryId, // Include subcategoryId from the modal
        description: newItem.description,
        minLevel: Number(newItem.minLevel),
        maxLevel: Number(newItem.maxLevel)
      };

      const response = await createItem(itemData);
      
      if (response.success) {
        setItems([response.data, ...items]);
        setIsModalOpen(false);
        setSuccessModal({
          isOpen: true,
          title: 'Item Created Successfully!',
          message: 'The new item has been added to your inventory. You can now view and manage it.'
        });
      } else {
        setError(response.message || 'Failed to create item');
      }
    } catch (err) {
      console.error('Error creating item:', err);
      
      // Parse error message to identify field-specific errors
      const errorMessage = err.message || 'Failed to create item';
      
      if (errorMessage.includes('item_code') && errorMessage.includes('unique')) {
        // This is an item code uniqueness error
        const fieldError = 'Code already exists. Please check your model number.';
        setFieldErrors({ modelNo: fieldError });
        setError(null); // Clear general error since we have field-specific error
      } else if (errorMessage.includes('modelNo')) {
        // Other item code related errors
        setFieldErrors({ modelNo: errorMessage });
        setError(null);
      } else {
        // General error
        setError(errorMessage);
        setFieldErrors({});
      }
    } finally {
      setCreatingItem(false);
    }
  };

  // Modern confirmation dialog for delete operations
  const showDeleteConfirmation = (itemName, itemId) => {
    setDeleteModal({
      isOpen: true,
      itemName,
      itemId
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteModal.itemId) return;

    try {
      setDeletingItem(true);
      setError(null);
      
      const response = await deleteItem(deleteModal.itemId);
      
      if (response.success) {
        setItems(prevItems => prevItems.filter(i => i.id !== deleteModal.itemId));
        
        setDeleteModal({ isOpen: false, itemName: '', itemId: null });
        setSuccessModal({
          isOpen: true,
          title: 'Item Archived Successfully!',
          message: 'The item has been moved to the archive and can be restored later.'
        });
      } else {
        setError(response.message || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message || 'An unexpected error occurred while deleting the item');
    } finally {
      setDeletingItem(false);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, itemName: '', itemId: null });
  };

  // Handle item update
  const handleUpdateItem = async (updatedItem) => {
    try {
      setUpdatingItem(true);
      setError(null);
      setFieldErrors({});
      
      // Transform form data to match API structure
      const itemData = {
        modelNo: updatedItem.modelNo,
        itemName: updatedItem.itemName,
        vendor: updatedItem.vendor,
        price: Number(updatedItem.price),
        floorPrice: Number(updatedItem.floorPrice),
        ceilingPrice: Number(updatedItem.ceilingPrice),
        unitId: units.find(u => u.name === updatedItem.unit)?.id,
        quantity: Number(updatedItem.quantity),
        categoryId: categories.find(c => c.name === updatedItem.category)?.id,
        description: updatedItem.description,
        minLevel: Number(updatedItem.minLevel),
        maxLevel: Number(updatedItem.maxLevel)
      };

      const response = await updateItem(selectedItem.id, itemData);
      
      if (response.success) {
        setItems(items.map(item => 
          item.id === selectedItem.id ? response.data : item
        ));
        setIsModalOpen(false);
        setSuccessModal({
          isOpen: true,
          title: 'Item Updated Successfully!',
          message: 'The item has been updated successfully. You can now view the changes in your inventory.'
        });
      } else {
        setError(response.message || 'Failed to update item');
      }
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message || 'Failed to update item');
      // // Parse error message to identify field-specific errors
      // const errorMessage = err.message || 'Failed to update item';
      // console.log('Backend error received (update):', errorMessage);
      
      // if (errorMessage.includes('item_code') && errorMessage.includes('unique')) {
      //   // This is an item code uniqueness error
      //   const fieldError = 'Code already exists. Please use a different item code.';
      //   console.log('Setting field error for itemCode (update):', fieldError);
      //   setFieldErrors({ itemCode: fieldError });
      //   setError(null); // Clear general error since we have field-specific error
      // } else if (errorMessage.includes('itemCode')) {
      //   // Other item code related errors
      //   console.log('Setting field error for itemCode (update):', errorMessage);
      //   setFieldErrors({ itemCode: errorMessage });
      //   setError(null);
      // } else {
      //   // General error
      //   console.log('Setting general error (update):', errorMessage);
      //   setError(errorMessage);
      //   setFieldErrors({});
      // }
    } finally {
      setUpdatingItem(false);
    }
  };

  // Handle view item details
  const handleViewItem = (item) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  // Handle item updated from EditDetailsModal
  const handleItemUpdated = (updatedItem) => {
    try {
      setUpdatingItem(true);
      setError(null);
      
      setItems(items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
      setIsEditModalOpen(false);
      setSelectedItem(null);
      setSuccessModal({
        isOpen: true,
        title: 'Item Updated Successfully!',
        message: 'The item has been updated successfully. You can now view the changes in your inventory.'
      });
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message || 'Failed to update item');
    } finally {
      setUpdatingItem(false);
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async (adjustmentData) => {
    try {
      setAdjustingStock(true);
      setError(null);
      
      const { type, quantity, reason } = adjustmentData;
      const itemId = stockAdjustmentModal.item.id;
      
      // Calculate new quantity
      const currentQuantity = stockAdjustmentModal.item.quantity;
      const newQuantity = type === 'add' 
        ? currentQuantity + quantity
        : Math.max(0, currentQuantity - quantity);
      
      // Update stock via API
      const response = await updateItemStock(itemId, newQuantity);
      
      if (response.success) {
        // Update local state
        setItems(items.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        ));
        
        // Close modal and show success message
        setStockAdjustmentModal({ isOpen: false, item: null });
        setSuccessModal({
          isOpen: true,
          title: 'Stock Updated Successfully!',
          message: `Stock has been ${type === 'add' ? 'added to' : 'removed from'} "${stockAdjustmentModal.item.itemName}". New quantity: ${newQuantity.toLocaleString()}`
        });
      } else {
        setError(response.message || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Error adjusting stock:', err);
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setAdjustingStock(false);
    }
  };

  // Handle price adjustment
  const handlePriceAdjustment = async (adjustmentData) => {
    try {
      setAdjustingPrice(true);
      setError(null);
      
      const { newPrice, reason } = adjustmentData;
      const itemId = priceAdjustmentModal.item.id;
      
      // Update price via API
      const response = await updateItemPrice(itemId, newPrice, reason);
      
      if (response.success) {
        // Update local state
        setItems(items.map(item => 
          item.id === itemId 
            ? { ...item, price: newPrice }
            : item
        ));
        
        // Close modal and show success message
        setPriceAdjustmentModal({ isOpen: false, item: null });
        setSuccessModal({
          isOpen: true,
          title: 'Price Updated Successfully!',
          message: `Price has been updated for "${priceAdjustmentModal.item.itemName}". New price: ₱${newPrice.toFixed(2)}`
        });
      } else {
        setError(response.message || 'Failed to update price');
      }
    } catch (err) {
      console.error('Error adjusting price:', err);
      setError(err.message || 'Failed to adjust price');
    } finally {
      setAdjustingPrice(false);
    }
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedItem(null);
  };

  // Row click handler
  const handleRowClick = (item) => {
    console.log('Item selected:', item);
    // Add navigation or details view here if needed
  };

  // Custom dropdown actions for items with view functionality
  const customItemsDropdownActions = useMemo(() => {
    if (isReadOnly) {
      return itemsDropdownActions.filter(a => a.id === 'view').map(action => ({
        ...action,
        onClick: handleViewItem
      }));
    }
    return itemsDropdownActions.map(action => {
      if (action.id === 'view') {
        return {
          ...action,
          onClick: handleViewItem
        };
      }
      if (action.id === 'edit') {
        return {
          ...action,
          onClick: (item) => {
            setSelectedItem(item);
            setIsEditModalOpen(true);
          }
        };
      }
      if (action.id === 'delete') {
        return {
          ...action,
          onClick: (item) => {
            showDeleteConfirmation(item.itemName, item.id);
          }
        };
      }
      if (action.id === 'adjustStock') {
        return {
          ...action,
          onClick: (item) => {
            setStockAdjustmentModal({ isOpen: true, item });
          }
        };
      }
      if (action.id === 'adjustPrice') {
        return {
          ...action,
          onClick: (item) => {
            setPriceAdjustmentModal({ isOpen: true, item });
          }
        };
      }
      return action;
    });
  }, [isReadOnly]);

  


  // Handle new item button click
  const handleNewItemClick = () => {
    navigate('/inventory/NewItem');
  };

  if (loading && items.length === 0) {
    return (
        <div className="max-w-full mx-15 mt-8 px-5">   
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Items</h1>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading items...</p>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-full mx-15 mt-8 px-5">   
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 ">Items</h1>
        </div>
       
        
        {/* Search and Filter Section */}
        <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-4 mb-4">
          <SearchFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            customerCount={filteredItems.length}
            filterOptions={['Filter by...', ...categories.map(category => category.name)]}
            placeholder="Search items..."
          />
          
          {/* New Item Button (hidden in read-only mode) */}
          {!isReadOnly && (
            <button 
              className={`w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white text-lg font-medium 
              py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors 
              flex items-center cursor-pointer justify-center gap-2 ${
                (loading || creatingItem || updatingItem) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading || creatingItem || updatingItem}
              onClick={handleNewItemClick}
            >
              <Plus className="h-6 w-6" />
              <span>New Item</span>
            </button>
          )}
          
        </div>
        
        {/* Generic Table for Items */}
        <GenericTable 
          data={displayItems}
          columns={itemColumns}
          onRowClick={handleRowClick}
          pagination={true}
          emptyMessage={'No items found'}
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={customItemsDropdownActions}
          serverPagination={true}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPageProp={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />


        {/* View Details Modal */}
        <ViewDetailsModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          data={selectedItem}
          title={itemViewConfig.title}
          sections={itemViewConfig.sections}
        />

        {/* Edit Details Modal (disabled in read-only mode) */}
        {!isReadOnly && (
          <EditDetailsModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
            data={selectedItem}
            categories={categories}
            units={units}
            vendors={suppliers}
            subcategories={subcategories}
            onDataUpdated={handleItemUpdated}
            config={editItemConfig}
            updateService={updateItem}
          />
        )}

        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Delete Item"
          entityName={deleteModal.itemName}
          description="Are you sure you want to delete this item? The item will be removed from the system."
          confirmLabel={deletingItem ? 'Deleting...' : 'Delete Item'}
          cancelLabel="Cancel"
          loading={deletingItem}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
        
        {/* Success Modal */}
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
          title={successModal.title}
          message={successModal.message}
          autoClose={true}
          autoCloseDelay={4000}
        />

        {/* Stock Adjustment Modal (disabled in read-only mode) */}
        {!isReadOnly && (
          <StockAdjustmentModal
            isOpen={stockAdjustmentModal.isOpen}
            onClose={() => setStockAdjustmentModal({ isOpen: false, item: null })}
            onSubmit={handleStockAdjustment}
            item={stockAdjustmentModal.item}
            isLoading={adjustingStock}
          />
        )}

        {/* Price Adjustment Modal (disabled in read-only mode) */}
        {!isReadOnly && (
          <PriceAdjustmentModal
            isOpen={priceAdjustmentModal.isOpen}
            onClose={() => setPriceAdjustmentModal({ isOpen: false, item: null })}
            onSubmit={handlePriceAdjustment}
            item={priceAdjustmentModal.item}
            isLoading={adjustingPrice}
          />
        )}
        
      </div>
  );
}

ItemsTable.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired 
    })
  ).isRequired,
  setCategories: PropTypes.func.isRequired,
  units: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      companyName: PropTypes.string.isRequired,
      contactName: PropTypes.string,
      email1: PropTypes.string,
      telephone1: PropTypes.string
    })
  ).isRequired,
  subcategories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired
};

export default ItemsTable;
