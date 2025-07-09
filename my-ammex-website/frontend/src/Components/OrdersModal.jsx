import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';

function OrdersModal({ isOpen, onClose, title, children, titleClassName }) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="px-8 pt-6">
          <div className="flex justify-between items-center border-b-2 pb-4 border-gray-300">
            <h2 className={`text-xl font-semibold ${titleClassName || ''}`}>{title}</h2>
            <button 
              onClick={onClose} 
              className="hover:text-gray-400 text-gray-600 mb-4"
              >
              <X className="h-8 w-8" />
            </button>
          </div>
        </div>
        <div className="p-2">
          {children}
        </div>
      </div>
    </div>
  );
}

OrdersModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  titleClassName: PropTypes.string
};

export default OrdersModal;