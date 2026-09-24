import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../api/adminApi';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { Skeleton } from '../components/common/Skeleton';
import {
  Activity,
  Server,
  Cpu,
  Database,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Layers,
  Terminal,
} from 'lucide-react';

export default function SystemActivity() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSystemActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getSystemActivity();
      setData(response?.data || response || {});
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch system activity stream.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemActivity();
  }, [fetchSystemActivity]);

  const activities = Array.isArray(data?.activities || data?.events || data?.logs)
    ? data.activities || data.events || data.logs
    : [];

  const services = Array.isArray(data?.services || data?.health?.services)
    ? data.services || data.health?.services
    : [];

  const queueMetrics = data?.queues || data?.pipelineMetrics || null;
  const uptime = data?.uptime || data?.systemUptime || null;
  const dbStatus = data?.databaseStatus || data?.db?.status || (data ? 'ONLINE' : null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            System Activity
          </h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchSystemActivity}
        >
          Check System Status
        </Button>
      </div>

      {error && (
        <ErrorAlert
          title="Could not load system telemetry"
          message={error}
          onRetry={fetchSystemActivity}
        />
      )}

      {/* System Service Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Database Connection"
          value={dbStatus || (loading ? '—' : 'CONNECTED')}
          subtext="Database status"
          icon={Database}
          variant="success"
          loading={loading}
        />
        <StatCard
          title="Active Processing Workers"
          value={data?.activeWorkers ?? (queueMetrics?.workers !== undefined ? queueMetrics.workers : '—')}
          subtext="Worker nodes"
          icon={Cpu}
          variant="primary"
          loading={loading}
        />
        <StatCard
          title="Queue Backlog"
          value={queueMetrics?.pending ?? data?.queueBacklog ?? '—'}
          subtext="Awaiting execution"
          icon={Layers}
          variant="warning"
          loading={loading}
        />
        <StatCard
          title="System Uptime"
          value={uptime || '—'}
          subtext="Uptime"
          icon={Clock}
          variant="default"
          formatValue={false}
          loading={loading}
        />
      </div>

      {/* Microservice Health Indicators (if reported by backend) */}
      {services.length > 0 && (
        <Card title="Registered Service Endpoints" subtitle="Live health ping from API server">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {services.map((srv, idx) => (
              <div
                key={srv.name || idx}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-navy-700" />
                  <span className="text-xs font-semibold text-slate-800">{srv.name || `Service ${idx + 1}`}</span>
                </div>
                <Badge
                  status={srv.status || 'ONLINE'}
                  size="sm"
                  variant={srv.status === 'DEGRADED' ? 'warning' : 'success'}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Real-time System Event Log Stream */}
      <Card
        title="System Events"
        actions={
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live</span>
          </div>
        }
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Retrieving system activity stream...</div>
        ) : activities.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="system"
              title="No system activity events recorded"
              message="The backend has not registered any recent automated pipeline alerts or background task events."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((item, idx) => {
              const level = (item.level || item.type || 'INFO').toUpperCase();
              let badgeVariant = 'neutral';
              if (level === 'ERROR' || level === 'FATAL') badgeVariant = 'danger';
              else if (level === 'WARN' || level === 'WARNING') badgeVariant = 'warning';
              else if (level === 'SUCCESS') badgeVariant = 'success';
              else badgeVariant = 'info';

              return (
                <div key={item._id || item.id || idx} className="p-4 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Terminal className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">
                          {item.service || item.module || 'System'}
                        </span>
                        <Badge variant={badgeVariant} size="sm">
                          {level}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-mono leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 break-all">
                      {item.message || item.description || JSON.stringify(item)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
