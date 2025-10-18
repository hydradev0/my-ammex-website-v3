import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Calendar, Mail, ExternalLink } from 'lucide-react';
import ModernSearchFilter from '../Components/ModernSearchFilter';

const FailedPaymentsTab = ({ 
  failedPayments = [], 
  isLoading = false,
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [filteredPayments, setFilteredPayments] = useState([]);

  // Get unique payment methods from failed payments
  const paymentMethods = [...new Set(failedPayments.map(p => p.paymentMethod || 'unknown'))];

  useEffect(() => {
    let filtered = failedPayments;

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        String(payment.customer?.customerName || payment.customerName || '').toLowerCase().includes(q) ||
        String(payment.invoice?.invoiceNumber || payment.invoiceNumber || '').toLowerCase().includes(q) ||
        String(payment.failureMessage || '').toLowerCase().includes(q)
      );
    }

    // Payment method filter
    if (selectedMethod !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === selectedMethod);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.updatedAt || payment.submittedAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    setFilteredPayments(filtered);
  }, [failedPayments, searchTerm, selectedMethod, dateRange]);

  const formatCurrency = (amount) => {
    return `₱${Number(amount).toFixed(2)}`;
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

  const getFailureTypeColor = (failureCode) => {
    switch (failureCode) {
      case 'card_declined':
      case 'insufficient_funds':
        return 'text-red-700 bg-red-100';
      case 'expired_card':
      case 'invalid_card':
        return 'text-orange-700 bg-orange-100';
      case 'processing_error':
      case 'unknown':
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const handleContactCustomer = (payment) => {
    const customerEmail = payment.customer?.email1 || payment.customerEmail;
    if (customerEmail) {
      window.location.href = `mailto:${customerEmail}?subject=Payment Failed - Invoice ${payment.invoice?.invoiceNumber || payment.invoiceNumber}`;
    }
  };

  const handleViewInvoice = (payment) => {
    // Navigate to invoice details or open in new tab
    console.log('View invoice:', payment.invoice?.id || payment.invoiceId);
  };

  const dropdownFilters = [
    {
      id: 'paymentMethod',
      value: selectedMethod,
      setValue: setSelectedMethod,
      options: [
        { value: 'all', label: 'All Payment Methods' },
        ...paymentMethods.map(method => ({
          value: method,
          label: method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }))
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading failed payments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <ModernSearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search customer, invoice, or failure reason..."
        dropdownFilters={dropdownFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showDateRange={true}
        filteredCount={filteredPayments.length}
        totalCount={failedPayments.length}
        itemLabel="failed payments"
      />

      {/* Failed Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {failedPayments.length === 0 ? 'No Failed Payments' : 'No Matching Failed Payments'}
            </h3>
            <p className="text-gray-500">
              {failedPayments.length === 0
                ? 'All payment transactions have been successful.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Failure Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Failed At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.customer?.customerName || payment.customerName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.customer?.email1 || payment.customerEmail || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {payment.invoice?.invoiceNumber || payment.invoiceNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {payment.paymentMethod?.replace(/_/g, ' ') || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {payment.failureCode && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFailureTypeColor(payment.failureCode)} mb-1`}>
                            {payment.failureCode.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        )}
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {payment.failureMessage || 'Payment failed'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(payment.updatedAt || payment.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleContactCustomer(payment)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          title="Contact Customer"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(payment)}
                          className="text-gray-600 hover:text-gray-900 cursor-pointer"
                          title="View Invoice"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FailedPaymentsTab;

