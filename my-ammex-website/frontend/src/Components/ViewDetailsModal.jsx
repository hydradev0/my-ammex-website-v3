import { X, Boxes, DollarSign, Info, User, MapPin, Shield } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import ScrollLock from './ScrollLock';

function ViewDetailsModal({
  onClose,
  data,
  title = 'View Details',
  sections = [],
  className = '',
  isOpen = true
}) {
  if (!isOpen || !data) {
    return null;
  }

  const modalContent = (
    <>
      {/* ScrollLock component to handle scroll locking properly */}
      <ScrollLock active={isOpen} />
      
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col max-h-screen overflow-hidden ${className}`} style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
          {/* Header */}
          <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div> 
          
          {/* Content */}
          <div className="overflow-y-auto flex-grow p-6 mr-3 bg-white">
            {/* Original sections */}
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8">
                {/* Section Header with Icon */}
                {section.title && (
                  <div className="flex items-center gap-2 mb-4">
                    {section.title === 'Item Details' && <Info className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Pricing Information' && <DollarSign className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Stock Information' && <Boxes className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Additional Information' && <Info className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Basic Information' && <User className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Address Information' && <MapPin className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Status Information' && <Shield className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Customer Details' && <User className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Contact Information' && <Info className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    {section.title === 'Business Information' && <Info className="mb-2 w-5 h-5 md:w-6 md:h-6 text-[#3182ce]" />}
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h3>
                  </div>
                )}
                
                {/* Section Container - removed borders and shadows */}
                <div className={`grid ${section.gridCols || 'grid-cols-1'} gap-6 ${section.bgColor || 'bg-white'} rounded-xl p-4`}>
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

                {/* Add divider after each section except the last one */}
                {sectionIndex < sections.length - 1 && (
                  <div className="border-t border-gray-300 mb-4 md:mb-6 mt-8"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex justify-end">
              <button 
                type="button" 
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
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
      <label className="block text-xl font-semibold text-gray-900 mb-2">
        {label}
      </label>
      <div className={`${width} py-1 bg-white min-h-[40px] items-center`}>
        {isTextArea ? (
          <div className="w-full min-h-[100px] whitespace-pre-wrap block text-lg text-gray-700 leading-relaxed">
            {displayValue}
          </div>
        ) : (
          <span className="block text-md font-medium text-gray-700">{displayValue}</span>
        )}
      </div>
    </div>
  );
}

export default ViewDetailsModal; 