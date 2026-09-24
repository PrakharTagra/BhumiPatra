import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../api/adminApi';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { TableSkeleton } from '../components/common/Skeleton';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Layers,
  Calendar,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspection Modal State (Strictly Read-Only for Administrator)
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (processingStatus) params.processingStatus = processingStatus;
      if (verificationStatus) params.verificationStatus = verificationStatus;
      if (district) params.district = district;

      const response = await adminApi.getDocuments(params);

      // Support direct array or paginated response format
      const docs = response?.documents || response?.data || (Array.isArray(response) ? response : []);
      const total = response?.total || response?.totalCount || docs.length;
      const pages = response?.totalPages || Math.ceil(total / pageSize) || 1;

      setDocuments(docs);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve documents from the server.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, processingStatus, verificationStatus, district]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleResetFilters = () => {
    setSearch('');
    setProcessingStatus('');
    setVerificationStatus('');
    setDistrict('');
    setPage(1);
  };

  const handleViewDocument = (doc) => {
    setSelectedDoc(doc);
    setModalOpen(true);
  };

  const columns = [
    {
      header: 'Document ID / Number',
      key: 'documentNumber',
      render: (doc) => (
        <div>
          <span className="font-semibold text-navy-950 font-mono">
            {doc.documentNumber || doc.title || doc._id || '—'}
          </span>
          {doc.khasraNumber && (
            <span className="block text-[11px] text-slate-500">
              Khasra: {doc.khasraNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'District / Tehsil',
      key: 'location',
      render: (doc) => (
        <div className="text-xs">
          <span className="text-slate-900 font-medium">{doc.district || '—'}</span>
          {doc.tehsil && <span className="text-slate-500 block text-[11px]">{doc.tehsil}</span>}
        </div>
      ),
    },
    {
      header: 'Document Type',
      key: 'documentType',
      render: (doc) => (
        <span className="text-xs text-slate-700 font-medium">
          {doc.documentType || doc.type || 'Land Record'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'processingStatus',
      render: (doc) => (
        <Badge status={doc.processingStatus || doc.status || 'PENDING'} size="sm" />
      ),
    },
    {
      header: 'Verification Status',
      key: 'verificationStatus',
      render: (doc) => (
        <Badge status={doc.verificationStatus || 'PENDING_VERIFICATION'} size="sm" />
      ),
    },
    {
      header: 'Confidence',
      key: 'confidence',
      render: (doc) => {
        const conf = doc.confidence !== undefined ? doc.confidence : doc.confidenceScore;
        if (conf === undefined || conf === null) return <span className="text-slate-400">—</span>;
        const confNum = Number(conf);
        const color = confNum >= 85 ? 'text-emerald-700' : confNum >= 65 ? 'text-amber-700' : 'text-rose-700';
        return <span className={`font-mono font-semibold text-xs ${color}`}>{confNum.toFixed(1)}%</span>;
      },
    },
    {
      header: 'Ingested On',
      key: 'createdAt',
      render: (doc) => (
        <span className="text-xs text-slate-500">
          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (doc) => (
        <Button
          variant="secondary"
          size="xs"
          icon={Eye}
          onClick={() => handleViewDocument(doc)}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            Documents
          </h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchDocuments}
        >
          Refresh Queue
        </Button>
      </div>

      {error && (
        <ErrorAlert
          title="Error Loading Documents"
          message={error}
          onRetry={fetchDocuments}
        />
      )}

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search document no, khasra, owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>

            {/* Processing Status Filter */}
            <div>
              <Select
                value={processingStatus}
                onChange={(e) => {
                  setProcessingStatus(e.target.value);
                  setPage(1);
                }}
                placeholder="All Processing States"
                options={[
                  { value: 'PENDING_PROCESSING', label: 'Pending Processing' },
                  { value: 'PROCESSING', label: 'Processing' },
                  { value: 'PROCESSED', label: 'Processed' },
                  { value: 'FAILED', label: 'Failed' },
                ]}
              />
            </div>

            {/* Verification Status Filter */}
            <div>
              <Select
                value={verificationStatus}
                onChange={(e) => {
                  setVerificationStatus(e.target.value);
                  setPage(1);
                }}
                placeholder="All Verification States"
                options={[
                  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                  { value: 'VERIFIED', label: 'Verified' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
              />
            </div>

            {/* District Filter */}
            <div>
              <Input
                placeholder="Filter by District"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setPage(1);
                }}
                icon={MapPin}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500 font-medium">
              Total matched: <strong className="text-slate-800">{totalCount}</strong>
            </span>
            <div className="flex items-center gap-2">
              {(search || processingStatus || verificationStatus || district) && (
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

      {/* Documents Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : documents.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="documents"
              title="No documents found"
              message={
                search || processingStatus || verificationStatus || district
                  ? 'No documents matched the specified search and filter criteria.'
                  : 'No land record documents exist in the database yet.'
              }
              action={
                (search || processingStatus || verificationStatus || district) && (
                  <Button variant="secondary" size="xs" onClick={handleResetFilters}>
                    Reset Search Parameters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={documents}
              keyExtractor={(doc, i) => doc._id || doc.id || i}
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

      {/* Document Inspection Modal (Strictly Read-Only for Administrator) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Document Record Inspection"
        subtitle={`Audit ID: ${selectedDoc?._id || selectedDoc?.id || '—'}`}
        maxWidth="max-w-3xl"
        footer={
          <div className="w-full flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Administrative Read-Only Mode &bull; Land data cannot be edited directly</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedDoc && (
          <div className="space-y-5 text-xs">
            {/* Status Alert Banner */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Processing</span>
                  <Badge status={selectedDoc.processingStatus || selectedDoc.status || 'PENDING'} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Verification</span>
                  <Badge status={selectedDoc.verificationStatus || 'PENDING_VERIFICATION'} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Confidence</span>
                <span className="font-mono font-bold text-sm text-navy-950">
                  {selectedDoc.confidence !== undefined ? `${Number(selectedDoc.confidence).toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>

            {/* Read-Only Restriction Notice */}
            <div className="p-2.5 rounded bg-blue-50/60 border border-blue-200/70 text-blue-900 flex items-start gap-2 text-[11px]">
              <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Administrator Notice:</strong> Cannot modify details directly in this view.
              </span>
            </div>

            {/* Metadata Grid */}
            <div>
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-2.5 border-b pb-1">
                Land Record Metadata
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Document Number</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedDoc.documentNumber || selectedDoc.title || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Khasra / Survey Number</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedDoc.khasraNumber || selectedDoc.surveyNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Document Type</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedDoc.documentType || selectedDoc.type || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">District</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedDoc.district || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Tehsil</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedDoc.tehsil || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Village</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedDoc.village || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Area / Extent</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedDoc.area ? `${selectedDoc.area} ${selectedDoc.areaUnit || 'Acres'}` : '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Owner / Claimant Name</span>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {selectedDoc.ownerName || (Array.isArray(selectedDoc.owner) ? selectedDoc.owner.map(o => o?.name || o).filter(Boolean).join(', ') : (typeof selectedDoc.owner === 'object' ? selectedDoc.owner?.name : selectedDoc.owner)) || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Ingestion Timestamp</span>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {selectedDoc.createdAt ? new Date(selectedDoc.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Operator and Officer Assignment */}
            {(() => {
              const opObj = selectedDoc.operator || (typeof selectedDoc.uploadedBy === 'object' ? selectedDoc.uploadedBy : null);
              const opName = opObj?.name || selectedDoc.operatorName || (typeof selectedDoc.uploadedBy === 'string' ? selectedDoc.uploadedBy : null) || 'System / Auto-Ingestion';
              const opEmail = opObj?.email || null;

              const verObj = selectedDoc.verifier || (typeof selectedDoc.verifiedBy === 'object' ? selectedDoc.verifiedBy : null);
              const verName = verObj?.name || selectedDoc.verifierName || (typeof selectedDoc.verifiedBy === 'string' ? selectedDoc.verifiedBy : null) || (selectedDoc.verificationStatus === 'VERIFIED' ? 'Verified Officer' : 'Unassigned / Pending');
              const verEmail = verObj?.email || null;

              return (
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-2.5 border-b pb-1">
                    Workflow Participants
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">Digitization Operator</span>
                      <p className="font-medium text-slate-800 mt-1">
                        {opName}
                      </p>
                      {opEmail && (
                        <span className="text-[11px] text-slate-500">{opEmail}</span>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">Verification Officer</span>
                      <p className="font-medium text-slate-800 mt-1">
                        {verName}
                      </p>
                      {verEmail && (
                        <span className="text-[11px] text-slate-500">{verEmail}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Failure or Rejection Details (if applicable) */}
            {(selectedDoc.failureReason || selectedDoc.rejectionReason) && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <h5 className="font-semibold text-rose-900 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Discrepancy / Failure Report
                </h5>
                <p className="text-rose-800 leading-relaxed">
                  {selectedDoc.failureReason || selectedDoc.rejectionReason}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
