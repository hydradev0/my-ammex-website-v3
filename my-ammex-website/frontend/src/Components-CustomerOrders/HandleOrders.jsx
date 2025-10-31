import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, XCircle, Eye, Trash2, CircleCheckBig, Pencil, Package } from 'lucide-react';
import ViewOrderModal from './ViewOrderModal';
import ProcessOrderModal from './ProcessOrderModal';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';
import PaginationTable from '../Components/PaginationTable';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import { getPendingOrdersForSales, getRejectedOrdersForSales, updateOrderStatus } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import ErrorModal from '../Components/ErrorModal';
import SuccessModal from '../Components/SuccessModal';
//test
function HandleOrders() {
  // Tab state
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'rejected'
  
  // State for pending orders
  const [pendingOrders, setPendingOrders] = useState([]);
  const [filteredPendingOrders, setFilteredPendingOrders] = useState([]);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  
  // State for rejected orders
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [filteredRejectedOrders, setFilteredRejectedOrders] = useState([]);
  const [totalRejectedCount, setTotalRejectedCount] = useState(0);
  
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
  const [discountPercent, setDiscountPercent] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  
  // Action loading states
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [reApprovingOrderId, setReApprovingOrderId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const { user } = useAuth();

  // Load pending orders from backend (Sales/Admin view)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = localStorage.getItem('token');
      if (!token || !user?.id) {
        if (!mounted) return;
        setPendingOrders([]);
        setFilteredPendingOrders([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await getPendingOrdersForSales(currentPage, itemsPerPage);
        if (!mounted) return;
        const orders = (res?.data || []).map((o) => ({
          id: o.orderNumber || String(o.id),
          orderDbId: o.id,
          clientName: o.customer?.customerName || '—',
          date: new Date(o.orderDate).toISOString().slice(0, 10),
          status: o.status,
          total: Number(o.totalAmount) || 0,
          paymentTerms: o.paymentTerms || '30 days',
          items: (o.items || []).map((it) => ({
            name: it.item?.itemName,
            modelNo: it.item?.modelNo,
            category: it.item?.category?.name,
            subcategory: it.item?.subcategory?.name,
            quantity: Number(it.quantity),
            unit: it.item?.unit?.name,
            unitPrice: Number(it.unitPrice),
            total: Number(it.totalPrice)
          }))
        }));
        setPendingOrders(orders);
        setFilteredPendingOrders(orders);
        const totalFromApi = Number(res?.pagination?.totalItems) || orders.length;
        setTotalPendingCount(totalFromApi);
      } catch (e) {
        console.error('Failed to load pending orders:', e);
        setPendingOrders([]);
        setFilteredPendingOrders([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [currentPage, itemsPerPage, user?.id]);

  // Load rejected orders from backend (Sales/Admin view)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = localStorage.getItem('token');
      if (!token || !user?.id) {
        if (!mounted) return;
        setRejectedOrders([]);
        setFilteredRejectedOrders([]);
        return;
      }
      try {
        const res = await getRejectedOrdersForSales(currentPage, itemsPerPage);
        if (!mounted) return;
        const orders = (res?.data || []).map((o) => ({
          id: o.orderNumber || String(o.id),
          orderDbId: o.id,
          clientName: o.customer?.customerName || '—',
          date: new Date(o.orderDate).toISOString().slice(0, 10),
          status: 'rejected',
          total: Number(o.totalAmount) || 0,
          paymentTerms: o.paymentTerms || '30 days',
          rejectedDate: o.updatedAt ? new Date(o.updatedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          rejectionReason: o.rejectionReason || 'Order rejected',
          items: (o.items || []).map((it) => ({
            name: it.item?.itemName,
            modelNo: it.item?.modelNo,
            category: it.item?.category?.name,
            subcategory: it.item?.subcategory?.name,
            quantity: Number(it.quantity),
            unit: it.item?.unit?.name,
            unitPrice: Number(it.unitPrice),
            total: Number(it.totalPrice)
          }))
        }));
        setRejectedOrders(orders);
        setFilteredRejectedOrders(orders);
        const totalFromApi = Number(res?.pagination?.totalItems) || orders.length;
        setTotalRejectedCount(totalFromApi);
      } catch (e) {
        console.error('Failed to load rejected orders:', e);
        setRejectedOrders([]);
        setFilteredRejectedOrders([]);
      }
    })();
    return () => { mounted = false; };
  }, [currentPage, itemsPerPage, user?.id]);

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
    setDiscountPercent(''); // Reset discount when opening process modal
    setIsProcessModalOpen(true);
  };


  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseProcessModal = () => {
    setIsProcessModalOpen(false);
    setSelectedOrder(null);
    setDiscountPercent(''); // Reset discount when closing process modal
  };

  const handleProcess = async (orderId, discount) => {
    setProcessingOrderId(orderId);
    try {
      const discountPct = discountPercent || 0;
      const discountAmt = discount || 0;
      
      const response = await updateOrderStatus(orderId, { 
        status: 'approved',
        discountPercent: discountPct,
        discountAmount: discountAmt
      });

      // Remove from pending lists immediately and decrement count
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      setFilteredPendingOrders(prev => prev.filter(o => o.id !== orderId));
      setTotalPendingCount(c => Math.max(0, c - 1));
      
      // Show success modal
      setSuccessModalMessage(`Order ${orderId} has been successfully approved. You can now view the order in the invoice section.`);
      setSuccessModalOpen(true);
      handleCloseProcessModal();
    } catch (e) {
      console.error('Failed to process order:', e);
      // Check if it's an insufficient inventory error
      const msg = e?.message || 'Failed to process order. Please try again.';
      setErrorModalMessage(msg);
      setErrorModalOpen(true);
      handleCloseProcessModal();
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Re-approve rejected order
  const handleReApproveOrder = async (order) => {
    setReApprovingOrderId(order.id);
    try {
      await updateOrderStatus(order.orderDbId || order.id, { status: 'pending' });

      // Remove from rejected list
      const updatedRejectedOrders = rejectedOrders.filter(o => o.id !== order.id);
      setRejectedOrders(updatedRejectedOrders);
      setTotalRejectedCount((c) => Math.max(0, c - 1));

      // Add back to pending
      const { rejectedDate, rejectionReason, ...cleanOrder } = order;
      const reApprovedOrder = {
        ...cleanOrder,
        status: 'pending',
        reApprovedDate: new Date().toISOString()
      };
      setPendingOrders([reApprovedOrder, ...pendingOrders]);
      setTotalPendingCount((c) => c + 1);
    } catch (e) {
      console.error('Failed to re-approve order:', e);
    } finally {
      setReApprovingOrderId(null);
    }
  };

  // Permanently delete rejected order
  const handleDeleteRejectedOrder = async (orderId) => {
    setDeletingOrderId(orderId);
    try {
      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedRejectedOrders = rejectedOrders.filter(o => o.id !== orderId);
      setRejectedOrders(updatedRejectedOrders);
      setTotalRejectedCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('Failed to delete order:', e);
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Reject pending order
  const handleRejectOrder = async (order, rejectionReason) => {
    setRejectingOrderId(order.id);
    try {
      // Update backend first
      await updateOrderStatus(order.orderDbId || order.id, { status: 'rejected', rejectionReason });

      // Remove from pending orders
      const updatedPendingOrders = pendingOrders.filter(o => o.id !== order.id);
      setPendingOrders(updatedPendingOrders);
      setTotalPendingCount((c) => Math.max(0, c - 1));
      
      // Add to rejected orders with rejection metadata
      const rejectedOrder = {
        ...order,
        status: 'rejected',
        rejectedDate: new Date().toISOString(),
        rejectionReason: rejectionReason || 'Order rejected'
      };
      setRejectedOrders([rejectedOrder, ...rejectedOrders]);
      setTotalRejectedCount((c) => c + 1);
    } catch (e) {
      console.error('Failed to reject order:', e);
    } finally {
      setRejectingOrderId(null);
      setIsProcessModalOpen(false);
      setSelectedOrder(null);
    }
  };


  // Handle delete confirmation
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (orderToDelete) {
      await handleDeleteRejectedOrder(orderToDelete.id);
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
                {totalPendingCount}
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
                {totalRejectedCount}
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
            totalCount={totalPendingCount}
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
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading pending orders...</h3>
                        <p className="text-gray-600">Please wait while we fetch the latest orders</p>
                      </td>
                    </tr>
                  ) : paginatedPendingOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Orders</h3>
                        <p className="text-gray-500 mb-6">You don't have any pending orders at the moment.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPendingOrders.map((order) => (
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
                            onClick={() => handleReviewOrder(order)}
                            disabled={processingOrderId === order.id}
                            className={`mr-4 flex items-center gap-1 cursor-pointer ${
                              processingOrderId === order.id 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {processingOrderId === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            ) : (
                              <Pencil className="w-4 h-4" />
                            )}
                            {processingOrderId === order.id ? 'Processing...' : 'Review'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
            totalCount={totalRejectedCount}
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
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading rejected orders...</h3>
                        <p className="text-gray-600">Please wait while we fetch the latest orders</p>
                      </td>
                    </tr>
                  ) : paginatedRejectedOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Rejected Orders</h3>
                        <p className="text-gray-500 mb-6">You don't have any rejected orders at the moment.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRejectedOrders.map((order) => (
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
                            title="View Order"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleReApproveOrder(order)}
                            disabled={reApprovingOrderId === order.id}
                            className={`mr-4 ${
                              reApprovingOrderId === order.id 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={reApprovingOrderId === order.id ? "Re-approving..." : "Re-approve Order"}
                          >
                            {reApprovingOrderId === order.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                            ) : (
                              <CircleCheckBig className="w-5 h-5" />
                            )}
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(order)}
                            disabled={deletingOrderId === order.id}
                            className={`mr-4 ${
                              deletingOrderId === order.id 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-red-600 hover:text-red-900'
                            }`}
                            title={deletingOrderId === order.id ? "Deleting..." : "Delete Order"}
                          >
                            {deletingOrderId === order.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
          isProcessing={processingOrderId === selectedOrder?.id}
          isRejecting={rejectingOrderId === selectedOrder?.id}
        />
      )}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Rejected Order"
        entityName={orderToDelete?.id}
        description="This action cannot be undone. The order will be permanently removed from the rejected orders list."
        confirmLabel={deletingOrderId ? "Deleting..." : "Delete Order"}
        cancelLabel="Cancel"
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={deletingOrderId === orderToDelete?.id}
      />
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Failed to process order"
        message={errorModalMessage}
      />
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Order Approved!"
        message={successModalMessage}
        redirectPath="/sales/invoices"
        redirectLabel="View Invoices"
        autoClose={true}
        autoCloseDelay={7000}
      />
    </div>
  );
}

export default HandleOrders; 