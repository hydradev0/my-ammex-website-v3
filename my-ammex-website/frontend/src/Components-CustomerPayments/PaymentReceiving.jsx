import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Clock, DollarSign, Receipt, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import PaymentTable from './PaymentTable';
import RejectedPaymentsTable from './RejectedPaymentsTable';
import PaymentApprovalModal from './PaymentApprovalModal';
import PaymentHistoryTab from './PaymentHistoryTab';
import BalanceTab from './BalanceTab';
import { 
  getPendingPayments, 
  getRejectedPayments, 
  approvePayment, 
  rejectPayment,
  getPaymentMethods,
  getBalanceHistory,
  getAllPaymentHistory,
  reapprovePayment,
  deleteRejectedPayment
} from '../services/paymentService';

const PaymentReceiving = () => {
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'balance', 'history', 'rejected'
  
  // State for pending payments
  const [pendingPayments, setPendingPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  
  // State for rejected payments
  const [rejectedPayments, setRejectedPayments] = useState([]);
  const [filteredRejectedPayments, setFilteredRejectedPayments] = useState([]);
  
  // State for balance tracking and payment history
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Loading states
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isLoadingRejected, setIsLoadingRejected] = useState(false);
  
  // Search and filter states for pending payments
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Search and filter states for rejected payments
  const [rejectedSearchTerm, setRejectedSearchTerm] = useState('');
  const [rejectedSelectedPaymentMethod, setRejectedSelectedPaymentMethod] = useState('all');
  const [rejectedDateRange, setRejectedDateRange] = useState({ start: '', end: '' });
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Payment methods management
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Set loading states
        setIsLoadingPending(true);
        setIsLoadingRejected(true);
        setIsLoadingBalance(true);
        setIsLoadingHistory(true);

        // Load pending payments
        const pendingResponse = await getPendingPayments();
        const pendingData = (pendingResponse.data || []).map(p => ({
          id: p.id,
          customerName: p.customer?.customer_name || p.customerName || 'Unknown',
          customerEmail: p.customer?.email1 || p.customerEmail || '',
          invoiceNumber: p.invoice?.invoiceNumber || p.invoiceNumber || '',
          amount: Number(p.amount) || 0,
          paymentMethod: p.paymentMethod || p.payment_method || '',
          reference: p.reference || '',
          status: p.status || 'pending_approval',
          submittedDate: p.submittedAt || p.submitted_at || p.createdAt || p.created_at,
          attachments: p.attachments || []
        }));
        setPendingPayments(pendingData);
        setFilteredPayments(pendingData);

        // Load rejected payments
        const rejectedResponse = await getRejectedPayments();
        const rejectedData = (rejectedResponse.data || []).map(p => ({
          id: p.id,
          customerName: p.customer?.customer_name || p.customerName || 'Unknown',
          customerEmail: p.customer?.email1 || p.customerEmail || '',
          invoiceNumber: p.invoice?.invoiceNumber || p.invoiceNumber || '',
          amount: Number(p.amount) || 0,
          paymentMethod: p.paymentMethod || p.payment_method || '',
          reference: p.reference || '',
          status: 'rejected',
          rejectedDate: p.reviewedAt || p.reviewed_at || p.updatedAt || p.updated_at,
          rejectionReason: p.rejectionReason || p.rejection_reason || '',
          attachments: p.attachments || []
        }));
        setRejectedPayments(rejectedData);
        setFilteredRejectedPayments(rejectedData);

        // Load payment methods
        try {
          const paymentMethodsResponse = await getPaymentMethods();
          setPaymentMethods(paymentMethodsResponse.data || []);
        } catch (error) {
          console.error('Failed to load payment methods:', error);
          // Fallback to empty array if API fails
          setPaymentMethods([]);
        }

        // Load balance history
        try {
          const balanceHistoryResponse = await getBalanceHistory();
          const bhRaw = (balanceHistoryResponse.data || []).map(h => ({
            id: h.id,
            customerName: h.customer?.customer_name || 'Unknown',
            invoiceNumber: h.invoice?.invoiceNumber || '',
            invoiceId: h.invoice?.id,
            action: h.action,
            timestamp: h.createdAt || h.created_at,
            dueDate: h.invoice?.dueDate || h.invoice?.due_date,
            paidAmount: Number(h.invoice?.paidAmount ?? h.invoice?.paid_amount ?? 0),
            remainingAmount: Number(h.invoice?.remainingBalance ?? h.invoice?.remaining_balance ?? 0),
            details: {
              amount: Number(h.amount) || 0,
              paymentMethod: h.paymentMethod || h.payment_method || '',
              reference: h.reference || ''
            }
          }));
          const outstanding = bhRaw.filter(h => h.remainingAmount > 0);
          // Deduplicate by invoice (keep latest timestamp per invoice)
          const latestBalanceByInvoice = Object.values(
            outstanding.reduce((acc, cur) => {
              const key = cur.invoiceId || cur.invoiceNumber || cur.id;
              const prev = acc[key];
              if (!prev || new Date(cur.timestamp) > new Date(prev.timestamp)) {
                acc[key] = cur;
              }
              return acc;
            }, {})
          );
          setBalanceHistory(latestBalanceByInvoice);
        } catch (error) {
          console.error('Failed to load balance history:', error);
          // Fallback to empty array if API fails
          setBalanceHistory([]);
        }

        // Load payment history (completed payments only, deduplicated per invoice)
        try {
          const paymentHistoryResponse = await getAllPaymentHistory();
          const phRaw = (paymentHistoryResponse.data || []).map(h => ({
            id: h.id,
            customerName: h.customer?.customer_name || 'Unknown',
            invoiceNumber: h.invoice?.invoice_number || h.invoice?.invoiceNumber || '',
            invoiceId: h.invoice?.id,
            action: h.action,
            timestamp: h.createdAt || h.created_at,
            remainingAmount: Number(h.invoice?.remainingBalance ?? h.invoice?.remaining_balance ?? 0),
            details: {
              amount: Number(h.amount) || 0,
              paymentMethod: h.paymentMethod || h.payment_method || '',
              reference: h.reference || ''
            }
          }));
          // Keep only latest record per invoiceId
          const completed = phRaw.filter(h => h.remainingAmount === 0);
          const latestCompletedByInvoice = Object.values(
            completed.reduce((acc, cur) => {
              const key = cur.invoiceId || cur.invoiceNumber || cur.id;
              const prev = acc[key];
              if (!prev || new Date(cur.timestamp) > new Date(prev.timestamp)) {
                acc[key] = cur;
              }
              return acc;
            }, {})
          ).map(h => ({ ...h, action: 'Payment Completed' }));
          const ph = latestCompletedByInvoice;
          setPaymentHistory(ph);
        } catch (error) {
          console.error('Failed to load payment history:', error);
          // Fallback to empty array if API fails
          setPaymentHistory([]);
        }

        // Clear loading states after all data is loaded
        setIsLoadingPending(false);
        setIsLoadingRejected(false);
        setIsLoadingBalance(false);
        setIsLoadingHistory(false);
      } catch (error) {
        console.error('Failed to load payment data:', error);
        // Clear loading states on error as well
        setIsLoadingPending(false);
        setIsLoadingRejected(false);
        setIsLoadingBalance(false);
        setIsLoadingHistory(false);
      }
    };

    loadData();
  }, []);

  // Filter payments based on search and filters
  useEffect(() => {
    let filtered = pendingPayments;

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        String(payment.customerName || '').toLowerCase().includes(q) ||
        String(payment.invoiceNumber || '').toLowerCase().includes(q) ||
        String(payment.reference || '').toLowerCase().includes(q)
      );
    }

    // Payment method filter
    if (selectedPaymentMethod !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === selectedPaymentMethod);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.submittedDate);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    setFilteredPayments(filtered);
  }, [pendingPayments, searchTerm, selectedPaymentMethod, dateRange]);

  // Filter rejected payments based on search and filters
  useEffect(() => {
    let filtered = rejectedPayments;

    // Search filter
    if (rejectedSearchTerm) {
      const q = rejectedSearchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        String(payment.customerName || '').toLowerCase().includes(q) ||
        String(payment.invoiceNumber || '').toLowerCase().includes(q) ||
        String(payment.reference || '').toLowerCase().includes(q)
      );
    }

    // Payment method filter
    if (rejectedSelectedPaymentMethod !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === rejectedSelectedPaymentMethod);
    }

    // Date range filter
    if (rejectedDateRange.start && rejectedDateRange.end) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.submittedDate);
        const startDate = new Date(rejectedDateRange.start);
        const endDate = new Date(rejectedDateRange.end);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    setFilteredRejectedPayments(filtered);
  }, [rejectedPayments, rejectedSearchTerm, rejectedSelectedPaymentMethod, rejectedDateRange]);



  // Payment approval handlers
  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowApprovalModal(true);
  };

  const handleApprovePayment = async (editedAmount) => {
    if (!selectedPayment) return;
    
    try {
      await approvePayment(selectedPayment.id, editedAmount);
      
      // Remove from pending payments
      const updatedPayments = pendingPayments.filter(p => p.id !== selectedPayment.id);
      setPendingPayments(updatedPayments);
      setFilteredPayments(updatedPayments);

      // Refresh balance tracking and payment history (reuse dedup/completed logic)
      try {
        const [bhRes, phRes] = await Promise.all([
          getBalanceHistory(),
          getAllPaymentHistory()
        ]);
        const bhRaw = (bhRes.data || []).map(h => ({
          id: h.id,
          customerName: h.customer?.customer_name || 'Unknown',
          invoiceNumber: h.invoice?.invoiceNumber || '',
          invoiceId: h.invoice?.id,
          action: h.action,
          timestamp: h.createdAt || h.created_at,
          dueDate: h.invoice?.dueDate || h.invoice?.due_date,
          paidAmount: Number(h.invoice?.paidAmount ?? h.invoice?.paid_amount ?? 0),
          remainingAmount: Number(h.invoice?.remainingBalance ?? h.invoice?.remaining_balance ?? 0),
          details: { amount: Number(h.amount) || 0, paymentMethod: h.paymentMethod || h.payment_method || '', reference: h.reference || '' }
        }));
        const outstanding = bhRaw.filter(h => h.remainingAmount > 0);
        const latestBalanceByInvoice = Object.values(
          outstanding.reduce((acc, cur) => {
            const key = cur.invoiceId || cur.invoiceNumber || cur.id;
            const prev = acc[key];
            if (!prev || new Date(cur.timestamp) > new Date(prev.timestamp)) {
              acc[key] = cur;
            }
            return acc;
          }, {})
        );
        setBalanceHistory(latestBalanceByInvoice);

        const phRaw = (phRes.data || []).map(h => ({
          id: h.id,
          customerName: h.customer?.customer_name || 'Unknown',
          invoiceNumber: h.invoice?.invoice_number || h.invoice?.invoiceNumber || '',
          invoiceId: h.invoice?.id,
          action: h.action,
          timestamp: h.createdAt || h.created_at,
          remainingAmount: Number(h.invoice?.remainingBalance ?? h.invoice?.remaining_balance ?? 0),
          details: { amount: Number(h.amount) || 0, paymentMethod: h.paymentMethod || h.payment_method || '', reference: h.reference || '' }
        }));
        const completed = phRaw.filter(h => h.remainingAmount === 0);
        const latestCompletedByInvoice = Object.values(
          completed.reduce((acc, cur) => {
            const key = cur.invoiceId || cur.invoiceNumber || cur.id;
            const prev = acc[key];
            if (!prev || new Date(cur.timestamp) > new Date(prev.timestamp)) {
              acc[key] = cur;
            }
            return acc;
          }, {})
        ).map(h => ({ ...h, action: 'Payment Completed' }));
        setPaymentHistory(latestCompletedByInvoice);
      } catch (e) {
        console.error('Failed to refresh histories:', e);
      }
      
      closeApprovalModal();
    } catch (error) {
      console.error('Failed to approve payment:', error);
      // You might want to show an error message to the user
    }
  };

  const handleRejectPayment = async (payment, rejectionReason) => {
    if (!payment) return;
    
    try {
      await rejectPayment(payment.id, rejectionReason);
      
      // Remove from pending payments
      const updatedPendingPayments = pendingPayments.filter(p => p.id !== payment.id);
      setPendingPayments(updatedPendingPayments);
      setFilteredPayments(updatedPendingPayments);
      
      // Add to rejected payments with rejection timestamp
      const rejectedPayment = {
        ...payment,
        status: 'rejected',
        rejectedDate: new Date().toISOString(),
        rejectionReason: rejectionReason || 'Payment rejected by admin'
      };
      setRejectedPayments([rejectedPayment, ...rejectedPayments]);
      setFilteredRejectedPayments([rejectedPayment, ...filteredRejectedPayments]);
      
      closeApprovalModal();
    } catch (error) {
      console.error('Failed to reject payment:', error);
      // You might want to show an error message to the user
    }
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedPayment(null);
  };

  // Re-approve rejected payment
  const handleReApprovePayment = async (payment) => {
    try {
      await reapprovePayment(payment.id);

      // Refresh lists from server to avoid reappearing on reload
      const [pendingRes, rejectedRes] = await Promise.all([
        getPendingPayments(),
        getRejectedPayments()
      ]);

      const pendingData = (pendingRes.data || []).map(p => ({
        id: p.id,
        customerName: p.customer?.customer_name || p.customerName || 'Unknown',
        customerEmail: p.customer?.email1 || p.customerEmail || '',
        invoiceNumber: p.invoice?.invoiceNumber || p.invoiceNumber || '',
        amount: Number(p.amount) || 0,
        paymentMethod: p.paymentMethod || p.payment_method || '',
        reference: p.reference || '',
        status: p.status || 'pending_approval',
        submittedDate: p.submittedAt || p.submitted_at || p.createdAt || p.created_at,
        attachments: p.attachments || []
      }));
      setPendingPayments(pendingData);
      setFilteredPayments(pendingData);

      const rejectedData = (rejectedRes.data || []).map(p => ({
        id: p.id,
        customerName: p.customer?.customer_name || p.customerName || 'Unknown',
        customerEmail: p.customer?.email1 || p.customerEmail || '',
        invoiceNumber: p.invoice?.invoiceNumber || p.invoiceNumber || '',
        amount: Number(p.amount) || 0,
        paymentMethod: p.paymentMethod || p.payment_method || '',
        reference: p.reference || '',
        status: 'rejected',
        rejectedDate: p.reviewedAt || p.reviewed_at || p.updatedAt || p.updated_at,
        rejectionReason: p.rejectionReason || p.rejection_reason || '',
        attachments: p.attachments || []
      }));
      setRejectedPayments(rejectedData);
      setFilteredRejectedPayments(rejectedData);

    } catch (error) {
      console.error('Failed to re-approve payment:', error);
    }
  };

  // Permanently delete rejected payment (persist to backend and refresh)
  const handleDeleteRejectedPayment = async (payment) => {
    try {
      await deleteRejectedPayment(payment.id);
      const rejectedRes = await getRejectedPayments();
      const rejectedData = (rejectedRes.data || []).map(p => ({
        id: p.id,
        customerName: p.customer?.customer_name || p.customerName || 'Unknown',
        customerEmail: p.customer?.email1 || p.customerEmail || '',
        invoiceNumber: p.invoice?.invoiceNumber || p.invoiceNumber || '',
        amount: Number(p.amount) || 0,
        paymentMethod: p.paymentMethod || p.payment_method || '',
        reference: p.reference || '',
        status: 'rejected',
        rejectedDate: p.reviewedAt || p.reviewed_at || p.updatedAt || p.updated_at,
        rejectionReason: p.rejectionReason || p.rejection_reason || '',
        attachments: p.attachments || []
      }));
      setRejectedPayments(rejectedData);
      setFilteredRejectedPayments(rejectedData);
    } catch (error) {
      console.error('Failed to delete rejected payment:', error);
    }
  };

  // Payment methods management handlers
  const handleManagePaymentMethods = () => {
    navigate('/Sales/ManagePaymentMethods');
  };

  const handleAddPaymentMethod = (methodData) => {
    setPaymentMethods([...paymentMethods, methodData]);
  };

  const handleUpdatePaymentMethod = (methodData) => {
    const updatedMethods = paymentMethods.map(m => 
      m.id === methodData.id ? methodData : m
    );
    setPaymentMethods(updatedMethods);
  };

  const handleDeletePaymentMethod = (methodId) => {
    const updatedMethods = paymentMethods.filter(m => m.id !== methodId);
    setPaymentMethods(updatedMethods);
  };


  // Utility functions
  const getPaymentMethodName = (method) => {
    const methodObj = paymentMethods.find(m => m.name.toLowerCase().replace(/\s+/g, '_') === method);
    return methodObj ? methodObj.name : method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Action handlers for the separate tab components
  const handleSendReminder = (item) => {
    console.log('Sending reminder for:', item);
    // Add logic to send reminder
  };

  const handleMarkAsPaid = (item) => {
    // Update the balance history to mark the item as paid
    const updatedBalanceHistory = balanceHistory.map(balanceItem => 
      balanceItem.id === item.id 
        ? { 
            ...balanceItem, 
            action: 'Paid',
            timestamp: new Date().toISOString(),
            details: {
              ...balanceItem.details,
              previousStatus: balanceItem.action,
              newStatus: 'Paid'
            }
          } 
        : balanceItem
    );
    setBalanceHistory(updatedBalanceHistory);
    
    // Add to payment history
    const newPaymentRecord = {
      id: `HIST-${Date.now()}`, 
      customerName: item.customerName,
      customerAddress: item.customerAddress,
      invoiceNumber: item.invoiceNumber,
      action: 'Marked as Paid',
      timestamp: new Date().toISOString(),
      details: {
        amount: item.details.amount,
        paymentMethod: 'Manual Entry',
        reference: `MANUAL-${Date.now()}`
      }
    };
    setPaymentHistory([newPaymentRecord, ...paymentHistory]);
  };

  const handleDownloadPDF = (item) => {
    console.log('Downloading PDF for:', item);
    // Add logic to download PDF
  };

  // Configure dropdown filters for ModernSearchFilter component
  const dropdownFilters = [
    {
      id: 'paymentMethod',
      value: selectedPaymentMethod,
      setValue: setSelectedPaymentMethod,
      options: [
        { value: 'all', label: 'All Payment Methods' },
        ...paymentMethods.map(method => ({
          value: method.name.toLowerCase().replace(/\s+/g, '_'),
          label: method.name
        }))
      ]
    }
  ];

  // Configure dropdown filters for rejected payments
  const rejectedDropdownFilters = [
    {
      id: 'rejectedPaymentMethod',
      value: rejectedSelectedPaymentMethod,
      setValue: setRejectedSelectedPaymentMethod,
      options: [
        { value: 'all', label: 'All Payment Methods' },
        ...paymentMethods.map(method => ({
          value: method.name.toLowerCase().replace(/\s+/g, '_'),
          label: method.name
        }))
      ]
    }
  ];

  const handlePaymentHistoryAction = (item, action) => {
    if (action === 'download_pdf') {
      handleDownloadPDF(item);
    } else if (action === 'view_details') {
      console.log('Viewing payment details:', item);
    } else if (action === 'export_record') {
      console.log('Exporting payment record:', item);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            </div>
            <button
              onClick={handleManagePaymentMethods}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage Payment Methods
            </button>
          </div>
        </div>

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
                  {pendingPayments.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('balance')}
                className={`py-2 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'balance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Balance Tracking
                <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {balanceHistory.length}
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
                  {rejectedPayments.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Payment History
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
              searchPlaceholder="Search customer, invoice, or reference..."
              dropdownFilters={dropdownFilters}
              dateRange={dateRange}
              setDateRange={setDateRange}
              showDateRange={true}
              filteredCount={filteredPayments.length}
              totalCount={pendingPayments.length}
              itemLabel="payments"
            />

            {/* Pending Payments Table */}
            <PaymentTable
              payments={filteredPayments}
              onViewPayment={handleViewPayment}
              getPaymentMethodName={getPaymentMethodName}
              isLoading={isLoadingPending}
            />
          </>
        )}

                   {/* Balance Tracking Tab Content */}
          {activeTab === 'balance' && (
            <BalanceTab
              historyData={balanceHistory}
              searchPlaceholder="Search balance history..."
              itemLabel="balance records"
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
              isLoading={isLoadingBalance}
              onSendReminder={handleSendReminder}
              onMarkAsPaid={handleMarkAsPaid}
            />
          )}

          {/* Rejected Tab Content */}
          {activeTab === 'rejected' && (
            <>
              {/* Search and Filters */}
              <ModernSearchFilter
                searchTerm={rejectedSearchTerm}
                setSearchTerm={setRejectedSearchTerm}
                searchPlaceholder="Search rejected payments..."
                dropdownFilters={rejectedDropdownFilters}
                dateRange={rejectedDateRange}
                setDateRange={setRejectedDateRange}
                showDateRange={true}
                filteredCount={filteredRejectedPayments.length}
                totalCount={rejectedPayments.length}
                itemLabel="rejected payments"
              />

              {/* Rejected Payments Table */}
              <RejectedPaymentsTable
                payments={filteredRejectedPayments}
                onReApprove={handleReApprovePayment}
                onViewDetails={handleViewPayment}
                onDelete={handleDeleteRejectedPayment}
                getPaymentMethodName={getPaymentMethodName}
                formatCurrency={formatCurrency}
                formatDateTime={formatDateTime}
                isLoading={isLoadingRejected}
              />
            </>
          )}

          {/* Payment History Tab Content */}
          {activeTab === 'history' && (
            <PaymentHistoryTab
              historyData={paymentHistory}
              searchPlaceholder="Search payment history..."
              itemLabel="payment records"
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
              onCustomAction={handlePaymentHistoryAction}
              tabType="history"
            />
          )}
      </div>

      {/* Modals */}
      <PaymentApprovalModal
        payment={selectedPayment}
        isOpen={showApprovalModal}
        onClose={closeApprovalModal}
        onApprove={handleApprovePayment}
        onReject={handleRejectPayment}
        getPaymentMethodName={getPaymentMethodName}
      />
    </>
  );
};

export default PaymentReceiving;
