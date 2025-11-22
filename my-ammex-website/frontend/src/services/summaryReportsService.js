import { API_BASE_URL } from '../utils/apiConfig';

// Get monthly report data for a specific year and month
export async function getMonthlyReport(year, month) {
  const url = `${API_BASE_URL}/summary-reports/monthly/${year}/${month}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Monthly report request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Monthly report error');
  return json;
}

// Get annual report data for a specific year
export async function getAnnualReport(year) {
  const url = `${API_BASE_URL}/summary-reports/annual/${year}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Annual report request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Annual report error');
  return json;
}

// Get weekly report data for a specific year, month, and week
export async function getWeeklyReport(year, month, week) {
  const url = `${API_BASE_URL}/summary-reports/weekly/${year}/${month}/${week}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Weekly report request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Weekly report error');
  return json;
}

// Get available years for dropdown
export async function getAvailableYears() {
  const url = `${API_BASE_URL}/summary-reports/years`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Available years request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Available years error');
  return json;
}

// Get available months for a specific year
export async function getAvailableMonths(year) {
  const url = `${API_BASE_URL}/summary-reports/years/${year}/months`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Available months request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Available months error');
  return json;
}

// Get available weeks for a specific year and month
export async function getAvailableWeeks(year, month) {
  const url = `${API_BASE_URL}/summary-reports/weekly/years/${year}/months/${month}/weeks`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Available weeks request failed: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || 'Available weeks error');
  return json;
}
