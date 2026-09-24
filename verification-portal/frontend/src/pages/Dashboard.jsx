import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import verificationApi from '../api/verificationApi';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Eye,
  FileText,
  Clock,
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await verificationApi.getDashboardMetrics();
      setData(response?.data || response || {});
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch verification metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real API numbers only - never invent values
  const pendingCount = data?.pendingVerification ?? data?.pendingCount ?? data?.pending;
  const highConfidenceCount = data?.highConfidenceRecords ?? data?.highConfidenceCount ?? data?.highConfidence;
  const lowConfidenceCount = data?.lowConfidenceRecords ?? data?.lowConfidenceCount ?? data?.lowConfidence;
  const approvedCount = data?.approvedRecords ?? data?.approvedCount ?? data?.approved;
  const rejectedCount = data?.rejectedRecords ?? data?.rejectedCount ?? data?.rejected;

  const recentRecords = Array.isArray(data?.recentlyReviewed || data?.recentRecords)
    ? data.recentlyReviewed || data.recentRecords
    : [];

  const isEmpty =
    (pendingCount === 0 || pendingCount === undefined) &&
    (approvedCount === 0 || approvedCount === undefined) &&
    recentRecords.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Dashboard
          </h1>
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
          <Link to="/queue">
            <Button variant="primary" size="sm" icon={Inbox}>
              Open Verification Queue
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

      {/* Main Metric Cards Grid */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Pending Verification"
            value={pendingCount}
            subtext="Awaiting officer decision"
            icon={Inbox}
            variant="navy"
            loading={loading}
          />
          <StatCard
            title="High-Confidence"
            value={highConfidenceCount}
            subtext="Confidence ≥ 80%"
            icon={Sparkles}
            variant="success"
            loading={loading}
          />
          <StatCard
            title="Low-Confidence"
            value={lowConfidenceCount}
            subtext="Confidence < 80%"
            icon={AlertTriangle}
            variant="warning"
            loading={loading}
          />
          <StatCard
            title="Approved Records"
            value={approvedCount}
            subtext="Validated & signed off"
            icon={CheckCircle2}
            variant="success"
            loading={loading}
          />
          <StatCard
            title="Rejected Records"
            value={rejectedCount}
            subtext="Flagged for discrepancy"
            icon={XCircle}
            variant="danger"
            loading={loading}
          />
        </div>
      </div>

      {/* Zero State if no data recorded in database */}
      {!loading && !error && isEmpty && (
        <EmptyState
          type="queue"
          title="Verification Desk Empty"
          message="There are currently no land records assigned or queued for verification in the database."
          action={
            <Link to="/queue">
              <Button variant="secondary" size="xs" icon={Inbox}>
                Check Queue
              </Button>
            </Link>
          }
        />
      )}

      {/* Recently Reviewed Records Table */}
      <Card
        title="Recently Reviewed Records"
        subtitle=""
        actions={
          <Link
            to="/history"
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
          >
            Full History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading recently reviewed records...</div>
        ) : recentRecords.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="records"
              title="No recently reviewed records"
              message="You have not reviewed any land records in this session yet."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Document / Parcel ID</th>
                  <th className="py-2.5 px-4 font-semibold">Owner / Claimant</th>
                  <th className="py-2.5 px-4 font-semibold">District / Tehsil</th>
                  <th className="py-2.5 px-4 font-semibold">Confidence</th>
                  <th className="py-2.5 px-4 font-semibold">Review Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentRecords.map((rec, idx) => {
                  const id = rec._id || rec.id || idx;
                  const conf = rec.confidence ?? rec.confidenceScore;
                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-navy-950">
                        {rec.documentNumber || rec.title || id}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {rec.ownerName || rec.owner || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {rec.district ? `${rec.district}${rec.tehsil ? `, ${rec.tehsil}` : ''}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {conf !== undefined ? `${Number(conf).toFixed(0)}%` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={rec.reviewStatus || rec.verificationStatus || 'VERIFIED'} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
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
      </Card>
    </div>
  );
}
