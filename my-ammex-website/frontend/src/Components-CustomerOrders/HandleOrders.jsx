import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Clock, XCircle, Eye, Trash2, CircleCheckBig, Pencil } from 'lucide-react';
import ViewOrderModal from './ViewOrderModal';
import ProcessOrderModal from './ProcessOrderModal';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';
import PaginationTable from '../Components/PaginationTable';
import ModernSearchFilter from '../Components/ModernSearchFilter';
//test
function HandleOrders() {
  // Tab state
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'rejected'
  
  // State for pending orders
  const [pendingOrders, setPendingOrders] = useState([]);
  const [filteredPendingOrders, setFilteredPendingOrders] = useState([]);
  
  // State for rejected orders
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [filteredRejectedOrders, setFilteredRejectedOrders] = useState([]);
  
  // Search and filter states for pending orders
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Search and filter states for rejected orders
  const [rejectedSearchTerm, setRejectedSearchTerm] = useState('');
  const [rejectedDateRange, setRejectedDateRange] = useState({ start: '', end: '' });
  
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Mock data initialization
  useEffect(() => {
    const mockPendingOrders = [
      {
        id: 'ORD001',
        clientName: 'ABC Corporation',
        date: '2024-03-20',
        status: 'pending',
        total: 1500.00,
        items: [
          {
            name: 'Product A',
            quantity: 2,
            unitPrice: 500.00,
            total: 1000.00
          },
          {
            name: 'Product B',
            quantity: 1,
            unitPrice: 500.00,
            total: 500.00
          }
        ]
      },
      {
        id: 'ORD002',
        clientName: 'XYZ Ltd',
        date: '2024-03-21',
        status: 'pending',
        total: 2300.00,
        items: [
          {
            name: 'Product C',
            quantity: 3,
            unitPrice: 500.00,
            total: 1500.00
          },
          {
            name: 'Product D',
            quantity: 2,
            unitPrice: 400.00,
            total: 800.00
          }
        ]
      },
      {
        id: 'ORD003',
        clientName: 'DEF Manufacturing',
        date: '2024-03-22',
        status: 'pending',
        total: 850.00,
        items: [
          {
            name: 'Product E',
            quantity: 1,
            unitPrice: 850.00,
            total: 850.00
          }
        ]
      }
    ];

    const mockRejectedOrders = [
      {
        id: 'ORD004',
        clientName: 'GHI Industries',
        date: '2024-03-15',
        status: 'rejected',
        total: 1200.00,
        rejectedDate: '2024-03-16',
        rejectionReason: 'Insufficient payment documentation',
        items: [
          {
            name: 'Product F',
            quantity: 2,
            unitPrice: 600.00,
            total: 1200.00
          }
        ]
      },
      {
        id: 'ORD005',
        clientName: 'JKL Services',
        date: '2024-03-18',
        status: 'rejected',
        total: 950.00,
        rejectedDate: '2024-03-19',
        rejectionReason: 'Customer account on hold',
        items: [
          {
            name: 'Product G',
            quantity: 1,
            unitPrice: 950.00,
            total: 950.00
          }
        ]
      }
    ];

    setPendingOrders(mockPendingOrders);
    setFilteredPendingOrders(mockPendingOrders);
    setRejectedOrders(mockRejectedOrders);
    setFilteredRejectedOrders(mockRejectedOrders);
  }, []);

  // Filter pending orders based on search and filters
  useEffect(() => {
    let filtered = pendingOrders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    setFilteredPendingOrders(filtered);
  }, [pendingOrders, searchTerm, dateRange]);

  // Filter rejected orders based on search and filters
  useEffect(() => {
    let filtered = rejectedOrders;

    // Search filter
    if (rejectedSearchTerm) {
      filtered = filtered.filter(order => 
        order.clientName.toLowerCase().includes(rejectedSearchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(rejectedSearchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (rejectedDateRange.start && rejectedDateRange.end) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        const startDate = new Date(rejectedDateRange.start);
        const endDate = new Date(rejectedDateRange.end);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    setFilteredRejectedOrders(filtered);
  }, [rejectedOrders, rejectedSearchTerm, rejectedDateRange]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const handleviewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleReviewOrder = (order) => {
    setSelectedOrder(order);
    setDiscountPercent(0); // Reset discount when opening process modal
    setIsProcessModalOpen(true);
  };


  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseProcessModal = () => {
    setIsProcessModalOpen(false);
    setSelectedOrder(null);
    setDiscountPercent(""); // Reset discount when closing process modal
  };

  const handleProcess = (orderId, discount) => {
    // Here you would typically make an API call to process the order with the discount
    console.log(`Processing order ${orderId} with discount ${discount}`);
    // Update the order status in your state/backend
    handleCloseProcessModal();
  };

  // Re-approve rejected order
  const handleReApproveOrder = (order) => {
    // Remove from rejected orders
    const updatedRejectedOrders = rejectedOrders.filter(o => o.id !== order.id);
    setRejectedOrders(updatedRejectedOrders);
    
    // Add back to pending orders (remove rejection metadata)
    const { rejectedDate, rejectionReason, ...cleanOrder } = order;
    const reApprovedOrder = {
      ...cleanOrder,
      status: 'pending',
      reApprovedDate: new Date().toISOString()
    };
    setPendingOrders([reApprovedOrder, ...pendingOrders]);
  };

  // Permanently delete rejected order
  const handleDeleteRejectedOrder = (orderId) => {
    const updatedRejectedOrders = rejectedOrders.filter(o => o.id !== orderId);
    setRejectedOrders(updatedRejectedOrders);
  };

  // Reject pending order
  const handleRejectOrder = (order, rejectionReason) => {
    // Remove from pending orders
    const updatedPendingOrders = pendingOrders.filter(o => o.id !== order.id);
    setPendingOrders(updatedPendingOrders);
    
    // Add to rejected orders with rejection metadata
    const rejectedOrder = {
      ...order,
      status: 'rejected',
      rejectedDate: new Date().toISOString(),
      rejectionReason: rejectionReason || 'Order rejected'
    };
    setRejectedOrders([rejectedOrder, ...rejectedOrders]);
    setIsProcessModalOpen(false);
    setSelectedOrder(null);
  };


  // Handle delete confirmation
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      handleDeleteRejectedOrder(orderToDelete.id);
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  // Configure dropdown filters for SearchFilters component
  const dropdownFilters = [];
  const rejectedDropdownFilters = [];

  // Sort filtered orders
  const sortOrders = (orders) => {
    return [...orders].sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      if (sortField === 'total') {
        return sortDirection === 'asc' 
          ? a.total - b.total
          : b.total - a.total;
      }
      if (sortField === 'clientName') {
        return sortDirection === 'asc'
          ? a.clientName.localeCompare(b.clientName)
          : b.clientName.localeCompare(a.clientName);
      }
      if (sortField === 'id') {
        return sortDirection === 'asc'
          ? a.id.localeCompare(b.id)
          : b.id.localeCompare(a.id);
      }
      return 0;
    });
  };

  const sortedPendingOrders = sortOrders(filteredPendingOrders);
  const sortedRejectedOrders = sortOrders(filteredRejectedOrders);

  // Pagination logic for pending orders
  const totalPendingPages = Math.ceil(sortedPendingOrders.length / itemsPerPage);
  const startPendingIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPendingOrders = sortedPendingOrders.slice(startPendingIndex, startPendingIndex + itemsPerPage);

  // Pagination logic for rejected orders
  const totalRejectedPages = Math.ceil(sortedRejectedOrders.length / itemsPerPage);
  const startRejectedIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRejectedOrders = sortedRejectedOrders.slice(startRejectedIndex, startRejectedIndex + itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 min-h-[calc(100vh-140px)]">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Orders</h1>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {pendingOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-2 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Rejected
              <span className="bg-red-100 text-red-600 py-1 px-2 rounded-full text-xs">
                {rejectedOrders.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Pending Tab Content */}
      {activeTab === 'pending' && (
        <>
          {/* Search and Filters */}
          <ModernSearchFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder="Search orders, customers, order IDs..."
            dropdownFilters={dropdownFilters}
            dateRange={dateRange}
            setDateRange={setDateRange}
            showDateRange={true}
            filteredCount={filteredPendingOrders.length}
            totalCount={pendingOrders.length}
            itemLabel="orders"
          />

          {/* Pending Orders Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-bl from-gray-200 to-gray-300">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('id')}
                    >
                      Order ID
                      {sortField === 'id' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('clientName')}
                    >
                      Customer Name
                      {sortField === 'clientName' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('total')}
                    >
                      Total
                      {sortField === 'total' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-md font-medium text-blue-600">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {order.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        ₱{order.total.toFixed(2)}
                      </td>
                      <td className="px-10 py-4 whitespace-nowrap text-md text-gray-500">
                        {order.items.reduce((total, item) => total + item.quantity, 0)}
                      </td>
                      <td className="py-4 whitespace-nowrap text-md font-medium flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleviewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 mr-4 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button 
                          onClick={() => handleReviewOrder(order)}
                          className="text-green-600 hover:text-green-900 mr-4 flex items-center gap-1"
                        >
                          <Pencil className="w-4 h-4" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationTable
            currentPage={currentPage}
            totalPages={totalPendingPages}
            totalItems={sortedPendingOrders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            itemsPerPageOptions={[5, 10, 20, 30, 40, 50]}
            className="mt-2"
          />
        </>
      )}

      {/* Rejected Tab Content */}
      {activeTab === 'rejected' && (
        <>
          {/* Search and Filters */}
          <ModernSearchFilter
            searchTerm={rejectedSearchTerm}
            setSearchTerm={setRejectedSearchTerm}
            searchPlaceholder="Search rejected orders..."
            dropdownFilters={rejectedDropdownFilters}
            dateRange={rejectedDateRange}
            setDateRange={setRejectedDateRange}
            showDateRange={true}
            filteredCount={filteredRejectedOrders.length}
            totalCount={rejectedOrders.length}
            itemLabel="rejected orders"
          />

          {/* Rejected Orders Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-bl from-gray-200 to-gray-300">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('id')}
                    >
                      Order ID
                      {sortField === 'id' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('clientName')}
                    >
                      Customer Name
                      {sortField === 'clientName' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Rejected Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Reason
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('total')}
                    >
                      Total
                      {sortField === 'total' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />
                      )}
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRejectedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-md font-medium text-blue-600">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {order.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {order.rejectedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        <span className="text-red-600 text-sm">
                          {order.rejectionReason}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        ₱{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-md font-medium">
                        <button 
                          onClick={() => handleviewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleReApproveOrder(order)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          <CircleCheckBig className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(order)}
                          className="text-red-600 hover:text-red-900 mr-4"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationTable
            currentPage={currentPage}
            totalPages={totalRejectedPages}
            totalItems={sortedRejectedOrders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            itemsPerPageOptions={[5, 10, 20, 30, 40, 50]}
            className="mt-2"
          />
        </>
      )}

      {/* Modals */}
      {isViewModalOpen && (
        <ViewOrderModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          order={selectedOrder}
        />
      )}
      {isProcessModalOpen && (
        <ProcessOrderModal
          isOpen={isProcessModalOpen}
          onClose={handleCloseProcessModal}
          order={selectedOrder}
          onProcess={handleProcess}
          onReject={handleRejectOrder}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
        />
      )}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Rejected Order"
        entityName={orderToDelete?.id}
        description="This action cannot be undone. The order will be permanently removed from the rejected orders list."
        confirmLabel="Delete Order"
        cancelLabel="Cancel"
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default HandleOrders; 