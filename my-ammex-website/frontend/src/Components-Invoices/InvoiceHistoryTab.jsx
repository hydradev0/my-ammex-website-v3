import React, { useState } from 'react';
import { Eye, Calendar, DollarSign, CheckCircle, Download } from 'lucide-react';
import PaginationTable from '../Components/PaginationTable';
import AdvanceActionsDropdown from '../Components/AdvanceActionsDropdown';

const InvoiceHistoryTab = ({
  invoices = [],
  onViewInvoice,
  onInvoiceAction,
  formatCurrency,
  formatDate,
  isloading,
  onDownloadPdf
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Add safety check for invoices
  const safeInvoices = invoices || [];

  // Pagination logic
  const totalPages = Math.ceil(safeInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = safeInvoices.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleAction = (invoice, action) => {
    if (action === 'view_details') {
      onViewInvoice(invoice);
    } else if (action === 'download_pdf') {
      if (onDownloadPdf) {
        onDownloadPdf(invoice);
      }
    } else {
      onInvoiceAction(invoice, action);
    }
  };

  // Configure quick actions (buttons that appear outside dropdown)
  const getQuickActions = () => [
    {
      key: 'view_details',
      icon: Eye,
      label: 'View Details',
      title: 'View Details',
      className: 'text-blue-600 cursor-pointer hover:text-blue-900 p-1 rounded transition-colors'
    }
  ];

  // Configure dropdown actions
  const getDropdownActions = () => [
    { key: 'download_pdf', label: 'Download PDF', icon: Download },
  ];

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-bl from-gray-200 to-gray-300">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isloading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading invoice history...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <DollarSign className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                      <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => {
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      {/* Invoice Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-blue-600">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            Order: {invoice.orderId}
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.customerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {invoice.customerEmail}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {invoice.customerAddress}
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>Invoice: {formatDate(invoice.invoiceDate)}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>Due: {formatDate(invoice.dueDate)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {invoice.items.length} items
                          </div>
                        </div>
                      </td>


                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <AdvanceActionsDropdown
                          item={invoice}
                          quickActions={getQuickActions()}
                          actions={getDropdownActions()}
                          onAction={handleAction}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <PaginationTable
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={safeInvoices.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPageOptions={[5, 10, 20, 30, 50]}
        className="mt-4"
      />
    </>
  );
};

export default InvoiceHistoryTab;
