import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../api/adminApi';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import {
  FileText,
  FileCheck2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Users,
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDashboard();
      // Handle response or response.data structure safely
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

  // Extract strict API fields without inventing any values
  const totalDocuments = data?.totalDocuments ?? data?.total;
  const processedDocuments = data?.processedDocuments ?? data?.processed;
  const pendingProcessing = data?.pendingProcessing ?? data?.pending;
  const pendingVerification = data?.pendingVerification ?? data?.unverified;
  const verifiedRecords = data?.verifiedRecords ?? data?.verified;
  const rejectedRecords = data?.rejectedRecords ?? data?.rejected;
  const failedDocuments = data?.failedDocuments ?? data?.failed;
  const accuracyRate = data?.accuracyRate !== undefined
    ? `${Number(data.accuracyRate).toFixed(1)}%`
    : data?.averageConfidence !== undefined
    ? `${Number(data.averageConfidence).toFixed(1)}%`
    : null;

  const recentDocuments = Array.isArray(data?.recentDocuments) ? data.recentDocuments : [];
  const recentActivities = Array.isArray(data?.recentActivities || data?.recentActivity)
    ? data.recentActivities || data.recentActivity
    : [];

  const hasZeroTotal = totalDocuments === 0 || (totalDocuments === undefined && !loading && !error);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Administrative Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time digitization tracking, verification workflows, and operational metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
          <Link to="/documents">
            <Button variant="primary" size="sm" icon={FileText}>
              Document Queue
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

      {/* Primary Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Document Pipeline Metrics
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Real API telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Documents"
            value={totalDocuments}
            subtext="All ingested land records"
            icon={FileText}
            variant="primary"
            loading={loading}
          />
          <StatCard
            title="Processed Documents"
            value={processedDocuments}
            subtext="OCR & indexing completed"
            icon={FileCheck2}
            variant="info"
            loading={loading}
          />
          <StatCard
            title="Pending Processing"
            value={pendingProcessing}
            subtext="Awaiting pipeline execution"
            icon={Clock}
            variant="warning"
            loading={loading}
          />
          <StatCard
            title="Pending Verification"
            value={pendingVerification}
            subtext="Awaiting officer sign-off"
            icon={AlertTriangle}
            variant="warning"
            loading={loading}
          />
        </div>
      </div>

      {/* Secondary Metrics: Verification & System Accuracy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Records"
          value={verifiedRecords}
          subtext="Approved by verification officers"
          icon={CheckCircle}
          variant="success"
          loading={loading}
        />
        <StatCard
          title="Rejected Records"
          value={rejectedRecords}
          subtext="Flagged for discrepancies"
          icon={XCircle}
          variant="danger"
          loading={loading}
        />
        <StatCard
          title="Failed Documents"
          value={failedDocuments}
          subtext="Extraction or OCR errors"
          icon={AlertTriangle}
          variant="danger"
          loading={loading}
        />
        <StatCard
          title="System Accuracy / Confidence"
          value={accuracyRate}
          subtext="Available model confidence metric"
          icon={Target}
          variant="default"
          formatValue={false}
          loading={loading}
        />
      </div>

      {/* Zero State Notice */}
      {!loading && !error && hasZeroTotal && (
        <EmptyState
          type="documents"
          title="Database Currently Empty"
          message="No documents or operations have been recorded in the BhumiPatra database yet. When records are uploaded and processed, live metrics will appear here."
          action={
            <div className="flex gap-2">
              <Link to="/users">
                <Button variant="secondary" size="xs" icon={Users}>
                  Manage Operators
                </Button>
              </Link>
            </div>
          }
        />
      )}

      {/* Recent Tables & Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ingested Documents */}
        <Card
          title="Recent Documents"
          subtitle="Latest records fed into the pipeline"
          actions={
            <Link to="/documents" className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0"
        >
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading records...</div>
          ) : recentDocuments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                type="documents"
                title="No recent documents"
                message="No recent document activities available in the system."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Document ID</th>
                    <th className="py-2.5 px-4 font-semibold">District</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentDocuments.map((doc, idx) => (
                    <tr key={doc._id || doc.id || idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {doc.documentNumber || doc.title || doc._id || `DOC-${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{doc.district || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge status={doc.status || doc.processingStatus || 'PENDING'} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {doc.confidence !== undefined ? `${Number(doc.confidence).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Audit / Operational Activity */}
        <Card
          title="Recent System Audit Events"
          subtitle="Operational actions logged across the portal"
          actions={
            <Link to="/audit-logs" className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0"
        >
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading audit log...</div>
          ) : recentActivities.length === 0 ? (
            <div className="p-8">
              <EmptyState
                type="audit"
                title="No recent audit logs"
                message="No administrative or operational activities logged yet."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivities.slice(0, 5).map((act, idx) => (
                <div key={act._id || act.id || idx} className="p-4 flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded bg-slate-100 text-navy-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    {act.action ? act.action.substring(0, 2).toUpperCase() : 'EV'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{act.action || 'Activity'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : '—'}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-1">{act.description || act.message || 'Action executed'}</p>
                    <div className="mt-1 text-[11px] text-slate-400">
                      User: <span className="font-medium text-slate-600">{act.user?.name || act.user?.email || act.userId || 'System'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link
          to="/analytics/digitization"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-navy-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-navy-950">Digitization Analytics</h4>
              <p className="text-xs text-slate-500 mt-0.5">Examine throughput & pipeline rates</p>
            </div>
          </div>
        </Link>

        <Link
          to="/analytics/verification"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-800 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-navy-950">Verification Analytics</h4>
              <p className="text-xs text-slate-500 mt-0.5">Review officer approval statistics</p>
            </div>
          </div>
        </Link>

        <Link
          to="/users"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center group-hover:bg-blue-800 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-navy-950">User Governance</h4>
              <p className="text-xs text-slate-500 mt-0.5">Manage operator & officer roles</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
