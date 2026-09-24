import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import UploadPage from '../pages/UploadPage';
import ProcessingDetailsPage from '../pages/ProcessingDetailsPage';
import DocumentsHistoryPage from '../pages/DocumentsHistoryPage';
import DocumentDetailPage from '../pages/DocumentDetailPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes for DIGITIZATION_OPERATOR */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/documents" element={<DocumentsHistoryPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/documents/:id/processing" element={<ProcessingDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Catch-all within layout */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
