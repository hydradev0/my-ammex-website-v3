import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Mail, FileText, Package, DollarSign } from 'lucide-react';
import ScrollLock from '../Components/ScrollLock';

const InvoiceDetailsModal = ({
  invoice,
  isOpen,
  onClose,
  formatCurrency,
  formatDate
}) => {
  if (!isOpen || !invoice) return null;



  const modalContent = (
    <>
      <ScrollLock active={isOpen} />
      <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div 
           className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh]"
           style={{ transform: 'scale(0.80)', transformOrigin: 'center' }}
         >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
                <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
           <div className="p-6 space-y-6 overflow-y-auto mr-1 max-h-[calc(90vh-100px)]">
            {/* Invoice Summary Card */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            {/* Invoice Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-gray-600" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{invoice.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-1 text-gray-400" />
                      {invoice.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{invoice.customerAddress}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Dates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                  Important Dates
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Invoice Date</p>
                    <p className="font-medium text-gray-900">{formatDate(invoice.invoiceDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Reference */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Order Reference
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Original Order ID</p>
                  <p className="font-medium text-blue-600">{invoice.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items Count</p>
                  <p className="font-medium text-gray-900">{invoice.items.length} items</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
             <div className="space-y-4">
               <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
               <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50 sticky top-0 z-10">
                     <tr>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                         Item Name
                       </th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                         Description
                       </th>
                       <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                         Qty
                       </th>
                       <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                         Unit
                       </th>
                       <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                         Unit Price
                       </th>
                       <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                         Total
                       </th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {invoice.items.map((item, index) => (
                       <tr key={index} className="hover:bg-gray-50">
                         <td className="px-4 py-3 text-sm font-medium text-gray-900">
                           {item.name}
                         </td>
                         <td className="px-4 py-3 text-sm text-gray-600">
                           {item.description}
                         </td>
                         <td className="px-4 py-3 text-sm text-gray-900 text-center">
                           {item.quantity}
                         </td>
                         <td className="px-4 py-3 text-sm text-gray-600 text-center">
                           {item.unit}
                         </td>
                         <td className="px-4 py-3 text-sm text-gray-900 text-right">
                           {formatCurrency(item.unitPrice)}
                         </td>
                         <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                           {formatCurrency(item.total)}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               {/* Summary Section (Outside the scrollable area) */}
               <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-600">Subtotal:</span>
                     <span className="font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                   </div>
                   {invoice.discountApplied > 0 && (
                     <div className="flex justify-between text-sm">
                       <span className="text-gray-600">Discount:</span>
                       <span className="font-medium text-red-600">-{formatCurrency(invoice.discountApplied)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                     <span className="text-gray-900">Total Amount:</span>
                     <span className="text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                   </div>
                 </div>
               </div>
             </div>

           </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-blue-600 border border-gray-300 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return isOpen ? createPortal(modalContent, document.body) : null;
};

export default InvoiceDetailsModal;

