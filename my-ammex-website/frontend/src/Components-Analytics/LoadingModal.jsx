import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const LoadingModal = ({ isOpen, children }) => {
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-300/40 to-indigo-200/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 backdrop-blur-xl rounded-3xl p-10 max-w-lg w-full mx-4 shadow-2xl border border-white/20 animate-in"
      style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default LoadingModal;


