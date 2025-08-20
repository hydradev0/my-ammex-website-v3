import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TopBar from './TopBar';
import Navigation from './Navigation';

const RoleBasedLayout = ({ children }) => {
  const { user } = useAuth();
  const role = user?.role;
  const isClient = role === 'Client';

  // Client users don't see staff interface
  if (isClient) {
    return <>{children}</>;
  }

  // Staff users see TopBar and Navigation
  return (
    <>
      <TopBar />
      <Navigation />
      {children}
    </>
  );
};

export default RoleBasedLayout;
