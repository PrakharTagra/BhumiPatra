import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authApi from '../api/auth';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button from '../components/common/Button';
import AlertBanner from '../components/common/AlertBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import {
  User,
  Shield,
  ShieldCheck,
  Mail,
  Building,
  Calendar,
  LogOut,
  Key,
  CheckCircle2,
  RefreshCw,
  FileCheck
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, logout, token } = useAuth();
  const { info, error: toastError } = useToast();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.getMe();
      const currentUser = data?.user || data;
      setProfile(currentUser);
    } catch (err) {
      console.warn('Failed to refresh profile from API:', err);
      // Keep existing context profile if available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    info('Operator session terminated.');
    window.location.href = '/login';
  };

  const displayName = profile?.name || profile?.username || profile?.email?.split('@')[0] || 'Digitization Operator';
  const email = profile?.email || 'operator@bhumipatra.gov';
  const role = profile?.role || 'DIGITIZATION_OPERATOR';
  const department = profile?.department || 'Land Records & Revenue Digitization Cell';
  const assignedDistrict = profile?.assignedDistrict || profile?.district || 'State Central Repository';
  const lastLogin = profile?.lastLogin || profile?.updatedAt || new Date().toISOString();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Operator Profile' }]} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Digitization Operator Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational credentials, assigned revenue jurisdiction, and compliance status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={loading}
            onClick={fetchProfile}
          >
            Refresh
          </Button>

          <Button
            variant="danger"
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Profile Sync Notice"
          message={error}
          onRetry={fetchProfile}
        />
      )}

      {/* Operator Identity Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-navy-900 text-sky-300 flex items-center justify-center font-bold text-2xl border-2 border-navy-700 shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active Session
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-navy-50 text-navy-800 border border-navy-200 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-navy-600" />
                <span>Role: {role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6 text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Department</span>
            <p className="font-semibold text-slate-800 text-sm mt-1">{department}</p>
          </div>

          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Assigned Revenue Zone</span>
            <p className="font-semibold text-slate-800 text-sm mt-1">{assignedDistrict}</p>
          </div>

          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Last Session Timestamp</span>
            <p className="font-mono text-slate-800 text-sm mt-1">{formatDate(lastLogin)}</p>
          </div>

          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Authentication Method</span>
            <p className="font-semibold text-slate-800 text-sm mt-1">JWT Bearer Authentication</p>
          </div>

          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Active Token Status</span>
            <p className="font-mono text-emerald-600 font-semibold text-sm mt-1">
              {token ? 'Valid (Stored Securely)' : 'Unset'}
            </p>
          </div>

          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Access Level</span>
            <p className="font-semibold text-slate-800 text-sm mt-1">Upload &amp; Pipeline Monitoring Only</p>
          </div>
        </div>
      </div>

      {/* Operator Responsibilities & SOP Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-navy-700" />
          <span>Digitization Operator Operating Procedures (SOP)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1. Scan Quality Standard</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 pl-6">
              Only upload legacy records (Jamabandi, Khasra, Naksha) scanned at minimum 300 DPI. Verify pages are right-side-up and legible.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>2. No Manual Data Entry of Land Records</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 pl-6">
              Operators are restricted to tagging only the 6 administrative indices (Document Type, State, District, Tehsil, Village, Record Year). Do not type owners or areas manually.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>3. AI Pipeline Monitoring</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 pl-6">
              Monitor documents as they progress through Preprocessing, OCR, Extraction, Validation, and Confidence Analysis. Re-trigger in case of transient pipeline exceptions.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>4. Confidentiality &amp; Audit Trail</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 pl-6">
              All document uploads are permanently cryptographically bound to your operator badge ID in the audit ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
