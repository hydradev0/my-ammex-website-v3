import React from 'react';
import { X, CheckCircle, XCircle, Image } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";


const PaymentApprovalModal = ({ 
  payment, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject, 
  getPaymentMethodName 
}) => {
  if (!isOpen || !payment) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString()}`;
  };

  const modalContent = (
    <>
      <ScrollLock active={isOpen} />
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Payment Approval</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                <p className="text-sm text-gray-900">{payment.customerName}</p>
                <p className="text-xs text-gray-500">{payment.customerEmail}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Invoice Number</h3>
                <p className="text-sm text-gray-900">{payment.invoiceNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Amount</h3>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                <p className="text-sm text-gray-900">{getPaymentMethodName(payment.paymentMethod)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reference Number</h3>
                <p className="text-sm text-gray-900">{payment.reference}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Submitted Date</h3>
                <p className="text-sm text-gray-900">{formatDate(payment.submittedDate)}</p>
              </div>
            </div>

            {payment.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{payment.notes}</p>
              </div>
            )}

            {payment.attachments && payment.attachments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
                <div className="space-y-2">
                  {payment.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Image className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={onApprove}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return isOpen ? createPortal(modalContent, document.body) : null;
};

export default PaymentApprovalModal;

