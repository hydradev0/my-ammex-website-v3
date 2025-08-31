import React, { useState } from 'react';
import { X, CheckCircle, Send, DollarSign, AlertCircle, Mail } from 'lucide-react';

const InvoiceActionsModal = ({
  invoice,
  isOpen,
  onClose,
  actionType,
  onMarkAsPaid,
  onSendReminder,
  formatCurrency
}) => {
  const [partialPayment, setPartialPayment] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      await onMarkAsPaid(invoice.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendReminder = async () => {
    setIsProcessing(true);
    try {
      await onSendReminder(invoice.id, reminderMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePartialPayment = () => {
    const paymentAmount = parseFloat(partialPayment);
    if (paymentAmount > 0 && paymentAmount <= invoice.balance) {
      // In a real app, this would call a partial payment API
      console.log(`Recording partial payment of ${paymentAmount} for invoice ${invoice.id}`);
      onClose();
    }
  };

  const getModalContent = () => {
    switch (actionType) {
      case 'mark_paid':
        return (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Mark Invoice as Paid</h2>
                  <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Confirm Payment</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Are you sure you want to mark this invoice as fully paid? This action will update the payment status to "Paid".
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{invoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-medium text-red-600">{formatCurrency(invoice.balance)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-900 font-semibold">Amount to Record:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(invoice.balance)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 flex items-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </>
                )}
              </button>
            </div>
          </>
        );

      case 'send_reminder':
        return (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Send className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Send Payment Reminder</h2>
                  <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{invoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-1 text-gray-400" />
                    {invoice.customerEmail}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Outstanding Balance:</span>
                  <span className="font-medium text-red-600">{formatCurrency(invoice.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Overdue:</span>
                  <span className="font-medium text-orange-600">
                    {(() => {
                      const due = new Date(invoice.dueDate);
                      const today = new Date();
                      const diffTime = today - due;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays > 0 ? `${diffDays} days` : 'Not overdue';
                    })()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent resize-none"
                  placeholder="Add a personal message to the reminder email..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  If left blank, a standard reminder message will be sent.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <Send className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Email Preview</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      A payment reminder will be sent to {invoice.customerEmail} including the invoice details, 
                      outstanding balance, and payment instructions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminder}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reminder
                  </>
                )}
              </button>
            </div>
          </>
        );

      case 'partial_payment':
        return (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Record Partial Payment</h2>
                  <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{invoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Already Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Outstanding Balance:</span>
                  <span className="font-medium text-red-600">{formatCurrency(invoice.balance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₱</span>
                  </div>
                  <input
                    type="number"
                    value={partialPayment}
                    onChange={(e) => setPartialPayment(e.target.value)}
                    step="0.01"
                    min="0.01"
                    max={invoice.balance}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none focus:ring-green-600 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum amount: {formatCurrency(invoice.balance)}
                </p>
              </div>

              {partialPayment && parseFloat(partialPayment) > 0 && (
                <div className="bg-green-50 rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-medium text-green-800">Payment Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Payment Amount:</span>
                      <span className="font-medium text-green-900">{formatCurrency(parseFloat(partialPayment) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">New Balance:</span>
                      <span className="font-medium text-green-900">
                        {formatCurrency(invoice.balance - (parseFloat(partialPayment) || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePartialPayment}
                disabled={!partialPayment || parseFloat(partialPayment) <= 0 || parseFloat(partialPayment) > invoice.balance}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
        {getModalContent()}
      </div>
    </div>
  );
};

export default InvoiceActionsModal;

