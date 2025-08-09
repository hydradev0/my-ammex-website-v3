import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ScrollLock from "./ScrollLock";

function HandleCustomerModal({ 
  isOpen, 
  onClose, 
  title,
  children,
  footerContent,
  width = 'w-[600px]',
  maxHeight = 'max-h-[100vh]',
}) {
  const modalRef = useRef(null);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && modalRef.current && event.target === modalRef.current) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className={`bg-white rounded-xl shadow-lg ${width} ${maxHeight} overflow-y-auto`} 
       style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <button 
            className="hover:text-gray-400 text-gray-600 mb-4 cursor-pointer"
            onClick={onClose} 
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footerContent && (
          <div className="border-t border-gray-200 p-6 flex justify-end gap-4">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <ScrollLock active={isOpen} />
      {createPortal(modalContent, document.body)}
    </>
  );
}

export default HandleCustomerModal;
