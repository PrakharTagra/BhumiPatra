import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DigitizationAnalytics from './pages/DigitizationAnalytics';
import VerificationAnalytics from './pages/VerificationAnalytics';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import SystemActivity from './pages/SystemActivity';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Administrative Routes (Exclusively ADMIN) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="documents" element={<Documents />} />
              <Route path="analytics/digitization" element={<DigitizationAnalytics />} />
              <Route path="analytics/verification" element={<VerificationAnalytics />} />
              <Route path="analytics" element={<Navigate to="/analytics/digitization" replace />} />
              <Route path="users" element={<Users />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="system-activity" element={<SystemActivity />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
