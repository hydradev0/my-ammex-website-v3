import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, DollarSign, CreditCard, Wallet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import TopBarPortal from './TopBarPortal';
import SuccessModal from '../Components/SuccessModal';
import { getMyInvoices } from '../services/invoiceService';
import { 
  createPaymentIntent, 
  createPaymentMethod,
  attachPaymentToIntent,
  createPaymentSource,
  getPaymentStatus
} from '../services/paymentService';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedAmount, setLastSubmittedAmount] = useState(0);
  const [paymentError, setPaymentError] = useState('');
  
  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Get invoice ID from URL params
  const invoiceId = new URLSearchParams(location.search).get('invoiceId');

  // Payment methods configuration
  const paymentMethods = [
    { key: 'card', label: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, JCB' },
    { key: 'gcash', label: 'GCash', icon: Wallet, description: 'Pay via GCash e-wallet' },
    { key: 'grab_pay', label: 'GrabPay', icon: Wallet, description: 'Pay via GrabPay' },
    { key: 'paymaya', label: 'Maya', icon: Wallet, description: 'Pay via Maya (PayMaya)' }
  ];

  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) {
        navigate('/Products/Invoices');
        return;
      }

      setIsLoading(true);
      try {
        // Check if returning from 3DS authentication
        const pendingPaymentIntentId = sessionStorage.getItem('pendingPaymentIntentId');
        if (pendingPaymentIntentId) {
          sessionStorage.removeItem('pendingPaymentIntentId');
          
          // Complete the payment after 3DS
          try {
            const completeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/complete-payment-manually`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ paymentIntentId: pendingPaymentIntentId })
            });
            
            const completeData = await completeResponse.json();
            
            if (completeData.success) {
              console.log('Payment completed after 3DS:', completeData);
              navigate('/Products/Invoices?payment=success');
              return;
            }
          } catch (err) {
            console.error('Error completing payment after 3DS:', err);
          }
        }

        // Check if returning from GCash/e-wallet payment
        const urlParams = new URLSearchParams(location.search);
        const paymentStatus = urlParams.get('payment');
        const sourceId = urlParams.get('source_id');
        
        if (paymentStatus === 'success' && sourceId) {
          console.log('Returning from GCash payment:', sourceId);
          
          // In development, manually complete the e-wallet payment
          if (import.meta.env.DEV) {
            try {
              console.log('Development mode: Completing e-wallet payment...');
              const completeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/complete-payment-manually`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ paymentIntentId: sourceId })
              });
              
              const completeData = await completeResponse.json();
              
              if (completeData.success) {
                console.log('E-wallet payment completed:', completeData);
                navigate('/Products/Invoices?payment=success');
                return;
              }
            } catch (err) {
              console.error('Error completing e-wallet payment:', err);
            }
          } else {
            // In production, webhook will handle it
            console.log('Production mode: Webhook will handle e-wallet payment');
            navigate('/Products/Invoices?payment=success');
            return;
          }
        }
        
        if (paymentStatus === 'failed') {
          console.log('E-wallet payment failed');
          navigate('/Products/Invoices?payment=failed');
          return;
        }

        const response = await getMyInvoices();
        const invoiceData = response.data || [];
        
        const foundInvoice = invoiceData.find(inv => inv.id === parseInt(invoiceId));
        
        if (!foundInvoice) {
          navigate('/Products/Invoices');
          return;
        }

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
          customer: {
            name: foundInvoice.customerName || 'Unknown Customer',
            email: foundInvoice.customerEmail || ''
          }
        };

        setInvoice(transformedInvoice);
        setPaymentAmount('');
      } catch (error) {
        console.error('Failed to load invoice:', error);
        navigate('/Products/Invoices');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, navigate]);


  const handleBack = () => {
    navigate('/Products/Invoices');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/Products/Invoices');
  };

  const validatePaymentAmount = () => {
    const errors = {};
    
    if (!paymentAmount || paymentAmount.trim() === '') {
      errors.amount = 'Payment amount is required';
    } else {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Payment amount must be greater than 0';
      } else if (invoice && amount > invoice.remainingAmount) {
        errors.amount = `Payment amount cannot exceed outstanding balance of ${formatCurrency(invoice.remainingAmount)}`;
      }
    }


    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAmountChange = (value) => {
    setPaymentAmount(value);
    if (validationErrors.amount) {
      setValidationErrors(prev => ({ ...prev, amount: undefined }));
    }
    setPaymentError('');
  };

  // Production: Poll payment status until completion
  const startPaymentPolling = async (paymentIntentId) => {
    const maxAttempts = 30; // 5 minutes max (10 seconds * 30)
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const statusResponse = await getPaymentStatus(paymentIntentId);
        
        if (statusResponse.success) {
          const { status } = statusResponse.data;
          
          if (status === 'succeeded') {
            clearInterval(pollInterval);
            setLastSubmittedAmount(parseFloat(paymentAmount));
            setShowSuccessModal(true);
            setIsProcessing(false);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setPaymentError('Payment failed. Please try again.');
            setIsProcessing(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPaymentError('Payment is taking longer than expected. Please check your payment status.');
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setPaymentError('Unable to verify payment status. Please contact support.');
          setIsProcessing(false);
        }
      }
    }, 10000); // Poll every 10 seconds
  };

  const handlePaymentSubmit = async () => {
    if (!invoice || !validatePaymentAmount()) {
      return;
    }

    // Validate card details for card payments
    if (selectedMethod === 'card') {
      const errors = {};
      
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
        errors.cardNumber = 'Valid card number is required';
      }
      
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        errors.cardExpiry = 'Valid expiry date (MM/YY) is required';
      }
      
      if (!cardCvc || cardCvc.length < 3) {
        errors.cardCvc = 'Valid CVC is required';
      }
      
      if (!cardholderName || cardholderName.trim().length < 3) {
        errors.cardholderName = 'Cardholder name is required';
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(prev => ({ ...prev, ...errors }));
        return;
      }
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      const amount = parseFloat(paymentAmount);

      // Step 1: Create payment intent via backend
      const intentResponse = await createPaymentIntent(invoice.id, amount, selectedMethod);
      
      if (!intentResponse.success) {
        throw new Error(intentResponse.message || 'Failed to create payment');
      }

      const { paymentIntentId, paymentId } = intentResponse.data;

      if (selectedMethod === 'card') {
        // Step 2: Create payment method with card details
        const [expMonth, expYear] = cardExpiry.split('/');
        
        const cardDetails = {
          card_number: cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(expMonth, 10),
          exp_year: parseInt('20' + expYear, 10),
          cvc: cardCvc
        };
        
        const billingDetails = {
          name: cardholderName,
          email: invoice.customer.email || ''
        };
        
        const methodResponse = await createPaymentMethod(cardDetails, billingDetails);
        
        if (!methodResponse.success) {
          throw new Error(methodResponse.message || 'Failed to create payment method');
        }
        
        const { paymentMethodId } = methodResponse.data;
        
        // Step 3: Attach payment method to intent
        const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
        const returnUrl = `${frontendUrl}/Products/Invoices?payment=success`;
        
        const attachResponse = await attachPaymentToIntent(
          paymentIntentId,
          paymentMethodId,
          returnUrl,
          paymentId
        );
        
        if (!attachResponse.success) {
          throw new Error(attachResponse.message || 'Failed to attach payment method');
        }
        
        const { status, nextAction } = attachResponse.data;
        
        // Step 4: Handle response based on status
        if (status === 'awaiting_next_action' && nextAction?.redirect?.url) {
          // 3D Secure required - redirect to authentication page
          // Store payment intent ID for completion after redirect
          sessionStorage.setItem('pendingPaymentIntentId', paymentIntentId);
          window.location.href = nextAction.redirect.url;
            } else if (status === 'processing' || status === 'succeeded') {
              // Payment is processing or succeeded
              
              if (status === 'processing') {
                // Start polling for payment completion
                startPaymentPolling(paymentIntentId);
              } else {
                // Payment already succeeded
                setLastSubmittedAmount(amount);
                setShowSuccessModal(true);
              }
        } else {
          throw new Error('Unexpected payment status: ' + status);
        }
        
      } else {
        // E-wallet payment (GCash, GrabPay, Maya)
        const sourceResponse = await createPaymentSource(
          selectedMethod,
          amount,
          invoice.id,
          paymentId
        );
        
        if (!sourceResponse.success) {
          throw new Error(sourceResponse.message || 'Failed to create payment source');
        }
        
        const { checkoutUrl } = sourceResponse.data;
        
        if (checkoutUrl) {
          // Redirect to e-wallet checkout page
          window.location.href = checkoutUrl;
        } else {
          throw new Error('No checkout URL received from payment provider');
        }
      }

    } catch (error) {
      console.error('Payment submission failed:', error);
      setPaymentError(error.message || 'Payment submission failed. Please try again.');
      setIsProcessing(false);
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
            <p className="text-sm text-gray-600 mt-1">Secure payment powered by PayMongo</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Payment Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                {invoice && (
                  <button
                    type="button"
                    onClick={() => handleAmountChange(invoice.remainingAmount.toString())}
                    className={`text-xs underline ${
                      'text-[#3182ce] hover:text-[#2c5282] cursor-pointer'
                    }`}
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
                  value={paymentAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*(?:[.,]?\d{0,2})?$/.test(val)) {
                      handleAmountChange(val.replace(',', '.'));
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

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setSelectedMethod(method.key)}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedMethod === method.key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mt-0.5 mr-3 flex-shrink-0 ${
                        selectedMethod === method.key ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${
                          selectedMethod === method.key ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {method.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                      </div>
                      {selectedMethod === method.key && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Details (only shown for card payments) */}
            {selectedMethod === 'card' && (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Card Details</h4>
                
                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                      setCardNumber(formatted);
                      if (validationErrors.cardNumber) {
                        setValidationErrors(prev => ({ ...prev, cardNumber: undefined }));
                      }
                    }}
                    maxLength="19"
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                      validationErrors.cardNumber 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.cardNumber}</p>
                  )}
                </div>

                {/* Expiry and CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setCardExpiry(value);
                        if (validationErrors.cardExpiry) {
                          setValidationErrors(prev => ({ ...prev, cardExpiry: undefined }));
                        }
                      }}
                      maxLength="5"
                      placeholder="MM/YY"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                        validationErrors.cardExpiry 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.cardExpiry && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.cardExpiry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCardCvc(value);
                        if (validationErrors.cardCvc) {
                          setValidationErrors(prev => ({ ...prev, cardCvc: undefined }));
                        }
                      }}
                      maxLength="4"
                      placeholder="123"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                        validationErrors.cardCvc 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.cardCvc && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.cardCvc}</p>
                    )}
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => {
                      setCardholderName(e.target.value);
                      if (validationErrors.cardholderName) {
                        setValidationErrors(prev => ({ ...prev, cardholderName: undefined }));
                      }
                    }}
                    placeholder="JUAN DELA CRUZ"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none uppercase ${
                      validationErrors.cardholderName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.cardholderName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Error Display */}
            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-red-600">{paymentError}</p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Secure Payment</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Your payment is processed securely via PayMongo</li>
                    <li>• Partial payments are supported</li>
                    <li>• You will receive a confirmation once payment is successful</li>
                    <li>• Payment will be reflected in your account within 1-2 business days</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handlePaymentSubmit}
                disabled={isProcessing || !paymentAmount}
                className="flex items-center cursor-pointer px-8 py-3 bg-[#3182ce] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pay {paymentAmount ? formatCurrency(parseFloat(paymentAmount)) : 'Now'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Payment Submitted Successfully!"
        message={`Your payment of ${formatCurrency(lastSubmittedAmount)} has been submitted for processing. You will receive a notification once it's confirmed.`}
        autoClose={false}
        showCloseButton={true}
      />
    </>
  );
};

export default Payment;

