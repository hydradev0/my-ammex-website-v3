import React, { useState, useEffect } from 'react';
import { Settings, FileText, Send, CheckCircle } from 'lucide-react';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import InvoiceTable from './InvoiceTable';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import InvoiceActionsModal from './InvoiceActionsModal';

const ProcessedInvoices = () => {
  // State for invoices - initialize as empty array
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [balanceFilter, setBalanceFilter] = useState('all'); // all, with_balance, paid
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionType, setActionType] = useState(''); // 'mark_paid', 'send_reminder'

  // Mock data initialization
  useEffect(() => {
    const mockInvoices = [
      {
        id: 'INV-001',
        invoiceNumber: 'INV-2024-001',
        orderId: 'ORD001',
        customerName: 'ABC Manufacturing Corp',
        customerEmail: 'purchasing@abcmfg.com',
        invoiceDate: new Date('2024-01-20').toISOString(),
        dueDate: new Date('2024-02-20').toISOString(),
        totalAmount: 1500.00,
        paidAmount: 1000.00,
        balance: 500.00,
        status: 'partially_paid',
        paymentStatus: 'Partially Paid',
        items: [
          {
            name: 'Product A',
            description: 'High-quality industrial product A',
            quantity: 2,
            unit: 'pcs',
            unitPrice: 500.00,
            total: 1000.00
          },
          {
            name: 'Product B',
            description: 'Premium product B with warranty',
            quantity: 1,
            unit: 'pcs',
            unitPrice: 500.00,
            total: 500.00
          }
        ],
        discountApplied: 0.00,
        notes: 'Processed from order ORD001 with standard terms',
        createdDate: new Date('2024-01-20').toISOString(),
        lastUpdated: new Date('2024-01-25').toISOString()
      },
      {
        id: 'INV-002',
        invoiceNumber: 'INV-2024-002',
        orderId: 'ORD002',
        customerName: 'XYZ Healthcare Services',
        customerEmail: 'orders@xyzhealthcare.com',
        invoiceDate: new Date('2024-01-22').toISOString(),
        dueDate: new Date('2024-02-22').toISOString(),
        totalAmount: 2300.00,
        paidAmount: 0.00,
        balance: 2300.00,
        status: 'unpaid',
        paymentStatus: 'Unpaid',
        items: [
          {
            name: 'Product C',
            description: 'Medical grade equipment C',
            quantity: 3,
            unit: 'sets',
            unitPrice: 500.00,
            total: 1500.00
          },
          {
            name: 'Product D',
            description: 'Specialized healthcare product D',
            quantity: 2,
            unit: 'units',
            unitPrice: 400.00,
            total: 800.00
          }
        ],
        discountApplied: 0.00,
        notes: 'Processed from order ORD002 - urgent delivery required',
        createdDate: new Date('2024-01-22').toISOString(),
        lastUpdated: new Date('2024-01-22').toISOString()
      },
      {
        id: 'INV-003',
        invoiceNumber: 'INV-2024-003',
        orderId: 'ORD003',
        customerName: 'DEF Construction Ltd',
        customerEmail: 'procurement@defconstruction.com',
        invoiceDate: new Date('2024-01-18').toISOString(),
        dueDate: new Date('2024-02-18').toISOString(),
        totalAmount: 1200.00,
        paidAmount: 1200.00,
        balance: 0.00,
        status: 'paid',
        paymentStatus: 'Paid',
        items: [
          {
            name: 'Construction Tool A',
            description: 'Heavy-duty construction equipment',
            quantity: 1,
            unit: 'set',
            unitPrice: 800.00,
            total: 800.00
          },
          {
            name: 'Safety Equipment B',
            description: 'Industrial safety gear package',
            quantity: 2,
            unit: 'kits',
            unitPrice: 200.00,
            total: 400.00
          }
        ],
        discountApplied: 0.00,
        notes: 'Processed from order ORD003 - bulk discount applied',
        createdDate: new Date('2024-01-18').toISOString(),
        lastUpdated: new Date('2024-01-30').toISOString()
      },
      {
        id: 'INV-004',
        invoiceNumber: 'INV-2024-004',
        orderId: 'ORD004',
        customerName: 'GHI Technology Solutions',
        customerEmail: 'finance@ghitech.com',
        invoiceDate: new Date('2024-01-25').toISOString(),
        dueDate: new Date('2024-02-25').toISOString(),
        totalAmount: 3500.00,
        paidAmount: 0.00,
        balance: 3500.00,
        status: 'overdue',
        paymentStatus: 'Overdue',
        items: [
          {
            name: 'Tech Equipment X',
            description: 'Advanced technology solution X',
            quantity: 5,
            unit: 'units',
            unitPrice: 600.00,
            total: 3000.00
          },
          {
            name: 'Installation Service',
            description: 'Professional installation and setup',
            quantity: 1,
            unit: 'service',
            unitPrice: 500.00,
            total: 500.00
          }
        ],
        discountApplied: 0.00,
        notes: 'Processed from order ORD004 - payment overdue, follow up required',
        createdDate: new Date('2024-01-25').toISOString(),
        lastUpdated: new Date('2024-01-25').toISOString()
      }
    ];

    setInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);
  }, []);

  // Filter invoices based on search and filters
  useEffect(() => {
    let filtered = invoices || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === selectedStatus);
    }

    // Balance filter
    if (balanceFilter === 'with_balance') {
      filtered = filtered.filter(invoice => invoice.balance > 0);
    } else if (balanceFilter === 'paid') {
      filtered = filtered.filter(invoice => invoice.balance === 0);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, selectedStatus, balanceFilter, dateRange]);

  // Invoice action handlers
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleInvoiceAction = (invoice, action) => {
    setSelectedInvoice(invoice);
    setActionType(action);
    setShowActionsModal(true);
  };

  const handleMarkAsPaid = (invoiceId) => {
    const updatedInvoices = invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { 
            ...invoice, 
            status: 'paid', 
            paymentStatus: 'Paid',
            paidAmount: invoice.totalAmount,
            balance: 0,
            lastUpdated: new Date().toISOString()
          } 
        : invoice
    );
    setInvoices(updatedInvoices);
    closeActionsModal();
  };

  const handleSendReminder = (invoiceId) => {
    // In a real app, this would send an email reminder
    console.log(`Sending reminder for invoice ${invoiceId}`);
    const updatedInvoices = invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, lastUpdated: new Date().toISOString() }
        : invoice
    );
    setInvoices(updatedInvoices);
    closeActionsModal();
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedInvoice(null);
  };

  const closeActionsModal = () => {
    setShowActionsModal(false);
    setSelectedInvoice(null);
    setActionType('');
  };

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partially_paid': return 'text-yellow-600 bg-yellow-100';
      case 'unpaid': return 'text-blue-600 bg-blue-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Configure dropdown filters for ModernSearchFilter component
  const dropdownFilters = [
    {
      id: 'status',
      value: selectedStatus,
      setValue: setSelectedStatus,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'paid', label: 'Paid' },
        { value: 'partially_paid', label: 'Partially Paid' },
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'overdue', label: 'Overdue' }
      ]
    },
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleInvoiceAction(null, 'export')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <ModernSearchFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchPlaceholder="Search invoices, customers, order IDs..."
          dropdownFilters={dropdownFilters}
          dateRange={dateRange}
          setDateRange={setDateRange}
          showDateRange={true}
          filteredCount={filteredInvoices.length}
          totalCount={invoices.length}
          itemLabel="invoices"
        />

        {/* Invoices Table */}
        <InvoiceTable
          invoices={filteredInvoices}
          onViewInvoice={handleViewInvoice}
          onInvoiceAction={handleInvoiceAction}
          getStatusColor={getStatusColor}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </div>

      {/* Modals */}
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
      />
      
      <InvoiceActionsModal
        invoice={selectedInvoice}
        isOpen={showActionsModal}
        onClose={closeActionsModal}
        actionType={actionType}
        onMarkAsPaid={handleMarkAsPaid}
        onSendReminder={handleSendReminder}
        formatCurrency={formatCurrency}
      />
    </>
  );
};

export default ProcessedInvoices;

