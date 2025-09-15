import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, QrCode, Upload, Save, X, Building2 } from 'lucide-react';
import TopBar from '../Components/TopBar';
import RoleBasedLayout from '../Components/RoleBasedLayout';
import ManageBankModal from './ManageBankModal';

const ManagePaymentMethods = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    requiresReference: false,
    qrCode: null
  });
  const qrUploadRef = useRef(null);

  // Mock payment methods data - replace with actual API call
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      name: 'Bank Transfer',
      accountNumber: '1234567890',
      isActive: true,
      requiresReference: true,
      qrCode: null
    },
    {
      id: '2',
      name: 'Maya (PayMaya)',
      accountNumber: '1234567890',
      isActive: true,
      requiresReference: false,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    {
      id: '3',
      name: 'GCash',
      accountNumber: '1234567890',
      isActive: true,
      requiresReference: false,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },
    {
      id: '4',
      name: 'Check',
      accountNumber: '1234567890',
      isActive: false,
      requiresReference: true,
      qrCode: null
    }
  ]);

  // Mock bank data - replace with actual API call
  const [banks, setBanks] = useState([
    {
      id: '1',
      bankName: 'BDO',
      accountNumber: '1234567890',
      isActive: true,
      qrCode: null
    },
    {
      id: '2',
      bankName: 'BPI',
      accountNumber: '0987654321',
      isActive: true,
      qrCode: null
    },
    {
      id: '3',
      bankName: 'Metrobank',
      accountNumber: '1122334455',
      isActive: false,
      qrCode: null
    }
  ]);

  const resetForm = () => {
    setFormData({
      name: '',
      accountNumber: '',
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
      accountNumber: method.accountNumber,
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
      setPaymentMethods(prev => 
        prev.map(method => method.id === selectedMethod.id ? methodData : method)
      );
    } else {
      setPaymentMethods(prev => [...prev, methodData]);
    }

    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  const handleDeleteMethod = (methodId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    }
  };

  const handleToggleActive = (methodId) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, isActive: !method.isActive }
          : method
      )
    );
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


  const handleManageBankTransfer = () => {
    setShowBankModal(true);
  };

  const handleAddBank = (bankData) => {
    const newBank = {
      id: `bank-${Date.now()}`,
      ...bankData
    };
    setBanks(prev => [...prev, newBank]);
  };

  const handleEditBank = (bankId, bankData) => {
    setBanks(prev => 
      prev.map(bank => bank.id === bankId ? { ...bank, ...bankData } : bank)
    );
  };

  const handleDeleteBank = (bankId) => {
    setBanks(prev => prev.filter(bank => bank.id !== bankId));
  };

  const handleToggleBankActive = (bankId) => {
    setBanks(prev => 
      prev.map(bank => 
        bank.id === bankId 
          ? { ...bank, isActive: !bank.isActive }
          : bank
      )
    );
  };

  // Modal Form Component
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
              <textarea
                value={formData.accountNumber}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Account number"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code </label>
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

  return (
    <>
      <RoleBasedLayout />
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">Payment Methods</h2>
              <p className="text-sm text-gray-500">Manage the payment methods available for your customers.</p>
              </div>
              <button
                onClick={handleAddMethod}
                className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Method
              </button>
            </div>
          </div>
          
          <div className="p-6 ">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentMethods.map((method) => (
                    <tr key={method.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {method.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {method.accountNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={method.isActive}
                            onChange={() => handleToggleActive(method.id)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditMethod(method)}
                            className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMethod(method.id)}
                            className="text-red-600 cursor-pointer hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                      {/* QR Code */}
                      <td className="py-4 whitespace-nowrap text-sm text-gray-500">
                        {method.name === 'Bank Transfer' ? (
                          <button
                            onClick={handleManageBankTransfer}
                            className="bg-green-600 cursor-pointer text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-xs"
                            title="Manage Banks"
                          >
                            <Building2 className="w-4 h-4" />
                            Manage Banks
                          </button>
                        ) : method.qrCode ? (
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Available</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
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
      {showAddModal && (
        <MethodForm
          title="Add Payment Method"
          onSave={handleSave}
          onCancel={() => {
            setShowAddModal(false);
            resetForm();
          }}
        />
      )}

      {/* Edit Method Modal */}
      {showEditModal && (
        <MethodForm
          title="Edit Payment Method"
          onSave={handleSave}
          onCancel={() => {
            setShowEditModal(false);
            resetForm();
          }}
        />
      )}

      {/* Bank Management Modal */}
      <ManageBankModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        banks={banks}
        onAddBank={handleAddBank}
        onEditBank={handleEditBank}
        onDeleteBank={handleDeleteBank}
        onToggleBankActive={handleToggleBankActive}
      />
    </>
  );
};

export default ManagePaymentMethods;
