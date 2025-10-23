import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, FileText, Clock, CheckCircle, X, XCircle, CreditCard, DollarSign, Calendar, ChevronDown, ChevronUp, Upload, Download } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import TopBarPortal from './TopBarPortal';
import PaymentReceiptsModal from './PaymentReceiptsModal';
import { getMyInvoices, downloadInvoicePdf } from '../services/invoiceService';

const Invoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for invoices
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sorting state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('open');
  
  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentReceiptsModal, setShowPaymentReceiptsModal] = useState(false);
  const [showPaymentSuccessNotification, setShowPaymentSuccessNotification] = useState(false);
  const [isDownloadingInvoicePdf, setIsDownloadingInvoicePdf] = useState(false);
  const modalRef = useRef(null);
  
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
              setTimeout(() => {
                setShowPaymentSuccessNotification(false);
              }, 8000);
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
              name: item.name || '',
              modelNo: item.modelNo || '',
              quantity: Number(item.quantity) || 0,
              price: Number(item.unitPrice) || 0, 
              total: Number(item.total) || 0, 
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
              name: item.name || '',
              modelNo: item.modelNo || '',
              quantity: Number(item.quantity) || 0,
              price: Number(item.unitPrice) || 0, 
              total: Number(item.total) || 0, 
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

  const handleViewPaymentReceipts = () => {
    setShowPaymentReceiptsModal(true);
    setShowPaymentSuccessNotification(false); // Close the success notification
  };

  const closePaymentReceiptsModal = () => {
    setShowPaymentReceiptsModal(false);
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

  // Split invoices by status
  const openInvoices = invoices.filter(inv => inv.paymentStatus !== 'completed');
  const completedInvoices = invoices.filter(inv => inv.paymentStatus === 'completed');

  // Sort invoices per tab
  const sortedOpenInvoices = sortInvoices(openInvoices);
  const sortedCompletedInvoices = sortInvoices(completedInvoices);

  // Pagination logic per tab
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOpenInvoices = sortedOpenInvoices.slice(startIndex, startIndex + itemsPerPage);
  const paginatedCompletedInvoices = sortedCompletedInvoices.slice(startIndex, startIndex + itemsPerPage);

  // Invoice Details Modal
  const invoiceModalContent = showInvoiceModal && selectedInvoice ? (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-sm">   
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invoice</h2>
            <button
              onClick={closeInvoiceModal}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {/* Invoice Header */}
          <div className="mb-8 ">
            <div className="flex justify-between items-start mb-6">
              {/* Company Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">AMMEX</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>123 Business Street</p>
                  <p>Makati City, Metro Manila 1234</p>
                  <p>Philippines</p>
                  <p className="mt-2">Phone: +63 2 1234 5678</p>
                  <p>Email: info@ammex.com</p>
                </div>
              </div>
              
              {/* Invoice Details */}
              <div className="text-right ">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">INVOICE</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-gray-600">Invoice #:</span>
                    <span className="font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-gray-600">Date:</span>
                    <span className="text-gray-900">{formatDate(selectedInvoice.invoiceDate)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-gray-600">Due Date:</span>
                    <span className="text-gray-900">{formatDate(selectedInvoice.dueDate)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedInvoice.paymentStatus)}`}>
                      {getPaymentStatusIcon(selectedInvoice.paymentStatus)}
                      <span className="ml-1 capitalize">{selectedInvoice.paymentStatus}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">{selectedInvoice.customer.name}</p>
                  <p>{selectedInvoice.customer.email}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Terms:</h3>
                <p className="text-sm text-gray-600">{selectedInvoice.paymentTerms}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Item Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Model No.</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">Qty</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">Unit Price</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                        <p className="font-medium">{item.name}</p>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-900">
                        {item.modelNo}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                  <span className="text-sm text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Tax:</span>
                  <span className="text-sm text-gray-900">₱0.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                {selectedInvoice.paidAmount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Paid Amount:</span>
                    <span className="text-sm text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-gray-50 px-3 rounded">
                  <span className="text-base font-semibold text-gray-900">Balance Due:</span>
                  <span className={`text-base font-bold ${selectedInvoice.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedInvoice.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-gray-200 ">
            <p className="text-xs text-gray-500 text-center">
              This invoice serves as proof of purchase. For any inquiries, please contact our support team with your invoice number.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 border-t flex justify-end border-gray-200 sticky bottom-0 bg-white z-10 rounded-sm">
          <div className="flex gap-3">
            <button
              onClick={closeInvoiceModal}
              className="flex justify-center cursor-pointer items-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg transition-colors gap-2"
            >
              Close
            </button>
            <button
              onClick={() => {
                (async () => {
                  try {
                    setIsDownloadingInvoicePdf(true);
                    const blob = await downloadInvoicePdf(selectedInvoice.id);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Invoice-${selectedInvoice.invoiceNumber}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Failed to download invoice PDF:', err);
                    alert('Failed to download invoice PDF. Please try again later.');
                  } finally {
                    setIsDownloadingInvoicePdf(false);
                  }
                })();
              }}
              disabled={isDownloadingInvoicePdf}
              className={`flex justify-center items-center border border-gray-300 px-4 py-2.5 rounded-lg transition-colors gap-2 ${
                isDownloadingInvoicePdf
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'cursor-pointer text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isDownloadingInvoicePdf ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download PDF
                </>
              )}
            </button>
          </div>
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
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px- flex space-x-8 justify-between">
              <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab('open'); setCurrentPage(1); }}
                className={`py-3 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'open'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-5 h-5" />
                Open Invoices
                <span className="bg-blue-100 text-blue-600 py-1 px-2.5 rounded-full text-xs font-medium">
                  {openInvoices.length}
                </span>
              </button>
              <button
                onClick={() => { setActiveTab('completed'); setCurrentPage(1); }}
                className={`py-3.5 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'completed'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                Invoice History
              </button>
              </div>
              <div className="flex -mr-36 items-center gap-2">
                <button
                  onClick={handleViewPaymentReceipts}
                  className="inline-flex items-center gap-2 cursor-pointer border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm md:mr-16 lg:mr-36"
                >
                  <span>View Payment Receipts</span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'open' && (
          <>
            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading your invoices...</h3>
                <p className="text-gray-600">Please wait while we fetch your invoices</p>
              </div>
            ) : paginatedOpenInvoices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Open Invoices</h3>
                <p className="text-gray-500 mb-6">Open invoices will appear here once your orders are invoiced.</p>
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
                      {paginatedOpenInvoices.map((invoice) => (
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
          </>
        )}

        {activeTab === 'completed' && (
          <>
            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading your invoices...</h3>
                <p className="text-gray-600">Please wait while we fetch your invoices</p>
              </div>
            ) : paginatedCompletedInvoices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Completed Invoices</h3>
                <p className="text-gray-500">You have no completed invoices yet.</p>
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
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedCompletedInvoices.map((invoice) => (
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
                          <td className="flex px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewInvoice(invoice)}
                              className="text-[#3182ce] cursor-pointer hover:text-[#2c5282] transition-colors flex items-center gap-1 ml-auto"
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
      </div>


      <ScrollLock active={showInvoiceModal} />
      {createPortal(invoiceModalContent, document.body)}

      {/* Payment Receipts Modal */}
      <PaymentReceiptsModal
        isOpen={showPaymentReceiptsModal}
        onClose={closePaymentReceiptsModal}
      />

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
                  onClick={handleViewPaymentReceipts}
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
