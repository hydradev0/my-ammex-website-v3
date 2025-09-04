import HandleCustomerModal from '../Components/HandleCustomerModal';

function ViewOrderModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const footerContent = (
    <button
      onClick={onClose}
      className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-blue-600 border border-gray-300 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
      Close
    </button>
  );

  return (
    <HandleCustomerModal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Details"
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
              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱{item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Summary */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Subtotal</p>
            <p className="text-2xl font-bold text-gray-900">₱{order.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </HandleCustomerModal>
  );
}

export default ViewOrderModal;
