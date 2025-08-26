import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import { Plus, MoreHorizontal } from 'lucide-react';
import PurchaseOrderForm from './PurchaseOrderForm';
import OrdersModal from '../Components/OrdersModal';

// Constants for status styling
const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ready: 'bg-green-100 text-green-800',
};

function PurchaseOrderTable() {
  // State for purchase orders data
  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      docNo: 'PO1001',
      name: 'Supplier A',
      amount: 2250.00,
      status: 'Pending',
      date: '2024-03-15',
    },
    {
      docNo: 'PO1002',
      name: 'Supplier B',
      amount: 4450.50,
      status: 'Ready',
      date: '2024-03-14',
    },
    {
      docNo: 'PO1003',
      name: 'Supplier C',
      amount: 1875.25,
      status: 'Ready',
      date: '2024-03-13',
    },
    {
      docNo: 'PO1004',
      name: 'Supplier D',
      amount: 3150.75,
      status: 'Pending',
      date: '2024-03-12',
    },
    {
      docNo: 'PO1005',
      name: 'Supplier E',
      amount: 2875.50,
      status: 'Ready',
      date: '2024-03-11',
    }
  ]);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('Filter by...');
  
  // State for error handling
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Calculate the highest document number from existing orders
  const highestDocNo = useMemo(() => {
    return Math.max(...purchaseOrders.map(order => 
      parseInt(order.docNo.replace('PO', ''), 10)
    ), 1000);
  }, [purchaseOrders]);
  
  // Handle adding a new purchase order
  const handleAddPurchaseOrder = (orderData) => {
    try {
      // Validate required fields
      if (!orderData.supplierName?.trim()) {
        throw new Error('Supplier name is required');
      }

      const amount = parseFloat(orderData.amount);
      if (isNaN(amount) || amount < 0) {
        throw new Error('Invalid amount');
      }

      // Validate date
      const orderDate = new Date(orderData.date);
      const deliveryDate = new Date(orderData.deliveryDate);
      if (deliveryDate < orderDate) {
        throw new Error('Delivery date must be after order date');
      }

      const newDocNo = highestDocNo + 1;
      const newOrder = {
        docNo: orderData.docNo || `PO${newDocNo}`,
        name: orderData.supplierName.trim(),
        amount,
        status: 'Pending',
        date: orderData.date,
        deliveryDate: orderData.deliveryDate,
        items: orderData.items
      };
      
      setPurchaseOrders(prevOrders => [...prevOrders, newOrder]);
      setIsModalOpen(false);
      setSuccess('Purchase order added successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding purchase order:', error);
      setError(error.message);
      setSuccess(null);
    }
  };
  
  // Define columns for the purchase orders table
  const purchaseOrderColumns = [
    { 
      key: 'docNo', 
      header: 'Doc. No.',
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'name', 
      header: 'Supplier Name',
      width: 'w-80',
      cellClassName: 'w-80',
      truncate: true
    },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (value) => `₱${value.toFixed(2)}`,
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'status', 
    header: 'Status'
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-sm ${STATUS_STYLES[value] || STATUS_STYLES.Pending}`}>
          {value}
        </span>
      ),
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    },
    { 
      key: 'date', 
      header: 'Date',
      width: 'w-40',
      cellClassName: 'w-40',
      truncate: true
    }
  ];
  
  // Custom row action for purchase orders table
  const customRowAction = (order) => (
    <button 
      className="cursor-pointer text-blue-900 hover:text-blue-600"
      onClick={(e) => {
        e.stopPropagation();
        console.log('Purchase Order actions:', order);
      }}
    >
      <MoreHorizontal className="h-6 w-6" />
    </button>
  );
  
  // Row click handler
  const handleRowClick = (order) => {
    console.log('Purchase Order selected:', order);
    // Add navigation or details view here if needed
  };
  
  // Filter purchase orders based on search term and filter value
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.name.toLowerCase().includes(searchLower) ||
        order.docNo.toLowerCase().includes(searchLower) ||
        order.status.toLowerCase().includes(searchLower);
      
      const matchesFilter = filterValue === 'Filter by...' || order.status === filterValue;
      
      return matchesSearch && matchesFilter;
    });
  }, [purchaseOrders, searchTerm, filterValue]);

  return (
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Purchase Order</h1>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        {/* Search and Filter Section */}
        <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-4 mb-4">
          <SearchFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            customerCount={filteredOrders.length}
            filterOptions={['Filter by...', 'Pending', 'Ready']}
            placeholder="Search orders..."
          />
          
          {/* New Purchase Order Button */}
          <button 
            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white text-lg font-medium 
            py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-colors 
            flex items-center cursor-pointer justify-center gap-2"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-6 w-6" />
            <span>New Purchase Order</span>
          </button>
        </div>
        
        {/* Generic Table for Purchase Orders */}
        <GenericTable 
          data={filteredOrders}
          columns={purchaseOrderColumns}
          onRowClick={handleRowClick}
          customRowAction={customRowAction}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No purchase orders found"
          className="mb-8"
          alternateRowColors={true}
        />
        
        {/* New Purchase Order Modal */}
        {isModalOpen && (
          <OrdersModal 
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setError(null);
            }}
            title="New Purchase Order"
          >
            <PurchaseOrderForm
              onSubmit={handleAddPurchaseOrder}
              onClose={() => {
                setIsModalOpen(false);
                setError(null);
              }}
              nextDocNo={`PO${highestDocNo + 1}`}
            />
          </OrdersModal>
        )}
      </div>
  );  
}

PurchaseOrderTable.propTypes = {
  // This component doesn't receive any props currently
  // Add prop types here if props are added in the future
};

export default PurchaseOrderTable; 