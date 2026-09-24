import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import documentsApi from '../api/documents';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import EmptyState from '../components/common/EmptyState';
import AlertBanner from '../components/common/AlertBanner';
import TableSkeleton, { CardSkeleton } from '../components/common/TableSkeleton';
import Button from '../components/common/Button';
import { formatDate, truncate } from '../utils/formatters';
import {
  Files,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Clock,
  Layers
} from 'lucide-react';

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Strictly API-driven stats: initialized to 0, NEVER filled with dummy numbers
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    processed: 0,
    needsVerification: 0,
    failed: 0,
  });

  // Strictly API-driven documents list: empty by default, NEVER filled with dummy records
  const [recentDocuments, setRecentDocuments] = useState([]);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      // Call GET /api/documents with limit for recent items
      const data = await documentsApi.getDocuments({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });

      // Support common backend response structures:
      // Structure A: { documents: [...], total: N, stats: { ... } }
      // Structure B: Array of documents [...]
      // Structure C: { data: { documents: [...], stats: { ... } } }
      const docList = Array.isArray(data)
        ? data
        : data?.documents || data?.data?.documents || data?.items || [];

      setRecentDocuments(docList);

      // Extract or compute stats strictly from API
      if (data?.stats) {
        setStats({
          total: Number(data.stats.total || 0),
          processing: Number(data.stats.processing || 0),
          processed: Number(data.stats.processed || 0),
          needsVerification: Number(data.stats.needsVerification || data.stats.requiringVerification || 0),
          failed: Number(data.stats.failed || 0),
        });
      } else {
        // If the backend doesn't return aggregated stats object, derive strictly from API documents
        const total = data?.total !== undefined ? Number(data.total) : docList.length;
        const processing = docList.filter((d) => {
          const s = String(d.status || d.processingStatus || '').toUpperCase();
          return ['PENDING', 'QUEUED', 'PROCESSING', 'PREPROCESSING', 'OCR', 'EXTRACTION', 'VALIDATION', 'CONFIDENCE_ANALYSIS'].includes(s);
        }).length;
        const processed = docList.filter((d) => {
          const s = String(d.status || d.processingStatus || '').toUpperCase();
          return ['COMPLETED', 'PROCESSED'].includes(s);
        }).length;
        const needsVerification = docList.filter((d) => {
          const v = String(d.verificationStatus || d.status || '').toUpperCase();
          return ['NEEDS_VERIFICATION', 'VERIFICATION_REQUIRED', 'FLAGGED'].includes(v);
        }).length;
        const failed = docList.filter((d) => {
          const s = String(d.status || d.processingStatus || '').toUpperCase();
          return ['FAILED', 'ERROR'].includes(s);
        }).length;

        setStats({
          total,
          processing,
          processed,
          needsVerification,
          failed,
        });
      }
    } catch (err) {
      console.warn('Dashboard API call error:', err);
      setError(err.message || 'Unable to retrieve dashboard metrics from the backend service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Digitization Operator Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational overview of scanned land records and AI digitization pipeline status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            isLoading={refreshing}
            icon={RefreshCw}
            title="Refresh API Data"
          >
            Refresh
          </Button>
          <Link to="/upload">
            <Button variant="primary" size="sm" icon={UploadCloud}>
              Upload Document
            </Button>
          </Link>
        </div>
      </div>

      {/* Backend Error / Connection Warning Banner */}
      {error && (
        <AlertBanner
          type="error"
          title="Backend Connection Notice"
          message={error}
          onRetry={() => fetchDashboardData(false)}
        />
      )}

      {/* 5 Strictly API-Driven Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* 1. Total Uploaded Documents */}
            <StatCard
              title="Total Uploaded"
              value={stats.total}
              subtext="Legacy land records"
              icon={Files}
              variant="primary"
            />

            {/* 2. Processing Documents */}
            <StatCard
              title="Processing"
              value={stats.processing}
              subtext="Active AI pipeline"
              icon={Cpu}
              variant="processing"
            />

            {/* 3. Processed Documents */}
            <StatCard
              title="Processed"
              value={stats.processed}
              subtext="Digitized & archived"
              icon={CheckCircle2}
              variant="success"
            />

            {/* 4. Requiring Verification */}
            <StatCard
              title="Needs Verification"
              value={stats.needsVerification}
              subtext="Discrepancy flagged"
              icon={AlertTriangle}
              variant="warning"
            />

            {/* 5. Failed Documents */}
            <StatCard
              title="Failed"
              value={stats.failed}
              subtext="Scan or OCR errors"
              icon={XCircle}
              variant="danger"
            />
          </>
        )}
      </div>

      {/* Recent Uploads Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-navy-800" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Recent Scanned Uploads
            </h2>
          </div>
          <Link
            to="/documents"
            className="text-xs font-semibold text-navy-800 hover:text-navy-950 flex items-center gap-1 group"
          >
            <span>View Full Document History</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Content: Skeleton, Empty State, or API Data Table */}
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : recentDocuments.length === 0 ? (
          <EmptyState
            type="documents"
            title="No Documents Uploaded Yet"
            description="No land records have been ingested into the system. As a Digitization Operator, you can start by uploading scanned legacy records."
            actionText="Upload First Document"
            actionIcon={UploadCloud}
            onAction={() => window.location.href = '/upload'}
            className="border-0 rounded-none py-14"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Doc ID</th>
                  <th scope="col" className="px-4 py-3">Filename</th>
                  <th scope="col" className="px-4 py-3">Document Type</th>
                  <th scope="col" className="px-4 py-3">Location (Dist / Tehsil / Vil)</th>
                  <th scope="col" className="px-4 py-3">Upload Date</th>
                  <th scope="col" className="px-4 py-3">Pipeline Status</th>
                  <th scope="col" className="px-4 py-3">Confidence</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentDocuments.map((doc) => {
                  const id = doc._id || doc.id || doc.documentId;
                  const filename = doc.originalName || doc.filename || doc.fileName || 'Untitled';
                  const docType = doc.documentType || doc.type || 'Land Record';
                  const locationStr = [doc.district, doc.tehsil, doc.village].filter(Boolean).join(' / ') || '—';
                  const uploadDate = doc.createdAt || doc.uploadDate || doc.uploadedAt;
                  const status = doc.status || doc.processingStatus || 'PENDING';
                  const confidence = doc.confidenceScore || doc.confidence;

                  return (
                    <tr key={id || Math.random()} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {truncate(id, 12)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px] truncate" title={filename}>
                        {filename}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate" title={docType}>
                        {docType}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={locationStr}>
                        {locationStr}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {formatDate(uploadDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ConfidenceBadge confidence={confidence} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/documents/${id}/processing`}
                            className="px-2 py-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded"
                            title="Monitor AI Processing"
                          >
                            Pipeline
                          </Link>
                          <Link
                            to={`/documents/${id}`}
                            className="px-2 py-1 text-[11px] font-semibold text-navy-800 hover:text-navy-950 hover:bg-navy-50 rounded"
                            title="View Document Details"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operator Workflow & SOP Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
            <span className="w-5 h-5 rounded-full bg-navy-50 text-navy-800 flex items-center justify-center text-[10px]">1</span>
            <span>Intake &amp; Scanning</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ensure legacy sheets (Jamabandi, Khasra, Naksha) are scanned flat, clean, and free of blur. Minimum recommended scan resolution: 300 DPI.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
            <span className="w-5 h-5 rounded-full bg-navy-50 text-navy-800 flex items-center justify-center text-[10px]">2</span>
            <span>Metadata Tagging Only</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Digitization Operators tag only Document Type, State, District, Tehsil, Village, and Record Year. Never manually enter owner names or land areas.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
            <span className="w-5 h-5 rounded-full bg-navy-50 text-navy-800 flex items-center justify-center text-[10px]">3</span>
            <span>AI Pipeline Monitoring</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Track live execution across Preprocessing, OCR, Extraction, Validation, and Confidence Analysis. Re-trigger pipeline if an intermittent scan error occurs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
