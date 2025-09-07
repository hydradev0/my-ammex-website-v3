import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, FileText, Clock, CheckCircle, X, XCircle, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';
import ScrollLock from "../Components/ScrollLock";
import TopBarPortal from './TopBarPortal';

const Invoice = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'terms',
    reference: '',
    notes: ''
  });
  const [invoiceReceipts, setInvoiceReceipts] = useState({}); // { [invoiceId]: { file, url, name, type, size } }
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const modalRef = useRef(null);
  const paymentModalRef = useRef(null);
  const methodMenuRef = useRef(null);

  useEffect(() => {
    // Mock data for demonstration
    const mockInvoices = [
      {
        id: 'INV-001',
        invoiceNumber: 'INV-2024-001',
        orderNumber: 'ORD-2024-001',
        invoiceDate: new Date('2024-01-15').toISOString(),
        dueDate: new Date('2024-02-14').toISOString(),
        totalAmount: 2450.00,
        paidAmount: 1000.00,
        remainingAmount: 1450.00,
        paymentStatus: 'partial',
        paymentTerms: '30 days',
        items: [
          { name: 'Industrial Gloves - Nitrile', quantity: 100, price: 12.50, total: 1250.00 },
          { name: 'Safety Goggles', quantity: 50, price: 24.00, total: 1200.00 },
          { name: 'Industrial Gloves - Nitrile', quantity: 100, price: 12.50, total: 1250.00 },
          { name: 'Safety Goggles', quantity: 50, price: 24.00, total: 1200.00 },
          { name: 'Industrial Gloves - Nitrile', quantity: 100, price: 12.50, total: 1250.00 },
          { name: 'Safety Goggles', quantity: 50, price: 24.00, total: 1200.00 },
          { name: 'Industrial Gloves - Nitrile', quantity: 100, price: 12.50, total: 1250.00 },
          { name: 'Safety Goggles', quantity: 50, price: 24.00, total: 1200.00 },
          { name: 'Industrial Gloves - Nitrile', quantity: 100, price: 12.50, total: 1250.00 },
          { name: 'Safety Goggles', quantity: 50, price: 24.00, total: 1200.00 },
          { name: 'Industrial Gloves - Nitrile', quantity: 100, price: 12.50, total: 1250.00 },
          { name: 'Safety Goggles', quantity: 50, price: 24.00, total: 1200.00 }
        ],
        customer: {
          name: 'ABC Manufacturing Corp',
          email: 'purchasing@abcmfg.com'
        },
        lastPayment: {
          date: new Date('2024-01-20').toISOString(),
          amount: 1000.00,
          method: 'bank_transfer',
          reference: 'TXN-ABC-001',
          notes: 'Partial payment via wire transfer'
        }
      },
      {
        id: 'INV-002',
        invoiceNumber: 'INV-2024-002',
        orderNumber: 'ORD-2024-002',
        invoiceDate: new Date('2024-01-20').toISOString(),
        dueDate: new Date('2024-02-19').toISOString(),
        totalAmount: 1850.75,
        paidAmount: 0,
        remainingAmount: 1850.75,
        paymentStatus: 'pending',
        paymentTerms: '30 days',
        items: [
          { name: 'Disposable Face Masks', quantity: 500, price: 2.50, total: 1250.00 },
          { name: 'Hand Sanitizer 500ml', quantity: 24, price: 15.50, total: 372.00 },
          { name: 'Cleaning Wipes', quantity: 30, price: 7.62, total: 228.75 }
        ],
        customer: {
          name: 'XYZ Healthcare Services',
          email: 'orders@xyzhealthcare.com'
        }
      },
      {
        id: 'INV-003',
        invoiceNumber: 'INV-2024-003',
        orderNumber: 'ORD-2024-003',
        invoiceDate: new Date('2024-01-10').toISOString(),
        dueDate: new Date('2024-02-09').toISOString(),
        totalAmount: 3200.00,
        paidAmount: 3200.00,
        remainingAmount: 0,
        paymentStatus: 'paid',
        paymentTerms: '30 days',
        items: [
          { name: 'Industrial Coveralls', quantity: 40, price: 45.00, total: 1800.00 },
          { name: 'Safety Helmets', quantity: 20, price: 35.00, total: 700.00 },
          { name: 'Work Boots', quantity: 20, price: 35.00, total: 700.00 }
        ],
        customer: {
          name: 'DEF Construction Ltd',
          email: 'procurement@defconstruction.com'
        },
        lastPayment: {
          date: new Date('2024-02-05').toISOString(),
          amount: 3200.00,
          method: 'terms',
          reference: 'NET30-DEF-001',
          notes: 'Full payment within terms'
        }
      },
      {
        id: 'INV-004',
        invoiceNumber: 'INV-2024-004',
        orderNumber: 'ORD-2024-004',
        invoiceDate: new Date('2023-12-15').toISOString(),
        dueDate: new Date('2024-01-14').toISOString(),
        totalAmount: 875.50,
        paidAmount: 0,
        remainingAmount: 875.50,
        paymentStatus: 'overdue',
        paymentTerms: '30 days',
        items: [
          { name: 'First Aid Kits', quantity: 15, price: 35.50, total: 532.50 },
          { name: 'Emergency Blankets', quantity: 25, price: 13.72, total: 343.00 }
        ],
        customer: {
          name: 'GHI Logistics Inc',
          email: 'billing@ghilogistics.com'
        }
      },
      {
        id: 'INV-005',
        invoiceNumber: 'INV-2024-005',
        orderNumber: 'ORD-2024-005',
        invoiceDate: new Date('2024-01-25').toISOString(),
        dueDate: new Date('2024-02-24').toISOString(),
        totalAmount: 1625.25,
        paidAmount: 500.00,
        remainingAmount: 1125.25,
        paymentStatus: 'partial',
        paymentTerms: '30 days',
        items: [
          { name: 'Chemical Resistant Gloves', quantity: 75, price: 18.50, total: 1387.50 },
          { name: 'Safety Signs', quantity: 15, price: 15.85, total: 237.75 }
        ],
        customer: {
          name: 'JKL Chemical Solutions',
          email: 'accounts@jklchem.com'
        },
        lastPayment: {
          date: new Date('2024-01-30').toISOString(),
          amount: 500.00,
          method: 'check',
          reference: 'CHK-7854',
          notes: 'Partial payment by company check'
        }
      }
    ];

    // Set mock invoices directly for testing (no localStorage persistence)
    setInvoices(mockInvoices);
  }, []);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showInvoiceModal && modalRef.current && event.target === modalRef.current) {
        closeInvoiceModal();
      }
      if (showPaymentModal && paymentModalRef.current && event.target === paymentModalRef.current) {
        closePaymentModal();
      }
      if (showMethodMenu && methodMenuRef.current && !methodMenuRef.current.contains(event.target)) {
        setShowMethodMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showMethodMenu) {
        setShowMethodMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInvoiceModal, showPaymentModal, showMethodMenu]);

  const handleBack = () => {
    navigate('/Products');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handlePayInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.remainingAmount.toString(),
      paymentMethod: 'terms',
      reference: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleReceiptUpload = (invoiceId, file) => {
    if (!file) return;
    const existing = invoiceReceipts[invoiceId];
    if (existing && existing.url) {
      URL.revokeObjectURL(existing.url);
    }
    const objectUrl = URL.createObjectURL(file);
    setInvoiceReceipts(prev => ({
      ...prev,
      [invoiceId]: {
        file,
        url: objectUrl,
        name: file.name,
        type: file.type,
        size: file.size
      }
    }));
  };

  const handleRemoveReceipt = (invoiceId) => {
    const existing = invoiceReceipts[invoiceId];
    if (!existing) return;
    if (existing.url) URL.revokeObjectURL(existing.url);
    setInvoiceReceipts(prev => {
      const copy = { ...prev };
      delete copy[invoiceId];
      return copy;
    });
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentData({
      amount: '',
      paymentMethod: 'terms',
      reference: '',
      notes: ''
    });
  };

  const handlePaymentSubmit = () => {
    if (!selectedInvoice || !paymentData.amount) return;

    const paymentAmount = parseFloat(paymentData.amount);
    const updatedInvoice = {
      ...selectedInvoice,
      paidAmount: selectedInvoice.paidAmount + paymentAmount,
      remainingAmount: selectedInvoice.remainingAmount - paymentAmount,
      paymentStatus: selectedInvoice.remainingAmount - paymentAmount <= 0 ? 'paid' : 'partial',
      lastPayment: {
        date: new Date().toISOString(),
        amount: paymentAmount,
        method: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes
      }
    };

    // Update invoices state (no localStorage save for testing)
    const updatedInvoices = invoices.map(inv => 
      inv.id === selectedInvoice.id ? updatedInvoice : inv
    );
    setInvoices(updatedInvoices);

    closePaymentModal();
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'partial':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  // Invoice Details Modal
  const invoiceModalContent = showInvoiceModal && selectedInvoice ? (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[120vh] sm:max-h-[120vh] flex flex-col"
        style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">   
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invoice Details</h2>
            <button
              onClick={closeInvoiceModal}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Invoice Number</h3>
              <p className="text-xs sm:text-sm text-gray-900 break-all">{selectedInvoice.invoiceNumber}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Invoice Date</h3>
              <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedInvoice.invoiceDate)}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Due Date</h3>
              <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedInvoice.dueDate)}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Payment Status</h3>
              <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedInvoice.paymentStatus)}`}>
                {getPaymentStatusIcon(selectedInvoice.paymentStatus)}
                <span className="ml-1 capitalize">{selectedInvoice.paymentStatus}</span>
              </span>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Remaining Balance</h3>
              <p className="text-xs sm:text-sm font-semibold text-red-600">{formatCurrency(selectedInvoice.remainingAmount)}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Invoice Items</h3>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {selectedInvoice.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start sm:items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{item.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Receipt upload moved to Payment Modal */}

        </div>
        {selectedInvoice.remainingAmount > 0 && (
          <div className="p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10">
            <button
              onClick={() => {
                closeInvoiceModal();
                handlePayInvoice(selectedInvoice);
              }}
              className="w-full bg-[#3182ce] text-white px-4 py-3 rounded-lg hover:bg-[#2c5282] transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Make Payment
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // Payment Modal
  const paymentModalContent = showPaymentModal && selectedInvoice ? (
    <div 
      ref={paymentModalRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[95vh] flex flex-col"
        style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Make Payment</h2>
            <button
              onClick={closePaymentModal}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4 mr-1 sm:p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <p className="text-sm text-gray-600">Invoice: {selectedInvoice.invoiceNumber}</p>
            <p className="text-sm text-gray-600">Outstanding Balance: <span className="font-semibold text-red-600">{formatCurrency(selectedInvoice.remainingAmount)}</span></p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">₱</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={paymentData.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*(?:[.,]?\d{0,2})?$/.test(val)) {
                      setPaymentData({ ...paymentData, amount: val.replace(',', '.') });
                    }
                  }}
                  className="w-full pl-6 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="relative" ref={methodMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowMethodMenu(!showMethodMenu)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 flex items-center justify-between"
                >
                  <span className="text-gray-700 text-sm">
                    {(
                      {
                        terms: 'Terms Payment',
                        bank_transfer: 'Bank Transfer',
                        check: 'Check',
                        cash: 'Cash'
                      }[paymentData.paymentMethod]
                    )}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {showMethodMenu && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                    {[
                      { key: 'terms', label: 'Terms Payment' },
                      { key: 'bank_transfer', label: 'Bank Transfer' },
                      { key: 'check', label: 'Check' },
                      { key: 'cash', label: 'Cash' }
                    ].map(option => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => { setPaymentData({ ...paymentData, paymentMethod: option.key }); setShowMethodMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${paymentData.paymentMethod === option.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Receipt </label>
              <div className="space-y-3">
                <div>
                  <input
                    id="receipt-upload-payment"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleReceiptUpload(selectedInvoice.id, e.target.files && e.target.files[0])}
                    className="block w-full cursor-pointer text-sm text-gray-700 file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#3182ce] file:text-white hover:file:bg-[#2c5282]"
                  />
                  <p className="mt-1 text-xs text-gray-500">Upload an image or PDF of your payment receipt.</p>
                </div>

                {invoiceReceipts[selectedInvoice.id] && (
                  <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-all">{invoiceReceipts[selectedInvoice.id].name}</p>
                      <p className="text-xs text-gray-500">{invoiceReceipts[selectedInvoice.id].type} • {(invoiceReceipts[selectedInvoice.id].size / 1024).toFixed(1)} KB</p>
                      {invoiceReceipts[selectedInvoice.id].type.startsWith('image/') ? (
                        <img
                          src={invoiceReceipts[selectedInvoice.id].url}
                          alt="Receipt preview"
                          className="mt-2 max-h-40 rounded border border-gray-200"
                        />
                      ) : (
                        <a
                          href={invoiceReceipts[selectedInvoice.id].url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 text-[#3182ce] hover:text-[#2c5282] text-sm"
                        >
                          View PDF receipt
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveReceipt(selectedInvoice.id)}
                      className="shrink-0 cursor-pointer text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number (Optional)</label>
              <input
                type="text"
                value={paymentData.reference}
                onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Transaction reference"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Payment notes"
              />
            </div>
          </div>

        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10">
          <div className="flex gap-3">
            <button
              onClick={closePaymentModal}
              className="flex-1 px-4 cursor-pointer py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePaymentSubmit}
              disabled={!paymentData.amount || isNaN(parseFloat(paymentData.amount)) || parseFloat(paymentData.amount) <= 0}
              className="flex-1 px-4 cursor-pointer py-2 bg-[#3182ce] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <TopBarPortal />
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 mb-4 sm:mb-0 sm:-mt-4 sm:-mx-1 md:-mx-15 lg:-mx-40 xl:-mx-48">
          <button 
            onClick={() => handleBreadcrumbClick('/Products')}
            className="hover:text-blue-600 transition-colors"
          >
            Products
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-700 font-medium">Invoices</span>
        </div>
        
        <div className="flex gap-8 md:gap-8 lg:gap-12 mb-6 mt-8 mx-1 md:-mx-15 lg:-mx-30 xl:-mx-35">
          <button 
            onClick={handleBack}
            className="flex items-center justify-center cursor-pointer bg-[#3182ce] hover:bg-[#4992d6] text-white px-3 py-2 rounded-3xl gap-1 transition-colors whitespace-nowrap w-20 sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center sm:text-left sm:-ml-4 -md:ml-2 -lg:ml-2 xl:ml-2">Invoices</h1>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Invoices Yet</h3>
            <p className="text-gray-500 mb-6">Invoices will appear here once your orders are completed and processed.</p>
            <button
              onClick={handleBack}
              className="bg-[#3182ce] text-white px-6 py-2 rounded-3xl hover:bg-[#2c5282] transition-colors"
            >
              View Products
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{formatDate(invoice.invoiceDate)}</div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={invoice.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(invoice.remainingAmount)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                          {getPaymentStatusIcon(invoice.paymentStatus)}
                          <span className="ml-1 capitalize">{invoice.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="text-[#3182ce] hover:text-[#2c5282] transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-6 h-6 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          {invoice.remainingAmount > 0 && (
                            <button
                              onClick={() => handlePayInvoice(invoice)}
                              className="text-green-600 hover:text-green-800 transition-colors flex items-center gap-1"
                            >
                              <CreditCard className="w-6 h-6 md:w-5 md:h-5" />
                              <span className="hidden sm:inline">Pay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      <ScrollLock active={showInvoiceModal} />
      {createPortal(invoiceModalContent, document.body)}

      {/* Payment Modal */}
      <ScrollLock active={showPaymentModal} />
      {createPortal(paymentModalContent, document.body)}
    </>
  );
};

export default Invoice;
