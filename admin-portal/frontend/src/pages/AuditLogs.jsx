import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../api/adminApi';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { TableSkeleton } from '../components/common/Skeleton';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Shield,
  Layers,
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (entityFilter) params.entity = entityFilter;
      if (actionFilter) params.action = actionFilter;

      const response = await adminApi.getAuditLogs(params);
      const logList = response?.logs || response?.data || (Array.isArray(response) ? response : []);
      const total = response?.total || response?.totalCount || logList.length;
      const pages = response?.totalPages || Math.ceil(total / pageSize) || 1;

      setLogs(logList);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve audit log records.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, entityFilter, actionFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setEntityFilter('');
    setActionFilter('');
    setPage(1);
  };

  const columns = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      className: 'w-44',
      render: (log) => {
        const date = log.timestamp || log.createdAt;
        if (!date) return <span className="text-slate-400">—</span>;
        const d = new Date(date);
        return (
          <div className="font-mono text-xs text-slate-700">
            <div>{d.toLocaleDateString()}</div>
            <div className="text-[11px] text-slate-400">{d.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      header: 'User / Actor',
      key: 'user',
      className: 'w-48',
      render: (log) => {
        const u = log.user || log.userId;
        const name = typeof u === 'object' ? u.name || u.email : u;
        const role = typeof u === 'object' ? u.role : null;
        return (
          <div>
            <span className="font-semibold text-slate-800 text-xs block truncate">
              {name || 'System / Automated'}
            </span>
            {role && <span className="text-[10px] text-slate-500 font-mono">{role}</span>}
          </div>
        );
      },
    },
    {
      header: 'Action',
      key: 'action',
      className: 'w-36',
      render: (log) => (
        <Badge
          variant="navy"
          size="sm"
          className="font-mono uppercase text-[10px]"
        >
          {log.action || 'OPERATION'}
        </Badge>
      ),
    },
    {
      header: 'Entity',
      key: 'entity',
      className: 'w-32',
      render: (log) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-medium border border-slate-200">
          {log.entity || log.target || 'GENERAL'}
        </span>
      ),
    },
    {
      header: 'Description',
      key: 'description',
      render: (log) => (
        <div className="text-xs text-slate-700 leading-relaxed">
          <p>{log.description || log.details || log.message || '—'}</p>
          {log.ipAddress && (
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              IP: {log.ipAddress}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Audit Logs
          </h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchAuditLogs}
        >
          Refresh Logs
        </Button>
      </div>

      {error && (
        <ErrorAlert
          title="Error Loading Audit Trail"
          message={error}
          onRetry={fetchAuditLogs}
        />
      )}

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search description, IP, or user identifier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>

            {/* Entity Filter */}
            <div>
              <Select
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="All Entities"
                options={[
                  { value: 'DOCUMENT', label: 'Document' },
                  { value: 'USER', label: 'User' },
                  { value: 'AUTH', label: 'Authentication' },
                  { value: 'SYSTEM', label: 'System' },
                  { value: 'VERIFICATION', label: 'Verification' },
                ]}
              />
            </div>

            {/* Action Filter */}
            <div>
              <Select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="All Actions"
                options={[
                  { value: 'LOGIN', label: 'Login' },
                  { value: 'LOGOUT', label: 'Logout' },
                  { value: 'CREATE', label: 'Create' },
                  { value: 'UPDATE', label: 'Update' },
                  { value: 'STATUS_CHANGE', label: 'Status Change' },
                  { value: 'VERIFY', label: 'Verify' },
                  { value: 'REJECT', label: 'Reject' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500 font-medium">
              Recorded audit events: <strong className="text-slate-800">{totalCount}</strong>
            </span>
            <div className="flex items-center gap-2">
              {(search || entityFilter || actionFilter) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Clear Filters
                </button>
              )}
              <Button type="submit" size="xs" variant="primary">
                Apply Filters
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Logs Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="audit"
              title="No audit logs recorded"
              message={
                search || entityFilter || actionFilter
                  ? 'No audit log entries matched the applied filters.'
                  : 'No audit records currently exist in the database.'
              }
              action={
                (search || entityFilter || actionFilter) && (
                  <Button variant="secondary" size="xs" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={logs}
              keyExtractor={(log, i) => log._id || log.id || i}
            />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </Card>
    </div>
  );
}
