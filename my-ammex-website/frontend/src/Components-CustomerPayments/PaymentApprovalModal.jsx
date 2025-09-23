import React, { useState, useEffect } from 'react';
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
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(payment?.amount || 0);

  // Sync paymentAmount with payment prop when payment changes
  useEffect(() => {
    if (payment?.amount) {
      setPaymentAmount(payment.amount);
    }
  }, [payment?.amount]);

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

  const getAttachmentName = (file) => {
    if (!file) return '';
    if (typeof file === 'string') return file;
    if (typeof file === 'object' && file.name) return file.name;
    return String(file);
  };

  const getAttachmentUrl = (file) => {
    if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('data:'))) {
      return file;
    }
    return null;
  };

  const isImageFile = (file) => {
    const filename = getAttachmentName(file);
    if (typeof filename !== 'string') return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const lower = filename.toLowerCase();
    return imageExtensions.some(ext => lower.endsWith(ext));
  };

  const isPdfFile = (file) => {
    const filename = getAttachmentName(file);
    if (typeof filename !== 'string') return false;
    return filename.toLowerCase().endsWith('.pdf');
  };

  const getFileIcon = (file) => {
    const name = getAttachmentName(file);
    if (isImageFile(name)) return '🖼️';
    if (isPdfFile(name)) return '📄';
    return '📎';
  };

  const handleViewAttachment = (attachment) => {
    const url = getAttachmentUrl(attachment);
    if (!url) return;
    setSelectedAttachment(url);
    setShowAttachmentModal(true);
  };

  const handleCloseAttachmentModal = () => {
    setShowAttachmentModal(false);
    setSelectedAttachment(null);
  };

  const handleReject = () => {
    if (!rejectionReason || !rejectionReason.trim()) return;
    onReject(payment, rejectionReason.trim());
  };
  const handleApprove = () => {
    onApprove(paymentAmount);
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
                {/* Editable Payment Amount*/}
                <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Amount</h3>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  text-sm text-gray-900 border border-gray-500 rounded-lg p-2" 
                />
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


            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
              {payment.attachments && payment.attachments.length > 0 ? (
                <div className="space-y-2">
                  {payment.attachments.map((attachment, index) => {
                    const label = getAttachmentName(attachment);
                    const url = getAttachmentUrl(attachment);
                    const canOpen = Boolean(url);
                    return (
                      <div key={index} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(attachment)}</span>
                          <span className="text-sm text-gray-700 truncate" title={label}>{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => canOpen && handleViewAttachment(attachment)}
                            disabled={!canOpen}
                            className={`p-1 ${canOpen ? 'cursor-pointer text-gray-500 hover:text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
                            title={canOpen ? 'View attachment' : 'No preview available'}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (!canOpen) return;
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = label.split('/').pop() || 'attachment';
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            disabled={!canOpen}
                            className={`p-1 ${canOpen ? 'cursor-pointer text-gray-500 hover:text-green-600' : 'text-gray-300 cursor-not-allowed'}`}
                            title={canOpen ? 'Download attachment' : 'No download available'}
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
                  No attachments provided.
                </div>
              )}
            </div>

            {/* Rejection Reason Section */}
            <div className="mb-6">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason<span className="text-red-500">*</span> (if rejecting)
              </label>
              <textarea id="rejectionReason" name="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter reason for rejection..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500 resize-none" rows="3" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || !rejectionReason.trim()}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${(!rejectionReason || !rejectionReason.trim()) ? 'bg-red-300 text-white cursor-not-allowed' : 'cursor-pointer bg-red-600 text-white hover:bg-red-700'}`}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
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

