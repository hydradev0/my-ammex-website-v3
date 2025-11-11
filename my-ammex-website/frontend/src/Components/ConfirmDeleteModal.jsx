import PropTypes from 'prop-types';
import { AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from './ScrollLock';

function ConfirmDeleteModal({
  isOpen,
  title,
  entityName,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onCancel,
  onConfirm
}) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
       style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {entityName && (
            <p className="text-gray-700 mb-4">
              Are you sure you want to removed <span className="font-semibold text-gray-900">"{entityName}"</span>?
            </p>
          )}
          {description && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 cursor-pointer border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 cursor-pointer bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{confirmLabel}</span>
              </div>
            ) : (
              confirmLabel
            )}
          </button>
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
}

ConfirmDeleteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  entityName: PropTypes.string,
  description: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  loading: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default ConfirmDeleteModal;


