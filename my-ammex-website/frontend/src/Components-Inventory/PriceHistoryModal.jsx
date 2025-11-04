import { useState, useEffect } from 'react';
import { X, History, TrendingUp, TrendingDown, ArrowRight, MoveRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import { getPriceHistory } from '../services/inventoryService';

function PriceHistoryModal({ 
  isOpen = false, 
  onClose, 
  item = null
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && item?.id) {
      fetchHistory();
    }
  }, [isOpen, item]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPriceHistory(item.id);
      if (response.success) {
        setHistory(response.data);
      } else {
        setError('Failed to load price history');
      }
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPrice = (value) => {
    const num = Number(value);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getMarkupChangeIcon = (oldMarkup, newMarkup) => {
    if (newMarkup > oldMarkup) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (newMarkup < oldMarkup) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getMarkupChangeColor = (oldMarkup, newMarkup) => {
    if (newMarkup > oldMarkup) return 'text-green-600';
    if (newMarkup < oldMarkup) return 'text-red-600';
    return 'text-gray-600';
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl transform transition-all max-h-[90vh] flex flex-col"
      style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Price Change History</h3>
              <p className="text-sm text-gray-600">{item.itemName} ({item.itemCode})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading price history...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={fetchHistory}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">No price history available for this item</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline view */}
              <div className="relative">
                {history.map((record, index) => (
                  <div key={record.id} className="relative pb-8">
                    {/* Timeline line */}
                    {index !== history.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    
                    {/* Timeline dot */}
                    <div className="absolute left-3 top-3 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow"></div>
                    
                    {/* Content card */}
                    <div className="ml-12 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm text-gray-500">{formatDate(record.createdAt)}</p>
                          <p className="text-sm font-medium text-gray-700">
                            Changed by: <span className="text-gray-900">{record.changer?.name || 'Unknown'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getMarkupChangeIcon(parseFloat(record.oldMarkup), parseFloat(record.newMarkup))}
                          <span className={`text-sm font-medium ${getMarkupChangeColor(parseFloat(record.oldMarkup), parseFloat(record.newMarkup))}`}>
                            {record.adjustmentType === 'markup' ? 'Markup Adjustment' : 'Price Adjustment'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Price changes grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Supplier Price */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Supplier Price</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">₱{formatPrice(record.oldSupplierPrice)}</span>
                            <span className="text-gray-700"><MoveRight className="h-5 w-5" /></span>
                            <span className="text-sm font-semibold text-gray-900">₱{formatPrice(record.newSupplierPrice)}</span>
                          </div>
                          {record.oldSupplierPrice !== record.newSupplierPrice && (
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-semibold text-gray-600">Changed by:</span> {record.newSupplierPrice > record.oldSupplierPrice ? '+' : ''}
                              ₱{formatPrice(Math.abs(record.newSupplierPrice - record.oldSupplierPrice))}
                            </p>
                          )}
                        </div>

                        {/* Selling Price */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-700 mb-1">Selling Price</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">₱{formatPrice(record.oldSellingPrice)}</span>
                            <span className="text-gray-700"><MoveRight className="h-5 w-5" /></span>
                            <span className="text-sm font-semibold text-blue-900">₱{formatPrice(record.newSellingPrice)}</span>
                          </div>
                          {record.oldSellingPrice !== record.newSellingPrice && (
                            <p className="text-xs text-blue-600 mt-1">
                              <span className="font-semibold text-blue-600">Changed by:</span> {record.newSellingPrice > record.oldSellingPrice ? '+' : ''}
                              ₱{formatPrice(Math.abs(record.newSellingPrice - record.oldSellingPrice))}
                            </p>
                          )}
                        </div>

                        {/* Markup Percentage */}
                        <div className="col-span-2 bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-700 mb-1">Markup Percentage</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{Number(record.oldMarkup).toFixed(2)}%</span>
                            <span className="text-gray-700"><MoveRight className="h-5 w-5" /></span>
                            <span className="text-sm font-semibold text-green-900">{Number(record.newMarkup).toFixed(2)}%</span>
                          </div>
                          {record.oldMarkup !== record.newMarkup && (
                            <p className={`text-xs mt-1 ${getMarkupChangeColor(parseFloat(record.oldMarkup), parseFloat(record.newMarkup))}`}>
                              <span className="font-semibold text-green-600">Changed by:</span> {record.newMarkup > record.oldMarkup ? '+' : ''}
                              {Math.abs(record.newMarkup - record.oldMarkup).toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 cursor-pointer bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ScrollLock active={isOpen} />
      {isOpen && createPortal(modalContent, document.body)}
    </>
  );
}

PriceHistoryModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object
};

export default PriceHistoryModal;

