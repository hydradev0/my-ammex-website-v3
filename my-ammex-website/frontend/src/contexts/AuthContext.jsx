import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall, checkApiHealth } from '../utils/apiConfig';
import { initializeCartFromDatabase } from '../services/cartService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuthStatus = async () => {
    try {
      // First check if API is healthy
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        console.warn('API is not responding, logging out user');
        logout();
        return;
      }

      const response = await apiCall('/auth/me');
      if (response.success) {
        const currentUser = response.data;
        setUser(currentUser);
        // Initialize cart from DB for clients
        if (currentUser?.role === 'Client' && currentUser?.customerPk) {
          try {
            // Clear any stale local cart first
            localStorage.removeItem('customerCart');
            await initializeCartFromDatabase(currentUser.customerPk);
          } catch (_) {}
        }
      } else {
        logout();
      }
    } catch (error) {
      console.warn('Auth check failed:', error.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (response.success) {
        const { token: newToken, user: userData } = response;
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(newToken);
        setUser(userData);
        
        // On login, clear any stale cart and initialize from DB for clients
        try {
          localStorage.removeItem('customerCart');
          if (userData?.role === 'Client' && userData?.customerPk) {
            await initializeCartFromDatabase(userData.customerPk);
          }
        } catch (_) {}
        
        return { success: true, user: userData };
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('customerCart');
    
    // Clear state
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


