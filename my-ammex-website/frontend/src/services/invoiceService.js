import { API_BASE_URL, apiCall } from '../utils/apiConfig';

// Get all invoices (Admin/Sales Marketing)
export const getAllInvoices = async (page = 1, limit = 10, status = null, startDate = null, endDate = null) => {
  const token = localStorage.getItem('token');
  const url = new URL(`${API_BASE_URL}/invoices`);
  
  // Add query parameters
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (status) url.searchParams.set('status', status);
  if (startDate) url.searchParams.set('startDate', startDate);
  if (endDate) url.searchParams.set('endDate', endDate);

  const res = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch invoices');
  return data; // { success, data: Invoice[], pagination }
};

// Get invoices by status (Admin/Sales Marketing)
export const getInvoicesByStatus = async (status, page = 1, limit = 10) => {
  const token = localStorage.getItem('token');
  const url = new URL(`${API_BASE_URL}/invoices/status/${status}`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch invoices by status');
  return data; // { success, data: Invoice[], pagination }
};

// Get single invoice by ID (Admin/Sales Marketing)
export const getInvoiceById = async (invoiceId) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch invoice');
  return data; // { success, data: Invoice }
};

// Get client's own invoices
export const getMyInvoices = async (status = null) => {
  const token = localStorage.getItem('token');
  const url = new URL(`${API_BASE_URL}/invoices/my`);
  if (status) url.searchParams.set('status', status);

  const res = await fetch(url.toString(), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch my invoices');
  return data; // { success, data: Invoice[] }
};

// Create invoice from approved order (Admin/Sales Marketing)
export const createInvoice = async (orderId, paymentTerms = null, notes = null) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ 
      orderId,
      ...(paymentTerms ? { paymentTerms } : {}),
      ...(notes ? { notes } : {})
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create invoice');
  return data; // { success, data: Invoice }
};

// Update invoice status (Admin/Sales Marketing)
export const updateInvoiceStatus = async (invoiceId, status) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update invoice status');
  return data; // { success, data: Invoice }
};

// Download invoice PDF (Client)
export const downloadInvoicePdf = async (invoiceId) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/download`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to download invoice PDF');
  }
  const blob = await res.blob();
  return blob;
};