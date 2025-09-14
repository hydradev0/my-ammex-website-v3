import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ScrollLock from '../Components/ScrollLock';

const QRCodeModal = ({ 
  isOpen, 
  onClose, 
  paymentMethod, 
  selectedBank, 
  bankOptions, 
  paymentAmount, 
  invoiceNumber 
}) => {
  const modalRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment QR Code</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="w-80 h-80 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
              {paymentMethod === 'maya' ? (
                <div className="text-center">
                  <div className="w-64 h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-6xl">M</span>
                  </div>
                  <p className="text-sm text-gray-600">Maya QR Code</p>
                </div>
              ) : paymentMethod === 'gcash' ? (
                <div className="text-center">
                  <div className="w-64 h-64 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-6xl">G</span>
                  </div>
                  <p className="text-sm text-gray-600">GCash QR Code</p>
                </div>
              ) : paymentMethod === 'bank_transfer' && selectedBank ? (
                <div className="text-center">
                  <div className={`w-64 h-64 bg-gradient-to-br ${bankOptions?.find(bank => bank.key === selectedBank)?.color || 'from-blue-600 to-blue-800'} rounded-lg flex items-center justify-center mb-4`}>
                    <span className="text-white font-bold text-6xl">
                      {bankOptions?.find(bank => bank.key === selectedBank)?.label?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {bankOptions?.find(bank => bank.key === selectedBank)?.label} QR
                  </p>
                </div>
              ) : paymentMethod === 'bank_transfer' ? (
                <div className="text-center">
                  <div className="w-64 h-64 bg-gray-300 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gray-600 font-bold text-6xl">?</span>
                  </div>
                  <p className="text-sm text-gray-600">Select a bank</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-64 h-64 bg-gray-300 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gray-600 font-bold text-6xl">?</span>
                  </div>
                  <p className="text-sm text-gray-600">QR Code</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Amount to Pay:</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(parseFloat(paymentAmount) || 0)}</p>
            {paymentMethod === 'bank_transfer' && selectedBank && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Reference Number:</p>
                <p className="text-sm font-medium text-gray-900">AMMEX-{invoiceNumber}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ScrollLock active={isOpen} />
      {createPortal(modalContent, document.body)}
    </>
  );
};

export default QRCodeModal;
