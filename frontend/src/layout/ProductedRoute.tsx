import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Mock authentication function
const isAuthenticated = (): boolean => {
  return localStorage.getItem('access_token') !== null;
};

const ProtectedRoute: React.FC = () => {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth/signin" replace />;
  }

  // If authenticated, render the component (children)
  return <Outlet />;
};

export default ProtectedRoute;
