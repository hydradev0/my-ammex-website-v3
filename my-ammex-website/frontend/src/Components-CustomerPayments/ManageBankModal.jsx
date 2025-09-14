import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import ScrollLock from '../Components/ScrollLock';
import { Plus, X, Edit2, Trash2, QrCode, Upload, Save } from 'lucide-react';

const ManageBankModal = ({ 
  isOpen, 
  onClose, 
  banks, 
  onAddBank, 
  onEditBank, 
  onDeleteBank, 
  onToggleBankActive 
}) => {
  const [showBankFormModal, setShowBankFormModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountNumber: '',
    isActive: true,
    qrCode: null
  });
  const bankQrUploadRef = useRef(null);

  const resetBankForm = () => {
    setBankFormData({
      bankName: '',
      accountNumber: '',
      isActive: true,
      qrCode: null
    });
    setSelectedBank(null);
  };

  const handleAddBank = () => {
    resetBankForm();
    setShowBankFormModal(true);
  };

  const handleEditBank = (bank) => {
    setSelectedBank(bank);
    setBankFormData({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      isActive: bank.isActive,
      qrCode: bank.qrCode
    });
    setShowBankFormModal(true);
  };

  const handleSaveBank = () => {
    if (!bankFormData.bankName.trim() || !bankFormData.accountNumber.trim()) {
      return;
    }

    if (selectedBank) {
      onEditBank(selectedBank.id, bankFormData);
    } else {
      onAddBank(bankFormData);
    }

    setShowBankFormModal(false);
    resetBankForm();
  };

  const handleDeleteBank = (bankId) => {
    if (window.confirm('Are you sure you want to delete this bank?')) {
      onDeleteBank(bankId);
    }
  };

  const handleBankQRUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBankFormData({...bankFormData, qrCode: e.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBankQRCode = () => {
    setBankFormData({...bankFormData, qrCode: null});
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <ScrollLock active={isOpen} />
      
      {/* Bank Management Modal */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Manage Banks</h3>
              <div className="flex gap-3">
                <button 
                onClick={onClose} 
                className="text-gray-400 cursor-pointer p-2 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {banks.map((bank) => (
                    <tr key={bank.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bank.bankName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bank.accountNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bank.isActive}
                            onChange={() => onToggleBankActive(bank.id)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bank.qrCode ? (
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
                            onClick={() => handleEditBank(bank)}
                            className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBank(bank.id)}
                            className="text-red-600 cursor-pointer hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
               <div className="pt-6 pb-4 flex justify-end">
                <button
                  onClick={handleAddBank}
                  className="bg-green-600 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Bank
                </button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Form Modal */}
      {showBankFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedBank ? 'Edit Bank' : 'Add Bank'}
                </h3>
                <button 
                  onClick={() => {
                    setShowBankFormModal(false);
                    resetBankForm();
                  }} 
                  className="text-gray-400 cursor-pointer hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankFormData.bankName}
                    onChange={(e) => setBankFormData({...bankFormData, bankName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., BDO, BPI, Metrobank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={bankFormData.accountNumber}
                    onChange={(e) => setBankFormData({...bankFormData, accountNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                    placeholder="Account number"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bankFormData.isActive}
                      onChange={(e) => setBankFormData({...bankFormData, isActive: e.target.checked})}
                      className="rounded w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={bankQrUploadRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBankQRUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => bankQrUploadRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {bankFormData.qrCode ? 'Replace QR Code' : 'Upload QR Code'}
                      </button>
                    </div>
                    
                    {bankFormData.qrCode && (
                      <div className="relative inline-block">
                        <img
                          src={bankFormData.qrCode}
                          alt="QR Code Preview"
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <button
                          onClick={removeBankQRCode}
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
                  onClick={() => {
                    setShowBankFormModal(false);
                    resetBankForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBank}
                  disabled={!bankFormData.bankName.trim() || !bankFormData.accountNumber.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {selectedBank ? 'Update' : 'Save'} Bank
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default ManageBankModal;
