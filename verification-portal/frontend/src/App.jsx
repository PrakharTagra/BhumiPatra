import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import OfficerLayout from './components/layout/OfficerLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import RecordVerification from './pages/RecordVerification';
import VerifiedRecords from './pages/VerifiedRecords';
import RejectedRecords from './pages/RejectedRecords';
import VerificationHistory from './pages/VerificationHistory';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Officer Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected Verification Desk Routes (Exclusively VERIFICATION_OFFICER) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <OfficerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="queue" element={<Queue />} />
              <Route path="verify/:id" element={<RecordVerification />} />
              <Route path="verified" element={<VerifiedRecords />} />
              <Route path="rejected" element={<RejectedRecords />} />
              <Route path="history" element={<VerificationHistory />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
