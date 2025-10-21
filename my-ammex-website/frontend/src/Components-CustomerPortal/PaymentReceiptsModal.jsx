import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Eye, Download, CheckCircle } from 'lucide-react';
import ScrollLock from '../Components/ScrollLock';
import { getMyPaymentReceipts, getPaymentReceiptDetails, downloadPaymentReceipt, formatPaymentMethod } from '../services/receiptService';

const PaymentReceiptsModal = ({ 
  isOpen, 
  onClose, 
  onViewReceiptDetail 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [paymentReceipts, setPaymentReceipts] = useState([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [downloadingReceipts, setDownloadingReceipts] = useState(new Set());
  const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false);
  const [isReceiptDetailModalAnimating, setIsReceiptDetailModalAnimating] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  const modalRef = useRef(null);
  const receiptDetailModalRef = useRef(null);

  // Handle modal animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Handle receipt detail modal animation
  useEffect(() => {
    if (showReceiptDetailModal) {
      const timer = setTimeout(() => {
        setIsReceiptDetailModalAnimating(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showReceiptDetailModal]);

  // Load payment receipts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPaymentReceipts();
    }
  }, [isOpen]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && modalRef.current && event.target === modalRef.current) {
        closeModal();
      }
      if (showReceiptDetailModal && receiptDetailModalRef.current && event.target === receiptDetailModalRef.current) {
        closeReceiptDetailModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showReceiptDetailModal]);

  const loadPaymentReceipts = async () => {
    setIsLoadingReceipts(true);
    try {
      const response = await getMyPaymentReceipts();
      setPaymentReceipts(response.data || []);
    } catch (error) {
      console.error('Failed to load payment receipts:', error);
      setPaymentReceipts([]);
    } finally {
      setIsLoadingReceipts(false);
    }
  };

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 500); // Match the animation duration
  };

  const handleViewReceiptDetail = async (receiptId) => {
    try {
      const response = await getPaymentReceiptDetails(receiptId);
      setSelectedReceipt(response.data);
      setShowReceiptDetailModal(true);
      setIsReceiptDetailModalAnimating(true);
    } catch (error) {
      console.error('Failed to load receipt details:', error);
    }
  };

  const closeReceiptDetailModal = () => {
    setIsReceiptDetailModalAnimating(false);
    setTimeout(() => {
      setShowReceiptDetailModal(false);
      setSelectedReceipt(null);
    }, 500);
  };

  const handleDownloadReceipt = async (receiptId) => {
    try {
      // Add receipt ID to downloading set
      setDownloadingReceipts(prev => new Set([...prev, receiptId]));
      
      await downloadPaymentReceipt(receiptId);
    } catch (error) {
      console.error('Failed to download receipt:', error);
      alert(`Failed to download receipt: ${error.message}`);
    } finally {
      // Remove receipt ID from downloading set
      setDownloadingReceipts(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiptId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₱0.00';
    }
    return `₱${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Main Payment Receipts Modal
  const paymentReceiptsModalContent = isOpen ? (
    <div 
      ref={modalRef}
      className={`fixed inset-0 bg-black/30 flex items-end sm:items-center justify-end z-50 p-0 sm:p-0 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-white rounded-t-2xl sm:rounded-l-2xl sm:rounded-r-none shadow-2xl w-full sm:w-[85vw] sm:max-w-xl h-[100vh] sm:h-[100vh] flex flex-col transform transition-all duration-500 ease-in-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">   
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment Receipts</h2>
              <p className="text-sm text-gray-600 mt-1">Your payment history and receipts</p>
            </div>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          {isLoadingReceipts ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading receipts...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paymentReceipts.map((receipt) => (
                  <div 
                    key={receipt.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="text-base font-bold text-gray-900">{receipt.receiptNumber}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {receipt.invoice?.invoiceNumber || 'N/A'} • {formatDate(receipt.paymentDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Payment Amount</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(receipt.amount)}</p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-gray-50 rounded-md p-3 mb-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Payment Method</span>
                          <p className="font-semibold text-gray-900">{formatPaymentMethod(receipt.paymentMethod)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Balance After Payment</span>
                          <p className={`font-semibold ${Number(receipt.remainingAmount) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {formatCurrency(receipt.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reference Info */}
                    {receipt.paymentReference && (
                      <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        <span className="font-normal">Ref: </span>{receipt.paymentReference}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end border-t border-gray-200 pt-3">
                      <button 
                        onClick={() => handleViewReceiptDetail(receipt.id)}
                        className="flex items-center gap-1 border border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-600 px-2 py-1.5 rounded-lg text-sm transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadReceipt(receipt.id);
                        }}
                        disabled={downloadingReceipts.has(receipt.id)}
                        className={`flex items-center gap-1 border border-gray-300 px-2 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
                          downloadingReceipts.has(receipt.id)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-600'
                        }`}
                      >
                        {downloadingReceipts.has(receipt.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {paymentReceipts.length === 0 && !isLoadingReceipts && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payment Receipts</h3>
                  <p className="text-gray-500">Payment receipts will appear here once payments are processed.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  // Receipt Detail Modal (Nested)
  const receiptDetailModalContent = showReceiptDetailModal && selectedReceipt ? (
    <div 
      ref={receiptDetailModalRef}
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 transition-opacity duration-300 ${
        isReceiptDetailModalAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ${
          isReceiptDetailModalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">   
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Receipt Details</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedReceipt.receiptNumber}</p>
            </div>
            <button
              onClick={closeReceiptDetailModal}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
          {/* Receipt Header */}
          <div className="border-b-2 border-gray-900 pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Payment Receipt</p>
                <h2 className="text-3xl font-bold text-gray-900">{selectedReceipt.receiptNumber}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount Paid</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedReceipt.amount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4" />
              <span>Payment Confirmed</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Payment Information Card */}
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Payment Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedReceipt.paymentDate)}</p>
                  <p className="text-xs text-gray-500">{new Date(selectedReceipt.paymentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Method</p>
                  <p className="text-sm font-semibold text-gray-900">{formatPaymentMethod(selectedReceipt.paymentMethod)}</p>
                </div>
                {selectedReceipt.paymentReference && (
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction Reference</p>
                    <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900">{selectedReceipt.paymentReference}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Information Card */}
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Invoice Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice Number</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReceipt.invoice?.invoiceNumber || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice Date</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReceipt.invoice?.invoiceDate ? formatDate(selectedReceipt.invoice.invoiceDate) : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            {selectedReceipt.customer && (
              <div className="border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Customer Information</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedReceipt.customer.customerName || selectedReceipt.customer.contactName || 'N/A'}</p>
                  </div>
                  {selectedReceipt.customer.email1 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</p>
                      <p className="text-sm text-gray-900">{selectedReceipt.customer.email1}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Breakdown */}
            <div className="border-2 border-gray-900 rounded-lg p-5 bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-700">Invoice Total</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedReceipt.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-300">
                  <span className="text-sm text-gray-700">This Payment</span>
                  <span className="text-sm font-semibold text-gray-900">- {formatCurrency(selectedReceipt.amount)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-900 pt-3">
                  <span className="text-base font-bold text-gray-900">Balance Remaining</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(selectedReceipt.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                This receipt serves as proof of payment. For any inquiries, please contact our support team with your receipt number.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10 rounded-b-lg">
          <div className="flex gap-2 justify-end">
            <button
              onClick={closeReceiptDetailModal}
              className="px-3 py-2 border cursor-pointer border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => handleDownloadReceipt(selectedReceipt.id)}
              disabled={downloadingReceipts.has(selectedReceipt.id)}
              className={`flex items-center gap-1 px-2 py-2 border border-gray-300 rounded-lg transition-colors ${
                downloadingReceipts.has(selectedReceipt.id)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'cursor-pointer text-gray-600 hover:bg-gray-50'
              }`}
            >
              {downloadingReceipts.has(selectedReceipt.id) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <ScrollLock active={isOpen || showReceiptDetailModal} />
      {createPortal(paymentReceiptsModalContent, document.body)}
      {createPortal(receiptDetailModalContent, document.body)}
    </>
  );
};

export default PaymentReceiptsModal;
