import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, FileText, Clock, CheckCircle, X, XCircle, CreditCard, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import TopBarPortal from './TopBarPortal';
import { getMyInvoices } from '../services/invoiceService';

const Invoice = () => {
  const navigate = useNavigate();
  
  // State for invoices
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sorting state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const modalRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        // Load all invoices
        const response = await getMyInvoices();
        const allInvoices = response?.data || [];
        
        // Transform backend data to match frontend format
        const transformInvoice = (invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderNumber: invoice.orderId,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          totalAmount: Number(invoice.totalAmount) || 0,
          paidAmount: Number(invoice.paidAmount) || 0,
          remainingAmount: invoice.remainingAmount !== null && invoice.remainingAmount !== undefined ? Number(invoice.remainingAmount) : (Number(invoice.totalAmount) || 0),
          paymentStatus: invoice.paymentStatus,
          paymentTerms: invoice.paymentTerms,
          items: (invoice.items || []).map(item => {
            const transformedItem = {
              name: item.name || item.itemName || 'Unknown Item',
              quantity: Number(item.quantity) || 0,
              price: Number(item.unitPrice) || 0, 
              total: Number(item.total) || 0, 
              description: item.description || '',
              unit: item.unit || 'pcs'
            };
            return transformedItem;
          }),
          customer: {
            name: invoice.customerName || 'Unknown Customer',
            email: invoice.customerEmail || ''
          },
          ...(invoice.lastPayment && { lastPayment: invoice.lastPayment }),
          ...(invoice.rejectionReason && { rejectionReason: invoice.rejectionReason })
        });

        setInvoices(allInvoices.map(transformInvoice));
      } catch (error) {
        console.error('Failed to load invoices:', error);
        // Fallback to empty array on error
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, []);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showInvoiceModal && modalRef.current && event.target === modalRef.current) {
        closeInvoiceModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInvoiceModal]);

  const handleBack = () => {
    navigate('/Products');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handlePayInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    navigate(`/Products/Payment?invoiceId=${invoice.id}`);
  };

  const handlePaymentSuccess = () => {
    // Refresh invoices after successful payment submission
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        const response = await getMyInvoices();
        const allInvoices = response?.data || [];
        
        // Transform backend data to match frontend format
        const transformInvoice = (invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderNumber: invoice.orderId,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          totalAmount: Number(invoice.totalAmount) || 0,
          paidAmount: Number(invoice.paidAmount) || 0,
          remainingAmount: invoice.remainingAmount !== null && invoice.remainingAmount !== undefined ? Number(invoice.remainingAmount) : (Number(invoice.totalAmount) || 0),
          paymentStatus: invoice.paymentStatus,
          paymentTerms: invoice.paymentTerms,
          items: (invoice.items || []).map(item => {
            const transformedItem = {
              name: item.name || item.itemName || 'Unknown Item',
              quantity: Number(item.quantity) || 0,
              price: Number(item.unitPrice) || 0, 
              total: Number(item.total) || 0, 
              description: item.description || '',
              unit: item.unit || 'pcs'
            };
            return transformedItem;
          }),
          customer: {
            name: invoice.customerName || 'Unknown Customer',
            email: invoice.customerEmail || ''
          },
          ...(invoice.lastPayment && { lastPayment: invoice.lastPayment }),
          ...(invoice.rejectionReason && { rejectionReason: invoice.rejectionReason })
        });

        setInvoices(allInvoices.map(transformInvoice));
      } catch (error) {
        console.error('Failed to load invoices:', error);
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  };


  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
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

  // Sort invoices function
  const sortInvoices = (invoices) => {
    return [...invoices].sort((a, b) => {
      if (sortField === 'invoiceDate') {
        return sortDirection === 'asc' 
          ? new Date(a.invoiceDate) - new Date(b.invoiceDate)
          : new Date(b.invoiceDate) - new Date(a.invoiceDate);
      }
      if (sortField === 'dueDate') {
        return sortDirection === 'asc' 
          ? new Date(a.dueDate) - new Date(b.dueDate)
          : new Date(b.dueDate) - new Date(a.dueDate);
      }
      if (sortField === 'totalAmount') {
        return sortDirection === 'asc' 
          ? a.totalAmount - b.totalAmount
          : b.totalAmount - a.totalAmount;
      }
      if (sortField === 'invoiceNumber') {
        return sortDirection === 'asc'
          ? a.invoiceNumber.localeCompare(b.invoiceNumber)
          : b.invoiceNumber.localeCompare(a.invoiceNumber);
      }
      return 0;
    });
  };


  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'awaiting payment':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'partially paid':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'awaiting payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'partially paid':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00';
    }
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Sort and paginate invoices
  const sortedInvoices = sortInvoices(invoices);

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = sortedInvoices.slice(startIndex, startIndex + itemsPerPage);

  // Invoice Details Modal
  const invoiceModalContent = showInvoiceModal && selectedInvoice ? (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[120vh] sm:max-h-[120vh] flex flex-col"
        style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">   
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invoice Details</h2>
            <button
              onClick={closeInvoiceModal}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Invoice Number</h3>
              <p className="text-xs sm:text-sm text-gray-900 break-all">{selectedInvoice.invoiceNumber}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Invoice Date</h3>
              <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedInvoice.invoiceDate)}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Due Date</h3>
              <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedInvoice.dueDate)}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Payment Status</h3>
              <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedInvoice.paymentStatus)}`}>
                {getPaymentStatusIcon(selectedInvoice.paymentStatus)}
                <span className="ml-1 capitalize">{selectedInvoice.paymentStatus}</span>
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Remaining Balance</h3>
              <p className="text-xs sm:text-sm font-semibold text-red-600">{formatCurrency(selectedInvoice.remainingAmount)}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Invoice Items</h3>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {selectedInvoice.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start sm:items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{item.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

      {/*Payment Modal */}
        </div>
        {selectedInvoice.remainingAmount > 0 && (
          <div className="p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10">
            <button
              onClick={() => {
                closeInvoiceModal();
                handlePayInvoice(selectedInvoice);
              }}
              className="w-full bg-[#3182ce] text-white px-4 py-3 rounded-lg hover:bg-[#2c5282] transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Make Payment
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;


  return (
    <>
      <TopBarPortal />
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 mb-4 sm:mb-0 sm:-mt-4 sm:-mx-1 md:-mx-15 lg:-mx-40 xl:-mx-48">
          <button 
            onClick={() => handleBreadcrumbClick('/Products')}
            className="hover:text-blue-600 transition-colors"
          >
            Products
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-700 font-medium">Invoices</span>
        </div>
        
        <div className="flex gap-8 md:gap-8 lg:gap-12 mb-6 mt-8 mx-1 md:-mx-15 lg:-mx-30 xl:-mx-35">
          <button 
            onClick={handleBack}
            className="flex items-center justify-center cursor-pointer bg-[#3182ce] hover:bg-[#4992d6] text-white px-3 py-2 rounded-3xl gap-1 transition-colors whitespace-nowrap w-20 sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center sm:text-left sm:-ml-4 -md:ml-2 -lg:ml-2 xl:ml-2">Invoices</h1>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading your invoices...</h3>
            <p className="text-gray-600">Please wait while we fetch your invoices</p>
          </div>
        ) : paginatedInvoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Invoices Yet</h3>
            <p className="text-gray-500 mb-6">Invoices will appear here once your orders are completed and processed.</p>
            <button
              onClick={handleBack}
              className="bg-[#3182ce] cursor-pointer text-white px-6 py-2 rounded-3xl hover:bg-[#2c5282] transition-colors"
            >
              View Products
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('invoiceNumber')}
                    >
                      Invoice #
                      {sortField === 'invoiceNumber' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                      )}
                    </th>
                    <th 
                      className="hidden sm:table-cell px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('invoiceDate')}
                    >
                      Date
                      {sortField === 'invoiceDate' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                      )}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('dueDate')}
                    >
                      Due Date
                      {sortField === 'dueDate' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                      )}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('totalAmount')}
                    >
                      Amount
                      {sortField === 'totalAmount' && (
                        sortDirection === 'asc' ? <ChevronUp className="inline ml-1 w-4 h-4" /> : <ChevronDown className="inline ml-1 w-4 h-4" />
                      )}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="hidden md:table-cell px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={invoice.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(invoice.remainingAmount)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                          {getPaymentStatusIcon(invoice.paymentStatus)}
                          <span className="ml-1 capitalize">{invoice.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="flex px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-[#3182ce] cursor-pointer hover:text-[#2c5282] transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {invoice.remainingAmount > 0 && (
                          <button
                            onClick={() => handlePayInvoice(invoice)}
                            className="text-green-600 cursor-pointer hover:text-green-800 transition-colors flex items-center gap-1 ml-4"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      <ScrollLock active={showInvoiceModal} />
      {createPortal(invoiceModalContent, document.body)}

    </>
  );
};

export default Invoice;
