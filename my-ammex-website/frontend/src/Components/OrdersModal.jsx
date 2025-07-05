import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { useEffect } from 'react';

function OrdersModal({ isOpen, onClose, title, children, titleClassName }) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
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
              className="hover:text-white hover:bg-red-800 text-gray-500 cursor-pointer"
              onClick={onClose} 
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