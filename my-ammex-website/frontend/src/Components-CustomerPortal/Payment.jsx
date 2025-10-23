import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronRight, DollarSign, CreditCard, Wallet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import TopBarPortal from './TopBarPortal';
import ScrollLock from '../Components/ScrollLock';
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
  const [paymentError, setPaymentError] = useState('');
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentFailureReason, setPaymentFailureReason] = useState('');
  const [showFailureModal, setShowFailureModal] = useState(false);
  
  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Get invoice ID from URL params
  const invoiceId = new URLSearchParams(location.search).get('invoiceId');

  // Payment methods configuration - now dynamic
  const [paymentMethods, setPaymentMethods] = useState([
    { 
      key: 'card', 
      label: 'Credit/Debit Card', 
      icon: CreditCard, 
      description: 'Visa, Mastercard, JCB',
      available: true,
      processingTime: 'Instant',
      fees: 'No additional fees',
      color: 'blue',
      minAmount: 1,
      maxAmount: 100000
    },
    { 
      key: 'gcash', 
      label: 'GCash', 
      icon: Wallet, 
      description: 'Pay via GCash e-wallet',
      available: true,
      processingTime: '1-2 minutes',
      fees: 'No additional fees',
      color: 'green',
      minAmount: 1,
      maxAmount: 50000
    },
    { 
      key: 'grab_pay', 
      label: 'GrabPay', 
      icon: Wallet, 
      description: 'Pay via GrabPay',
      available: true,
      processingTime: '1-2 minutes',
      fees: 'No additional fees',
      color: 'purple',
      minAmount: 1,
      maxAmount: 50000
    },
    { 
      key: 'paymaya', 
      label: 'Maya', 
      icon: Wallet, 
      description: 'Pay via Maya (PayMaya)',
      available: true,
      processingTime: '1-2 minutes',
      fees: 'No additional fees',
      color: 'pink',
      minAmount: 1,
      maxAmount: 50000
    }
  ]);

  // Load available payment methods from backend
  const loadPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/methods/available`);
      const data = await response.json();
      
      if (data.success && data.data.paymentMethods) {
        // Map backend data to frontend format
        const mappedMethods = data.data.paymentMethods.map(method => ({
          key: method.key,
          label: method.label,
          icon: method.icon === 'CreditCard' ? CreditCard : Wallet,
          description: method.description,
          available: method.available,
          processingTime: method.processingTime,
          fees: method.fees,
          color: method.color,
          minAmount: method.minAmount || 1,
          maxAmount: method.maxAmount || 100000
        }));
        
        setPaymentMethods(mappedMethods);
        console.log('Payment methods loaded from backend:', mappedMethods.length);
      } else {
        console.log('Using fallback payment methods');
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      console.log('Using fallback payment methods');
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) {
        navigate('/Products/Invoices');
        return;
      }

      setIsLoading(true);
      try {
        // Load payment methods
        await loadPaymentMethods();
        // Check if returning from 3DS authentication
        const pendingPaymentIntentId = sessionStorage.getItem('pendingPaymentIntentId');
        if (pendingPaymentIntentId) {
          sessionStorage.removeItem('pendingPaymentIntentId');
          
          // For 3DS payments, webhook will handle completion
          // Just redirect to success page
          console.log('Returning from 3DS authentication - webhook will handle payment completion');
          navigate('/Products/Invoices?payment=success');
          return;
        }

        // Check if returning from GCash/e-wallet payment
        const urlParams = new URLSearchParams(location.search);
        const paymentStatus = urlParams.get('payment');
        
        if (paymentStatus === 'success') {
          console.log('Returning from e-wallet payment - webhook will handle completion');
          navigate('/products/invoices?payment=success');
          return;
        }
        
        if (paymentStatus === 'failed') {
          console.log('E-wallet payment failed');
          const failureReason = urlParams.get('reason') || 'Payment was declined or cancelled';
          setPaymentFailureReason(failureReason);
          setShowFailureModal(true);
          return;
        }

        const response = await getMyInvoices();
        const invoiceData = response.data || [];
        
        const foundInvoice = invoiceData.find(inv => inv.id === parseInt(invoiceId));
        
        if (!foundInvoice) {
          navigate('/products/invoices');
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
        navigate('/products/invoices');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, navigate]);


  const handleBack = () => {
    navigate('/products/invoices');
  };

  const handleBreadcrumbClick = (path) => {
    navigate(path);
  };


  const handleFailureModalClose = () => {
    setShowFailureModal(false);
    setPaymentFailureReason('');
    setPaymentError('');
    setIsProcessing(false);
  };

  const handleRetryPayment = () => {
    setShowFailureModal(false);
    setPaymentFailureReason('');
    setPaymentError('');
    setIsProcessing(false);
    // Keep the form data for retry
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
      } else {
        // Validate against payment method limits
        const currentMethod = paymentMethods.find(m => m.key === selectedMethod);
        if (currentMethod) {
          if (currentMethod.minAmount && amount < currentMethod.minAmount) {
            errors.amount = `${currentMethod.label} requires a minimum payment of ${formatCurrency(currentMethod.minAmount)}`;
          } else if (currentMethod.maxAmount && amount > currentMethod.maxAmount) {
            errors.amount = `${currentMethod.label} has a maximum limit of ${formatCurrency(currentMethod.maxAmount)}`;
          }
        }
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
            console.log('✅ Payment succeeded! Redirecting to invoices with success notification...');
            setIsProcessing(false);
            // Redirect to invoices page with success parameter to show notification
            navigate('/Products/Invoices?payment=success');
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setPaymentFailureReason('Payment was declined by your bank or card issuer. Please check your card details and try again.');
            setShowFailureModal(true);
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
          // Payment is processing or succeeded - ALWAYS wait for webhook confirmation
          console.log(`Payment status: ${status} - Waiting for webhook confirmation...`);
          startPaymentPolling(paymentIntentId);
        } else {
          setPaymentFailureReason(`Unexpected payment status: ${status}. Please try again or contact support.`);
          setShowFailureModal(true);
          setIsProcessing(false);
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
      setPaymentFailureReason(error.message || 'Payment submission failed. Please check your details and try again.');
      setShowFailureModal(true);
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
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Payment Method <span className="text-red-500">*</span>
              </label>
              
              {loadingPaymentMethods ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-5 border-2 border-gray-200 rounded-xl bg-gray-50 animate-pulse">
                      <div className="flex items-start mb-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                        <div className="ml-3 flex-1">
                          <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-300 rounded w-full"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.key;
                  const isAvailable = method.available;
                  
                  // Color schemes for different payment methods
                  const colorSchemes = {
                    blue: {
                      selected: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
                      unselected: 'border-gray-200 hover:border-blue-300 hover:bg-blue-25',
                      icon: isSelected ? 'text-blue-600' : 'text-gray-400',
                      text: isSelected ? 'text-blue-900' : 'text-gray-900',
                      accent: 'text-blue-600'
                    },
                    green: {
                      selected: 'border-green-500 bg-green-50 ring-2 ring-green-200',
                      unselected: 'border-gray-200 hover:border-green-300 hover:bg-green-25',
                      icon: isSelected ? 'text-green-600' : 'text-gray-400',
                      text: isSelected ? 'text-green-900' : 'text-gray-900',
                      accent: 'text-green-600'
                    },
                    purple: {
                      selected: 'border-purple-500 bg-purple-50 ring-2 ring-purple-200',
                      unselected: 'border-gray-200 hover:border-purple-300 hover:bg-purple-25',
                      icon: isSelected ? 'text-purple-600' : 'text-gray-400',
                      text: isSelected ? 'text-purple-900' : 'text-gray-900',
                      accent: 'text-purple-600'
                    },
                    pink: {
                      selected: 'border-pink-500 bg-pink-50 ring-2 ring-pink-200',
                      unselected: 'border-gray-200 hover:border-pink-300 hover:bg-pink-25',
                      icon: isSelected ? 'text-pink-600' : 'text-gray-400',
                      text: isSelected ? 'text-pink-900' : 'text-gray-900',
                      accent: 'text-pink-600'
                    }
                  };
                  
                  const colors = colorSchemes[method.color] || colorSchemes.blue;
                  
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setSelectedMethod(method.key)}
                      disabled={!isAvailable}
                      className={`group relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                        isSelected 
                          ? colors.selected 
                          : isAvailable 
                            ? colors.unselected 
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      } ${!isAvailable ? 'hover:scale-100' : ''}`}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className={`w-6 h-6 ${colors.accent}`} />
                        </div>
                      )}
                      
                      {/* Payment method icon and header */}
                      <div className="flex items-start mb-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected 
                            ? 'bg-white shadow-sm' 
                            : 'bg-gray-50 group-hover:bg-white'
                        }`}>
                          <Icon className={`w-6 h-6 ${colors.icon}`} />
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className={`font-semibold text-lg ${
                            isSelected ? colors.text : 'text-gray-900'
                          }`}>
                            {method.label}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {method.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Payment method details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Processing time:</span>
                          <span className={`font-medium ${
                            isSelected ? colors.accent : 'text-gray-700'
                          }`}>
                            {method.processingTime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Fees:</span>
                          <span className={`font-medium ${
                            isSelected ? colors.accent : 'text-gray-700'
                          }`}>
                            {method.fees}
                          </span>
                        </div>
                        {method.minAmount && method.minAmount > 1 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Minimum:</span>
                            <span className={`font-medium ${
                              isSelected ? colors.accent : 'text-gray-700'
                            }`}>
                              {formatCurrency(method.minAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status indicator */}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 rounded-xl">
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                            Temporarily Unavailable
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
                </div>
              )}
              
              
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
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


            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handlePaymentSubmit}
                disabled={!paymentAmount}
                className="flex items-center cursor-pointer px-8 py-3 bg-[#3182ce] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Pay {paymentAmount ? formatCurrency(parseFloat(paymentAmount)) : 'Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      {isProcessing && createPortal(
        <>
          <ScrollLock active={isProcessing} />
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-gray-600">Please wait while we process your payment securely...</p>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Failure Modal */}
      {showFailureModal && createPortal(
        <>
          <ScrollLock active={showFailureModal} />
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  {paymentFailureReason}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700">
                    <strong>Common reasons for payment failure:</strong>
                  </p>
                  <ul className="text-xs text-red-600 mt-1 space-y-1">
                    <li>• Insufficient funds in your account</li>
                    <li>• Incorrect card details or expired card</li>
                    <li>• Bank security restrictions</li>
                    <li>• Network connectivity issues</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleFailureModalClose}
                  className="flex-1 cursor-pointer bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleRetryPayment}
                  className="flex-1 cursor-pointer bg-[#3182ce] text-white px-4 py-2 rounded-lg hover:bg-[#2c5282] transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default Payment;

