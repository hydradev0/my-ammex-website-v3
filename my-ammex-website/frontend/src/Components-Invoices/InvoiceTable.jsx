import React, { useState } from 'react';
import { Eye, Send, CheckCircle, MoreVertical, Calendar, DollarSign } from 'lucide-react';
import PaginationTable from '../Components/PaginationTable';

const InvoiceTable = ({
  invoices = [],
  onViewInvoice,
  onInvoiceAction,
  getStatusColor,
  formatCurrency,
  formatDate
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [activeDropdown, setActiveDropdown] = useState(null);

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

  const toggleDropdown = (invoiceId) => {
    setActiveDropdown(activeDropdown === invoiceId ? null : invoiceId);
  };

  const handleAction = (invoice, action) => {
    setActiveDropdown(null);
    onInvoiceAction(invoice, action);
  };

  const getDaysOverdue = (dueDate, status) => {
    if (status === 'paid') return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const getBalancePercentage = (paidAmount, totalAmount) => {
    return totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  };

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
                  Amount & Balance
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <DollarSign className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                      <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => {
                  const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
                  const balancePercentage = getBalancePercentage(invoice.paidAmount, invoice.totalAmount);
                  
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
                          <div className="text-xs text-gray-400 mt-1">
                            {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
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
                          {daysOverdue && (
                            <div className="text-xs text-red-600 font-medium">
                              {daysOverdue} days overdue
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Amount & Balance */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            Total: {formatCurrency(invoice.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-600">
                            Paid: {formatCurrency(invoice.paidAmount)}
                          </div>
                          <div className={`text-xs font-medium ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Balance: {formatCurrency(invoice.balance)}
                          </div>
                          {/* Payment Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                balancePercentage === 100 ? 'bg-green-500' : 
                                balancePercentage > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${balancePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onViewInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {invoice.balance > 0 && (
                            <button
                              onClick={() => handleAction(invoice, 'send_reminder')}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded transition-colors"
                              title="Send Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          
                          {invoice.status !== 'paid' && (
                            <button
                              onClick={() => handleAction(invoice, 'mark_paid')}
                              className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* More Actions Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => toggleDropdown(invoice.id)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                              title="More Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {activeDropdown === invoice.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleAction(invoice, 'download_pdf')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Download PDF
                                  </button>
                                  <button
                                    onClick={() => handleAction(invoice, 'send_email')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Send via Email
                                  </button>
                                  <button
                                    onClick={() => handleAction(invoice, 'duplicate')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Duplicate Invoice
                                  </button>
                                  {invoice.status !== 'paid' && (
                                    <>
                                      <hr className="my-1" />
                                      <button
                                        onClick={() => handleAction(invoice, 'partial_payment')}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Record Payment
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
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

export default InvoiceTable;
