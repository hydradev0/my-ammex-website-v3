import React from 'react';
import { X, Calendar, User, Mail, FileText, Package, DollarSign, Clock } from 'lucide-react';

const InvoiceDetailsModal = ({
  invoice,
  isOpen,
  onClose,
  formatCurrency,
  formatDate,
  getStatusColor
}) => {
  if (!isOpen || !invoice) return null;

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

  const daysOverdue = getDaysOverdue(invoice.dueDate, invoice.status);
  const balancePercentage = getBalancePercentage(invoice.paidAmount, invoice.totalAmount);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
              <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invoice Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.paymentStatus}
                  </span>
                  {daysOverdue && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      {daysOverdue} days overdue
                    </p>
                  )}
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* Total Amount Card */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            {/* Balance Card */}
            <div className={`rounded-lg p-4 ${invoice.balance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding Balance</p>
                  <p className={`text-2xl font-bold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(invoice.balance)}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${invoice.balance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                  <DollarSign className={`w-5 h-5 ${invoice.balance > 0 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Payment Progress</h3>
              <span className="text-sm text-gray-600">{balancePercentage.toFixed(1)}% paid</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  balancePercentage === 100 ? 'bg-green-500' : 
                  balancePercentage > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                }`}
                style={{ width: `${balancePercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Paid: {formatCurrency(invoice.paidAmount)}</span>
              <span>Remaining: {formatCurrency(invoice.balance)}</span>
            </div>
          </div>

          {/* Invoice Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                Customer Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{invoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    <Mail className="w-4 h-4 mr-1 text-gray-400" />
                    {invoice.customerEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                Important Dates
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="font-medium text-gray-900">{formatDate(invoice.invoiceDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className={`font-medium ${daysOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">{formatDate(invoice.lastUpdated)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Reference */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Order Reference
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Original Order ID</p>
                <p className="font-medium text-blue-600">{invoice.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Items Count</p>
                <p className="font-medium text-gray-900">{invoice.items.length} items</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Subtotal:
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                  </tr>
                  {invoice.discountApplied > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        Discount:
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600 text-right">
                        -{formatCurrency(invoice.discountApplied)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-lg font-bold text-gray-900 text-right">
                      Total Amount:
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-gray-900 text-right">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;

