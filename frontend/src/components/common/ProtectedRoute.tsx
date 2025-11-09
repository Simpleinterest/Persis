import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireUser?: boolean;
  requireCoach?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireUser = false, 
  requireCoach = false 
}) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userType = authService.getUserType();
  
  if (requireUser && userType !== 'user') {
    return <Navigate to="/login" replace />;
  }

  if (requireCoach && userType !== 'coach') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

