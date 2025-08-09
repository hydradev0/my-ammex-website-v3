import HandleCustomerModal from '../Components/HandleCustomerModal';

function ProcessOrderModal({ isOpen, onClose, order, onProcess, discountPercent, setDiscountPercent }) {
  if (!order) return null;

  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    // Ensure the percentage is between 0 and 100
    setDiscountPercent(Math.min(Math.max(value, 0), 100));
  };

  const handleProcess = () => {
    const discountAmount = (order.total * discountPercent) / 100;
    onProcess(order.id, discountAmount);
  };

  const discountAmount = (order.total * discountPercent) / 100;
  const finalTotal = order.total - discountAmount;

  const footerContent = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleProcess}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Process Order
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium">{order.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Items:</span>
            <span className="font-medium">{order.items.reduce((total, item) => total + item.quantity, 0)}</span>
          </div>
        </div>
      </div>

      {/* Discount Section */}
      <div className="mb-6">
        <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
          Discount Percentage
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
            className="pl-4 pr-8 py-2 max-w-2xl border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 focus:border-transparent 
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute center pl-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
        </div>
      </div>

      {/* Total Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>₱{order.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Discount ({discountPercent}%):</span>
            <span>-₱{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Final Total:</span>
            <span>₱{finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </HandleCustomerModal>
  );
}

export default ProcessOrderModal; 