import { useState, useEffect } from 'react';
import { X, History, TrendingUp, TrendingDown, Package } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import { getStockHistory } from '../services/inventoryService';

function StockHistoryModal({ 
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
      const response = await getStockHistory(item.id);
      if (response.success) {
        setHistory(response.data);
      } else {
        setError('Failed to load stock history');
      }
    } catch (err) {
      console.error('Error fetching stock history:', err);
      setError('Failed to load stock history');
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

  const getStockChangeIcon = (adjustmentType, adjustmentAmount) => {
    if (adjustmentType === 'add') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (adjustmentType === 'subtract') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else if (adjustmentAmount > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (adjustmentAmount < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Package className="h-4 w-4 text-gray-600" />;
  };

  const getStockChangeColor = (adjustmentType, adjustmentAmount) => {
    if (adjustmentType === 'add') return 'text-green-600';
    if (adjustmentType === 'subtract') return 'text-red-600';
    if (adjustmentAmount > 0) return 'text-green-600';
    if (adjustmentAmount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getAdjustmentTypeLabel = (adjustmentType) => {
    switch (adjustmentType) {
      case 'add': return 'Stock Added';
      case 'subtract': return 'Stock Removed';
      case 'set': return 'Stock Set';
      default: return 'Stock Adjustment';
    }
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
              <h3 className="text-xl font-bold text-gray-800">Stock Adjustment History</h3>
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
                <p className="text-gray-600">Loading stock history...</p>
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
              <p className="text-gray-500">No stock adjustment history available for this item</p>
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
                          {getStockChangeIcon(record.adjustmentType, record.adjustmentAmount)}
                          <span className={`text-sm font-medium ${getStockChangeColor(record.adjustmentType, record.adjustmentAmount)}`}>
                            {getAdjustmentTypeLabel(record.adjustmentType)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Stock changes grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Old Quantity */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Previous Stock</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">{Number(record.oldQuantity).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* New Quantity */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-700 mb-1">New Stock</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-900">{Number(record.newQuantity).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Adjustment Amount */}
                        <div className={`col-span-2 p-3 rounded-lg ${
                          record.adjustmentType === 'subtract' 
                            ? 'bg-red-50' 
                            : record.adjustmentType === 'add' 
                            ? 'bg-green-50' 
                            : 'bg-gray-50'
                        }`}>
                          <p className={`text-xs mb-1 ${
                            record.adjustmentType === 'subtract' 
                              ? 'text-red-700' 
                              : record.adjustmentType === 'add' 
                              ? 'text-green-700' 
                              : 'text-gray-700'
                          }`}>Adjustment Amount</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${getStockChangeColor(record.adjustmentType, record.adjustmentAmount)}`}>
                              {record.adjustmentType === 'subtract' 
                                ? '-' 
                                : record.adjustmentType === 'add' 
                                ? '+' 
                                : record.adjustmentAmount >= 0 ? '+' : ''}{Number(record.adjustmentAmount).toLocaleString()}
                            </span>
                          </div>
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

StockHistoryModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object
};

export default StockHistoryModal;
