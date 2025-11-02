import { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, History } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import { getPriceHistory } from '../services/inventoryService';

function PriceAdjustmentModal({ 
  isOpen = false, 
  onClose, 
  onSubmit, 
  item = null,
  isLoading = false,
  onViewHistory
}) {
  const [adjustmentMode, setAdjustmentMode] = useState('markup'); // 'price' or 'markup'
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState('');
  const [newSupplierPrice, setNewSupplierPrice] = useState('');
  const [calculatedValue, setCalculatedValue] = useState('');
  const [errors, setErrors] = useState({});
  const [recentHistory, setRecentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Calculate current markup percentage
  const currentMarkup = item ? 
    (((parseFloat(item.sellingPrice) - parseFloat(item.supplierPrice)) / parseFloat(item.supplierPrice)) * 100).toFixed(2) : 
    0;

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen && item) {
      setNewSellingPrice('');
      setMarkupPercentage('');
      setCalculatedValue('');
      setNewSupplierPrice('');
      setErrors({});
      setAdjustmentMode('markup');
      fetchRecentHistory();
    }
  }, [isOpen, item]);

  // Fetch recent price history (last 3 changes)
  const fetchRecentHistory = async () => {
    if (!item?.id) return;
    
    try {
      setLoadingHistory(true);
      const response = await getPriceHistory(item.id);
      if (response.success) {
        setRecentHistory(response.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Clear calculated preview when switching modes
  useEffect(() => {
    setCalculatedValue('');
  }, [adjustmentMode]);

  // Calculate values when inputs change
  useEffect(() => {
    if (!item) return;

    const supplierPrice = newSupplierPrice !== '' ? parseFloat(newSupplierPrice) : parseFloat(item.supplierPrice);

    if (adjustmentMode === 'markup' && markupPercentage !== '') {
      const markup = parseFloat(markupPercentage);
      if (!isNaN(markup) && markup >= 0) {
        const calculated = supplierPrice * (1 + markup / 100);
        setCalculatedValue(calculated.toFixed(2));
      } else {
        setCalculatedValue('');
      }
    } else if (adjustmentMode === 'price' && newSellingPrice !== '') {
      const selling = parseFloat(newSellingPrice);
      if (!isNaN(selling) && selling > 0 && supplierPrice > 0) {
        const calculatedMarkup = ((selling - supplierPrice) / supplierPrice) * 100;
        setCalculatedValue(calculatedMarkup.toFixed(2));
      } else {
        setCalculatedValue('');
      }
    }
  }, [markupPercentage, newSellingPrice, adjustmentMode, item]);

  const validateForm = () => {
    const newErrors = {};
    const supplierPrice = newSupplierPrice !== '' ? parseFloat(newSupplierPrice) : parseFloat(item.supplierPrice);

    if (adjustmentMode === 'markup') {
      if (!markupPercentage || markupPercentage === '') {
        newErrors.markupPercentage = 'Markup percentage is required';
      } else if (isNaN(markupPercentage) || parseFloat(markupPercentage) < 0) {
        newErrors.markupPercentage = 'Markup percentage must be a non-negative number';
      } else if (parseFloat(markupPercentage) > 150) {
        newErrors.markupPercentage = 'Markup percentage cannot exceed 150%';
      }
    } else if (adjustmentMode === 'price') {
      if (!newSellingPrice || newSellingPrice === '') {
        newErrors.newSellingPrice = 'Selling price is required';
      } else if (isNaN(newSellingPrice) || parseFloat(newSellingPrice) <= 0) {
        newErrors.newSellingPrice = 'Selling price must be a positive number';
      } else if (parseFloat(newSellingPrice) < supplierPrice) {
        newErrors.newSellingPrice = `Selling price (₱${newSellingPrice}) cannot be below supplier price (₱${supplierPrice.toFixed(2)})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const supplierPrice = newSupplierPrice !== '' ? parseFloat(newSupplierPrice) : parseFloat(item.supplierPrice);
      
      let adjustmentData;
      
      if (adjustmentMode === 'markup') {
        const markup = parseFloat(markupPercentage);
        const sellingPrice = supplierPrice * (1 + markup / 100);
        
        adjustmentData = {
          sellingPrice: sellingPrice,
          markupPercentage: markup,
          supplierPrice: newSupplierPrice !== '' ? supplierPrice : undefined,
          adjustmentType: 'markup'
        };
      } else {
        const sellingPrice = parseFloat(newSellingPrice);
        const markup = ((sellingPrice - supplierPrice) / supplierPrice) * 100;
        
        adjustmentData = {
          sellingPrice: sellingPrice,
          markupPercentage: markup,
          supplierPrice: newSupplierPrice !== '' ? supplierPrice : undefined,
          adjustmentType: 'price'
        };
      }
      
      onSubmit(adjustmentData);
    }
  };

  const handleMarkupChange = (value) => {
    setMarkupPercentage(value);
    // Validate on change for immediate feedback
    const numValue = parseFloat(value);
    if (value === '') {
      // Clear error if field is empty
      if (errors.markupPercentage) {
        setErrors(prev => ({ ...prev, markupPercentage: '' }));
      }
    } else if (!isNaN(numValue)) {
      if (numValue < 0) {
        setErrors(prev => ({ ...prev, markupPercentage: 'Markup percentage must be a non-negative number' }));
      } else if (numValue > 150) {
        setErrors(prev => ({ ...prev, markupPercentage: 'Markup percentage cannot exceed 150%' }));
      } else {
        // Valid range, clear error if exists
        if (errors.markupPercentage) {
          setErrors(prev => ({ ...prev, markupPercentage: '' }));
        }
      }
    }
  };

  const handleSellingPriceChange = (value) => {
    setNewSellingPrice(value);
    if (errors.newSellingPrice) {
      setErrors(prev => ({ ...prev, newSellingPrice: '' }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all flex flex-col max-h-[100vh]"
      style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Adjust Pricing</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 mr-1">
          {/* Item Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">{item.itemName}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Code:</span> {item.itemCode}
              </div>
              <div>
                <span className="font-medium">Category:</span> {item.category?.name || item.category}
              </div>
              <div>
                <span className="font-medium">Supplier Price:</span> ₱{Number(newSupplierPrice !== '' ? newSupplierPrice : item.supplierPrice).toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Selling Price:</span> ₱{Number(item.sellingPrice).toFixed(2)}
              </div>
            </div>
            {/* Current Markup */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current Markup:</span>
                <span className="text-lg font-bold text-green-600">{currentMarkup}%</span>
              </div>
            </div>
          </div>

          {/* Adjustment Mode Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Adjustment Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentMode('markup')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  adjustmentMode === 'markup'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Adjust by Markup %
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentMode('price')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  adjustmentMode === 'price'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Adjust by Price
              </button>
            </div>
          </div>

          {/* Optional Supplier Price Override */}
          <div className="mb-6">
            <label htmlFor="supplierPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Price (Optional)
            </label>
            <div className="relative">
              <input
                type="number"
                id="supplierPrice"
                value={newSupplierPrice}
                onChange={(e) => setNewSupplierPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder={`Current: ₱${Number(item.supplierPrice).toFixed(2)}`}
                min="0.01"
                step="0.01"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty to keep current supplier price</p>
          </div>

          {/* Markup Percentage Input (if mode is markup) */}
          {adjustmentMode === 'markup' && (
            <div className="mb-6">
              <label htmlFor="markupPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                New Markup Percentage *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="markupPercentage"
                  value={markupPercentage}
                  onChange={(e) => handleMarkupChange(e.target.value)}
                  className={`w-full pr-8 pl-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    ${errors.markupPercentage ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Enter markup percentage (e.g., 30)"
                  min="0"
                  max="150"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
              </div>
              {errors.markupPercentage && (
                <p className="text-red-500 text-sm mt-1">{errors.markupPercentage}</p>
              )}
              {calculatedValue && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Calculated Selling Price:</span> ₱{calculatedValue}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selling Price Input (if mode is price) */}
          {adjustmentMode === 'price' && (
            <div className="mb-6">
              <label htmlFor="newSellingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                New Selling Price *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="newSellingPrice"
                  value={newSellingPrice}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    ${errors.newSellingPrice ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Enter new selling price"
                  min="0.01"
                  step="0.01"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
              </div>
              {errors.newSellingPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.newSellingPrice}</p>
              )}
              {calculatedValue && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Calculated Markup:</span> {calculatedValue}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recent Price History */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Recent Price Changes</h4>
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
                      <span className="font-medium">Selling:</span> ₱{Number(history.oldSellingPrice).toFixed(2)} → ₱{Number(history.newSellingPrice).toFixed(2)}
                      <span className="ml-3 text-gray-600">
                        <span className="font-medium">Markup:</span> {Number(history.oldMarkup).toFixed(1)}% → {Number(history.newMarkup).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                No price history available
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t rounded-2xl border-gray-100 flex-shrink-0 bg-white">
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
              adjustmentMode === 'markup'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-200'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-200'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </div>
            ) : (
              `Update ${adjustmentMode === 'markup' ? 'Markup' : 'Price'}`
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

PriceAdjustmentModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  item: PropTypes.object,
  isLoading: PropTypes.bool,
  onViewHistory: PropTypes.func
};

export default PriceAdjustmentModal;
