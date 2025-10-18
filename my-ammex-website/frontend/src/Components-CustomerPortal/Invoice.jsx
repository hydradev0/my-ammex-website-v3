import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, FileText, Clock, CheckCircle, X, XCircle, CreditCard, DollarSign, Calendar, ChevronDown, ChevronUp, Upload, Download } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import TopBarPortal from './TopBarPortal';
import { getMyInvoices } from '../services/invoiceService';
import { getMyPaymentReceipts, getPaymentReceiptDetails, printReceipt, formatPaymentMethod } from '../services/receiptService';

const Invoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for invoices
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sorting state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentReceiptsModal, setShowPaymentReceiptsModal] = useState(false);
  const [isPaymentReceiptsModalAnimating, setIsPaymentReceiptsModalAnimating] = useState(false);
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false);
  const [isReceiptDetailModalAnimating, setIsReceiptDetailModalAnimating] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [paymentReceipts, setPaymentReceipts] = useState([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [showPaymentSuccessNotification, setShowPaymentSuccessNotification] = useState(false);
  const modalRef = useRef(null);
  const paymentReceiptsModalRef = useRef(null);
  const receiptDetailModalRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        // Check if returning from GCash/e-wallet payment
        const urlParams = new URLSearchParams(location.search);
        const paymentStatus = urlParams.get('payment');
        
            if (paymentStatus === 'success') {
              // Clear URL parameter to prevent infinite loops on reload
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Show success notification
              setShowPaymentSuccessNotification(true);
              console.log('✅ Payment completed successfully! Showing notification...');
              
              // Auto-hide notification after 8 seconds
              const hideTimer = setTimeout(() => {
                setShowPaymentSuccessNotification(false);
              }, 8000);
              
              // Cleanup timer on unmount
              return () => clearTimeout(hideTimer);
            }
        
        if (paymentStatus === 'failed') {
          // E-wallet payment failed
          window.history.replaceState({}, document.title, window.location.pathname);
          // You can add a failure notification here if needed
        }


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
      if (showPaymentReceiptsModal && paymentReceiptsModalRef.current && event.target === paymentReceiptsModalRef.current) {
        closePaymentReceiptsModal();
      }
      if (showReceiptDetailModal && receiptDetailModalRef.current && event.target === receiptDetailModalRef.current) {
        closeReceiptDetailModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInvoiceModal, showPaymentReceiptsModal, showReceiptDetailModal]);

  // Handle payment receipts modal animation
  useEffect(() => {
    if (showPaymentReceiptsModal) {
      // Small delay to ensure the modal is rendered before animation starts
      const timer = setTimeout(() => {
        setIsPaymentReceiptsModalAnimating(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showPaymentReceiptsModal]);

  // Handle receipt detail modal animation
  useEffect(() => {
    if (showReceiptDetailModal) {
      const timer = setTimeout(() => {
        setIsReceiptDetailModalAnimating(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showReceiptDetailModal]);

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

  const handleViewPaymentReceipts = async () => {
    setIsLoadingReceipts(true);
    setShowPaymentReceiptsModal(true);
    setIsPaymentReceiptsModalAnimating(true);
    
    try {
      const response = await getMyPaymentReceipts();
      setPaymentReceipts(response.data || []);
    } catch (error) {
      console.error('Failed to load payment receipts:', error);
      setPaymentReceipts([]);
    } finally {
      setIsLoadingReceipts(false);
    }
  };

  const closePaymentReceiptsModal = () => {
    setIsPaymentReceiptsModalAnimating(false);
    setTimeout(() => {
      setShowPaymentReceiptsModal(false);
    }, 500); // Match the animation duration
  };

  const handleViewReceiptDetail = async (receiptId) => {
    try {
      const response = await getPaymentReceiptDetails(receiptId);
      setSelectedReceipt(response.data);
      setShowReceiptDetailModal(true);
      setIsReceiptDetailModalAnimating(true);
    } catch (error) {
      console.error('Failed to load receipt details:', error);
    }
  };

  const closeReceiptDetailModal = () => {
    setIsReceiptDetailModalAnimating(false);
    setTimeout(() => {
      setShowReceiptDetailModal(false);
      setSelectedReceipt(null);
    }, 500);
  };

  const handleDownloadReceipt = async (receiptId) => {
    try {
      await printReceipt(receiptId);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
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

  const getPaymentReceiptStatusColor = (status) => {
    switch (status) {
      case 'Partial':
        return 'bg-orange-100 text-orange-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
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
      return '₱0.00';
    }
    return `₱${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  // Payment Receipts Modal
  const paymentReceiptsModalContent = showPaymentReceiptsModal ? (
    <div 
      ref={paymentReceiptsModalRef}
      className={`fixed inset-0 bg-black/30 flex items-end sm:items-center justify-end z-50 p-0 sm:p-0 transition-opacity duration-300 ${
        isPaymentReceiptsModalAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-white rounded-t-2xl sm:rounded-l-2xl sm:rounded-r-none shadow-2xl w-full sm:w-[85vw] sm:max-w-xl h-[100vh] sm:h-[100vh] flex flex-col transform transition-all duration-500 ease-in-out ${
          isPaymentReceiptsModalAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">   
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment Receipts</h2>
              <p className="text-sm text-gray-600 mt-1">Your payment history and receipts</p>
            </div>
            <button
              onClick={closePaymentReceiptsModal}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          {isLoadingReceipts ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading receipts...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paymentReceipts.map((receipt) => (
                  <div 
                    key={receipt.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="text-base font-bold text-gray-900">{receipt.receiptNumber}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {receipt.invoice?.invoiceNumber || 'N/A'} • {formatDate(receipt.paymentDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Payment Amount</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(receipt.amount)}</p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-gray-50 rounded-md p-3 mb-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Payment Method</span>
                          <p className="font-semibold text-gray-900">{formatPaymentMethod(receipt.paymentMethod)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Balance After Payment</span>
                          <p className={`font-semibold ${Number(receipt.remainingAmount) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {formatCurrency(receipt.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reference Info */}
                    {receipt.paymentReference && (
                      <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        <span className="font-normal">Ref: </span>{receipt.paymentReference}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end border-t border-gray-200 pt-3">
                      <button 
                        onClick={() => handleViewReceiptDetail(receipt.id)}
                        className="flex items-center gap-1 border border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-600 px-2 py-1.5 rounded-lg text-sm transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadReceipt(receipt.id);
                        }}
                        className="flex items-center gap-1 border border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-600 px-2 py-1.5 rounded-lg text-sm transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {paymentReceipts.length === 0 && !isLoadingReceipts && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payment Receipts</h3>
                  <p className="text-gray-500">Payment receipts will appear here once payments are processed.</p>
                </div>
              )}
            </>
          )}
        </div>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6 mt-8 mx-1 md:-mx-15 lg:-mx-30 xl:-mx-35">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="flex items-center justify-center cursor-pointer bg-[#3182ce] hover:bg-[#4992d6] text-white px-3 py-2 rounded-3xl gap-1 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800 lg:ml-12">Invoices</h1>
          </div>
          <button
            onClick={handleViewPaymentReceipts}
            className="inline-flex items-center gap-2 cursor-pointer border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm md:mr-16 lg:mr-36"
          >
            <span>View Payment Receipts</span>
          </button>
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

      {/* Receipt Detail Modal (Nested) */}
      {showReceiptDetailModal && selectedReceipt && createPortal(
        <div 
          ref={receiptDetailModalRef}
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 transition-opacity duration-300 ${
            isReceiptDetailModalAnimating ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className={`bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ${
              isReceiptDetailModalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">   
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Receipt Details</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedReceipt.receiptNumber}</p>
                </div>
                <button
                  onClick={closeReceiptDetailModal}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
              {/* Receipt Header */}
              <div className="border-b-2 border-gray-900 pb-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Payment Receipt</p>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedReceipt.receiptNumber}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount Paid</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedReceipt.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Payment Confirmed</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-6">
                {/* Payment Information Card */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Payment Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(selectedReceipt.paymentDate)}</p>
                      <p className="text-xs text-gray-500">{new Date(selectedReceipt.paymentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Method</p>
                      <p className="text-sm font-semibold text-gray-900">{formatPaymentMethod(selectedReceipt.paymentMethod)}</p>
                    </div>
                    {selectedReceipt.paymentReference && (
                      <div className="sm:col-span-2 space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction Reference</p>
                        <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900">{selectedReceipt.paymentReference}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Information Card */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Invoice Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice Number</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedReceipt.invoice?.invoiceNumber || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice Date</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedReceipt.invoice?.invoiceDate ? formatDate(selectedReceipt.invoice.invoiceDate) : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information Card */}
                {selectedReceipt.customer && (
                  <div className="border border-gray-200 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Customer Information</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer Name</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedReceipt.customer.customerName || selectedReceipt.customer.contactName || 'N/A'}</p>
                      </div>
                      {selectedReceipt.customer.email1 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</p>
                          <p className="text-sm text-gray-900">{selectedReceipt.customer.email1}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Breakdown */}
                <div className="border-2 border-gray-900 rounded-lg p-5 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4">Payment Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-700">Invoice Total</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedReceipt.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-300">
                      <span className="text-sm text-gray-700">This Payment</span>
                      <span className="text-sm font-semibold text-gray-900">- {formatCurrency(selectedReceipt.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t-2 border-gray-900 pt-3">
                      <span className="text-base font-bold text-gray-900">Balance Remaining</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(selectedReceipt.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-gray-600 text-center">
                    This receipt serves as proof of payment. For any inquiries, please contact our support team with your receipt number.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10 rounded-b-lg">
              <div className="flex gap-2 justify-end">
                <button
                  onClick={closeReceiptDetailModal}
                  className="px-3 py-2 border cursor-pointer border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadReceipt(selectedReceipt.id)}
                  className="flex items-center cursor-pointer gap-1 px-2 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Invoice Details Modal */}
      <ScrollLock active={showInvoiceModal || showPaymentReceiptsModal || showReceiptDetailModal} />
      {createPortal(invoiceModalContent, document.body)}
      {createPortal(paymentReceiptsModalContent, document.body)}

      {/* Payment Success Notification */}
      {showPaymentSuccessNotification && createPortal(
        <div className="fixed top-4 right-4 z-[9999] transition-all duration-300 ease-out">
          <div className="bg-white rounded-lg shadow-2xl border-l-4 border-green-500 p-4 max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Payment Successful!
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Your payment has been processed successfully. Your receipt has been generated and is available below.
                </p>
                <button
                  onClick={() => handleOpenPaymentReceiptsModal()}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                >
                  View Payment Receipts
                </button>
              </div>
              <button
                onClick={() => setShowPaymentSuccessNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Invoice;
