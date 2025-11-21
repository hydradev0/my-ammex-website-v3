// Lightweight Tier service for UI-first implementation
// Endpoints are optimistic; callers must handle failures gracefully.

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json'
  };
};

export const getTiers = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/settings/tiers`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      return { success: false, data: [] };
    }
    const data = await res.json();
    return data?.success ? { success: true, data: data.data || [] } : { success: false, data: [] };
  } catch {
    return { success: false, data: [] };
  }
};

export const saveTiers = async (tiers) => {
  try {
    const res = await fetch(`${API_BASE_URL}/settings/tiers`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ tiers })
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.message || 'Failed to save tiers';
      return { success: false, message: msg };
    }
    const data = await res.json();
    return data?.success ? { success: true, data: data.data } : { success: false, message: data?.message || 'Failed to save tiers' };
  } catch (e) {
    return { success: false, message: e?.message || 'Failed to save tiers' };
  }
};

// Current authenticated customer's tier
export const getMyTier = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/settings/tiers/my`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      return { success: false, data: null };
    }
    const data = await res.json();
    return data?.success ? { success: true, data: data.data || null } : { success: false, data: null };
  } catch {
    return { success: false, data: null };
  }
};

// Specific customer's tier (for Sales screens)
export const getCustomerTier = async (customerId) => {
  if (!customerId) return { success: false, data: null };
  try {
    const res = await fetch(`${API_BASE_URL}/settings/tiers/customer/${customerId}`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      return { success: false, data: null };
    }
    const data = await res.json();
    return data?.success ? { success: true, data: data.data || null } : { success: false, data: null };
  } catch {
    return { success: false, data: null };
  }
};


