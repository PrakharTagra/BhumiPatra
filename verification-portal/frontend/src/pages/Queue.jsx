import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import verificationApi from '../api/verificationApi';
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
  Search,
  Filter,
  RefreshCw,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function Queue() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [validationFilter, setValidationFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (district.trim()) params.district = district.trim();
      if (tehsil.trim()) params.tehsil = tehsil.trim();
      if (confidenceFilter) params.confidence = confidenceFilter;
      if (validationFilter) params.validationStatus = validationFilter;
      if (reviewFilter) params.reviewStatus = reviewFilter;
      if (sortBy) params.sort = sortBy;

      const response = await verificationApi.getPendingRecords(params);
      const list = response?.records || response?.data || (Array.isArray(response) ? response : []);
      const total = response?.total || response?.totalCount || list.length;
      const pages = response?.totalPages || Math.ceil(total / pageSize) || 1;

      // In-memory filter/sort if backend returns unfiltered array
      let filtered = [...list];
      if (confidenceFilter === 'high') {
        filtered = filtered.filter((r) => (r.confidence ?? r.confidenceScore ?? 0) >= 80);
      } else if (confidenceFilter === 'low') {
        filtered = filtered.filter((r) => (r.confidence ?? r.confidenceScore ?? 0) < 80);
      }

      setRecords(filtered);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve verification queue from backend.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, district, tehsil, confidenceFilter, validationFilter, reviewFilter, sortBy]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDistrict('');
    setTehsil('');
    setConfidenceFilter('');
    setValidationFilter('');
    setReviewFilter('');
    setSortBy('date_desc');
    setPage(1);
  };

  // Required columns: Document ID, Document type, District, Tehsil, Village, Confidence, Validation status, Date, Review status
  const columns = [
    {
      header: 'Document ID',
      key: 'documentId',
      render: (r) => (
        <div>
          <span className="font-semibold text-navy-950 font-mono">
            {r.documentNumber || r.documentId || r._id || r.id || '—'}
          </span>
          {r.ownerName && (
            <span className="block text-[11px] text-slate-500 truncate max-w-[140px]">
              {r.ownerName}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Document Type',
      key: 'documentType',
      render: (r) => (
        <span className="text-xs text-slate-700 font-medium">
          {r.documentType || r.type || 'Land Record'}
        </span>
      ),
    },
    {
      header: 'District',
      key: 'district',
      render: (r) => <span className="text-xs text-slate-800">{r.district || '—'}</span>,
    },
    {
      header: 'Tehsil',
      key: 'tehsil',
      render: (r) => <span className="text-xs text-slate-700">{r.tehsil || '—'}</span>,
    },
    {
      header: 'Village',
      key: 'village',
      render: (r) => <span className="text-xs text-slate-700">{r.village || '—'}</span>,
    },
    {
      header: 'Confidence',
      key: 'confidence',
      render: (r) => {
        const conf = r.confidence ?? r.confidenceScore;
        if (conf === undefined || conf === null) return <span className="text-slate-400">—</span>;
        const num = Number(conf);
        const isLow = num < 75;
        return (
          <span
            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full border ${
              num >= 85
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : num >= 70
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
            }`}
          >
            {num.toFixed(0)}%
          </span>
        );
      },
    },
    {
      header: 'Validation Status',
      key: 'validationStatus',
      render: (r) => (
        <Badge status={r.validationStatus || (r.isDuplicate ? 'FAILED' : 'PASS')} size="sm" />
      ),
    },
    {
      header: 'Date',
      key: 'createdAt',
      render: (r) => (
        <span className="text-xs text-slate-500 font-mono">
          {r.createdAt || r.date ? new Date(r.createdAt || r.date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Review Status',
      key: 'reviewStatus',
      render: (r) => (
        <Badge status={r.reviewStatus || r.verificationStatus || 'PENDING'} size="sm" />
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
            <Button
              variant="primary"
              size="xs"
              icon={FileCheck}
              className="bg-navy-950 hover:bg-navy-900"
            >
              Verify
            </Button>
          </Link>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Land Record Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Examine scanned land instruments, validate extracted titles, and record official dispositions.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchQueue}
        >
          Refresh Queue
        </Button>
      </div>

      {error && (
        <ErrorAlert
          title="Error Loading Verification Queue"
          message={error}
          onRetry={fetchQueue}
        />
      )}

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search Document ID, owner, khasra..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>

            {/* District */}
            <div>
              <Input
                placeholder="Filter District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                icon={MapPin}
              />
            </div>

            {/* Confidence Filter */}
            <div>
              <Select
                value={confidenceFilter}
                onChange={(e) => {
                  setConfidenceFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="All Confidence Levels"
                options={[
                  { value: 'high', label: 'High (≥ 80%)' },
                  { value: 'low', label: 'Low (< 80%)' },
                ]}
              />
            </div>

            {/* Validation Status */}
            <div>
              <Select
                value={validationFilter}
                onChange={(e) => {
                  setValidationFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="All Validations"
                options={[
                  { value: 'PASS', label: 'Validation: PASS' },
                  { value: 'WARNING', label: 'Validation: WARNING' },
                  { value: 'FAILED', label: 'Validation: FAILED' },
                ]}
              />
            </div>

            {/* Sorting */}
            <div>
              <Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: 'date_desc', label: 'Newest Date' },
                  { value: 'date_asc', label: 'Oldest Date' },
                  { value: 'conf_asc', label: 'Lowest Confidence First' },
                  { value: 'conf_desc', label: 'Highest Confidence First' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500 font-medium">
              Queue backlog: <strong className="text-slate-800">{totalCount}</strong> pending records
            </span>
            <div className="flex items-center gap-2">
              {(search || district || tehsil || confidenceFilter || validationFilter || reviewFilter || sortBy !== 'date_desc') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Clear Filters
                </button>
              )}
              <Button type="submit" size="xs" variant="primary">
                Apply Criteria
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Queue Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <TableSkeleton rows={8} cols={10} />
        ) : records.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="queue"
              title="No records pending verification"
              message={
                search || district || confidenceFilter || validationFilter
                  ? 'No records match the applied search and filter criteria.'
                  : 'All land records currently in the database have been reviewed and verified.'
              }
              action={
                (search || district || confidenceFilter || validationFilter) && (
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
              data={records}
              keyExtractor={(r, i) => r._id || r.id || i}
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
