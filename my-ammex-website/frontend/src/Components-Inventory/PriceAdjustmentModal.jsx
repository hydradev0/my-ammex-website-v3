import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";

function PriceAdjustmentModal({ 
  isOpen = false, 
  onClose, 
  onSubmit, 
  item = null,
  isLoading = false
}) {
  const [adjustmentType, setAdjustmentType] = useState('increase'); // 'increase' or 'decrease'
  const [priceChange, setPriceChange] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen && item) {
      setPriceChange('');
      setNewPrice('');
      setReason('');
      setErrors({});
      setAdjustmentType('increase');
    }
  }, [isOpen, item]);

  // Calculate new price when price change or adjustment type changes
  useEffect(() => {
    if (item) {
      const currentPrice = parseFloat(item.price) || 0;
      
      if (priceChange === '' || priceChange === null || priceChange === undefined) {
        // Reset to original price when input is cleared
        setNewPrice(currentPrice.toFixed(2));
      } else {
        const change = parseFloat(priceChange) || 0;
        
        if (adjustmentType === 'increase') {
          setNewPrice((currentPrice + change).toFixed(2));
        } else {
          setNewPrice(Math.max(0, (currentPrice - change)).toFixed(2));
        }
      }
    }
  }, [priceChange, adjustmentType, item]);

  const validateForm = () => {
    const newErrors = {};

    if (!priceChange || priceChange === '') {
      newErrors.priceChange = 'Price change amount is required';
    } else if (isNaN(priceChange) || Number(priceChange) <= 0) {
      newErrors.priceChange = 'Price change must be a positive number';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    // Validate new price is within floor/ceiling bounds if they exist
    if (item?.floorPrice && parseFloat(newPrice) < parseFloat(item.floorPrice)) {
      newErrors.priceChange = `New price (₱${newPrice}) cannot be below floor price (₱${item.floorPrice})`;
    }
    if (item?.ceilingPrice && parseFloat(newPrice) > parseFloat(item.ceilingPrice)) {
      newErrors.priceChange = `New price (₱${newPrice}) cannot exceed ceiling price (₱${item.ceilingPrice})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const adjustmentData = {
        type: adjustmentType,
        priceChange: Number(priceChange),
        newPrice: Number(newPrice),
        reason: reason.trim(),
        currentPrice: item.price,
        percentageChange: ((Number(newPrice) - Number(item.price)) / Number(item.price)) * 100
      };
      
      onSubmit(adjustmentData);
    }
  };

  const handlePriceChangeInput = (value) => {
    setPriceChange(value);
    if (errors.priceChange) {
      setErrors(prev => ({ ...prev, priceChange: '' }));
    }
  };

  const handleReasonChange = (value) => {
    setReason(value);
    if (errors.reason) {
      setErrors(prev => ({ ...prev, reason: '' }));
    }
  };

  const getPriceChangeColor = () => {
    if (adjustmentType === 'increase') return 'text-green-600';
    if (adjustmentType === 'decrease') return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = () => {
    if (adjustmentType === 'increase') return '↗';
    if (adjustmentType === 'decrease') return '↘';
    return '→';
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all"
      style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
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
                <span className="font-medium">Current Price:</span> ₱{Number(item.price).toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Category:</span> {item.category?.name || item.category}
              </div>
              <div>
                <span className="font-medium">Unit:</span> {item.unit?.name || item.unit}
              </div>
            </div>
            {/* Price Range Info */}
            {(item.floorPrice || item.ceilingPrice) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {item.floorPrice && (
                    <div>
                      <span className="font-medium text-green-600">Floor Price:</span> ₱{Number(item.floorPrice).toFixed(2)}
                    </div>
                  )}
                  {item.ceilingPrice && (
                    <div>
                      <span className="font-medium text-red-600">Ceiling Price:</span> ₱{Number(item.ceilingPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Adjustment Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Adjustment Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('increase')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  adjustmentType === 'increase'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Increase Price
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('decrease')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  adjustmentType === 'decrease'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                Decrease Price
              </button>
            </div>
          </div>

          {/* Price Change Input */}
          <div className="mb-6">
            <label htmlFor="priceChange" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to {adjustmentType === 'increase' ? 'Add' : 'Subtract'}
            </label>
            <div className="relative">
              <input
                type="number"
                id="priceChange"
                value={priceChange}
                onChange={(e) => handlePriceChangeInput(e.target.value)}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${errors.priceChange ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder={`Enter amount to ${adjustmentType === 'increase' ? 'add' : 'subtract'}`}
                min="0.01"
                step="0.01"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
            </div>
            {errors.priceChange && (
              <p className="text-red-500 text-sm mt-1">{errors.priceChange}</p>
            )}
          </div>

          {/* New Price Preview */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">New Price:</span>
              <span className="text-lg font-bold text-blue-900">
                ₱{newPrice || Number(item.price).toFixed(2)}
              </span>
            </div>
            {priceChange && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Price Change: <span className={`font-medium ${getPriceChangeColor()}`}>
                  {getPriceChangeIcon()} ₱{priceChange}
                </span></p>
                <p className="text-xs text-gray-500 mt-1">
                  {((Number(newPrice) - Number(item.price)) / Number(item.price) * 100).toFixed(1)}% change from current price
                </p>
              </div>
            )}
          </div>

          {/* Reason Input */}
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Price Adjustment *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[80px] resize-none ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Market price increase, Competitive pricing, Cost adjustment, etc."
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
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
              adjustmentType === 'increase'
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
              `${adjustmentType === 'increase' ? 'Increase' : 'Decrease'} Price`
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
  isLoading: PropTypes.bool
};

export default PriceAdjustmentModal;
