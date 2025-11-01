import { API_BASE_URL } from '../utils/apiConfig';

export async function getWebsiteCategoryTraffic({ start, end } = {}) {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  const url = `${API_BASE_URL}/analytics/website/category-traffic${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Website category traffic failed: ${res.status}`);
  const json = await res.json();
  if (json?.success !== true) throw new Error(json?.error || 'Website category traffic error');
  return json.data || [];
}

export async function getWebsiteTopClickedItems({ start, end, limit = 5 } = {}) {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  if (limit) params.append('limit', String(limit));
  const url = `${API_BASE_URL}/analytics/website/top-clicked-items${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Website top clicked items failed: ${res.status}`);
  const json = await res.json();
  if (json?.success !== true) throw new Error(json?.error || 'Website top clicked items error');
  return json.data || [];
}

export async function getWebsiteCartAdditions({ start, end } = {}) {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  const url = `${API_BASE_URL}/analytics/website/cart-additions${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Website cart additions failed: ${res.status}`);
  const json = await res.json();
  if (json?.success !== true) throw new Error(json?.error || 'Website cart additions error');
  return json.data || [];
}

export async function sendWebsiteEvent(eventData) {
  const url = `${API_BASE_URL}/analytics/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(eventData)
  });
  if (!res.ok) throw new Error(`Send website event failed: ${res.status}`);
  const json = await res.json();
  if (json?.success !== true) throw new Error(json?.error || 'Send website event error');
  return json;
}

export async function refreshWebsiteAnalytics() {
  const url = `${API_BASE_URL}/analytics/website/refresh`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Refresh website data failed: ${res.status}`);
  const json = await res.json();
  if (json?.success !== true) throw new Error(json?.error || 'Refresh website data error');
  return json;
}

export async function generateAIInsights({ categoryTraffic, topClickedItems, cartAdditions, dateRange } = {}) {
  const url = `${API_BASE_URL}/analytics/website/generate-insights`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      categoryTraffic, 
      topClickedItems, 
      cartAdditions, 
      dateRange 
    })
  });
  if (!res.ok) throw new Error(`Generate insights failed: ${res.status}`);
  const json = await res.json();
  if (json?.success !== true) throw new Error(json?.error || 'Generate insights error');
  return json.data;
}


