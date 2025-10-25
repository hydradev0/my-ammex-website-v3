import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, ToggleLeft, ToggleRight, Edit2, Save, X, GripVertical } from 'lucide-react';
import ScrollLock from '../Components/ScrollLock';

const ManagePayMongoMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [editForm, setEditForm] = useState({
    methodName: '',
    description: '',
    processingTime: '',
    fees: '',
    minAmount: '',
    maxAmount: ''
  });

  // Load payment methods
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/paymongo-payment-methods`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payment methods loaded:', data);
        setPaymentMethods(data.data || []);
      } else {
        console.error('Failed to load payment methods:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (methodId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/paymongo-payment-methods/${methodId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(prev => 
          prev.map(method => 
            method.id === methodId ? data.data : method
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle payment method:', error);
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setEditForm({
      methodName: method.methodName,
      description: method.description || '',
      processingTime: method.processingTime,
      fees: method.fees,
      minAmount: method.minAmount.toString(),
      maxAmount: method.maxAmount.toString()
    });
  };

  const handleSave = async () => {
    if (!editingMethod) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/paymongo-payment-methods/${editingMethod.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          methodName: editForm.methodName,
          description: editForm.description,
          processingTime: editForm.processingTime,
          fees: editForm.fees,
          minAmount: parseFloat(editForm.minAmount),
          maxAmount: parseFloat(editForm.maxAmount)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(prev => 
          prev.map(method => 
            method.id === editingMethod.id ? data.data : method
          )
        );
        setEditingMethod(null);
      }
    } catch (error) {
      console.error('Failed to save payment method:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingMethod(null);
    setEditForm({
      methodName: '',
      description: '',
      processingTime: '',
      fees: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Payment Methods...</h3>
        <p className="text-gray-500">Please wait while we fetch the payment configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">PayMongo Payment Methods</h3>
        <p className="text-gray-600 text-sm">
          Manage which PayMongo payment methods are available to customers. 
          Disabled methods will not appear in the payment form.
        </p>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Settings className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payment Methods Found</h3>
              <p className="text-gray-500 mb-4">
                No PayMongo payment methods are configured yet. Please check your backend setup.
              </p>
              <button
                onClick={loadPaymentMethods}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    method.isEnabled 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <div className={`w-3 h-3 rounded-full ${
                          method.isEnabled ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {method.methodName}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            method.isEnabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {method.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Description:</span> {method.description || 'No description'}
                          </div>
                          <div>
                            <span className="font-medium">Processing Time:</span> {method.processingTime}
                          </div>
                          <div>
                            <span className="font-medium">Fees:</span> {method.fees}
                          </div>
                          <div>
                            <span className="font-medium">Min Amount:</span> ₱{method.minAmount}
                          </div>
                          <div>
                            <span className="font-medium">Max Amount:</span> ₱{method.maxAmount}
                          </div>
                          <div>
                            <span className="font-medium">Method Key:</span> <code className="bg-gray-100 px-1 rounded">{method.methodKey}</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(method.id)}
                        className={`flex items-center cursor-pointer gap-2 px-3 py-2 rounded-lg transition-colors ${
                          method.isEnabled
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {method.isEnabled ? (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Disable
                          </>
                        ) : (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Enable
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleEdit(method)}
                        className="flex items-center cursor-pointer gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingMethod && (
        <>
          <ScrollLock active={true} />
          {createPortal(
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit Payment Method
                    </h3>
                    <button 
                      onClick={handleCancel}
                      className="text-gray-400 cursor-pointer hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Method Name
                    </label>
                    <input
                      type="text"
                      value={editForm.methodName}
                      onChange={(e) => setEditForm({...editForm, methodName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Processing Time
                    </label>
                    <input
                      type="text"
                      value={editForm.processingTime}
                      onChange={(e) => setEditForm({...editForm, processingTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fees
                    </label>
                    <input
                      type="text"
                      value={editForm.fees}
                      onChange={(e) => setEditForm({...editForm, fees: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.minAmount}
                        onChange={(e) => setEditForm({...editForm, minAmount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.maxAmount}
                        onChange={(e) => setEditForm({...editForm, maxAmount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!editForm.methodName.trim() || isSaving}
                      className="flex-1 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

export default ManagePayMongoMethods;