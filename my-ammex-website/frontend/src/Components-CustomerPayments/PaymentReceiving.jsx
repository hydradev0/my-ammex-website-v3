import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, DollarSign, Receipt, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import ModernSearchFilter from '../Components/ModernSearchFilter';
import PaymentHistoryTab from './PaymentHistoryTab';
import BalanceTab from './BalanceTab';
import FailedPaymentsTab from './FailedPaymentsTab';
import { 
  getPaymentMethods,
  getBalanceHistory,
  getAllPaymentHistory,
  getFailedPayments
} from '../services/paymentService';

const PaymentReceiving = () => {
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('balance'); // 'balance', 'history', 'failures'
  
  // State for balance tracking, payment history, and failed payments
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);

  // Loading states
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingFailed, setIsLoadingFailed] = useState(false);
  
  // Payment methods management
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Set loading states
        setIsLoadingBalance(true);
        setIsLoadingHistory(true);
        setIsLoadingFailed(true);

        // Load payment methods
        try {
          const paymentMethodsResponse = await getPaymentMethods();
          setPaymentMethods(paymentMethodsResponse.data || []);
        } catch (error) {
          console.error('Failed to load payment methods:', error);
          setPaymentMethods([]);
        }

        // Load balance history
        try {
          const balanceHistoryResponse = await getBalanceHistory();
          const bhRaw = (balanceHistoryResponse.data || []).map(h => ({
            id: h.id,
            customerName: h.customer?.customerName || 'Unknown',
            invoiceNumber: h.invoice?.invoiceNumber || '',
            invoiceId: h.invoice?.id,
            action: h.action,
            timestamp: h.createdAt || h.created_at,
            dueDate: h.invoice?.dueDate || h.invoice?.due_date,
            paidAmount: Number(h.invoice?.paidAmount ?? h.invoice?.paid_amount ?? 0),
            remainingAmount: Number(h.invoice?.remainingBalance ?? h.invoice?.remaining_balance ?? 0),
            details: {
              amount: Number(h.amount) || 0,
              paymentMethod: h.paymentMethod || h.payment_method || '',
              reference: h.reference || ''
            }
          }));
          const outstanding = bhRaw.filter(h => h.remainingAmount > 0);
          // Deduplicate by invoice (keep latest timestamp per invoice)
          const latestBalanceByInvoice = Object.values(
            outstanding.reduce((acc, cur) => {
              const key = cur.invoiceId || cur.invoiceNumber || cur.id;
              const prev = acc[key];
              if (!prev || new Date(cur.timestamp) > new Date(prev.timestamp)) {
                acc[key] = cur;
              }
              return acc;
            }, {})
          );
          setBalanceHistory(latestBalanceByInvoice);
        } catch (error) {
          console.error('Failed to load balance history:', error);
          // Fallback to empty array if API fails
          setBalanceHistory([]);
        }

        // Load payment history (completed payments only, deduplicated per invoice)
        try {
          const paymentHistoryResponse = await getAllPaymentHistory();
          const phRaw = (paymentHistoryResponse.data || []).map(h => ({
            id: h.id,
            customerName: h.customer?.customerName || 'Unknown',
            invoiceNumber: h.invoice?.invoice_number || h.invoice?.invoiceNumber || '',
            invoiceId: h.invoice?.id,
            action: h.action,
            timestamp: h.createdAt || h.created_at,
            remainingAmount: Number(h.invoice?.remainingBalance ?? h.invoice?.remaining_balance ?? 0),
            details: {
              amount: Number(h.amount) || 0,
              paymentMethod: h.paymentMethod || h.payment_method || '',
              reference: h.reference || ''
            }
          }));
          // Keep only latest record per invoiceId
          const completed = phRaw.filter(h => h.remainingAmount === 0);
          const latestCompletedByInvoice = Object.values(
            completed.reduce((acc, cur) => {
              const key = cur.invoiceId || cur.invoiceNumber || cur.id;
              const prev = acc[key];
              if (!prev || new Date(cur.timestamp) > new Date(prev.timestamp)) {
                acc[key] = cur;
              }
              return acc;
            }, {})
          ).map(h => ({ ...h, action: 'Payment Completed' }));
          const ph = latestCompletedByInvoice;
          setPaymentHistory(ph);
        } catch (error) {
          console.error('Failed to load payment history:', error);
          // Fallback to empty array if API fails
          setPaymentHistory([]);
        }

        // Load failed payments
        try {
          const failedResponse = await getFailedPayments();
          setFailedPayments(failedResponse.data || []);
        } catch (error) {
          console.error('Failed to load failed payments:', error);
          setFailedPayments([]);
        }

        // Clear loading states after all data is loaded
        setIsLoadingBalance(false);
        setIsLoadingHistory(false);
        setIsLoadingFailed(false);
      } catch (error) {
        console.error('Failed to load payment data:', error);
        // Clear loading states on error as well
        setIsLoadingBalance(false);
        setIsLoadingHistory(false);
        setIsLoadingFailed(false);
      }
    };

    loadData();
  }, []);


  // Payment methods management handlers
  const handleManagePaymentMethods = () => {
    navigate('/Sales/ManagePaymentMethods');
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Action handlers for the separate tab components
  const handleSendReminder = (item) => {
    console.log('Sending reminder for:', item);
    // Add logic to send reminder
  };

  const handleMarkAsPaid = (item) => {
    console.log('Marking as paid:', item);
    // In PayMongo flow, this would not be needed as payments auto-approve
  };

  const handleDownloadPDF = (item) => {
    console.log('Downloading PDF for:', item);
    // Add logic to download PDF
  };

  const handlePaymentHistoryAction = (item, action) => {
    if (action === 'download_pdf') {
      handleDownloadPDF(item);
    } else if (action === 'view_details') {
      console.log('Viewing payment details:', item);
    } else if (action === 'export_record') {
      console.log('Exporting payment record:', item);
    }
  };

  const handleRefreshFailedPayments = async () => {
    setIsLoadingFailed(true);
    try {
      const failedResponse = await getFailedPayments();
      setFailedPayments(failedResponse.data || []);
    } catch (error) {
      console.error('Failed to refresh failed payments:', error);
    } finally {
      setIsLoadingFailed(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            </div>
            <button
              onClick={handleManagePaymentMethods}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage Payment Methods
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('balance')}
                className={`py-2 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'balance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Balance Tracking
                <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {balanceHistory.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Payment History
              </button>
              <button
                onClick={() => setActiveTab('failures')}
                className={`py-2 cursor-pointer px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'failures'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Failed Payments
                <span className="bg-red-100 text-red-600 py-1 px-2 rounded-full text-xs">
                  {failedPayments.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Balance Tracking Tab Content */}
        {activeTab === 'balance' && (
            <BalanceTab
              historyData={balanceHistory}
              searchPlaceholder="Search balance history..."
              itemLabel="balance records"
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
              isLoading={isLoadingBalance}
              onSendReminder={handleSendReminder}
              onMarkAsPaid={handleMarkAsPaid}
            />
          )}

        {/* Payment History Tab Content */}
        {activeTab === 'history' && (
          <PaymentHistoryTab
            historyData={paymentHistory}
            searchPlaceholder="Search payment history..."
            itemLabel="payment records"
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
            onCustomAction={handlePaymentHistoryAction}
            tabType="history"
            isLoading={isLoadingHistory}
          />
        )}

        {/* Failed Payments Tab Content */}
        {activeTab === 'failures' && (
          <FailedPaymentsTab
            failedPayments={failedPayments}
            isLoading={isLoadingFailed}
            onRefresh={handleRefreshFailedPayments}
          />
        )}
      </div>
    </>
  );
};

export default PaymentReceiving;
