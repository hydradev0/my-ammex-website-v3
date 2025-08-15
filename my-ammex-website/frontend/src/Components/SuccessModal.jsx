import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from './ScrollLock';

function SuccessModal({ 
  isOpen = false, 
  onClose, 
  title = "Success!", 
  message = "Operation completed successfully.", 
  autoClose = true,
  autoCloseDelay = 5000,
  showCloseButton = true 
}) {
  
  // Auto-close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <ScrollLock active={isOpen} />
      
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out"
          style={{ 
            animation: 'successModalIn 0.3s ease-out',
            transform: 'scale(1)'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            </div>
            
            {showCloseButton && (
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 text-center leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-200 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes successModalIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );

  return createPortal(modalContent, document.body);
}

export default SuccessModal;
