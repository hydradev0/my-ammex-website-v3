import { X } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

function ViewDetailsModal({ 
  onClose, 
  data, 
  title = 'Details', 
  sections = [],
  className = '',
  isOpen = true
}) {
  if (!isOpen || !data) return null;

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

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full max-w-6xl flex flex-col max-h-screen ${className}`} style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 pl-4 py-4">{title}</h2>
          
          <button 
            onClick={onClose} 
            className="hover:text-gray-400 text-gray-600 mb-4"
          >
            <X className="h-8 w-8" />
          </button>
        </div> 
        
        <div className="overflow-y-auto flex-grow p-6">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {/* Section Header */}
              {section.title && (
                <h3 className="text-lg pl-4 font-bold text-gray-700 mb-4">{section.title}</h3>
              )}
              
              {/* Section Container */}
              <div className={`grid ${section.gridCols || 'grid-cols-1'} border border-gray-200 shadow-sm gap-4 bg-white rounded-lg p-4`}>
                {section.fields.map((field, fieldIndex) => (
                  <ViewField
                    key={fieldIndex}
                    label={field.label}
                    value={field.getValue ? field.getValue(data) : (data[field.key] || 'N/A')}
                    width={field.width || 'w-full'}
                    isTextArea={field.isTextArea || false}
                    customRender={field.customRender}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 mt-2 border-t-2 border-gray-300 flex justify-end gap-3">
          <button 
            type="button" 
            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal outside the scaled container
  return createPortal(modalContent, document.body);
}

ViewDetailsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  title: PropTypes.string,
  isOpen: PropTypes.bool,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      gridCols: PropTypes.string,
      bgColor: PropTypes.string,
      fields: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          key: PropTypes.string,
          getValue: PropTypes.func,
          width: PropTypes.string,
          isTextArea: PropTypes.bool,
          customRender: PropTypes.func
        })
      ).isRequired
    })
  ).isRequired,
  className: PropTypes.string
};

function ViewField({ label, value, width = 'w-full', isTextArea = false, customRender }) {
  const displayValue = customRender ? customRender(value) : value;
  
  return (
    <div className="m-4">
      <label className="block text-lg font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className={`${width} text-lg border border-gray-300 rounded-md px-4 py-2 bg-gray-50 min-h-[40px] flex items-center`}>
        {isTextArea ? (
          <div className="w-full min-h-[100px] whitespace-pre-wrap">
            {displayValue}
          </div>
        ) : (
          <span className="text-gray-800">{displayValue}</span>
        )}
      </div>
    </div>
  );
}

export default ViewDetailsModal; 