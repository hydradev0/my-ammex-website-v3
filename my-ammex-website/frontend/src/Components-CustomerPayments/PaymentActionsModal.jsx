import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Send, DollarSign, AlertCircle, Mail, Calendar, User } from 'lucide-react';
import ScrollLock from '../Components/ScrollLock';

const PaymentActionsModal = ({
  item,
  isOpen,
  onClose,
  actionType,
  onConfirm,
  formatCurrency
}) => {
  const [formData, setFormData] = useState({
    notes: '',
    reminderMessage: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onConfirm(actionType, { ...item, ...formData });
      onClose();
      setFormData({ notes: '', reminderMessage: '' });
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalContent = () => {
    switch (actionType) {
      case 'mark_as_paid':
        return (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Mark as Paid</h3>
                  <p className="text-sm text-gray-600">Confirm payment for this invoice</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Invoice Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Invoice:</span>
                    <p className="font-medium text-gray-900">{item.invoiceNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium text-gray-900">{item.customerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Balance:</span>
                    <p className="font-medium text-green-600">
                      {formatCurrency ? formatCurrency(item.details?.amount || 0) : `₱${(item.details?.amount || 0).toFixed(2)}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.action === 'Overdue' ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100'}`}>
                      {item.action}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Confirm Payment</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Are you sure you want to mark this invoice as paid? The balance will be set to zero.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAction({ key: 'mark_as_paid' })}
                  disabled={isSubmitting}
                  className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'send_reminder':
        return (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Send Payment Reminder</h3>
                  <p className="text-sm text-gray-600">Send a friendly reminder via email to the customer</p>
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
            <div className="p-6">
              {/* Invoice Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Invoice:</span>
                    <p className="font-medium text-gray-900">{item.invoiceNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium text-gray-900">{item.customerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount Due:</span>
                    <p className="font-medium text-red-600">
                      {formatCurrency ? formatCurrency(item.details?.amount || 0) : `₱${(item.details?.amount || 0).toFixed(2)}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Due Date:</span>
                    <p className="font-medium text-gray-900">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reminder Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reminderMessage"
                    value={formData.reminderMessage}
                    onChange={handleInputChange}
                    rows="4"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none focus:border-blue-500"
                    placeholder="Write a friendly reminder message..."
                    defaultValue={`Dear ${item.customerName},

This is a friendly reminder that invoice ${item.invoiceNumber} for ${formatCurrency ? formatCurrency(item.details?.amount || 0) : `₱${(item.details?.amount || 0).toFixed(2)}`} is currently outstanding.

Please process this payment at your earliest convenience. If you have any questions or concerns, please don't hesitate to contact us.

Thank you for your business!

Best regards,
Ammex`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none focus:border-blue-500"
                    placeholder="Any additional notes for internal use..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reminder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'download_pdf':
        return (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Download PDF</h3>
                  <p className="text-sm text-gray-600">Download invoice as PDF document</p>
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
            <div className="p-6">
              {/* Invoice Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Invoice:</span>
                    <p className="font-medium text-gray-900">{item.invoiceNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium text-gray-900">{item.customerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-medium text-gray-900">
                      {formatCurrency ? formatCurrency(item.details?.amount || 0) : `₱${(item.details?.amount || 0).toFixed(2)}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.action === 'Overdue' ? 'text-red-600 bg-red-100' : item.action === 'Paid' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'}`}>
                      {item.action}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF Format
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="standard">Standard Invoice</option>
                    <option value="detailed">Detailed with Items</option>
                    <option value="receipt">Payment Receipt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Company Logo</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Payment Terms</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Item Details</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction({ key: 'download_pdf' })}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleAction = (action) => {
    handleSubmit({ preventDefault: () => {} });
  };

  const modalContent = (
    <>
      <ScrollLock active={isOpen} />
      <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}
        >
          {getModalContent()}
        </div>
      </div>
    </>
  );

  return isOpen ? createPortal(modalContent, document.body) : null;
};

export default PaymentActionsModal;
