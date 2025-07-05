import { X } from 'lucide-react';
import { useEffect } from 'react';

function HandleCustomerModal({ 
  isOpen, 
  onClose, 
  title,
  children,
  footerContent,
  width = "600px",
  maxHeight = "100vh"
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    // Clean up on unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl shadow-lg w-[${width}] max-h-[${maxHeight}] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <button 
            className="hover:text-white hover:bg-red-800 text-gray-500 mb-4"
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
}

export default HandleCustomerModal;
