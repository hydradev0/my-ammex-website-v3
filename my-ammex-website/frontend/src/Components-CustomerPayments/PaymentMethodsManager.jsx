import React, { useState, useRef } from 'react';
import { X, Plus, Edit2, Trash2, QrCode, Upload, Save } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";

const PaymentMethodsManager = ({ 
  isOpen, 
  onClose, 
  paymentMethods, 
  onAddMethod, 
  onUpdateMethod, 
  onDeleteMethod 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    requiresReference: false,
    qrCode: null
  });
  const qrUploadRef = useRef(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      requiresReference: false,
      qrCode: null
    });
    setSelectedMethod(null);
  };

  const handleAddMethod = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditMethod = (method) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      description: method.description,
      isActive: method.isActive,
      requiresReference: method.requiresReference,
      qrCode: method.qrCode
    });
    setShowEditModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    const methodData = {
      id: selectedMethod?.id || `method-${Date.now()}`,
      ...formData
    };

    if (selectedMethod) {
      onUpdateMethod(methodData);
    } else {
      onAddMethod(methodData);
    }

    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  const handleQRUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, qrCode: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQRCode = () => {
    setFormData({ ...formData, qrCode: null });
  };

  {/* Modal */}
  const MethodForm = ({ title, onSave, onCancel }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                placeholder="e.g., Credit Card, PayPal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Brief description of the payment method"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiresReference}
                  onChange={(e) => setFormData({...formData, requiresReference: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Requires Reference</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code (Optional)</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={qrUploadRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQRUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => qrUploadRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {formData.qrCode ? 'Replace QR Code' : 'Upload QR Code'}
                  </button>
                </div>
                
                {formData.qrCode && (
                  <div className="relative inline-block">
                    <img
                      src={formData.qrCode}
                      alt="QR Code Preview"
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <button
                      onClick={removeQRCode}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!formData.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {selectedMethod ? 'Update' : 'Save'} Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const modalContent = (
    <>
      <ScrollLock active={isOpen} />
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[120vh] overflow-y-auto"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Manage Payment Methods</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddMethod}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Method
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentMethods.map((method) => (
                    <tr key={method.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {method.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {method.description}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          method.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {method.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {method.qrCode ? (
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Available</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditMethod(method)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteMethod(method.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Method Modal */}
      {showAddModal && createPortal(
        <MethodForm
          title="Add Payment Method"
          onSave={handleSave}
          onCancel={() => {
            setShowAddModal(false);
            resetForm();
          }}
        />,
        document.body
      )}

      {/* Edit Method Modal */}
      {showEditModal && createPortal(
        <MethodForm
          title="Edit Payment Method"
          onSave={handleSave}
          onCancel={() => {
            setShowEditModal(false);
            resetForm();
          }}
        />,
        document.body
      )}
    </>
  );

  return isOpen ? createPortal(modalContent, document.body) : null;
};

export default PaymentMethodsManager;

