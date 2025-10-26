import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingModal = ({ isOpen, message = "Loading..." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-lg p-4 shadow-xl border border-gray-200 max-w-sm w-full">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
          <p className="text-gray-700 font-medium text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
