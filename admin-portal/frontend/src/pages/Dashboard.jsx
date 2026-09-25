import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../api/adminApi';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import {
  FileText,
  RefreshCw,
  ArrowRight,
  Activity,
  Users,
  Eye,
  ScrollText,
} from 'lucide-react';

function formatActivityAction(action) {
  if (!action) return 'Activity logged';
  const mapping = {
    DOCUMENT_UPLOAD: 'Document uploaded',
    DOCUMENT_PROCESS_TRIGGERED: 'Document processing started',
    DOCUMENT_PROCESSED: 'Document processing completed',
    DOCUMENT_PROCESSING_FAILED: 'Document processing failed',
    LAND_RECORD_CREATED: 'Land record created',
    LAND_RECORD_UPDATED: 'Land record updated',
    LAND_RECORD_VERIFIED: 'Land record verified and approved',
    LAND_RECORD_REJECTED: 'Land record rejected',
    LAND_RECORD_SENT_BACK: 'Land record returned for correction',
    USER_LOGIN: 'User logged in',
    USER_LOGOUT: 'User logged out',
    USER_CREATED: 'New user created',
    USER_UPDATED: 'User account updated',
  };
  return mapping[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDashboard();
      setData(response?.data || response || {});
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalDocuments = data?.totalDocuments ?? data?.total ?? 0;
  const processingDocuments = (data?.pendingProcessing ?? data?.pending ?? 0) + (data?.processing ?? 0);
  const pendingVerification = data?.pendingVerification ?? data?.unverified ?? 0;
  const verifiedRecords = data?.verifiedRecords ?? data?.verified ?? 0;
  const rejectedRecords = data?.rejectedRecords ?? data?.rejected ?? 0;
  const failedDocuments = data?.failedDocuments ?? data?.failed ?? 0;

  const recentDocuments = Array.isArray(data?.recentDocuments) ? data.recentDocuments : [];
  const recentActivities = Array.isArray(data?.recentActivities || data?.recentActivity)
    ? data.recentActivities || data.recentActivity
    : [];

  const hasZeroTotal = totalDocuments === 0 && !loading && !error;

  return (
    <div className="space-y-5">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            System Administration Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of cadastral digitization repository, operational queues, and administrative activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="xs"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
          <Link to="/documents">
            <Button variant="primary" size="xs" icon={FileText}>
              Document Monitoring
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <ErrorAlert
          title="Could not load dashboard metrics"
          message={error}
          onRetry={fetchDashboardData}
        />
      )}

      {/* Compact Official Document Summary Ribbon (No Giant SaaS Cards, No Fake Accuracy) */}
      <div className="bg-white border border-slate-300 rounded divide-y sm:divide-y-0 sm:divide-x divide-slate-200 grid grid-cols-2 sm:grid-cols-6 text-center text-xs">
        <div className="p-3">
          <div className="text-slate-500 font-medium">Total Documents</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
            {loading ? '—' : totalDocuments}
          </div>
          <div className="text-[10px] text-slate-400">All uploaded records</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">Processing</div>
          <div className="text-lg font-bold text-blue-900 mt-0.5 font-mono">
            {loading ? '—' : processingDocuments}
          </div>
          <div className="text-[10px] text-slate-400">In OCR / extraction</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">Pending Verification</div>
          <div className="text-lg font-bold text-amber-800 mt-0.5 font-mono">
            {loading ? '—' : pendingVerification}
          </div>
          <div className="text-[10px] text-slate-400">Awaiting officer review</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">Verified</div>
          <div className="text-lg font-bold text-emerald-800 mt-0.5 font-mono">
            {loading ? '—' : verifiedRecords}
          </div>
          <div className="text-[10px] text-slate-400">Certified & approved</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">Rejected</div>
          <div className="text-lg font-bold text-rose-800 mt-0.5 font-mono">
            {loading ? '—' : rejectedRecords}
          </div>
          <div className="text-[10px] text-slate-400">Returned or rejected</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">Failed</div>
          <div className="text-lg font-bold text-slate-700 mt-0.5 font-mono">
            {loading ? '—' : failedDocuments}
          </div>
          <div className="text-[10px] text-slate-400">Extraction failure</div>
        </div>
      </div>

      {/* Empty State Notice */}
      {!loading && !error && hasZeroTotal && (
        <EmptyState
          type="documents"
          title="Database Currently Empty"
          message="No documents or operations have been recorded in the BhumiPatra database yet."
          action={
            <Link to="/users">
              <Button variant="secondary" size="xs" icon={Users}>
                Manage Operators
              </Button>
            </Link>
          }
        />
      )}

      {/* Two Administrative Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Table 1: Recent Documents */}
        <div className="bg-white border border-slate-300 rounded">
          <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Documents
              </h2>
            </div>
            <Link
              to="/documents"
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading documents...</div>
          ) : recentDocuments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No recent documents available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Document ID</th>
                    <th className="py-2 px-3">Jurisdiction</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentDocuments.slice(0, 5).map((doc, idx) => {
                    const id = doc._id || doc.id || idx;
                    return (
                      <tr key={id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3">
                          <span className="font-mono font-medium text-slate-900 block">
                            {doc.documentId || doc.originalName || `DOC-${String(id).slice(0, 8)}`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {doc.documentType || 'Land Record'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {doc.district ? `${doc.district} • ${doc.tehsil || '—'}` : '—'}
                        </td>
                        <td className="py-2 px-3">
                          <Badge status={doc.verificationStatus || doc.processingStatus || 'PENDING'} size="xs" />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Link to="/documents">
                            <Button variant="secondary" size="xs" icon={Eye}>
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Table 2: Human-readable Recent System Activity */}
        <div className="bg-white border border-slate-300 rounded">
          <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent System Activity
              </h2>
            </div>
            <Link
              to="/audit-logs"
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
            >
              Audit Trail <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading activity trail...</div>
          ) : recentActivities.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No system activities logged yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[360px]">
              {recentActivities.slice(0, 6).map((act, idx) => {
                const id = act._id || act.id || idx;
                const readableAction = formatActivityAction(act.action);
                const userName = act.user?.name || act.user?.email || (typeof act.user === 'string' ? act.user : 'System');
                const timeStr = act.timestamp
                  ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—';

                return (
                  <div key={id} className="p-2.5 text-xs hover:bg-slate-50/50 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{readableAction}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{timeStr}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                        {act.description || act.message || `Action executed on ${act.entityType || 'record'}`}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 shrink-0 font-medium">
                      {userName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
