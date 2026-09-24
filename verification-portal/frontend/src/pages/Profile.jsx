import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authApi from '../api/authApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  User,
  Shield,
  Mail,
  Building2,
  MapPin,
  Calendar,
  KeyRound,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Award,
} from 'lucide-react';

export default function Profile() {
  const { user, token, logout, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(user);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await authApi.getMe();
      const freshUser = response?.user || response;
      setProfileData(freshUser);
      updateProfile(freshUser);
      showSuccess('Officer profile synced with server.');
    } catch (err) {
      showError(err.customMessage || 'Failed to sync latest profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData(user);
    }
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Profile
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchProfile}>
            Sync Profile
          </Button>
          <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>

      <Card bodyClassName="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-navy-950 text-white flex items-center justify-center font-bold text-2xl shadow-md border border-navy-800">
            {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-navy-950 truncate">
                {profileData?.name || 'Verification Officer'}
              </h2>
              <Badge variant="navy" size="md">
                VERIFICATION_OFFICER
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{profileData?.email || 'officer@bhumipatra.in'}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Building2 className="w-4 h-4 text-navy-700" />
              <span className="text-[10px] uppercase font-semibold">Department</span>
            </div>
            <span className="text-xs font-semibold text-slate-900">
              {profileData?.department || 'Revenue Department'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <MapPin className="w-4 h-4 text-navy-700" />
              <span className="text-[10px] uppercase font-semibold">Jurisdiction</span>
            </div>
            <span className="text-xs font-semibold text-slate-900">
              {profileData?.district
                ? `${profileData.district}${profileData.tehsil ? ` / ${profileData.tehsil}` : ''}`
                : 'District Office'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Calendar className="w-4 h-4 text-navy-700" />
              <span className="text-[10px] uppercase font-semibold">Start Date</span>
            </div>
            <span className="text-xs font-semibold text-slate-900">
              {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
