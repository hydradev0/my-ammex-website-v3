import { apiCall } from '../utils/apiConfig';

// Get all payment receipts for authenticated customer
export const getMyPaymentReceipts = async () => {
  try {
    const response = await apiCall('/payments/receipts/my', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Error fetching payment receipts:', error);
    throw error;
  }
};

// Get specific payment receipt details
export const getPaymentReceiptDetails = async (receiptId) => {
  try {
    const response = await apiCall(`/payments/receipts/${receiptId}`, {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Error fetching payment receipt details:', error);
    throw error;
  }
};

// Download payment receipt as PDF
export const downloadPaymentReceipt = async (receiptId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/receipts/${receiptId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Could not parse error response as JSON, use status text
      }
      throw new Error(errorMessage);
    }

    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Payment_Receipt.pdf';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Fallback to receipt ID if no filename provided
    if (filename === 'Payment_Receipt.pdf') {
      filename = `Receipt_${receiptId}.pdf`;
    }

    // Create blob from response
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Received empty file');
    }
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Receipt downloaded successfully' };
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
        @media print {
          @page { margin: 0; }
          body { margin: 1cm; }
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #1a1a1a;
          background: white;
        }
        .receipt-header {
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .receipt-header h1 {
          color: #1a1a1a;
          margin: 0 0 5px 0;
          font-size: 28px;
          font-weight: 700;
        }
        .receipt-label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .receipt-number {
          font-size: 20px;
          color: #1a1a1a;
          font-weight: 600;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 11px;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          font-weight: 600;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 8px;
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
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .amount-box {
          background: #f5f5f5;
          border: 2px solid #1a1a1a;
          border-radius: 4px;
          padding: 24px;
          text-align: right;
          margin: 20px 0;
        }
        .amount-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
         .amount-value {
           font-size: 32px;
           font-weight: 700;
           color: #1a1a1a;
         }
         .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .summary-table td {
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
          font-size: 14px;
        }
        .summary-table td:first-child {
          color: #4a4a4a;
          width: 50%;
        }
        .summary-table td:last-child {
          text-align: right;
          font-weight: 600;
          color: #1a1a1a;
        }
        .summary-table tr.total-row td {
          border-top: 2px solid #1a1a1a;
          border-bottom: 2px solid #1a1a1a;
          font-size: 16px;
          font-weight: 700;
          padding: 15px 0;
          color: #1a1a1a;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          color: #666;
          font-size: 10px;
          page-break-inside: avoid;
        }
        .confirmed-badge {
          display: inline-block;
          padding: 6px 12px;
          background: #f5f5f5;
          border: 1px solid #d0d0d0;
          border-radius: 3px;
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div class="receipt-label">Payment Receipt</div>
            <h1>${receipt.receiptNumber}</h1>
            <div class="confirmed-badge">✓ Payment Confirmed</div>
          </div>
          <div class="amount-box" style="margin: 0; max-width: 280px;">
            <div class="amount-label">Amount Paid</div>
            <div class="amount-value">${formatCurrency(receipt.amount)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${receipt.customer?.customerName || receipt.customer?.contactName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email Address</div>
            <div class="info-value">${receipt.customer?.email1 || 'N/A'}</div>
          </div>
        </div>
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
        </table>
      </div>

      <div class="section">
        <div class="section-title">Payment Summary</div>
        <table class="summary-table">
          <tr>
            <td>Invoice Total</td>
            <td>${formatCurrency(receipt.totalAmount)}</td>
          </tr>
          <tr>
            <td>This Payment</td>
            <td>- ${formatCurrency(receipt.amount)}</td>
          </tr>
          <tr class="total-row">
            <td>Balance Remaining</td>
            <td>${formatCurrency(receipt.remainingAmount)}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>This receipt serves as proof of payment. For inquiries, please contact our support team with your receipt number.</p>
        <p style="margin-top: 10px;">Generated on ${formatDate(new Date())} at ${formatTime(new Date())}</p>
      </div>
    </body>
    </html>
  `;
};

// Print/Download receipt as PDF
export const printReceipt = async (receiptId) => {
  try {
    const response = await getPaymentReceiptDetails(receiptId);
    const receipt = response.data;
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML(receipt));
      printWindow.document.close();
      
      // Wait for content to load then trigger print dialog
      printWindow.onload = () => {
        // Small delay to ensure styles are loaded
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      };
    } else {
      // Popup blocked - fallback message
      alert('Please allow popups to download the receipt. Or check your browser settings.');
    }
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw error;
  }
};

