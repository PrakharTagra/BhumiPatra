import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import verificationApi from '../api/verificationApi';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { TableSkeleton } from '../components/common/Skeleton';
import { XCircle, Search, RefreshCw, Eye, AlertTriangle } from 'lucide-react';

export default function RejectedRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRejected = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: 'REJECTED',
        page,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();

      const response = await verificationApi.getRecords(params);
      const list = response?.records || response?.data || (Array.isArray(response) ? response : []);
      const total = response?.total || response?.totalCount || list.length;
      const pages = response?.totalPages || Math.ceil(total / pageSize) || 1;

      const rejectedList = list.filter(
        (r) => (r.verificationStatus || r.reviewStatus || '').toUpperCase() === 'REJECTED'
      );

      setRecords(rejectedList.length > 0 ? rejectedList : list);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve rejected records.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchRejected();
  }, [fetchRejected]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRejected();
  };

  const columns = [
    {
      header: 'Document ID',
      key: 'documentId',
      render: (r) => (
        <span className="font-semibold text-navy-950 font-mono">
          {r.documentNumber || r.documentId || r._id || '—'}
        </span>
      ),
    },
    {
      header: 'Owner / Claimant',
      key: 'ownerName',
      render: (r) => <span className="font-medium text-slate-900">{r.ownerName || '—'}</span>,
    },
    {
      header: 'District / Tehsil',
      key: 'location',
      render: (r) => (
        <div className="text-xs">
          <span className="text-slate-800">{r.district || '—'}</span>
          {r.tehsil && <span className="text-slate-500 block text-[11px]">{r.tehsil}</span>}
        </div>
      ),
    },
    {
      header: 'Discrepancy / Reason for Rejection',
      key: 'rejectionReason',
      render: (r) => (
        <div className="flex items-start gap-1.5 max-w-sm text-xs text-rose-800">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{r.rejectionReason || r.reason || 'Flagged for discrepancy'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => <Badge status="REJECTED" size="sm" />,
    },
    {
      header: 'Rejection Date',
      key: 'rejectedAt',
      render: (r) => (
        <span className="text-xs text-slate-500 font-mono">
          {r.rejectedAt || r.updatedAt ? new Date(r.rejectedAt || r.updatedAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Action',
      key: 'action',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (r) => {
        const id = r._id || r.id;
        return (
          <Link to={`/verify/${id}`}>
            <Button variant="secondary" size="xs" icon={Eye}>
              Review
            </Button>
          </Link>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Rejected Records
          </h1>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchRejected}>
          Refresh
        </Button>
      </div>

      {error && <ErrorAlert title="Error Loading Rejected Records" message={error} onRetry={fetchRejected} />}

      <Card bodyClassName="p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by Document Number, Owner, or Rejection Reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>
      </Card>

      <Card bodyClassName="p-0">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : records.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="rejected"
              title="No rejected records found"
              message={search ? 'No records match your search.' : 'There are no rejected records in the database.'}
            />
          </div>
        ) : (
          <>
            <Table columns={columns} data={records} keyExtractor={(r, i) => r._id || r.id || i} />
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
