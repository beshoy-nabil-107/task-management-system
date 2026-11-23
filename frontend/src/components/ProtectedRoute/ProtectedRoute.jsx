import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader } from '../UI';

export function ProtectedRoute({ children, allowedRoles = null }) {
  const { user, token, isInitialized } = useSelector((state) => state.auth);
  const location = useLocation();

  // If token exists but initialization (fetchCurrentUser) is still pending
  if (token && !isInitialized) {
    return <Loader fullscreen text="Loading user session..." />;
  }

  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role authorization check
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
