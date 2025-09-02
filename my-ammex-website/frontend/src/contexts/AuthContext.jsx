import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { initializeCartFromDatabase } from '../services/cartService';

// Set axios base URL to point to backend
axios.defaults.baseURL = 'http://localhost:5000';

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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data.success) {
        const currentUser = response.data.data;
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
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
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
    
    // Clear axios header
    delete axios.defaults.headers.common['Authorization'];
    
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


