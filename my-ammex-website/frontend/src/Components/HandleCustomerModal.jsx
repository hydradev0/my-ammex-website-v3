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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className={`bg-white rounded-xl shadow-lg ${width} ${maxHeight} flex flex-col`} 
       style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <button 
            className="hover:text-gray-400 text-gray-600 cursor-pointer"
            onClick={onClose} 
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Fixed Footer */}
        {footerContent && (
          <div className="border-t border-gray-200 p-6 flex justify-end gap-4 flex-shrink-0">
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
