import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Image, Eye, Download } from 'lucide-react';
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
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

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

  const handleViewAttachment = (attachment) => {
    setSelectedAttachment(attachment);
    setShowAttachmentModal(true);
  };

  const handleCloseAttachmentModal = () => {
    setShowAttachmentModal(false);
    setSelectedAttachment(null);
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (filename) => {
    return filename.toLowerCase().endsWith('.pdf');
  };

  const getFileIcon = (filename) => {
    if (isImageFile(filename)) return '🖼️';
    if (isPdfFile(filename)) return '📄';
    return '📎';
  };

  const modalContent = (
    <>
      <ScrollLock active={isOpen} />
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Payment Approval</h2>
              <button
                onClick={onClose}
                className="text-gray-400 cursor-pointer hover:text-gray-600 p-1 transition-colors"
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
                <h3 className="text-sm font-medium text-gray-500">Invoice Reference</h3>
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
                    <div key={index} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{getFileIcon(attachment)}</span>
                        <span className="text-sm text-gray-700 truncate">{attachment}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewAttachment(attachment)}
                          className="p-1 cursor-pointer text-gray-500 hover:text-blue-600 transition-colors"
                          title="View attachment"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            // Create a temporary link to download the file
                            const link = document.createElement('a');
                            link.href = attachment; // Assuming attachment is a URL
                            link.download = attachment.split('/').pop() || 'attachment';
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="p-1 cursor-pointer text-gray-500 hover:text-green-600 transition-colors"
                          title="Download attachment"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onReject}
                className="flex-1 cursor-pointer px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={onApprove}
                className="flex-1 cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
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

  // Attachment Viewer Modal
  const attachmentModalContent = showAttachmentModal && selectedAttachment ? (
    <>
      <ScrollLock active={showAttachmentModal} />
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
             style={{ transform: 'scale(0.95)', transformOrigin: 'center' }}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">View Attachment</h3>
            <button
              onClick={handleCloseAttachmentModal}
              className="text-gray-400 cursor-pointer hover:text-gray-600 p-1 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">{selectedAttachment}</p>
              
              {isImageFile(selectedAttachment) ? (
                <div className="flex justify-center">
                  <img
                    src={selectedAttachment}
                    alt="Attachment preview"
                    className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="hidden text-center p-8">
                    <Image className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Unable to load image</p>
                    <a
                      href={selectedAttachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : isPdfFile(selectedAttachment) ? (
                <div className="flex justify-center">
                  <iframe
                    src={selectedAttachment}
                    className="w-full h-96 border border-gray-200 rounded-lg"
                    title="PDF Preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="hidden text-center p-8">
                    <span className="text-6xl">📄</span>
                    <p className="text-gray-500 mt-2">PDF preview not available</p>
                    <a
                      href={selectedAttachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                    >
                      Open PDF in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <span className="text-6xl">📎</span>
                  <p className="text-gray-500 mt-2">Preview not available for this file type</p>
                  <a
                    href={selectedAttachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                  >
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              onClick={handleCloseAttachmentModal}
              className="px-4 py-2 cursor-pointer text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = selectedAttachment;
                link.download = selectedAttachment.split('/').pop() || 'attachment';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return isOpen ? (
    <>
      {createPortal(modalContent, document.body)}
      {createPortal(attachmentModalContent, document.body)}
    </>
  ) : null;
};

export default PaymentApprovalModal;

