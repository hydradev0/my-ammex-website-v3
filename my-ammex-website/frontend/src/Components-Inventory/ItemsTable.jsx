import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import ItemModal from './ItemModal';
import ViewDetailsModal from '../Components/ViewDetailsModal';
import { itemViewConfig } from '../Components/viewConfigs';
import { itemsDropdownActions } from '../Components/dropdownActions';
import { itemsData } from '../data/itemsData';

// Constants for category styling
const CATEGORY_STYLES = {
  'Raw Materials': 'bg-blue-100 text-blue-800',
  'Machine': 'bg-green-100 text-green-800',
  'Marker': 'bg-purple-100 text-purple-800',
  'Drill': 'bg-orange-100 text-orange-800'
};

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

function ItemsTable({ categories, setCategories }) {
  // State for items data
  const [items, setItems] = useState(itemsData);

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Define columns for the items table
  const itemColumns = [
    { 
      key: 'itemCode', 
      header: 'Item Code'
    },
    { 
      key: 'itemName', 
      header: 'Item Name'
    },
    { 
      key: 'quantity', 
      header: 'Quantity',
      render: (value) => value.toLocaleString()
    },
    { 
      key: 'unit', 
      header: 'Unit'
    },
    { 
      key: 'price', 
      header: 'Price',
      render: (value) => `₱${value.toFixed(2)}`
    },
    { 
      key: 'category', 
      header: 'Category',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-sm ${CATEGORY_STYLES[value] || 'bg-gray-100 text-gray-800'}`}>
          {value}
        </span>
      )
    }
  ];

  // Filter items based on search term and filter value
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.itemName.toLowerCase().includes(searchLower) ||
        item.itemCode.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower);
      
      const matchesFilter = filterValue === 'Filter by...' || item.category === filterValue;
      
      return matchesSearch && matchesFilter;
    });
  }, [items, searchTerm, filterValue]);

  // Handle new item submission
  const handleNewItem = (newItem) => {
    // Sanitize and match all fields from ItemModal
    const sanitizedItem = {
      itemCode: newItem.itemCode || '',
      itemName: newItem.itemName || '',
      vendor: newItem.vendor || '',
      price: Number(newItem.price) || 0,
      floorPrice: Number(newItem.floorPrice) || 0,
      ceilingPrice: Number(newItem.ceilingPrice) || 0,
      unit: newItem.unit || '',
      quantity: Number(newItem.quantity) || 0,
      category: newItem.category || '',
      description: newItem.description || '',
      minLevel: Number(newItem.minLevel) || 0,
      maxLevel: Number(newItem.maxLevel) || 0
    };
    setItems([...items, sanitizedItem]);
    setIsModalOpen(false);
  };

  // Handle view item details
  const handleViewItem = (item) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
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
    return itemsDropdownActions.map(action => {
      if (action.id === 'view') {
        return {
          ...action,
          onClick: handleViewItem
        };
      }
      return action;
    });
  }, []);

  return (
    <div className="bg-gray-100">
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Items</h1>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-4 mb-4">
          <SearchFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            customerCount={filteredItems.length}
            filterOptions={['Filter by...', 'Raw Materials', 'Machine', 'Marker', 'Drill']}
            placeholder="Search items..."
          />
          
          {/* New Item Button */}
          <button 
            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white text-lg font-medium 
            py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors 
            flex items-center cursor-pointer justify-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-6 w-6" />
            <span>New Item</span>
          </button>
        </div>
        
        {/* Generic Table for Items */}
        <GenericTable 
          data={filteredItems}
          columns={itemColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No items found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={customItemsDropdownActions}
        />

        {/* Item Modal */}
        {isModalOpen && (
          <ItemModal
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleNewItem}
            categories={categories}
          />
        )}

        {/* View Item Modal */}
        <ViewDetailsModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          data={selectedItem}
          title={itemViewConfig.title}
          sections={itemViewConfig.sections}
        />
      </div>
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
  setCategories: PropTypes.func.isRequired
};

export default ItemsTable;
