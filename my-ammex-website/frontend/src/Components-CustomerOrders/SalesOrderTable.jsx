import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import SearchFilter from '../Components/SearchFilter';
import GenericTable from '../Components/GenericTable';
import OrdersModal from '../Components/OrdersModal';
import { Plus, MoreHorizontal } from 'lucide-react';
import SalesOrderForm from './SalesOrderForm';
import { salesOrdersDropdownActions } from '../Components/dropdownActions';

// Constants for status styling
const STATUS_STYLES = {
  Processing: 'bg-yellow-100 text-yellow-800',
  Ready: 'bg-green-100 text-green-800'
};

function SalesOrderTable() {
  // State for sales orders data
  const [salesOrders, setSalesOrders] = useState([
    {
      docNo: 'SO1001',
      name: 'John Smith',
      amount: 1250.00,
      status: 'Processing',
      date: '2024-03-15',
    },
    {
      docNo: 'SO1002',
      name: 'Sarah Johnson',
      amount: 3450.50,
      status: 'Ready',
      date: '2024-03-14',
    },
    {
      docNo: 'SO1003',
      name: 'Michael Brown',
      amount: 875.25,
      status: 'Processing',
      date: '2024-03-13',
    },
    {
      docNo: 'SO1004',
      name: 'Emily Davis',
      amount: 2150.75,
      status: 'Ready',
      date: '2024-03-12',
    },
    {
      docNo: 'SO1005',
      name: 'Robert Wilson',
      amount: 1875.50,
      status: 'Processing',
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
    return Math.max(...salesOrders.map(order => 
      parseInt(order.docNo.replace('SO', ''), 10)
    ), 1000);
  }, [salesOrders]);
  
  // Handle adding a new sales order
  const handleAddSalesOrder = (orderData) => {
    try {
      // Validate required fields
      if (!orderData.customerName?.trim()) {
        throw new Error('Customer name is required');
      }

      const amount = parseFloat(orderData.amount);
      if (isNaN(amount) || amount < 0) {
        throw new Error('Invalid amount');
      }

      const newDocNo = highestDocNo + 1;
      const newOrder = {
        docNo: orderData.docNo || `SO${newDocNo}`,
        name: orderData.customerName.trim(),
        amount,
        status: 'Processing',
        date: new Date().toISOString().split('T')[0],
        items: orderData.items
      };
      
      setSalesOrders(prevOrders => [...prevOrders, newOrder]);
      setIsModalOpen(false);
      setSuccess('Sales order added successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding sales order:', error);
      setError(error.message);
      setSuccess(null);
    }
  };
  
  // Define columns for the sales orders table
  const salesOrderColumns = [
    { 
      key: 'docNo', 
      header: 'Doc. No.'
    },
    { 
      key: 'name', 
      header: 'Name'
    },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (value) => `₱${value.toFixed(2)}`
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-sm ${STATUS_STYLES[value] || STATUS_STYLES.Processing}`}>
          {value}
        </span>
      )
    },
    { 
      key: 'date', 
      header: 'Date'
    }
  ];
  
  // Row click handler
  const handleRowClick = (order) => {
    console.log('Sales Order selected:', order);
    // Add navigation or details view here if needed
  };
  
  // Filter sales orders based on search term and filter value
  const filteredOrders = useMemo(() => {
    return salesOrders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.name.toLowerCase().includes(searchLower) ||
        order.docNo.toLowerCase().includes(searchLower) ||
        order.status.toLowerCase().includes(searchLower);
      
      const matchesFilter = filterValue === 'Filter by...' || order.status === filterValue;
      
      return matchesSearch && matchesFilter;
    });
  }, [salesOrders, searchTerm, filterValue]);

  return (
    <div className="bg-gray-100">
      <div className="max-w-full mx-15 mt-8 px-5">   
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales Order</h1>
        
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
            filterOptions={['Filter by...', 'Processing', 'Ready']}
            placeholder="Search orders..."
          />
          
          {/* New Sales Order Button */}
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
            <span>New Sales Order</span>
          </button>
        </div>
        
        {/* Generic Table for Sales Orders */}
        <GenericTable 
          data={filteredOrders}
          columns={salesOrderColumns}
          onRowClick={handleRowClick}
          pagination={true}
          itemsPerPage={7}
          emptyMessage="No sales orders found"
          className="mb-8"
          alternateRowColors={true}
          dropdownActions={salesOrdersDropdownActions}
        />
        
        {/* New Sales Order Modal */}
        {isModalOpen && (
          <OrdersModal 
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setError(null);
            }}
            title="New Sales Order"
          >
            <SalesOrderForm
              onSubmit={handleAddSalesOrder}
              onClose={() => {
                setIsModalOpen(false);
                setError(null);
              }}
              nextDocNo={`SO${highestDocNo + 1}`}
            />
          </OrdersModal>
        )}
      </div>
    </div>
  );
}

SalesOrderTable.propTypes = {
  // This component doesn't receive any props currently
  // Add prop types here if props are added in the future
};

export default SalesOrderTable;
