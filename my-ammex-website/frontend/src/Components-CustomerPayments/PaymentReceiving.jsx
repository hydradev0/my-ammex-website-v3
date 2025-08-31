import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { createPortal } from 'react-dom';
import PaymentFilters from './PaymentFilters';
import PaymentTable from './PaymentTable';
import PaymentApprovalModal from './PaymentApprovalModal';
import PaymentMethodsManager from './PaymentMethodsManager';

const PaymentReceiving = () => {
  // State for pending payments
  const [pendingPayments, setPendingPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
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

    setPendingPayments(mockPendingPayments);
    setFilteredPayments(mockPendingPayments);
    setPaymentMethods(mockPaymentMethods);
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
    
    const updatedPayments = pendingPayments.map(p => 
      p.id === selectedPayment.id ? { ...p, status: 'rejected' } : p
    );
    setPendingPayments(updatedPayments);
    closeApprovalModal();
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedPayment(null);
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




  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 ">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap- mt-2">
            <div>
              <h1 className="text-3xl -mx-32 font-bold text-gray-90 ">Payments</h1>
            </div>
            <button
              onClick={handleManagePaymentMethods}
              className="bg-gray-600 -mx-40 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage Payment Methods
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <PaymentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          paymentMethods={paymentMethods}
          filteredCount={filteredPayments.length}
          totalCount={pendingPayments.length}
        />

        {/* Pending Payments Table */}
        <PaymentTable
          payments={filteredPayments}
          onViewPayment={handleViewPayment}
          getPaymentMethodName={getPaymentMethodName}
        />
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
