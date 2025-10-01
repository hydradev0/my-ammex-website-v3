const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export async function getHistoricalSales(months = 12) {
  const url = `${BASE_URL}/api/analytics/historical-sales?months=${months}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Historical sales request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Historical sales error');
  return json;
}

export async function postForecast({ period = 3, historicalMonths = 12 }) {
  const url = `${BASE_URL}/api/analytics/forecast`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ period, historicalMonths })
  });
  if (!res.ok) throw new Error(`Forecast request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Forecast error');
  return json;
}

export async function getHistoricalCustomerData(months = 12) {
  const url = `${BASE_URL}/api/analytics/historical-customer-data?months=${months}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Historical customer data request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Historical customer data error');
  return json;
}

export async function postCustomerBulkForecast({ period = 3 } = {}) {
  const url = `${BASE_URL}/api/analytics/customer-bulk-forecast`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ period })
  });
  if (!res.ok) throw new Error(`Customer bulk forecast request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Customer bulk forecast error');
  return json;
}



