import { useState } from 'react';
import HandleCustomerModal from './HandleCustomerModal';

function ProcessOrderModal({ isOpen, onClose, order, onProcess, onReject, discountPercent, setDiscountPercent, isProcessing, isRejecting }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [discountError, setDiscountError] = useState('');
  
  if (!order) return null;

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    
    // Clear previous error
    setDiscountError('');
    
    // Allow empty input for better UX
    if (value === '' || value === null || value === undefined) {
      setDiscountPercent('');
      return;
    }
    
    const numValue = parseFloat(value);
    
    // Check for invalid input
    if (isNaN(numValue)) {
      setDiscountError('Please enter a valid number');
      return;
    }
    
    // Check for negative values
    if (numValue < 0) {
      setDiscountError('Discount cannot be negative');
      setDiscountPercent(0);
      return;
    }
    
    // Check for values above 30%
    if (numValue > 30) {
      setDiscountError('Maximum discount allowed is 30%');
      setDiscountPercent(numValue); // Allow them to type the value but show error
      return;
    }
    
    // Valid input
    setDiscountPercent(numValue);
  };

  const handleProcess = () => {
    // Don't process if there's a discount error
    if (discountError) {
      return;
    }
    
    const discountPct = discountPercent || 0;
    const discountAmount = (order.total * discountPct) / 100;
    onProcess(order.id, discountAmount);
  };

  const handleReject = () => {
    onReject(order, rejectionReason);
  };

  const discountPct = discountPercent || 0;
  const discountAmount = (order.total * discountPct) / 100;
  const finalTotal = order.total - discountAmount;

  const footerContent = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleReject}
        disabled={isRejecting || isProcessing || !rejectionReason || !rejectionReason.trim()}
        className={`px-4 py-2 cursor-pointer text-sm font-medium text-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
          isRejecting || isProcessing || !rejectionReason || !rejectionReason.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        }`}
      >
        {isRejecting ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Rejecting...
          </div>
        ) : (
          'Reject'
        )}
      </button>
      <button
        onClick={handleProcess}
        disabled={isProcessing || isRejecting || discountError}
        className={`px-4 py-2 cursor-pointer text-sm font-medium text-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
          isProcessing || isRejecting || discountError
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </div>
        ) : (
          'Process Order'
        )}
      </button>
    </>
  );

  return (
    <HandleCustomerModal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Order"
      width="w-[800px]"
      footerContent={footerContent}
    >
      {/* Order Information */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Order ID</h3>
          <p className="text-lg font-semibold text-gray-900">{order.id}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Name</h3>
          <p className="text-lg font-semibold text-gray-900">{order.clientName}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Order Date</h3>
          <p className="text-lg font-semibold text-gray-900">{order.date}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
            ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              order.status === 'approved' ? 'bg-green-100 text-green-800' :
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        <div className="col-span-2">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Terms</h3>
          <p className="text-lg font-semibold text-gray-900">{order.paymentTerms || '30 days'}</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model No.</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.modelNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ₱{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    ₱{item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discount Section */}
      <div className="mb-6">
        <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
          Discount Percentage (Maximum 30%)
        </label>
        <div className="relative">
          <input
            type="number"
            id="discount"
            name="discount"
            value={discountPercent}
            onChange={handleDiscountChange}
            min="0"
            max="100"
            step="0.01"
            className={`pl-4 pr-8 py-2 max-w-2xl border rounded-lg focus:ring-2 focus:outline-none focus:border-transparent 
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${discountError ? 'border-red-300 focus:ring-red-600' : 'border-gray-300 focus:ring-blue-600'}`}
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
        </div>
        {discountError && (
          <p className="mt-1 text-sm text-red-600">{discountError}</p>
        )}
      </div>

      {/* Rejection Reason Section */}
      <div className="mb-6">
        <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
          Rejection Reason (if rejecting)
        </label>
        <textarea
          id="rejectionReason"
          name="rejectionReason"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter reason for rejection..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500 resize-none"
          rows="3"
        />
      </div>

      {/* Total Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>₱{order.total.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Discount ({discountPct}%):</span>
            <span>-₱{discountAmount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Final Total:</span>
            <span>₱{finalTotal.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        </div>
      </div>
    </HandleCustomerModal>
  );
}

export default ProcessOrderModal; 