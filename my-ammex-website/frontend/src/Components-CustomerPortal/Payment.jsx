import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, X, DollarSign } from 'lucide-react';
import TopBarPortal from './TopBarPortal';
import QRCodeModal from './QRCodeModal';
import { getMyInvoices } from '../services/invoiceService';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: '',
    reference: ''
  });
  const [invoiceReceipts, setInvoiceReceipts] = useState({});
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const [showBankMenu, setShowBankMenu] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const methodMenuRef = useRef(null);
  const bankMenuRef = useRef(null);

  // Bank data for bank transfer
  const bankOptions = [
    { key: 'bdo', label: 'BDO Unibank Inc.', accountNumber: '123-456-7890', color: 'from-red-600 to-red-800' },
    { key: 'bpi', label: 'BPI (Bank of the Philippine Islands)', accountNumber: '987-654-3210', color: 'from-red-500 to-red-700' },
    { key: 'metrobank', label: 'Metrobank', accountNumber: '456-789-0123', color: 'from-blue-600 to-blue-800' },
    { key: 'security_bank', label: 'Security Bank', accountNumber: '789-012-3456', color: 'from-green-600 to-green-800' },
    { key: 'eastwest', label: 'EastWest Bank', accountNumber: '012-345-6789', color: 'from-purple-600 to-purple-800' },
    { key: 'chinabank', label: 'China Bank', accountNumber: '345-678-9012', color: 'from-yellow-600 to-yellow-800' }
  ];

  // Get invoice ID from URL params
  const invoiceId = new URLSearchParams(location.search).get('invoiceId');

  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) {
        navigate('/Products/Invoices');
        return;
      }

      setIsLoading(true);
      try {
        const response = await getMyInvoices();
        const invoiceData = response.data || [];
        
        // Find the specific invoice
        const foundInvoice = invoiceData.find(inv => inv.id === parseInt(invoiceId));
        
        if (!foundInvoice) {
          navigate('/Products/Invoices');
          return;
        }

        // Transform backend data to match frontend format
        const transformedInvoice = {
          id: foundInvoice.id,
          invoiceNumber: foundInvoice.invoiceNumber,
          orderNumber: foundInvoice.orderId,
          invoiceDate: foundInvoice.invoiceDate,
          dueDate: foundInvoice.dueDate,
          totalAmount: Number(foundInvoice.totalAmount) || 0,
          paidAmount: Number(foundInvoice.paidAmount) || 0,
          remainingAmount: Number(foundInvoice.remainingAmount) || Number(foundInvoice.totalAmount) || 0,
          paymentStatus: foundInvoice.paymentStatus,
          paymentTerms: foundInvoice.paymentTerms,
          items: (foundInvoice.items || []).map(item => {
            const transformedItem = {
              name: item.name || item.itemName || 'Unknown Item',
              quantity: Number(item.quantity) || 0,
              price: Number(item.unitPrice) || 0, 
              total: Number(item.total) || 0, 
              description: item.description || '',
              unit: item.unit || 'pcs'
            };
            return transformedItem;
          }),
          customer: {
            name: foundInvoice.customerName || 'Unknown Customer',
            email: foundInvoice.customerEmail || ''
          },
          ...(foundInvoice.lastPayment && { lastPayment: foundInvoice.lastPayment })
        };

        setInvoice(transformedInvoice);
        setPaymentData({
          amount: '',
          paymentMethod: '',
          reference: ''
        });
      } catch (error) {
        console.error('Failed to load invoice:', error);
        navigate('/Products/Invoices');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, navigate]);

  // Handle click outside method menu and bank menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMethodMenu && methodMenuRef.current && !methodMenuRef.current.contains(event.target)) {
        setShowMethodMenu(false);
      }
      if (showBankMenu && bankMenuRef.current && !bankMenuRef.current.contains(event.target)) {
        setShowBankMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showMethodMenu) setShowMethodMenu(false);
        if (showBankMenu) setShowBankMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMethodMenu, showBankMenu]);

  const handleBack = () => {
    navigate('/Products/Invoices');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  // Validation functions
  const validatePaymentData = () => {
    const errors = {};
    
    // Amount validation
    if (!paymentData.amount || paymentData.amount.toString().trim() === '') {
      errors.amount = 'Payment amount is required';
    } else {
      const amount = parseFloat(paymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Payment amount must be greater than 0';
      } else if (invoice && amount > invoice.remainingAmount) {
        errors.amount = `Payment amount cannot exceed outstanding balance of ${formatCurrency(invoice.remainingAmount)}`;
      }
    }

    // Payment method validation
    if (!paymentData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required';
    }

    // Payment receipt validation
    if (!invoiceReceipts[invoice.id] || !invoiceReceipts[invoice.id].file) {
      errors.receipt = 'Payment receipt is required';
    }

    // Reference number validation (if provided)
    if (paymentData.reference && paymentData.reference.length > 50) {
      errors.reference = 'Reference number must be 50 characters or less';
    }

    // Set validation errors and return validation result
    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    
    return { isValid, errors };
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Reset selected bank when payment method changes
    if (field === 'paymentMethod') {
      setSelectedBank('');
    }
  };

  const handleBankSelect = (bankKey) => {
    setSelectedBank(bankKey);
    setShowBankMenu(false);
  };

  const handleReceiptUpload = (file) => {
    if (!file) return;
    const existing = invoiceReceipts[invoice.id];
    if (existing && existing.url) {
      URL.revokeObjectURL(existing.url);
    }
    const objectUrl = URL.createObjectURL(file);
    setInvoiceReceipts(prev => ({
      ...prev,
      [invoice.id]: {
        file,
        url: objectUrl,
        name: file.name,
        type: file.type,
        size: file.size
      }
    }));
  };

  const handleRemoveReceipt = () => {
    const existing = invoiceReceipts[invoice.id];
    if (existing && existing.url) {
      URL.revokeObjectURL(existing.url);
    }
    setInvoiceReceipts(prev => {
      const newReceipts = { ...prev };
      delete newReceipts[invoice.id];
      return newReceipts;
    });
  };

  const handlePaymentSubmit = async () => {
    if (!invoice) return;

    // Clear previous validation errors
    clearValidationErrors();

    // Validate payment data
    const { isValid, errors } = validatePaymentData();

    if (!isValid) {
      // Show validation errors and prevent submission
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentAmount = parseFloat(paymentData.amount);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would typically make an API call to submit the payment
      console.log('Payment submitted:', {
        invoiceId: invoice.id,
        amount: paymentAmount,
        method: paymentData.paymentMethod,
        reference: paymentData.reference,
        receipt: invoiceReceipts[invoice.id]?.file
      });

      // Simulate successful payment
      const updatedInvoice = {
        ...invoice,
        paidAmount: invoice.paidAmount + paymentAmount,
        remainingAmount: invoice.remainingAmount - paymentAmount,
        paymentStatus: invoice.remainingAmount - paymentAmount <= 0 ? 'paid' : 'partial',
        lastPayment: {
          date: new Date().toISOString(),
          amount: paymentAmount,
          method: paymentData.paymentMethod,
          reference: paymentData.reference
        }
      };

      // Navigate back to invoices after successful submission
      navigate('/Products/Invoices');
    } catch (error) {
      console.error('Payment submission failed:', error);
      setValidationErrors({ submit: 'Payment submission failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!invoice) return;

    setIsSavingDraft(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Here you would typically save the draft to localStorage or send to API
      const draftData = {
        invoiceId: invoice.id,
        paymentData,
        receipt: invoiceReceipts[invoice.id]?.file,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(`payment_draft_${invoice.id}`, JSON.stringify(draftData));
      
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error('Draft save failed:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <>
        <TopBarPortal />
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Payment Form...</h3>
            <p className="text-gray-500">Please wait while we fetch the invoice details.</p>
          </div>
        </div>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <TopBarPortal />
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Invoice Not Found</h3>
            <p className="text-gray-500 mb-6">The requested invoice could not be found or you don't have access to it.</p>
            <button
              onClick={handleBack}
              className="bg-[#3182ce] text-white px-6 py-2 rounded-3xl hover:bg-[#2c5282] transition-colors"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBarPortal />
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 mb-4 sm:mb-0 sm:-mt-4 sm:-mx-1 md:-mx-15 lg:-mx-40 xl:-mx-48">
          <button 
            onClick={() => handleBreadcrumbClick('/Products')}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            Products
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button 
            onClick={() => handleBreadcrumbClick('/Products/Invoices')}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            Invoices
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-700 font-medium">Payment</span>
        </div>
        
        <div className="flex gap-8 md:gap-8 lg:gap-12 mb-6 mt-8 mx-1 md:-mx-15 lg:-mx-30 xl:-mx-35">
          <button 
            onClick={handleBack}
            className="flex items-center justify-center cursor-pointer bg-[#3182ce] hover:bg-[#4992d6] text-white px-3 py-2 rounded-3xl gap-1 transition-colors whitespace-nowrap w-20 sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center sm:text-left sm:-ml-4 -md:ml-2 -lg:ml-2 xl:ml-2">Make Payment</h1>
        </div>

        {/* Invoice Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#3182ce]" />
            <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className="font-semibold text-red-600 text-lg">{formatCurrency(invoice.remainingAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Terms</p>
              <p className="font-medium text-gray-900">{invoice.paymentTerms || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Payment Amount, Reference Number, and Payment Method Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Payment Amount <span className="text-red-500">*</span></label>
                  {invoice && (
                    <button
                      type="button"
                      onClick={() => handleInputChange('amount', invoice.remainingAmount.toString())}
                      className="text-xs text-[#3182ce] hover:text-[#2c5282] underline"
                    >
                      Pay Full Amount ({formatCurrency(invoice.remainingAmount)})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">₱</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={paymentData.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*(?:[.,]?\d{0,2})?$/.test(val)) {
                        handleInputChange('amount', val.replace(',', '.'));
                      }
                    }}
                    className={`w-full pl-6 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none text-lg
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    ${validationErrors.amount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="0.00"
                  />
                </div>
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                )}
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number (Optional)</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:outline-none
                  ${validationErrors.reference ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Transaction reference"
                  maxLength={50}
                />
                {validationErrors.reference && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.reference}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{paymentData.reference.length}/50 characters</p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method <span className="text-red-500">*</span></label>
                <div className="relative" ref={methodMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowMethodMenu(!showMethodMenu)}
                    className={`w-full px-3 py-3 border rounded-lg text-left focus:ring-2 focus:outline-none flex items-center justify-between
                    ${validationErrors.paymentMethod ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  >
                    <span className={`${paymentData.paymentMethod ? 'text-gray-700' : 'text-gray-400'}`}>
                      {paymentData.paymentMethod ? (
                        {
                          bank_transfer: 'Bank Transfer',
                          check: 'Check',
                          maya: 'Maya (PayMaya)',
                          gcash: 'GCash'
                        }[paymentData.paymentMethod]
                      ) : 'Select payment method'}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {showMethodMenu && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      {[
                        { key: 'bank_transfer', label: 'Bank Transfer' },
                        { key: 'check', label: 'Check' },
                        { key: 'maya', label: 'Maya (PayMaya)' },
                        { key: 'gcash', label: 'GCash' }
                      ].map(option => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => { 
                            handleInputChange('paymentMethod', option.key); 
                            setShowMethodMenu(false); 
                          }}
                          className={`w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${paymentData.paymentMethod === option.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {validationErrors.paymentMethod && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.paymentMethod}</p>
                )}
              </div>
            </div>

            {/* QR Code Section */}
            {paymentData.paymentMethod && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment QR Code</h4>
                
                {/* Bank Selection for Bank Transfer */}
                {paymentData.paymentMethod === 'bank_transfer' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank</label>
                    <div className="relative" ref={bankMenuRef}>
                      <button
                        type="button"
                        onClick={() => setShowBankMenu(!showBankMenu)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg text-left focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                      >
                        <span className={selectedBank ? 'text-gray-700' : 'text-gray-400'}>
                          {selectedBank ? bankOptions.find(bank => bank.key === selectedBank)?.label : 'Select bank'}
                        </span>
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      {showBankMenu && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                          {bankOptions.map(bank => (
                            <button
                              key={bank.key}
                              type="button"
                              onClick={() => handleBankSelect(bank.key)}
                              className={`w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selectedBank === bank.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              {bank.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-48 h-48 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all duration-200"
                      onClick={() => setShowQRModal(true)}
                      title="Click to view larger QR code"
                    >
                      {paymentData.paymentMethod === 'maya' ? (
                        <div className="text-center">
                          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-2">
                            <span className="text-white font-bold text-lg">M</span>
                          </div>
                          <p className="text-xs text-gray-600">Maya QR Code</p>
                        </div>
                      ) : paymentData.paymentMethod === 'gcash' ? (
                        <div className="text-center">
                          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mb-2">
                            <span className="text-white font-bold text-lg">G</span>
                          </div>
                          <p className="text-xs text-gray-600">GCash QR Code</p>
                        </div>
                      ) : paymentData.paymentMethod === 'bank_transfer' && selectedBank ? (
                        <div className="text-center">
                          <div className={`w-32 h-32 bg-gradient-to-br ${bankOptions.find(bank => bank.key === selectedBank)?.color || 'from-blue-600 to-blue-800'} rounded-lg flex items-center justify-center mb-2`}>
                            <span className="text-white font-bold text-lg">
                              {bankOptions.find(bank => bank.key === selectedBank)?.label?.charAt(0) || 'B'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {bankOptions.find(bank => bank.key === selectedBank)?.label} QR
                          </p>
                        </div>
                      ) : paymentData.paymentMethod === 'bank_transfer' ? (
                        <div className="text-center">
                          <div className="w-32 h-32 bg-gray-300 rounded-lg flex items-center justify-center mb-2">
                            <span className="text-gray-600 font-bold text-lg">?</span>
                          </div>
                          <p className="text-xs text-gray-600">Select a bank</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-32 h-32 bg-gray-300 rounded-lg flex items-center justify-center mb-2">
                            <span className="text-gray-600 font-bold text-lg">?</span>
                          </div>
                          <p className="text-xs text-gray-600">QR Code</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Click to view larger QR code</p>
                  </div>

                  <div className="flex-1">
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {paymentData.paymentMethod === 'maya' ? 'Maya (PayMaya) Payment' :
                           paymentData.paymentMethod === 'gcash' ? 'GCash Payment' :
                           paymentData.paymentMethod === 'bank_transfer' ? 'Bank Transfer Payment' :
                           paymentData.paymentMethod === 'check' ? 'Check Payment' :
                           'Payment Instructions'}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {paymentData.paymentMethod === 'maya' ? 'Scan this QR code with your Maya app to complete the payment.' :
                           paymentData.paymentMethod === 'gcash' ? 'Scan this QR code with your GCash app to complete the payment.' :
                           paymentData.paymentMethod === 'bank_transfer' ? 'Use this QR code for bank transfer or scan with your banking app.' :
                           paymentData.paymentMethod === 'check' ? 'Make check payable to the account below.' :
                           'Follow the payment instructions for your selected method.'}
                        </p>
                      </div>
                      
                      {/* Account Number Display */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h6 className="font-medium text-gray-900 mb-2">Account Details</h6>
                        {paymentData.paymentMethod === 'maya' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Account Name:</span>
                              <span className="text-sm font-medium text-gray-900">Ammex Trading Corp.</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Maya Account:</span>
                              <span className="text-sm font-medium text-gray-900">0917-123-4567</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Invoice Reference:</span>
                              <span className="text-sm font-medium text-gray-900">AMMEX-{invoice?.invoiceNumber}</span>
                            </div>
                          </div>
                        ) : paymentData.paymentMethod === 'gcash' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Account Name:</span>
                              <span className="text-sm font-medium text-gray-900">Ammex Trading Corp.</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">GCash Number:</span>
                              <span className="text-sm font-medium text-gray-900">0917-987-6543</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Invoice Reference:</span>
                              <span className="text-sm font-medium text-gray-900">AMMEX-{invoice?.invoiceNumber}</span>
                            </div>
                          </div>
                        ) : paymentData.paymentMethod === 'bank_transfer' && selectedBank ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Bank Name:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {bankOptions.find(bank => bank.key === selectedBank)?.label}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Account Name:</span>
                              <span className="text-sm font-medium text-gray-900">Ammex Trading Corp.</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Account Number:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {bankOptions.find(bank => bank.key === selectedBank)?.accountNumber}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Invoice Reference:</span>
                              <span className="text-sm font-medium text-gray-900">AMMEX-{invoice?.invoiceNumber}</span>
                            </div>
                          </div>
                        ) : paymentData.paymentMethod === 'bank_transfer' ? (
                          <div className="space-y-2">
                            <div className="flex justify-center">
                              <span className="text-sm text-gray-500">Please select a bank to view account details</span>
                            </div>
                          </div>
                        ) : paymentData.paymentMethod === 'check' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Payable to:</span>
                              <span className="text-sm font-medium text-gray-900">Ammex Trading Corp.</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Invoice Reference:</span>
                              <span className="text-sm font-medium text-gray-900">AMMEX-{invoice?.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Amount:</span>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(parseFloat(paymentData.amount) || 0)}</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      {paymentData.amount && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Amount to Pay:</span>
                            <span className="font-semibold text-lg text-gray-900">{formatCurrency(parseFloat(paymentData.amount) || 0)}</span>
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        <p>• Make sure to include the reference number in your payment</p>
                        <p>• Keep your payment receipt for verification</p>
                        <p>• Payment will be processed within 1-2 business days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Receipt - Moved to bottom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Receipt <span className="text-red-500">*</span></label>
              <div className="space-y-3">
                <div>
                  <input
                    id="receipt-upload-payment"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleReceiptUpload(e.target.files && e.target.files[0])}
                    className="block w-full cursor-pointer text-sm text-gray-700 file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#3182ce] file:text-white hover:file:bg-[#2c5282]"
                  />
                  <p className="mt-1 text-xs text-gray-500">Upload an image or PDF of your payment receipt.</p>
                </div>
                {validationErrors.receipt && (
                  <p className="text-sm text-red-600">{validationErrors.receipt}</p>
                )}

                {invoiceReceipts[invoice.id] && (
                  <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-all">{invoiceReceipts[invoice.id].name}</p>
                      <p className="text-xs text-gray-500">{invoiceReceipts[invoice.id].type} • {(invoiceReceipts[invoice.id].size / 1024).toFixed(1)} KB</p>
                      {invoiceReceipts[invoice.id].type.startsWith('image/') ? (
                        <img
                          src={invoiceReceipts[invoice.id].url}
                          alt="Receipt preview"
                          className="mt-2 max-h-40 rounded border border-gray-200"
                        />
                      ) : (
                        <a
                          href={invoiceReceipts[invoice.id].url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 text-[#3182ce] hover:text-[#2c5282] text-sm"
                        >
                          View PDF receipt
                        </a>
                      )}
                    </div>
                    <button
                      onClick={handleRemoveReceipt}
                      className="shrink-0 cursor-pointer text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Form validation note */}
              <p className="text-xs text-red-500">
                <strong>Note:</strong> Required fields are marked with <span className="text-red-500">*</span>. 
                Please fill in all required fields (Payment Amount, Payment Method, and Payment Receipt) before submitting your payment.
              </p>

            {/* Global validation error */}
            {validationErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{validationErrors.submit}</p>
              </div>
            )}

            {/* Success message for draft save */}
            {isDraftSaved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600">Draft saved successfully!</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSubmitting}
                className="flex px-3 cursor-pointer py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSavingDraft ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save as draft'
                )}
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={isSubmitting || isSavingDraft}
                className="flex px-8 cursor-pointer py-3 bg-[#3182ce] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        paymentMethod={paymentData.paymentMethod}
        selectedBank={selectedBank}
        bankOptions={bankOptions}
        paymentAmount={paymentData.amount}
        invoiceNumber={invoice?.invoiceNumber}
      />
    </>
  );
};

export default Payment;
