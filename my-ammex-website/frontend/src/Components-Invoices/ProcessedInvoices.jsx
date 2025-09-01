import React, { useState, useEffect } from 'react';
import { Settings, FileText, Send, CheckCircle, Clock, Receipt } from 'lucide-react';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import InvoiceTable from './InvoiceTable';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import InvoiceActionsModal from './InvoiceActionsModal';
import HistoryTab from '../Components/HistoryTab';

const ProcessedInvoices = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'
  
  // State for invoices - initialize as empty array
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  
  // Search and filter states for current invoices
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  
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
        customerAddress: '123 Industrial Ave, Manufacturing District, Metro Manila',
        invoiceDate: new Date('2024-01-20').toISOString(),
        dueDate: new Date('2024-02-20').toISOString(),
        totalAmount: 1500.00,
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
        createdDate: new Date('2024-01-20').toISOString(),
        lastUpdated: new Date('2024-01-25').toISOString()
      },
      {
        id: 'INV-002',
        invoiceNumber: 'INV-2024-002',
        orderId: 'ORD002',
        customerName: 'XYZ Healthcare Services',
        customerEmail: 'orders@xyzhealthcare.com',
        customerAddress: '456 Medical Center Blvd, Healthcare Hub, Quezon City',
        invoiceDate: new Date('2024-01-22').toISOString(),
        dueDate: new Date('2024-02-22').toISOString(),
        totalAmount: 2300.00,
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
        createdDate: new Date('2024-01-22').toISOString(),
        lastUpdated: new Date('2024-01-22').toISOString()
      },
      {
        id: 'INV-003',
        invoiceNumber: 'INV-2024-003',
        orderId: 'ORD003',
        customerName: 'DEF Construction Ltd',
        customerEmail: 'procurement@defconstruction.com',
        customerAddress: '789 Construction Way, Building Complex, Makati City',
        invoiceDate: new Date('2024-01-18').toISOString(),
        dueDate: new Date('2024-02-18').toISOString(),
        totalAmount: 1200.00,
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
        createdDate: new Date('2024-01-18').toISOString(),
        lastUpdated: new Date('2024-01-30').toISOString()
      },
      {
        id: 'INV-004',
        invoiceNumber: 'INV-2024-004',
        orderId: 'ORD004',
        customerName: 'GHI Technology Solutions',
        customerEmail: 'finance@ghitech.com',
        customerAddress: '321 Tech Park Drive, Innovation Center, Taguig City',
        invoiceDate: new Date('2024-01-25').toISOString(),
        dueDate: new Date('2024-02-25').toISOString(),
        totalAmount: 3500.00,
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
        createdDate: new Date('2024-01-25').toISOString(),
        lastUpdated: new Date('2024-01-25').toISOString()
      }
    ];

    const mockInvoiceHistory = [
      {
        id: 'HIST-002',
        invoiceId: 'INV-001',
        invoiceNumber: 'INV-2024-001',
        action: 'Fully Paid',
        description: 'Full payment of ₱1,500.00 received via Bank Transfer',
        timestamp: new Date('2024-01-25T14:15:00').toISOString(),
        details: { amount: 1500.00, paymentMethod: 'Bank Transfer', reference: 'TXN-ABC-001' }
      },
      {
        id: 'HIST-003',
        invoiceId: 'INV-001',
        invoiceNumber: 'INV-2024-001',
        action: 'Marked as Paid',
        description: 'Invoice marked as paid - full payment received',
        timestamp: new Date('2024-01-25T14:20:00').toISOString(),
        details: { previousStatus: 'unpaid', newStatus: 'paid' }
      },
      {
        id: 'HIST-005',
        invoiceId: 'INV-002',
        invoiceNumber: 'INV-2024-002',
        action: 'Fully Paid',
        description: 'Full payment of ₱2,300.00 received via GCash',
        timestamp: new Date('2024-02-08T11:30:00').toISOString(),
        details: { amount: 2300.00, paymentMethod: 'GCash', reference: 'GCASH-XYZ-001' }
      },
      {
        id: 'HIST-006',
        invoiceId: 'INV-002',
        invoiceNumber: 'INV-2024-002',
        action: 'Marked as Paid',
        description: 'Invoice marked as paid - full payment received',
        timestamp: new Date('2024-02-08T11:35:00').toISOString(),
        details: { previousStatus: 'unpaid', newStatus: 'paid' }
      },
      {
        id: 'HIST-008',
        invoiceId: 'INV-003',
        invoiceNumber: 'INV-2024-003',
        action: 'Fully Paid',
        description: 'Full payment of ₱1,200.00 received via Check',
        timestamp: new Date('2024-01-30T13:45:00').toISOString(),
        details: { amount: 1200.00, paymentMethod: 'Check', reference: 'CHK-DEF-001' }
      },
      {
        id: 'HIST-009',
        invoiceId: 'INV-003',
        invoiceNumber: 'INV-2024-003',
        action: 'Marked as Paid',
        description: 'Invoice marked as paid - full payment received',
        timestamp: new Date('2024-01-30T13:50:00').toISOString(),
        details: { previousStatus: 'unpaid', newStatus: 'paid' }
      },
      {
        id: 'HIST-011',
        invoiceId: 'INV-004',
        invoiceNumber: 'INV-2024-004',
        action: 'Fully Paid',
        description: 'Full payment of ₱3,500.00 received via Maya',
        timestamp: new Date('2024-02-20T10:15:00').toISOString(),
        details: { amount: 3500.00, paymentMethod: 'Maya', reference: 'MAYA-GHI-001' }
      },
      {
        id: 'HIST-012',
        invoiceId: 'INV-004',
        invoiceNumber: 'INV-2024-004',
        action: 'Marked as Paid',
        description: 'Invoice marked as paid - full payment received',
        timestamp: new Date('2024-02-20T10:20:00').toISOString(),
        details: { previousStatus: 'unpaid', newStatus: 'paid' }
      }
    ];

    setInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);
    setInvoiceHistory(mockInvoiceHistory);
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
  }, [invoices, searchTerm, dateRange]);

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


  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedInvoice(null);
  };

  const closeActionsModal = () => {
    setShowActionsModal(false);
    setSelectedInvoice(null);
    setActionType('');
  };



  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // History-specific utility functions
  const getInvoiceActionColor = (action) => {
    switch (action) {
      case 'Fully Paid': return 'text-green-600 bg-green-100';
      case 'Marked as Paid': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Configure dropdown filters for ModernSearchFilter component
  const dropdownFilters = [];

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

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('current')}
                className={`py-2 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'current'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Current Invoices
                <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {filteredInvoices.length}
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
                <Clock className="w-4 h-4" />
                Invoice History
              </button>
            </nav>
          </div>
        </div>

        {/* Current Invoices Tab Content */}
        {activeTab === 'current' && (
          <>
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
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <HistoryTab
            historyData={invoiceHistory}
            title="Invoice History"
            searchPlaceholder="Search invoice history..."
            itemLabel="invoice history"
            getActionColor={getInvoiceActionColor}
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
            entityTypes={[...new Set(invoiceHistory.map(item => item.invoiceNumber))]}
            actionTypes={[...new Set(invoiceHistory.map(item => item.action))]}
          />
        )}
      </div>

      {/* Modals */}
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
      
      <InvoiceActionsModal
        invoice={selectedInvoice}
        isOpen={showActionsModal}
        onClose={closeActionsModal}
        actionType={actionType}
      />
    </>
  );
};

export default ProcessedInvoices;

