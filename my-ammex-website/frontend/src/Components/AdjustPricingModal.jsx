import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, } from 'lucide-react';

const AdjustPricingModal = ({ isOpen, onClose, product, onAdjustPricing }) => {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercentage, setPriceChangePercentage] = useState(0);

  useEffect(() => {
    if (product) {
      // Set initial values - in a real app, these would come from the product data
      const initialPrice = product.currentPrice || 100;
      setCurrentPrice(initialPrice);
      setNewPrice(initialPrice);
      setPriceChange(0);
      setPriceChangePercentage(0);
      setDiscountPercentage(0);
    }
  }, [product]);

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

  const handleNewPriceChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setNewPrice(value);
    
    // Calculate price change
    const change = value - currentPrice;
    setPriceChange(change);
    
    // Calculate percentage change
    const percentageChange = currentPrice > 0 ? (change / currentPrice) * 100 : 0;
    setPriceChangePercentage(percentageChange);
    
    // Calculate discount percentage (if price is reduced)
    const discount = change < 0 ? Math.abs(percentageChange) : 0;
    setDiscountPercentage(discount);
  };

  const handleDiscountChange = (e) => {
    const discount = parseFloat(e.target.value) || 0;
    setDiscountPercentage(discount);
    
    // Calculate new price based on discount
    const newPriceValue = currentPrice * (1 - discount / 100);
    setNewPrice(newPriceValue);
    
    // Calculate price change
    const change = newPriceValue - currentPrice;
    setPriceChange(change);
    setPriceChangePercentage(-discount);
  };

  const handleAdjustPricing = () => {
    if (onAdjustPricing) {
      onAdjustPricing(product.id, {
        currentPrice,
        newPrice,
        discountPercentage,
        priceChange,
        priceChangePercentage
      });
    }
    onClose();
  };

  const getPriceChangeColor = () => {
    if (priceChange > 0) return 'text-green-600';
    if (priceChange < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = () => {
    if (priceChange > 0) return '↗';
    if (priceChange < 0) return '↘';
    return '→';
  };

  if (!isOpen || !product) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-[800px]" style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Adjust Pricing</h2>
          <button 
            className="hover:text-white hover:bg-red-800 text-gray-500 mb-4"
            onClick={onClose} 
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Product Name:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-medium text-red-600">{product.currentStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Units Sold (Monthly):</span>
                <span className="font-medium text-red-600">{product.unitsSold} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Growth Rate:</span>
                <span className="font-medium text-red-600">{product.growth}</span>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-6">
            <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Current Price
            </label>
            <div className="relative">
              <input
                type="number"
                id="currentPrice"
                name="currentPrice"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className="pl-5 pr-8 py-2 max-w-2xl border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent 
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled
              />
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
            </div>
          </div>

          {/* New Price Section */}
          <div className="mb-6">
            <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700 mb-2">
              New Price
            </label>
            <div className="relative">
              <input
                type="number"
                id="newPrice"
                name="newPrice"
                value={newPrice || ''}
                onChange={handleNewPriceChange}
                step="0.01"
                min="0"
                className="pl-5 pr-8 py-2 max-w-2xl border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent 
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
            </div>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-500">
                Recommended price: Floor Price
              </p>
            </div>
          </div>

          {/* Discount Percentage Section */}
          <div className="mb-6">
            <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 mb-2">
              Discount Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                id="discountPercentage"
                name="discountPercentage"
                value={discountPercentage || ''}
                onChange={handleDiscountChange}
                step="0.1"
                min="0"
                max="100"
                className="pl-4 pr-8 py-2 max-w-2xl border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent 
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute left-32 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
            </div>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-gray-600">
                <p>Price Change: <span className={`font-medium ${getPriceChangeColor()}`}>
                  {getPriceChangeIcon()} ₱{Math.abs(priceChange).toFixed(2)}
                </span></p>
                <p className="text-xs text-gray-500 mt-1">
                  {priceChangePercentage > 0 ? '+' : ''}{priceChangePercentage.toFixed(1)}% change from current price
                </p>
              </div>
            </div>
          </div>

          {/* Price Status Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Price Status:</span>
                <span className={`font-medium  ${
                  priceChange > 0 ? 'text-green-600' : 
                  priceChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {priceChange > 0 ? 'Price Increase' :
                   priceChange < 0 ? 'Price Decrease' : 'No Change'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount Applied:</span>
                <span className="font-medium text-red-600">
                  {discountPercentage > 0 ? `${discountPercentage.toFixed(1)}%` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdjustPricing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Price Change
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal outside the scaled container
  return createPortal(modalContent, document.body);
};

export default AdjustPricingModal; 