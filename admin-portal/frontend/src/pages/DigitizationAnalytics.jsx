import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../api/adminApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { Skeleton } from '../components/common/Skeleton';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { RefreshCw, Calendar, TrendingUp, AlertTriangle, Layers, MapPin } from 'lucide-react';

const COLORS = ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

export default function DigitizationAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAnalytics({ range: timeRange, type: 'digitization' });
      setData(response?.data || response || {});
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve digitization analytics.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Strict API checks: never invent data
  const processedOverTime = Array.isArray(data?.processedOverTime) ? data.processedOverTime : [];
  const processingStatus = Array.isArray(data?.processingStatus) ? data.processingStatus : [];
  const districtProgress = Array.isArray(data?.districtProgress || data?.districtWiseProgress)
    ? data.districtProgress || data.districtWiseProgress
    : [];
  const documentTypeDistribution = Array.isArray(data?.documentTypeDistribution || data?.typeDistribution)
    ? data.documentTypeDistribution || data.typeDistribution
    : [];
  const errorCategories = Array.isArray(data?.errorCategories || data?.errors)
    ? data.errorCategories || data.errors
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
            Digitization Analytics
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
          title="Could not load analytics data"
          message={error}
          onRetry={fetchAnalytics}
        />
      )}

      {/* Chart 1: Documents Processed Over Time */}
      <Card
        title="Documents Processed Over Time"
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : !hasData(processedOverTime) ? (
          <div className="py-8">
            <EmptyState
              type="analytics"
              title="Insufficient data for this visualization."
              message="No processed document history is recorded for this period."
            />
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Documents Processed"
                  stroke="#1e3a8a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Charts Grid: Processing Status & Document Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Processing Status */}
        <Card
          title="Processing Status Distribution"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData(processingStatus) ? (
            <div className="py-8">
              <EmptyState
                type="analytics"
                title="Insufficient data for this visualization."
                message="No processing status metrics are available in the database."
              />
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processingStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                    labelLine={false}
                  >
                    {processingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Chart 3: Document Type Distribution */}
        <Card
          title="Document Type Distribution"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData(documentTypeDistribution) ? (
            <div className="py-8">
              <EmptyState
                type="analytics"
                title="Insufficient data for this visualization."
                message="No document type classifications recorded."
              />
            </div>
          ) : (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={documentTypeDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Document Count" fill="#2b5789" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Charts Grid: District-wise Progress & Error Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 4: District-wise Progress */}
        <Card
          title="District-wise Progress"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData(districtProgress) ? (
            <div className="py-8">
              <EmptyState
                type="analytics"
                title="Insufficient data for this visualization."
                message="No district-level progress data recorded."
              />
            </div>
          ) : (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={districtProgress}
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
                  <Bar dataKey="processed" name="Processed" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Chart 5: Error Categories */}
        <Card
          title="Error Categories"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : !hasData(errorCategories) ? (
            <div className="py-8">
              <EmptyState
                type="analytics"
                title="Insufficient data for this visualization."
                message="No error category logs registered in the database."
              />
            </div>
          ) : (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorCategories} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Failure Count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
