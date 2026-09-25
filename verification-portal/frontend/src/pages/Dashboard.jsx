import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import verificationApi from '../api/verificationApi';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import {
  Inbox,
  RefreshCw,
  ArrowRight,
  Eye,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, pendingRes] = await Promise.all([
        verificationApi.getDashboardMetrics(),
        verificationApi.getPendingRecords({ limit: 5 }).catch(() => ({ records: [] })),
      ]);

      setData(metricsRes?.data || metricsRes || {});
      const pList = pendingRes?.records || pendingRes?.data || (Array.isArray(pendingRes) ? pendingRes : []);
      setPendingQueue(pList);
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch verification metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const pendingCount = data?.pendingVerification ?? data?.pendingCount ?? data?.pending ?? 0;
  const highConfidenceCount = data?.highConfidenceRecords ?? data?.highConfidenceCount ?? data?.highConfidence ?? 0;
  const lowConfidenceCount = data?.lowConfidenceRecords ?? data?.lowConfidenceCount ?? data?.lowConfidence ?? 0;
  const approvedCount = data?.approvedRecords ?? data?.approvedCount ?? data?.approved ?? 0;
  const rejectedCount = data?.rejectedRecords ?? data?.rejectedCount ?? data?.rejected ?? 0;

  const recentRecords = Array.isArray(data?.recentlyReviewed || data?.recentRecords)
    ? data.recentlyReviewed || data.recentRecords
    : [];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Verification Desk Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Land title cadastre verification and revenue record approval queue
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
          <Link to="/queue">
            <Button variant="primary" size="xs" icon={Inbox}>
              Open Verification Queue ({pendingCount})
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <ErrorAlert
          title="Could not load verification metrics"
          message={error}
          onRetry={fetchDashboardData}
        />
      )}

      {/* Operational Summary Row (Administrative, Dense, No Giant SaaS Cards) */}
      <div className="bg-white border border-slate-300 rounded divide-y sm:divide-y-0 sm:divide-x divide-slate-200 grid grid-cols-2 sm:grid-cols-5 text-center text-xs">
        <div className="p-3">
          <div className="text-slate-500 font-medium">Pending Queue</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
            {loading ? '—' : pendingCount}
          </div>
          <div className="text-[10px] text-slate-400">Awaiting verification</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">High Match</div>
          <div className="text-lg font-bold text-emerald-800 mt-0.5 font-mono">
            {loading ? '—' : highConfidenceCount}
          </div>
          <div className="text-[10px] text-slate-400">Score &ge; 80%</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">Review Flags</div>
          <div className="text-lg font-bold text-amber-800 mt-0.5 font-mono">
            {loading ? '—' : lowConfidenceCount}
          </div>
          <div className="text-[10px] text-slate-400">Field discrepancies</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">Approved</div>
          <div className="text-lg font-bold text-blue-900 mt-0.5 font-mono">
            {loading ? '—' : approvedCount}
          </div>
          <div className="text-[10px] text-slate-400">Signed & certified</div>
        </div>
        <div className="p-3">
          <div className="text-slate-500 font-medium">Rejected</div>
          <div className="text-lg font-bold text-rose-800 mt-0.5 font-mono">
            {loading ? '—' : rejectedCount}
          </div>
          <div className="text-[10px] text-slate-400">Returned or rejected</div>
        </div>
      </div>

      {/* Table 1: Pending Verification Queue */}
      <div className="bg-white border border-slate-300 rounded">
        <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Pending Verification Queue
            </h2>
          </div>
          <Link
            to="/queue"
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
          >
            View All ({pendingCount}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500">Loading pending verification queue...</div>
        ) : pendingQueue.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No records currently pending verification in queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">Record / Document ID</th>
                  <th className="py-2 px-3">Primary Owner</th>
                  <th className="py-2 px-3">Khasra / Plot</th>
                  <th className="py-2 px-3">Revenue Jurisdiction</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pendingQueue.slice(0, 5).map((rec) => {
                  const id = rec._id || rec.id;
                  return (
                    <tr key={id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 font-mono font-medium text-slate-900">
                        {rec.documentNumber || `REC-${String(id).slice(0, 8)}`}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {rec.ownerName || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-mono">
                        {rec.khasraNumber || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {rec.district ? `${rec.district} • ${rec.tehsil || '—'}` : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge status={rec.reviewStatus || rec.verificationStatus || 'PENDING'} size="xs" />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Link to={`/verify/${id}`}>
                          <Button variant="primary" size="xs">
                            Verify Record
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

      {/* Table 2: Recently Reviewed Records */}
      <div className="bg-white border border-slate-300 rounded">
        <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recently Reviewed Records
            </h2>
          </div>
          <Link
            to="/history"
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
          >
            Verification History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500">Loading reviewed records...</div>
        ) : recentRecords.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No recently verified records in this session yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">Record / Document ID</th>
                  <th className="py-2 px-3">Primary Owner</th>
                  <th className="py-2 px-3">Revenue Jurisdiction</th>
                  <th className="py-2 px-3">Review Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentRecords.slice(0, 5).map((rec, idx) => {
                  const id = rec._id || rec.id || idx;
                  return (
                    <tr key={id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 font-mono font-medium text-slate-900">
                        {rec.documentNumber || `REC-${String(id).slice(0, 8)}`}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {rec.ownerName || rec.owner || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {rec.district ? `${rec.district}${rec.tehsil ? ` • ${rec.tehsil}` : ''}` : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge status={rec.reviewStatus || rec.verificationStatus || 'VERIFIED'} size="xs" />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Link to={`/verify/${id}`}>
                          <Button variant="secondary" size="xs" icon={Eye}>
                            Inspect
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
    </div>
  );
}
