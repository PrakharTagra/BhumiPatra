import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ShieldAlert, LogOut } from 'lucide-react';
import Button from '../components/common/Button';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Authenticating Operator Session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Operator role check
  if (user?.role && user.role !== 'DIGITIZATION_OPERATOR') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Denied: Operator Role Required</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            This portal is exclusively designated for <span className="font-semibold text-navy-800">DIGITIZATION_OPERATOR</span> accounts.
            Your current assigned role is <span className="font-mono font-semibold text-rose-700">{user.role}</span>.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              onClick={async () => {
                await logout();
                window.location.href = '/login';
              }}
            >
              Sign Out &amp; Use Operator Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
