import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Mock authentication function
const isAuthenticated = (): boolean => {
  return localStorage.getItem('isLoggedIn') !== null;
};

const PublicRoute: React.FC = () => {
  if (isAuthenticated()) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/" replace />;
  }

  // If not authenticated, allow access to the public route
  return <Outlet />;
};

export default PublicRoute;
