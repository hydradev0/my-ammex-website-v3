import { API_BASE_URL } from '../utils/apiConfig';

export async function getHistoricalSales(months = 12, includeCurrent = false) {
  const url = `${API_BASE_URL}/analytics/historical-sales?months=${months}&includeCurrent=${includeCurrent}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Historical sales request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Historical sales error');
  return json;
}

export async function postForecast({ period = 3, historicalMonths = 12 }) {
  const url = `${API_BASE_URL}/analytics/forecast`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ period, historicalMonths })
  });
  
  const json = await res.json();
  if (json?.metadata?.usage) {
    // Frontend visibility of OpenRouter token usage
    console.log('[Forecast Usage]', json.metadata.usage);
  }
  
  if (!res.ok) {
    const error = new Error(json?.error || `Forecast request failed: ${res.status}`);
    error.response = { data: json };
    throw error;
  }
  
  if (!json?.success) {
    const error = new Error(json?.error || 'Forecast error');
    error.response = { data: json };
    throw error;
  }
  
  return json;
}

export async function getHistoricalCustomerData(months = 12) {
  const url = `${API_BASE_URL}/analytics/historical-customer-data?months=${months}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Historical customer data request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Historical customer data error');
  return json;
}

export async function postCustomerBulkForecast({ period = 3 } = {}) {
  const url = `${API_BASE_URL}/analytics/customer-bulk-forecast`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ period })
  });
  
  const json = await res.json();
  if (json?.metadata?.usage) {
    // Frontend visibility of OpenRouter token usage (bulk)
    console.log('[Customer Bulk Forecast Usage]', json.metadata.usage);
  }
  
  if (!res.ok) {
    const error = new Error(json?.error || `Customer bulk forecast request failed: ${res.status}`);
    error.response = { data: json };
    throw error;
  }
  
  if (!json?.success) {
    const error = new Error(json?.error || 'Customer bulk forecast error');
    error.response = { data: json };
    throw error;
  }
  
  return json;
}

export async function getTopProducts({ months = 12, limit = 10 } = {}) {
  const url = `${API_BASE_URL}/analytics/top-products?months=${months}&limit=${limit}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Top products request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Top products error');
  return json;
}

export async function getTopBulkCustomers({ months = 12, limit = 10 } = {}) {
  const url = `${API_BASE_URL}/analytics/top-bulk-customers?months=${months}&limit=${limit}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Top bulk customers request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Top bulk customers error');
  return json;
}

export async function getYTDSalesGrowth() {
  const url = `${API_BASE_URL}/analytics/ytd-growth`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`YTD sales growth request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'YTD sales growth error');
  return json;
}



