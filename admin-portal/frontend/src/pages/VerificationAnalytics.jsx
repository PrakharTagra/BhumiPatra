import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../api/adminApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { Skeleton } from '../components/common/Skeleton';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const STATUS_COLORS = {
  VERIFIED: '#10b981',
  REJECTED: '#ef4444',
  PENDING_VERIFICATION: '#f59e0b',
  FLAGGED: '#8b5cf6',
};

const PALETTE = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b'];

export default function VerificationAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAnalytics({ range: timeRange, type: 'verification' });
      setData(response?.data || response || {});
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve verification analytics.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const verificationStatus = Array.isArray(data?.verificationStatus) ? data.verificationStatus : [];
  const rejectionReasons = Array.isArray(data?.rejectionReasons || data?.rejectionCategories)
    ? data.rejectionReasons || data.rejectionCategories
    : [];
  const districtVerification = Array.isArray(data?.districtVerification || data?.districtVerificationProgress)
    ? data.districtVerification || data.districtVerificationProgress
    : [];
  const confidenceBands = Array.isArray(data?.confidenceDistribution || data?.confidenceBands)
    ? data.confidenceDistribution || data.confidenceBands
    : [];

  const hasData = (arr) => Array.isArray(arr) && arr.length > 0 && arr.some((item) => {
    return Object.values(item).some((v) => typeof v === 'number' && v > 0);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Verification Analytics
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-600"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last 1 Year</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchAnalytics}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <ErrorAlert
          title="Could not load verification analytics"
          message={error}
          onRetry={fetchAnalytics}
        />
      )}

      {/* Grid: Verification Status & Rejection Taxonomy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Status Breakdown */}
        <Card
          title="Verification Status Distribution"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData(verificationStatus) ? (
            <div className="py-8">
              <EmptyState
                type="analytics"
                title="Insufficient data for this visualization."
                message="No verification status data found for the selected timeframe."
              />
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {verificationStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || PALETTE[index % PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Rejection Reasons Taxonomy */}
        <Card
          title="Rejection Reasons"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData(rejectionReasons) ? (
            <div className="py-8">
              <EmptyState
                type="analytics"
                title="Insufficient data for this visualization."
                message="No rejection logs recorded in the database."
              />
            </div>
          ) : (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rejectionReasons} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="reason" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Rejections" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Grid: District-wise Verification & Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Verification Progress */}
        <Card
          title="District-wise Verification Progress"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData(districtVerification) ? (
            <div className="py-8">
              <EmptyState
                type="analytics"
                title="Insufficient data for this visualization."
                message="No district-level verification records found."
              />
            </div>
          ) : (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={districtVerification}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="district" stroke="#64748b" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="verified" name="Verified" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Confidence Distribution */}
        <Card
          title="Confidence Score Distribution"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData(confidenceBands) ? (
            <div className="py-8">
              <EmptyState
                type="analytics"
                title="Insufficient data for this visualization."
                message="No confidence distribution telemetry recorded."
              />
            </div>
          ) : (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceBands} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Document Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
