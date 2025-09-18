import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const Modal = ({
  isOpen,
  onClose,
  title,
  icon: TitleIcon,
  children,
  footer
}) => {
  const overlayRef = useRef(null);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
        document.documentElement.classList.add('overflow-hidden');
        document.body.classList.add('overflow-hidden');
      } else {
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden');
      }
      return () => {
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden');
      };
  }, [isOpen]);


  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
    >
      <div className="bg-white rounded-xl w-full max-w-6xl shadow-2xl max-h-[100vh] flex flex-col"
      style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}
      >
        {/* Header (fixed) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl sticky top-0">
          <div className="flex items-center gap-3">
            {TitleIcon ? <TitleIcon className="w-6 h-6" /> : null}
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-2 p-2 hover:bg-gray-200 rounded-full"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-6 overflow-y-auto mr-1">
          {children}
        </div>

        {/* Footer (fixed) */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl sticky bottom-0">
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;



