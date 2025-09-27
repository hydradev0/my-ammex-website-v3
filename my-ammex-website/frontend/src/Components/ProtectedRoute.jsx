import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role checks (supports either a single requiredRole or an array via allowedRoles)
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.role)) {
      // If user is Client and trying to access non-Client routes, redirect to Products
      if (user?.role === 'Client') {
        return <Navigate to="/products" replace />;
      }
      return <Navigate to="/home/dashboard" replace />;
    }
  } else if (requiredRole && user?.role !== requiredRole) {
    // If user is Client and trying to access non-Client routes, redirect to Products
    if (user?.role === 'Client') {
      return <Navigate to="/products" replace />;
    }
    return <Navigate to="/home/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
