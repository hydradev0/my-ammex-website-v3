import React, { useState, useEffect } from 'react';
import { FileText, Clock, Receipt } from 'lucide-react';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import InvoiceActionsModal from './InvoiceActionsModal';
import InvoiceHistoryTab from './InvoiceHistoryTab';
import { getInvoicesByStatus, downloadInvoicePdf } from '../services/invoiceService';

const ProcessedInvoices = () => {
  // State for all invoices - merged from different statuses
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionType, setActionType] = useState(''); // 'mark_paid', 'send_reminder'

  // Load all invoices from API
  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        // Load all invoices with all statuses
        const [awaitingResponse, partiallyPaidResponse, completedResponse, overdueResponse] = await Promise.all([
          getInvoicesByStatus('awaiting payment'),
          getInvoicesByStatus('partially paid'),
          getInvoicesByStatus('completed'),
          getInvoicesByStatus('overdue'),
        ]);
        
        const awaitingInvoices = awaitingResponse.data || [];
        const partiallyPaidInvoices = partiallyPaidResponse.data || [];
        const completedInvoices = completedResponse.data || [];
        const overdueInvoices = overdueResponse.data || [];
        
        // Combine all invoices
        const allInvoices = [
          ...awaitingInvoices, 
          ...partiallyPaidInvoices, 
          ...completedInvoices, 
          ...overdueInvoices
        ];

        // Transform backend data to frontend format
        const transformInvoice = (invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.order?.orderNumber || `ORD-${invoice.orderId}`,
          customerName: invoice.customer?.customerName || 'Unknown Customer',
          customerEmail: invoice.customer?.email1 || '',
          customerAddress: `${invoice.customer?.street || ''}, ${invoice.customer?.city || ''}, ${invoice.customer?.postalCode || ''}, ${invoice.customer?.country || ''}`.trim(),
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          totalAmount: Number(invoice.totalAmount),
          items: (invoice.items || []).map(item => ({
            category: item.item?.category?.name || 'Unknown Category',
            subcategory: item.item?.subcategory?.name || '',
            modelNo: item.item?.modelNo || '',
            quantity: Number(item.quantity),
            unit: item.item?.unit?.name || 'pcs',
            unitPrice: Number(item.unitPrice),
            total: Number(item.totalPrice),

          })),
          discountPercent: Number(invoice.order?.discountPercent || 0),
          discountAmount: Number(invoice.order?.discountAmount || 0),
          createdDate: invoice.createdAt,
          lastUpdated: invoice.updatedAt,
          status: invoice.status
        });

        const transformedInvoices = allInvoices.map(transformInvoice);

        // Sort by invoice date (most recent first) - when the invoice was actually created/issued
        const sortedInvoices = transformedInvoices.sort((a, b) => {
          const dateA = new Date(a.invoiceDate);
          const dateB = new Date(b.invoiceDate);
          return dateB - dateA; // Most recent first
        });

        setInvoices(sortedInvoices);
        setFilteredInvoices(sortedInvoices);
      } catch (error) {
        console.error('Failed to load invoices:', error);
        // Fallback to empty arrays on error
        setInvoices([]);
        setFilteredInvoices([]);
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

  // Invoice action handlers
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleInvoiceAction = async (invoice, action) => {
    setSelectedInvoice(invoice);
    setActionType(action);
    setShowActionsModal(true);
  };

  // Handle PDF download
  const handleDownloadPdf = async (invoice) => {
    try {
      setIsDownloading(true);
      const blob = await downloadInvoicePdf(invoice.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
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
        <InvoiceHistoryTab
          invoices={filteredInvoices}
          onViewInvoice={handleViewInvoice}
          onInvoiceAction={handleInvoiceAction}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          isloading={isLoading}
          onDownloadPdf={handleDownloadPdf}
        />
      </div>

      {/* Modals */}
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onDownloadPdf={handleDownloadPdf}
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

