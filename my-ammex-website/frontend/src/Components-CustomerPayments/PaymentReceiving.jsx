import React, { useState, useEffect } from 'react';
import { Settings, Clock, DollarSign, Receipt, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import PaymentTable from './PaymentTable';
import RejectedPaymentsTable from './RejectedPaymentsTable';
import PaymentApprovalModal from './PaymentApprovalModal';
import PaymentMethodsManager from './PaymentMethodsManager';
import PaymentHistoryTab from './PaymentHistoryTab';
import BalanceTab from './BalanceTab';

const PaymentReceiving = () => {
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
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Payment methods management
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Mock data initialization
  useEffect(() => {
    const mockPendingPayments = [
      {
        id: 'PAY-001',
        invoiceNumber: 'INV-2024-001',
        customerName: 'ABC Manufacturing Corp',
        customerEmail: 'purchasing@abcmfg.com',
        amount: 1450.00,
        paymentMethod: 'bank_transfer',
        reference: 'TXN-ABC-002',
        submittedDate: new Date('2024-01-22').toISOString(),
        notes: 'Payment for outstanding invoice balance',
        status: 'pending_approval',
        attachments: ['receipt_abc_001.pdf']
      },
      {
        id: 'PAY-002',
        invoiceNumber: 'INV-2024-002',
        customerName: 'XYZ Healthcare Services',
        customerEmail: 'orders@xyzhealthcare.com',
        amount: 1850.75,
        paymentMethod: 'check',
        reference: 'CHK-9876',
        submittedDate: new Date('2024-01-23').toISOString(),
        notes: 'Check payment for full invoice amount',
        status: 'pending_approval',
        attachments: ['check_image_xyz.jpg']
      },
      {
        id: 'PAY-003',
        invoiceNumber: 'INV-2024-005',
        customerName: 'JKL Chemical Solutions',
        customerEmail: 'accounts@jklchem.com',
        amount: 625.25,
        paymentMethod: 'gcash',
        reference: 'GCASH-789456123',
        submittedDate: new Date('2024-01-24').toISOString(),
        notes: 'Partial payment via GCash',
        status: 'pending_approval',
        attachments: ['gcash_receipt.png']
      },
      {
        id: 'PAY-004',
        invoiceNumber: 'INV-2024-003',
        customerName: 'DEF Construction Ltd',
        customerEmail: 'procurement@defconstruction.com',
        amount: 500.00,
        paymentMethod: 'maya',
        reference: 'MAYA-REF-456789',
        submittedDate: new Date('2024-01-21').toISOString(),
        notes: 'Additional payment via Maya',
        status: 'pending_approval',
        attachments: ['maya_screenshot.jpg']
      }
    ];

    const mockPaymentMethods = [
      {
        id: 'method-1',
        name: 'Bank Transfer',
        description: 'Direct bank to bank transfer',
        isActive: true,
        requiresReference: true,
        qrCode: null
      },
      {
        id: 'method-2',
        name: 'Check Payment',
        description: 'Company or personal check',
        isActive: true,
        requiresReference: true,
        qrCode: null
      },
      {
        id: 'method-3',
        name: 'GCash',
        description: 'GCash mobile payment',
        isActive: true,
        requiresReference: true,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' // Placeholder
      },
      {
        id: 'method-4',
        name: 'Maya (PayMaya)',
        description: 'Maya digital wallet',
        isActive: true,
        requiresReference: true,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' // Placeholder
      },
      {
        id: 'method-5',
        name: 'Cash Payment',
        description: 'Cash payment at office',
        isActive: true,
        requiresReference: false,
        qrCode: null
      }
    ];

    const mockBalanceHistory = [
      {
        id: 'BAL-001',
        customerName: 'ABC Manufacturing Corp',
        invoiceNumber: 'INV-2024-001',
        action: 'Overdue',
        timestamp: new Date('2024-01-25T14:30:00').toISOString(),
        dueDate: new Date('2025-07-20').toISOString(), // 5 days overdue
        details: {
          amount: 1500.00,
          previousBalance: 2300.00,
          newBalance: 1000.00,
        }
      },
      {
        id: 'BAL-002',
        customerName: 'QWE Pharmaceuticals',
        invoiceNumber: 'INV-2024-001',
        action: 'Partially paid',
        timestamp: new Date('2024-01-25T14:35:00').toISOString(),
        dueDate: new Date('2025-09-15').toISOString(), // Future due date
        details: {
          amount: 1000.00,
          previousBalance: 1500.00,
          newBalance: 500.00,
        }
      },
      {
        id: 'BAL-003',
        customerName: 'XYZ Healthcare Services',
        invoiceNumber: 'INV-2024-002',
        action: 'Unpaid',
        timestamp: new Date('2024-02-08T11:30:00').toISOString(),
        dueDate: new Date('2025-10-10').toISOString(), // Recently overdue
        details: {
          amount: 1300.00,
        }
      }
    ];

    const mockPaymentHistory = [
      {
        id: 'HIST-001',
        customerName: 'ABC Manufacturing Corp',
        invoiceNumber: 'INV-2024-001',
        action: 'Payment Completed',
        timestamp: new Date('2024-01-25T15:00:00').toISOString(),
        details: { 
          amount: 1500.00, 
          paymentMethod: 'Bank Transfer',
          reference: 'TXN-ABC-001',

        }
      },
      {
        id: 'HIST-002',
        customerName: 'XYZ Healthcare Services',
        invoiceNumber: 'INV-2024-002',
        action: 'Payment Completed',
        timestamp: new Date('2024-02-08T12:00:00').toISOString(),
        details: { 
          amount: 2300.00, 
          paymentMethod: 'Check',
          reference: 'CHK-9876',
  
        }
      },
      {
        id: 'HIST-003',
        customerName: 'DEF Construction Ltd',
        invoiceNumber: 'INV-2024-003',
        action: 'Payment Completed',
        timestamp: new Date('2024-01-30T14:20:00').toISOString(),
        details: { 
          amount: 800.00, 
          paymentMethod: 'Maya',
          reference: 'MAYA-REF-456789',
    
        }
      },
      {
        id: 'HIST-004',
        customerName: 'JKL Chemical Solutions',
        invoiceNumber: 'INV-2024-005',
        action: 'Payment Completed',
        timestamp: new Date('2024-01-24T17:00:00').toISOString(),
        details: { 
          amount: 625.25, 
          paymentMethod: 'GCash',
          reference: 'GCASH-789456123',
   
        }
      }
    ];

    // Mock rejected payments data
    const mockRejectedPayments = [
      {
        id: 'REJ-001',
        invoiceNumber: 'INV-2024-006',
        customerName: 'MNO Electronics Corp',
        customerEmail: 'finance@mnoelectronics.com',
        amount: 2750.50,
        paymentMethod: 'bank_transfer',
        reference: 'TXN-MNO-001',
        submittedDate: new Date('2024-01-15').toISOString(),
        rejectedDate: new Date('2024-01-16').toISOString(),
        notes: 'Payment for electronic components order',
        status: 'rejected',
        rejectionReason: 'Insufficient documentation provided',
        attachments: ['receipt_mno_001.pdf']
      },
      {
        id: 'REJ-002',
        invoiceNumber: 'INV-2024-007',
        customerName: 'PQR Manufacturing Ltd',
        customerEmail: 'accounts@pqrmfg.com',
        amount: 1200.00,
        paymentMethod: 'check',
        reference: 'CHK-5432',
        submittedDate: new Date('2024-01-18').toISOString(),
        rejectedDate: new Date('2024-01-19').toISOString(),
        notes: 'Check payment for manufacturing supplies',
        status: 'rejected',
        rejectionReason: 'Check amount does not match invoice total',
        attachments: ['check_image_pqr.jpg']
      },
      {
        id: 'REJ-003',
        invoiceNumber: 'INV-2024-008',
        customerName: 'STU Logistics Inc',
        customerEmail: 'payments@stulogistics.com',
        amount: 850.75,
        paymentMethod: 'gcash',
        reference: 'GCASH-456789123',
        submittedDate: new Date('2024-01-20').toISOString(),
        rejectedDate: new Date('2024-01-21').toISOString(),
        notes: 'Partial payment for logistics services',
        status: 'rejected',
        rejectionReason: 'Payment reference number not found in our records',
        attachments: ['gcash_receipt_stu.png']
      },
      {
        id: 'REJ-004',
        invoiceNumber: 'INV-2024-009',
        customerName: 'VWX Construction Group',
        customerEmail: 'billing@vwxconstruction.com',
        amount: 3200.00,
        paymentMethod: 'maya',
        reference: 'MAYA-REF-789123',
        submittedDate: new Date('2024-01-22').toISOString(),
        rejectedDate: new Date('2024-01-23').toISOString(),
        notes: 'Payment for construction materials',
        status: 'rejected',
        rejectionReason: 'Customer account on hold due to outstanding balance',
        attachments: ['maya_screenshot_vwx.jpg']
      }
    ];

    setPendingPayments(mockPendingPayments);
    setFilteredPayments(mockPendingPayments);
    setRejectedPayments(mockRejectedPayments);
    setFilteredRejectedPayments(mockRejectedPayments);
    setPaymentMethods(mockPaymentMethods);
    setBalanceHistory(mockBalanceHistory);
    setPaymentHistory(mockPaymentHistory);
  }, []);

  // Filter payments based on search and filters
  useEffect(() => {
    let filtered = pendingPayments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase())
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
      filtered = filtered.filter(payment => 
        payment.customerName.toLowerCase().includes(rejectedSearchTerm.toLowerCase()) ||
        payment.invoiceNumber.toLowerCase().includes(rejectedSearchTerm.toLowerCase()) ||
        payment.reference.toLowerCase().includes(rejectedSearchTerm.toLowerCase())
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

  const handleApprovePayment = () => {
    if (!selectedPayment) return;
    
    const updatedPayments = pendingPayments.filter(p => p.id !== selectedPayment.id);
    setPendingPayments(updatedPayments);
    closeApprovalModal();
  };

  const handleRejectPayment = () => {
    if (!selectedPayment) return;
    
    // Remove from pending payments
    const updatedPendingPayments = pendingPayments.filter(p => p.id !== selectedPayment.id);
    setPendingPayments(updatedPendingPayments);
    
    // Add to rejected payments with rejection timestamp
    const rejectedPayment = {
      ...selectedPayment,
      status: 'rejected',
      rejectedDate: new Date().toISOString(),
      rejectionReason: 'Payment rejected by admin' // This could be made configurable
    };
    setRejectedPayments([rejectedPayment, ...rejectedPayments]);
    
    closeApprovalModal();
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedPayment(null);
  };

  // Re-approve rejected payment
  const handleReApprovePayment = (payment) => {
    // Remove from rejected payments
    const updatedRejectedPayments = rejectedPayments.filter(p => p.id !== payment.id);
    setRejectedPayments(updatedRejectedPayments);
    
    // Add back to pending payments (remove rejection metadata)
    const { rejectedDate, rejectionReason, ...cleanPayment } = payment;
    const reApprovedPayment = {
      ...cleanPayment,
      status: 'pending_approval',
      reApprovedDate: new Date().toISOString()
    };
    setPendingPayments([reApprovedPayment, ...pendingPayments]);
  };

  // Permanently delete rejected payment
  const handleDeleteRejectedPayment = (paymentId) => {
    const updatedRejectedPayments = rejectedPayments.filter(p => p.id !== paymentId);
    setRejectedPayments(updatedRejectedPayments);
  };

  // Payment methods management handlers
  const handleManagePaymentMethods = () => {
    setShowPaymentMethodsModal(true);
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

  const closePaymentMethodsModal = () => {
    setShowPaymentMethodsModal(false);
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
      
      <PaymentMethodsManager
        isOpen={showPaymentMethodsModal}
        onClose={closePaymentMethodsModal}
        paymentMethods={paymentMethods}
        onAddMethod={handleAddPaymentMethod}
        onUpdateMethod={handleUpdatePaymentMethod}
        onDeleteMethod={handleDeletePaymentMethod}
      />
    </>
  );
};

export default PaymentReceiving;
