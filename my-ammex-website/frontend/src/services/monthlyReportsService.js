import { API_BASE_URL } from '../utils/apiConfig';

// Get monthly report data for a specific year and month
export async function getMonthlyReport(year, month) {
  const url = `${API_BASE_URL}/monthly-reports/${year}/${month}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Monthly report request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Monthly report error');
  return json;
}

// Get available years for dropdown
export async function getAvailableYears() {
  const url = `${API_BASE_URL}/monthly-reports/years`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Available years request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Available years error');
  return json;
}

// Get available months for a specific year
export async function getAvailableMonths(year) {
  const url = `${API_BASE_URL}/monthly-reports/years/${year}/months`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Available months request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Available months error');
  return json;
}
