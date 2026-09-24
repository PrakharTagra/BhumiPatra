import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isOfficer, isLoading, user, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoadingSpinner size="lg" message="Verifying officer credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Exclusive role check: VERIFICATION_OFFICER only
  if (!isOfficer) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-rose-200 p-6 shadow-md text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-950">Unauthorized Access</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            The BhumiPatra Verification Portal is strictly reserved for accounts with the{' '}
            <span className="font-semibold text-rose-700">VERIFICATION_OFFICER</span> role.
          </p>
          <div className="my-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-left">
            <p><strong>Signed in as:</strong> {user?.email || 'Unknown'}</p>
            <p className="mt-1"><strong>Assigned Role:</strong> {user?.role || 'None'}</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={LogOut}
            onClick={logout}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
