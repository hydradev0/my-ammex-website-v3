import React, { useState, useEffect } from 'react';
import { FileText, Clock, Receipt } from 'lucide-react';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import InvoiceTable from './InvoiceTable';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import InvoiceActionsModal from './InvoiceActionsModal';
import InvoiceHistoryTab from './InvoiceHistoryTab';
import { getInvoicesByStatus, updateInvoiceStatus } from '../services/invoiceService';

const ProcessedInvoices = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'
  
  // State for invoices - initialize as empty array
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [completedInvoices, setCompletedInvoices] = useState([]);
  
  // Search and filter states for current invoices
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Search and filter states for history tab
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyDateRange, setHistoryDateRange] = useState({ start: '', end: '' });
  const [filteredCompletedInvoices, setFilteredCompletedInvoices] = useState([]);

  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionType, setActionType] = useState(''); // 'mark_paid', 'send_reminder'

  // Load invoices from API
  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        // Load pending invoices (current)
        const pendingResponse = await getInvoicesByStatus('pending');
        const pendingInvoices = pendingResponse.data || [];
        
        // Load completed invoices (history)
        const completedResponse = await getInvoicesByStatus('completed');
        const completedInvoices = completedResponse.data || [];

        // Transform backend data to frontend format
        const transformInvoice = (invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.order?.orderNumber || `ORD-${invoice.orderId}`,
          customerName: invoice.customer?.customerName || 'Unknown Customer',
          customerEmail: invoice.customer?.email1 || '',
          customerAddress: `${invoice.customer?.street || ''}, ${invoice.customer?.city || ''}, ${invoice.customer?.country || ''}`.trim(),
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          totalAmount: Number(invoice.totalAmount),
          items: (invoice.items || []).map(item => ({
            name: item.item?.itemName || 'Unknown Item',
            description: item.item?.description || '',
            quantity: Number(item.quantity),
            unit: item.item?.unit?.name || 'pcs',
            unitPrice: Number(item.unitPrice),
            total: Number(item.totalPrice)
          })),
          discountApplied: 0,
          createdDate: invoice.createdAt,
          lastUpdated: invoice.updatedAt,
          status: invoice.status
        });

        const transformedPending = pendingInvoices.map(transformInvoice);
        const transformedCompleted = completedInvoices.map(transformInvoice);

        setInvoices(transformedPending);
        setFilteredInvoices(transformedPending);
        setCompletedInvoices(transformedCompleted);
        setFilteredCompletedInvoices(transformedCompleted);
      } catch (error) {
        console.error('Failed to load invoices:', error);
        // Fallback to empty arrays on error
        setInvoices([]);
        setFilteredInvoices([]);
        setCompletedInvoices([]);
        setFilteredCompletedInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
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

  // Filter completed invoices based on search and filters
  useEffect(() => {
    let filtered = completedInvoices || [];

    // Search filter
    if (historySearchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.customerName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        invoice.orderId.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        invoice.customerEmail.toLowerCase().includes(historySearchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (historyDateRange.start && historyDateRange.end) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        const startDate = new Date(historyDateRange.start);
        const endDate = new Date(historyDateRange.end);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    }

    setFilteredCompletedInvoices(filtered);
  }, [completedInvoices, historySearchTerm, historyDateRange]);

  // Invoice action handlers
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleInvoiceAction = async (invoice, action) => {
    if (action === 'mark_completed' && invoice) {
      setIsLoading(true);
      try {
        await updateInvoiceStatus(invoice.id, 'completed');
        
        // Remove from current invoices and add to completed
        setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
        setFilteredInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
        
        const completedInvoice = { ...invoice, status: 'completed' };
        setCompletedInvoices(prev => [completedInvoice, ...prev]);
        setFilteredCompletedInvoices(prev => [completedInvoice, ...prev]);
        
        // Close any open modals
        setShowActionsModal(false);
        setSelectedInvoice(null);
        setActionType('');
      } catch (error) {
        console.error('Failed to mark invoice as completed:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSelectedInvoice(invoice);
      setActionType(action);
      setShowActionsModal(true);
    }
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
              isloading={isLoading}
            />
          </>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <>
            {/* Search and Filters for History */}
            <ModernSearchFilter
              searchTerm={historySearchTerm}
              setSearchTerm={setHistorySearchTerm}
              searchPlaceholder="Search completed invoices..."
              dropdownFilters={dropdownFilters}
              dateRange={historyDateRange}
              setDateRange={setHistoryDateRange}
              showDateRange={true}
              filteredCount={filteredCompletedInvoices.length}
              totalCount={completedInvoices.length}
              itemLabel="completed invoices"
            />

            {/* Completed Invoices Table */}
            <InvoiceHistoryTab
              invoices={filteredCompletedInvoices}
              onViewInvoice={handleViewInvoice}
              onInvoiceAction={handleInvoiceAction}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              isloading={isLoading}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        action
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

