import React, { useState, useEffect, useCallback } from 'react';
import verificationApi from '../api/verificationApi';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { TableSkeleton } from '../components/common/Skeleton';
import { History, Search, RefreshCw, ShieldCheck } from 'lucide-react';

export default function VerificationHistory() {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchGlobalHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Query history from backend
      const response = await verificationApi.getRecords({ type: 'history', page, limit: pageSize, search: search.trim() });
      const list = response?.history || response?.records || response?.data || (Array.isArray(response) ? response : []);
      const total = response?.total || response?.totalCount || list.length;
      const pages = response?.totalPages || Math.ceil(total / pageSize) || 1;

      setHistoryLogs(list);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch verification audit history.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchGlobalHistory();
  }, [fetchGlobalHistory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGlobalHistory();
  };

  const columns = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      className: 'w-44',
      render: (item) => {
        const date = item.timestamp || item.createdAt;
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
      header: 'Document / Record ID',
      key: 'documentId',
      render: (item) => (
        <span className="font-mono font-semibold text-navy-950 text-xs">
          {item.documentNumber || item.documentId || item.recordId || '—'}
        </span>
      ),
    },
    {
      header: 'Field Modified',
      key: 'field',
      render: (item) => (
        <span className="font-semibold text-slate-800 text-xs">
          {item.field || item.fieldName || 'Land Attribute'}
        </span>
      ),
    },
    {
      header: 'Previous Value',
      key: 'previousValue',
      render: (item) => (
        <span className="text-slate-500 line-through text-xs font-mono">
          {item.previousValue !== undefined ? String(item.previousValue) : '—'}
        </span>
      ),
    },
    {
      header: 'New Value',
      key: 'newValue',
      render: (item) => (
        <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs font-mono">
          {item.newValue !== undefined ? String(item.newValue) : '—'}
        </span>
      ),
    },
    {
      header: 'Officer',
      key: 'officer',
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">
          {item.officer?.name || item.officerName || item.officerId || 'Verification Officer'}
        </span>
      ),
    },
    {
      header: 'Reason / Justification',
      key: 'reason',
      render: (item) => (
        <span className="text-xs text-slate-600 max-w-xs block truncate" title={item.reason}>
          {item.reason || item.remarks || 'Officer correction'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Verification History
          </h1>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchGlobalHistory}>
          Refresh History
        </Button>
      </div>

      {error && <ErrorAlert title="Error Loading Audit Trail" message={error} onRetry={fetchGlobalHistory} />}

      <Card bodyClassName="p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by Document Number, Field, Officer, or Reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Filter History
          </Button>
        </form>
      </Card>

      <Card bodyClassName="p-0">
        {loading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : historyLogs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="history"
              title="No verification history logs found"
              message={search ? 'No history logs matched your search.' : 'No audit records have been generated yet.'}
            />
          </div>
        ) : (
          <>
            <Table columns={columns} data={historyLogs} keyExtractor={(item, i) => item._id || item.id || i} />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </Card>
    </div>
  );
}
