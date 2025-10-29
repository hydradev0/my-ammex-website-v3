import { useState, useEffect } from 'react';
import { X, Plus, Minus, Package, History } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import { getStockHistory } from '../services/inventoryService';

function StockAdjustmentModal({ 
  isOpen = false, 
  onClose, 
  onSubmit, 
  item = null,
  isLoading = false,
  onViewHistory
}) {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'subtract'
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState({});
  const [recentHistory, setRecentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen && item) {
      setQuantity('');
      setErrors({});
      setAdjustmentType('add');
      fetchRecentHistory();
    }
  }, [isOpen, item]);

  // Fetch recent stock history (last 3 changes)
  const fetchRecentHistory = async () => {
    if (!item?.id) return;
    
    try {
      setLoadingHistory(true);
      const response = await getStockHistory(item.id);
      if (response.success) {
        setRecentHistory(response.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching stock history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!quantity || quantity === '') {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(quantity) || Number(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    // Additional validation for stock removal
    if (adjustmentType === 'subtract') {
      const currentStock = item?.quantity || 0;
      const removalAmount = Number(quantity);
      if (removalAmount > currentStock) {
        newErrors.quantity = `Cannot remove more than current stock (${currentStock.toLocaleString()})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const adjustmentData = {
        quantity: Number(quantity),
        adjustmentType: adjustmentType
      };
      
      onSubmit(adjustmentData);
    }
  };

  const handleQuantityChange = (value) => {
    setQuantity(value);
    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: '' }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getNewStockDisplay = () => {
    if (!quantity || isNaN(quantity)) return item?.quantity || 0;
    
    const adjustment = Number(quantity);
    return adjustmentType === 'add' 
      ? (item?.quantity || 0) + adjustment
      : Math.max(0, (item?.quantity || 0) - adjustment);
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all"
      style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Adjust Stock</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Item Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">{item.itemName}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Code:</span> {item.itemCode}
              </div>
              <div>
                <span className="font-medium">Current Stock:</span> {item.quantity.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Category:</span> {item.category?.name || item.category}
              </div>
              <div>
                <span className="font-medium">Unit:</span> {item.unit?.name || item.unit}
              </div>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Adjustment Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  adjustmentType === 'add'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <Plus className="h-4 w-4" />
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('subtract')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  adjustmentType === 'subtract'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <Minus className="h-4 w-4" />
                Remove Stock
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="mb-6">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to {adjustmentType === 'add' ? 'Add' : 'Remove'}
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`Enter quantity to ${adjustmentType === 'add' ? 'add' : 'remove'}`}
              min="1"
              step="1"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* New Stock Preview */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">New Stock Level:</span>
              <span className="text-lg font-bold text-blue-900">
                {getNewStockDisplay().toLocaleString()}
              </span>
            </div>
            {adjustmentType === 'subtract' && getNewStockDisplay() < 0 && (
              <p className="text-red-600 text-sm mt-2">
                ⚠️ Warning: This will result in negative stock
              </p>
            )}
          </div>

          {/* Recent Stock History */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Recent Stock Changes</h4>
              {onViewHistory && (
                <button
                  type="button"
                  onClick={() => onViewHistory(item)}
                  className="text-sm cursor-pointer text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <History className="h-4 w-4" />
                  View Full History
                </button>
              )}
            </div>
            
            {loadingHistory ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                Loading history...
              </div>
            ) : recentHistory.length > 0 ? (
              <div className="space-y-2">
                {recentHistory.map((history) => (
                  <div key={history.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-gray-500">{formatDate(history.createdAt)}</span>
                      <span className="text-xs text-gray-600 font-medium">
                        {history.changer?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-gray-700">
                      <span className="font-medium">Stock:</span> {Number(history.oldQuantity).toLocaleString()} → {Number(history.newQuantity).toLocaleString()}
                      <span className="ml-3 text-gray-600">
                        <span className="font-medium">Change:</span> {history.adjustmentAmount >= 0 ? '+' : ''}{Number(history.adjustmentAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                No stock adjustment history available
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 cursor-pointer px-4 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 cursor-pointer text-white font-medium rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
              adjustmentType === 'add'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-200'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-200'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </div>
            ) : (
              `${adjustmentType === 'add' ? 'Add' : 'Remove'} Stock`
            )}
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

StockAdjustmentModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  item: PropTypes.object,
  isLoading: PropTypes.bool,
  onViewHistory: PropTypes.func
};

export default StockAdjustmentModal;
