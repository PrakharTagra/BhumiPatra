import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import documentsApi from '../api/documents';
import Breadcrumbs from '../components/common/Breadcrumbs';
import StatusBadge from '../components/common/StatusBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import EmptyState from '../components/common/EmptyState';
import AlertBanner from '../components/common/AlertBanner';
import TableSkeleton from '../components/common/TableSkeleton';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { formatDate, truncate } from '../utils/formatters';
import { DOCUMENT_TYPES, PROCESSING_STATUSES } from '../utils/constants';
import {
  FileSpreadsheet,
  Search,
  Filter,
  RotateCcw,
  RefreshCw,
  UploadCloud,
  Eye,
  Cpu,
  FileText
} from 'lucide-react';

export const DocumentsHistoryPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { documentType: typeFilter } : {}),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const data = await documentsApi.getDocuments(params);

      // Support array response or paginated wrapper { documents: [], total: N, totalPages: N }
      if (Array.isArray(data)) {
        setDocuments(data);
        setTotalCount(data.length);
        setTotalPages(Math.max(1, Math.ceil(data.length / limit)));
      } else {
        const docList = data?.documents || data?.data?.documents || data?.items || [];
        setDocuments(docList);
        const total = data?.total ?? data?.totalCount ?? docList.length;
        setTotalCount(total);
        setTotalPages(data?.totalPages ?? Math.max(1, Math.ceil(total / limit)));
      }
    } catch (err) {
      console.warn('Error fetching document list:', err);
      setError(err.message || 'Unable to load documents from backend service.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(debouncedSearch || statusFilter || typeFilter);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PROCESSING', label: 'Processing (Active Pipeline)' },
    { value: 'COMPLETED', label: 'Processed / Completed' },
    { value: 'NEEDS_VERIFICATION', label: 'Needs Verification' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'PENDING', label: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Documents & History' }]} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Land Records Digitization History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Query, inspect, and monitor scanned land records across all jurisdictions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDocuments}
            icon={RefreshCw}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Link to="/upload">
            <Button variant="primary" size="sm" icon={UploadCloud}>
              Upload Record
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Documents Query Failed"
          message={error}
          onRetry={fetchDocuments}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2">
            <Input
              placeholder="Search by Document ID, Filename, Village, District..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              options={statusOptions}
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Document Type Filter */}
          <div>
            <Select
              options={[{ value: '', label: 'All Document Types' }, ...DOCUMENT_TYPES]}
              placeholder="Filter by Doc Type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Active filters applied. Showing matching records.
            </span>
            <Button
              variant="ghost"
              size="xs"
              icon={RotateCcw}
              onClick={handleClearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Documents Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : documents.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              type="search"
              title="No Matching Land Records"
              description="No documents matched the specified filters or search term. Try adjusting or clearing your search criteria."
              actionText="Clear Filters"
              actionIcon={RotateCcw}
              onAction={handleClearFilters}
              className="border-0 rounded-none py-16"
            />
          ) : (
            <EmptyState
              type="documents"
              title="No Ingested Documents Yet"
              description="No land records have been submitted into the BhumiPatra repository. Upload a scanned legacy document to begin."
              actionText="Upload Document"
              actionIcon={UploadCloud}
              onAction={() => window.location.href = '/upload'}
              className="border-0 rounded-none py-16"
            />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Doc ID</th>
                    <th scope="col" className="px-4 py-3">Filename</th>
                    <th scope="col" className="px-4 py-3">Document Type</th>
                    <th scope="col" className="px-4 py-3">District</th>
                    <th scope="col" className="px-4 py-3">Tehsil</th>
                    <th scope="col" className="px-4 py-3">Village</th>
                    <th scope="col" className="px-4 py-3">Upload Date</th>
                    <th scope="col" className="px-4 py-3">Processing Status</th>
                    <th scope="col" className="px-4 py-3">Verification</th>
                    <th scope="col" className="px-4 py-3">Confidence</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {documents.map((doc) => {
                    const id = doc._id || doc.id || doc.documentId;
                    const filename = doc.originalName || doc.filename || doc.fileName || 'Untitled';
                    const docType = doc.documentType || doc.type || 'Land Record';
                    const district = doc.district || '—';
                    const tehsil = doc.tehsil || '—';
                    const village = doc.village || '—';
                    const uploadDate = doc.createdAt || doc.uploadDate || doc.uploadedAt;
                    const status = doc.status || doc.processingStatus || 'PENDING';
                    const verificationStatus = doc.verificationStatus || 'PENDING';
                    const confidence = doc.confidenceScore ?? doc.confidence;

                    return (
                      <tr key={id || Math.random()} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Document ID */}
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                          <Link
                            to={`/documents/${id}`}
                            className="text-navy-700 hover:text-navy-950 hover:underline"
                            title={`Inspect Document ${id}`}
                          >
                            {truncate(id, 10)}
                          </Link>
                        </td>

                        {/* 2. Filename */}
                        <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate" title={filename}>
                          {filename}
                        </td>

                        {/* 3. Document Type */}
                        <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate" title={docType}>
                          {docType}
                        </td>

                        {/* 4. District */}
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {district}
                        </td>

                        {/* 5. Tehsil */}
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {tehsil}
                        </td>

                        {/* 6. Village */}
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {village}
                        </td>

                        {/* 7. Upload Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {formatDate(uploadDate)}
                        </td>

                        {/* 8. Processing Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>

                        {/* 9. Verification Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={verificationStatus} type="verification" />
                        </td>

                        {/* 10. Confidence */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ConfidenceBadge confidence={confidence} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/documents/${id}/processing`}
                              className="p-1.5 text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded"
                              title="Monitor Processing Pipeline"
                            >
                              <Cpu className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/documents/${id}`}
                              className="p-1.5 text-navy-800 hover:text-navy-950 hover:bg-navy-50 rounded"
                              title="View Document Details"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              limit={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentsHistoryPage;
