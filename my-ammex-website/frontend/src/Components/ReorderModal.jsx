import { X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ScrollLock from './ScrollLock';

function ReorderModal({ isOpen, onClose, product, onReorder }) {
  const [reorderQuantity, setReorderQuantity] = useState(0);
  const [stockDuration, setStockDuration] = useState(0);
  const modalRef = useRef(null);

  // Initialize reorder quantity when product changes
  useEffect(() => {
    if (product) {
      setReorderQuantity(product.reorderQuantity);
    }
  }, [product]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && modalRef.current && event.target === modalRef.current) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Calculate stock duration based on monthly sales
  const calculateStockDuration = (quantity, monthlySales) => {
    if (!monthlySales || monthlySales === 0) return 0;
    return Math.round((quantity / monthlySales) * 30); // Convert to days
  };

  // Update stock duration whenever reorder quantity changes
  useEffect(() => {
    if (product) {
      const duration = calculateStockDuration(reorderQuantity, product.monthlySales);
      setStockDuration(duration);
    }
  }, [reorderQuantity, product]);

  const handleReorder = () => {
    onReorder(product.id, reorderQuantity);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setReorderQuantity(value);
    if (product?.setReorderQuantity) {
      product.setReorderQuantity(value);
    }
  };

  if (!isOpen || !product) return null;

  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div
        className="bg-white rounded-xl shadow-lg w-[800px]"
        style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Reorder Product</h2>
          <button
            onClick={onClose}
            className="hover:text-gray-400 text-gray-600 mb-4 cursor-pointer"
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
                <span className="font-medium">{product.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SKU:</span>
                <span className="font-medium">{product.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-medium text-red-600">{product.currentStock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Stock Level:</span>
                <span className="font-medium">{product.minimumStockLevel} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Sales:</span>
                <span className="font-medium">{product.monthlySales || 0} units</span>
              </div>
            </div>
          </div>
          {/* Reorder Quantity Section */}
          <div className="mb-6">
            <label htmlFor="reorderQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              Reorder Quantity
            </label>
            <div className="relative">
              <input
                type="number"
                id="reorderQuantity"
                name="reorderQuantity"
                value={reorderQuantity}
                onChange={handleQuantityChange}
                min="1"
                className="pl-4 pr-8 py-2 max-w-2xl border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent 
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute center pl-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">units</span>
            </div>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-500">
                Recommended reorder quantity: {product.minimumStockLevel * 2} units
              </p>
              <div className="text-sm text-gray-600">
                <p>Stock Duration: <span className="font-medium text-blue-600">{stockDuration} days</span></p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on current monthly sales of {product.monthlySales || 0} units
                </p>
              </div>
            </div>
          </div>
          {/* Stock Status Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Stock Status:</span>
                <span className={`font-medium ${
                  product.currentStock === 0 ? 'text-red-600' : 
                  product.currentStock <= product.minimumStockLevel * 0.3 ? 'text-red-500' :
                  product.currentStock <= product.minimumStockLevel * 0.5 ? 'text-orange-500' : 'text-yellow-600'
                }`}>
                  {product.currentStock === 0 ? 'Out of Stock' :
                   product.currentStock <= product.minimumStockLevel * 0.3 ? 'Critical Low' :
                   product.currentStock <= product.minimumStockLevel * 0.5 ? 'Very Low' :
                   product.currentStock <= product.minimumStockLevel ? 'Low Stock' : 'In Stock'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Stock Deficit:</span>
                <span className="font-medium text-red-600">
                  {Math.max(0, product.minimumStockLevel - product.currentStock)} units
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
            onClick={handleReorder}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Place Reorder
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

export default ReorderModal;
