import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, Package, Clock, CheckCircle, X, XCircle, ChevronDown, ChevronUp, Trash } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import TopBarPortal from './TopBarPortal';
import { getMyOrders, cancelMyOrder } from '../services/orderService';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';
import { useAuth } from '../contexts/AuthContext';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('pending');
  
  // State for pending orders
  const [pendingOrders, setPendingOrders] = useState([]);
  
  // State for rejected orders
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sorting state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const modalRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Load orders from backend (on login changes)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const token = localStorage.getItem('token');
      if (!token || !user?.id) {
        if (!isMounted) return;
        setPendingOrders([]);
        setRejectedOrders([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [resPending, resRejected] = await Promise.all([
          getMyOrders('pending'),
          getMyOrders('rejected')
        ]);
        if (!isMounted) return;
        setPendingOrders(resPending?.data || []);
        setRejectedOrders(resRejected?.data || []);
      } catch (e) {
        console.error('Failed to load orders:', e);
        setPendingOrders([]);
        setRejectedOrders([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user?.id]);


  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOrderModal && modalRef.current && event.target === modalRef.current) {
        closeOrderModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOrderModal]);

  const handleBack = () => {
    navigate('/Products');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCancelOrder = async (order) => {
    setOrderToCancel(order);
    setIsCancelOpen(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort orders function
  const sortOrders = (orders) => {
    return [...orders].sort((a, b) => {
      if (sortField === 'orderDate') {
        return sortDirection === 'asc' 
          ? new Date(a.orderDate) - new Date(b.orderDate)
          : new Date(b.orderDate) - new Date(a.orderDate);
      }
      if (sortField === 'totalAmount') {
        return sortDirection === 'asc' 
          ? a.totalAmount - b.totalAmount
          : b.totalAmount - a.totalAmount;
      }
      if (sortField === 'orderNumber') {
        return sortDirection === 'asc'
          ? a.orderNumber.localeCompare(b.orderNumber)
          : b.orderNumber.localeCompare(a.orderNumber);
      }
      return 0;
    });
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'dispatched':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort and paginate orders
  const sortedPendingOrders = sortOrders(pendingOrders);
  const sortedRejectedOrders = sortOrders(rejectedOrders);

  // Pagination logic for pending orders
  const startPendingIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPendingOrders = sortedPendingOrders.slice(startPendingIndex, startPendingIndex + itemsPerPage);

  // Pagination logic for rejected orders
  const startRejectedIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRejectedOrders = sortedRejectedOrders.slice(startRejectedIndex, startRejectedIndex + itemsPerPage);
// Order Details Modal
  const modalContent = showOrderModal && selectedOrder ? (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[120vh] sm:max-h-[120vh] overflow-y-auto"
        style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Order Details</h2>
            <button
              onClick={closeOrderModal}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 ">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Order Number</h3>
              <p className="text-xs sm:text-sm text-gray-900 break-all">{selectedOrder.orderNumber}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Order Date</h3>
              <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedOrder.orderDate)}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Status</h3>
              <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                <span className="ml-1 capitalize">{selectedOrder.status}</span>
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">${selectedOrder.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Order Items</h3>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start sm:items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{item.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toLocaleString()}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">${item.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <TopBarPortal />
      <div className="max-w-4xl lg:max-w-5xl  xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6  sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 mb-4 sm:mb-0 sm:-mt-4 sm:-mx-1 md:-mx-30 lg:-mx-40 xl:-mx-48">
          <button 
            onClick={() => handleBreadcrumbClick('/Products')}
            className="hover:text-blue-600 transition-colors"
          >
            Products
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-700 font-medium">Orders</span>
        </div>
        
        <div className="flex gap-8 md:gap-8 lg:gap-12 mb-6 mt-8 mx-1 md:-mx-15 lg:-mx-30 xl:-mx-35">
          <button 
            onClick={handleBack}
            className="flex items-center justify-center cursor-pointer bg-[#3182ce] hover:bg-[#4992d6] text-white px-3 py-2 rounded-3xl gap-1 transition-colors whitespace-nowrap w-20"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center sm:text-left sm:-ml-4 -md:ml-2 -lg:ml-2 xl:ml-2">Orders</h1>
        </div>


        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-3 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-5 h-5" />
                Pending Orders
                <span className="bg-blue-100 text-blue-600 py-1 px-2.5 rounded-full text-xs font-medium">
                  {pendingOrders.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`py-3 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'rejected'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <XCircle className="w-5 h-5" />
                Rejected Orders
                <span className="bg-red-100 text-red-600 py-1 px-2.5 rounded-full text-xs font-medium">
                  {rejectedOrders.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Pending Tab Content */}
        {activeTab === 'pending' && (
          <>
            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading your orders...</h3>
                <p className="text-gray-600">Please wait while we fetch your orders</p>
              </div>
            ) : paginatedPendingOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Orders</h3>
                <p className="text-gray-500 mb-6">You don't have any pending orders at the moment.</p>
                <button
                  onClick={handleBack}
                  className="bg-[#3182ce] cursor-pointer text-white px-6 py-2 rounded-3xl hover:bg-[#2c5282] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th 
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleSort('orderNumber')}
                        >
                          Order #
                          {sortField === 'orderNumber' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                          )}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleSort('orderDate')}
                        >
                          Date
                          {sortField === 'orderDate' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                          )}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Items
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleSort('totalAmount')}
                        >
                          Total
                          {sortField === 'totalAmount' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                          )}
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPendingOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {order.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.orderDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ${order.totalAmount.toLocaleString()}
                          </td>
                          <td className="flex px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="text-[#3182ce] cursor-pointer hover:text-[#2c5282] transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="text-red-600 cursor-pointer hover:text-red-800 transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Trash className="w-4 h-4" />
                              Cancel Order
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Rejected Tab Content */}
        {activeTab === 'rejected' && (
          <>

            {/* Rejected Orders Table */}
            {paginatedRejectedOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Rejected Orders</h3>
                <p className="text-gray-500">You don't have any rejected orders.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th 
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleSort('orderNumber')}
                        >
                          Order #
                          {sortField === 'orderNumber' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                          )}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleSort('orderDate')}
                        >
                          Date
                          {sortField === 'orderDate' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                          )}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Items
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleSort('totalAmount')}
                        >
                          Total
                          {sortField === 'totalAmount' && (
                            sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                          )}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRejectedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {order.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.orderDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ${order.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            {order.rejectionReason || 'Order rejected'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewOrder(order)} // TODO: Add an edit button and checkout button
                              className="text-[#3182ce] hover:text-[#2c5282] transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {((activeTab === 'pending' && paginatedPendingOrders.length > 0) || 
          (activeTab === 'rejected' && paginatedRejectedOrders.length > 0)) && (
          <div className="mt-6">
            {/* Add PaginationTable component here if needed */}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <ScrollLock active={showOrderModal} />
      {createPortal(modalContent, document.body)}

      {/* Cancel Confirmation */}
      <ConfirmDeleteModal
        isOpen={isCancelOpen}
        title="Cancel Order"
        entityName={orderToCancel?.orderNumber}
        description="This will cancel your order. Sales will no longer process it."
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        loading={cancelLoading}
        onCancel={() => {
          if (cancelLoading) return;
          setIsCancelOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={async () => {
          try {
            setCancelLoading(true);
            await cancelMyOrder(orderToCancel?.orderNumber || orderToCancel?.id);
            setPendingOrders(prev => prev.filter(o => o.id !== orderToCancel?.id));
          } catch (e) {
            console.error('Failed to cancel order:', e);
          } finally {
            setCancelLoading(false);
            setIsCancelOpen(false);
            setOrderToCancel(null);
          }
        }}
      />
    </>
  );
};

export default Orders;
