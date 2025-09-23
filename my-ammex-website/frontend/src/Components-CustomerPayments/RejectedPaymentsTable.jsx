import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import ConfirmDeleteModal from '../Components/ConfirmDeleteModal';

const RejectedPaymentsTable = ({
  payments,
  onReApprove,
  onDelete,
  getPaymentMethodName,
  formatCurrency,
  formatDateTime
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleDeleteClick = (payment) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedPayment) {
      onDelete(selectedPayment);
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSelectedPayment(null);
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No rejected payments</h3>
        <p className="mt-1 text-sm text-gray-500">
          Rejected payments will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {payments.map((payment) => (
          <li key={payment.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {payment.customerName}
                      </p>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Rejected
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <p>
                        Invoice: {payment.invoiceNumber} • 
                        {getPaymentMethodName(payment.paymentMethod)} • 
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Rejected: {formatDateTime(payment.rejectedDate || payment.submittedDate)}
                      {payment.rejectionReason && (
                        <span> • {payment.rejectionReason}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onReApprove(payment)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Re-approve
                  </button>
                  <button
                    onClick={() => handleDeleteClick(payment)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Rejected Payment"
        entityName={selectedPayment ? `${selectedPayment.customerName} - ${selectedPayment.invoiceNumber}` : ''}
        description="This action cannot be undone. The rejected payment will be permanently removed from the system."
        confirmLabel="Delete Payment"
        cancelLabel="Cancel"
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default RejectedPaymentsTable;
