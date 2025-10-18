import { apiCall } from '../utils/apiConfig';

// Get all payment receipts for authenticated customer
export const getMyPaymentReceipts = async () => {
  try {
    const response = await apiCall.get('/payments/receipts/my');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment receipts:', error);
    throw error;
  }
};

// Get specific payment receipt details
export const getPaymentReceiptDetails = async (receiptId) => {
  try {
    const response = await apiCall.get(`/payments/receipts/${receiptId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment receipt details:', error);
    throw error;
  }
};

// Download payment receipt as PDF
export const downloadPaymentReceipt = async (receiptId) => {
  try {
    const response = await apiCall.get(`/payments/receipts/${receiptId}/download`);
    return response.data;
  } catch (error) {
    console.error('Error downloading payment receipt:', error);
    throw error;
  }
};

// Helper: Format payment method display name
export const formatPaymentMethod = (method) => {
  const methodMap = {
    'card': 'Credit/Debit Card',
    'gcash': 'GCash',
    'grab_pay': 'GrabPay',
    'paymaya': 'Maya',
    'bank_transfer': 'Bank Transfer',
    'paymongo': 'PayMongo'
  };
  return methodMap[method] || method;
};

// Helper: Generate printable receipt HTML
export const generateReceiptHTML = (receipt) => {
  const formatCurrency = (amount) => {
    return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${receipt.receiptNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #333;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 3px solid #3182ce;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .receipt-header h1 {
          color: #3182ce;
          margin: 0 0 10px 0;
          font-size: 32px;
        }
        .receipt-number {
          font-size: 18px;
          color: #666;
          font-weight: bold;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-item {
          margin-bottom: 15px;
        }
        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        .amount-box {
          background: #f7fafc;
          border: 2px solid #3182ce;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .amount-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        .amount-value {
          font-size: 36px;
          font-weight: bold;
          color: #3182ce;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        .status-partial {
          background: #fef3c7;
          color: #92400e;
        }
        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .summary-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .summary-table td:first-child {
          color: #666;
          width: 40%;
        }
        .summary-table td:last-child {
          text-align: right;
          font-weight: 600;
        }
        .summary-table tr:last-child td {
          border-bottom: none;
          font-size: 18px;
          padding-top: 15px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <h1>PAYMENT RECEIPT</h1>
        <div class="receipt-number">${receipt.receiptNumber}</div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${receipt.customer?.customerName || receipt.customer?.contactName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${receipt.customer?.email1 || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="amount-box">
        <div class="amount-label">Payment Amount</div>
        <div class="amount-value">${formatCurrency(receipt.amount)}</div>
      </div>

      <div class="section">
        <div class="section-title">Payment Details</div>
        <table class="summary-table">
          <tr>
            <td>Payment Date</td>
            <td>${formatDate(receipt.paymentDate)}</td>
          </tr>
          <tr>
            <td>Payment Time</td>
            <td>${formatTime(receipt.paymentDate)}</td>
          </tr>
          <tr>
            <td>Payment Method</td>
            <td>${formatPaymentMethod(receipt.paymentMethod)}</td>
          </tr>
          ${receipt.paymentReference ? `
          <tr>
            <td>Reference Number</td>
            <td>${receipt.paymentReference}</td>
          </tr>
          ` : ''}
          <tr>
            <td>Invoice Number</td>
            <td>${receipt.invoice?.invoiceNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td>
              <span class="status-badge status-${receipt.status.toLowerCase()}">${receipt.status}</span>
            </td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Invoice Summary</div>
        <table class="summary-table">
          <tr>
            <td>Total Invoice Amount</td>
            <td>${formatCurrency(receipt.totalAmount)}</td>
          </tr>
          <tr>
            <td>Payment Made</td>
            <td>${formatCurrency(receipt.amount)}</td>
          </tr>
          <tr>
            <td>Remaining Balance</td>
            <td style="color: ${Number(receipt.remainingAmount) > 0 ? '#dc2626' : '#059669'}">
              ${formatCurrency(receipt.remainingAmount)}
            </td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>This is an automatically generated payment receipt.</p>
        <p>Generated on ${formatDate(new Date())} at ${formatTime(new Date())}</p>
        <p>For inquiries, please contact our support team.</p>
      </div>
    </body>
    </html>
  `;
};

// Print receipt
export const printReceipt = async (receiptId) => {
  try {
    const response = await getPaymentReceiptDetails(receiptId);
    const receipt = response.data;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML(receipt));
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } catch (error) {
    console.error('Error printing receipt:', error);
    throw error;
  }
};

