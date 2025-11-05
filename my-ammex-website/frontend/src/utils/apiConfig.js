// API Configuration for different environments
const getApiBaseUrl = () => {
  // Production environment with explicit API URL
  if (import.meta.env.PROD && import.meta.env.VITE_API_BASE_URL) {
    const apiUrl = import.meta.env.VITE_API_BASE_URL.trim();
    if (!isValidUrl(apiUrl)) {
      throw new Error(`Invalid VITE_API_BASE_URL: ${apiUrl}. Must be a valid URL.`);
    }
    return apiUrl;
  }
  
  // Development environment
  if (import.meta.env.DEV) {
    // Use explicit URL for development, or fallback to localhost backend
    const devApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return devApiUrl;
  }
  
  // Fallback for production without explicit API URL (relative path)
  return '/api';
};

// Validate URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Get API base URL with validation
export const getApiBaseUrlSafe = () => {
  try {
    return getApiBaseUrl();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('API Configuration Error:', error.message);
    }
    // Fallback to relative path for production
    return '/api';
  }
};

export const API_BASE_URL = getApiBaseUrlSafe();

// API call configuration
const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 2,
  retryDelay: 1000, // 1 second
};

// Enhanced API call with timeout, retry, and better error handling
export const apiCall = async (endpoint, options = {}) => {
  const { timeout = API_CONFIG.timeout, retries = API_CONFIG.retries } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.statusText = response.statusText;
        error.errors = errorData.errors; // Preserve validation errors array
        throw error;
      }

      return await response.json();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isTimeout = error.name === 'AbortError';
      const isNetworkError = !error.status;
      
      // Log errors appropriately
      if (import.meta.env.DEV || isLastAttempt) {
        console.error(`API Error (${endpoint}) - Attempt ${attempt + 1}:`, {
          message: error.message,
          status: error.status,
          isTimeout,
          isNetworkError,
          ...(error.errors && { validationErrors: error.errors }),
        });
      }
      
      // Don't retry on client errors (4xx) or last attempt
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      if (isLastAttempt) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (attempt + 1)));
    }
  }
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
};
