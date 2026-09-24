import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import documentsApi from '../api/documents';
import { useToast } from '../context/ToastContext';
import Breadcrumbs from '../components/common/Breadcrumbs';
import StatusBadge from '../components/common/StatusBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import Button from '../components/common/Button';
import AlertBanner from '../components/common/AlertBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatFileSize } from '../utils/formatters';
import {
  FileText,
  FileCheck2,
  Calendar,
  Building,
  MapPin,
  Cpu,
  RotateCw,
  ArrowLeft,
  ExternalLink,
  Shield,
  Layers,
  Percent,
  Download,
  CheckCircle2,
  AlertTriangle,
  User,
  Hash
} from 'lucide-react';

export function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentsApi.getDocumentById(id);
      const doc = data?.document || data?.data || data;
      setDocument(doc);
    } catch (err) {
      console.error('Fetch document error:', err);
      setError(err.message || 'Unable to retrieve document details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleRerunProcessing = async () => {
    try {
      setIsRetrying(true);
      await documentsApi.triggerProcess(id);
      success('Processing started.', 'Processing Triggered');
      navigate(`/documents/${id}/processing`);
    } catch (err) {
      toastError(err.message || 'Failed to re-trigger processing.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Documents', to: '/documents' }, { label: 'Loading Document...' }]} />
        <LoadingSpinner label="Loading document details..." size="lg" className="py-20" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Documents', to: '/documents' }, { label: 'Document Error' }]} />
        <AlertBanner
          type="error"
          title="Document Retrieval Failed"
          message={error || 'The requested document record does not exist or was deleted.'}
          onRetry={fetchDocument}
        />
        <div className="flex justify-start">
          <Link to="/documents">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to Documents History
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const docId = document._id || document.id || document.documentId || id;
  const filename = document.originalName || document.filename || document.fileName || 'Scanned_Record';
  const status = document.status || document.processingStatus || 'PENDING';
  const verificationStatus = document.verificationStatus || 'PENDING';
  const confidence = document.confidenceScore ?? document.confidence;
  const extracted = document.extractedData || document.extractionResults || document.extractedRecord || null;
  const fileUrl = document.fileUrl || document.filePath || document.url;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Documents', to: '/documents' },
          { label: `Document #${docId.substring(0, 8)}` },
        ]}
      />

      {/* Top Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate max-w-md" title={filename}>
                  {filename}
                </h1>
                <StatusBadge status={status} />
                <StatusBadge status={verificationStatus} type="verification" />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Document ID: <strong className="text-slate-700">{docId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/documents/${docId}/processing`}>
              <Button variant="secondary" size="sm" icon={Cpu}>
                Processing Status
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              icon={RotateCw}
              isLoading={isRetrying}
              onClick={handleRerunProcessing}
            >
              Re-run Processing
            </Button>
          </div>
        </div>

        {/* Confidence Banner */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Confidence:</span>
            <ConfidenceBadge confidence={confidence} size="md" />
          </div>

          <div className="text-slate-500 text-xs">
            Ingestion Date: <span className="font-mono text-slate-700">{formatDate(document.createdAt || document.uploadDate)}</span>
          </div>
        </div>
      </div>

      {/* Grid: Metadata & File Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Administrative Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-navy-700" />
              <span>Administrative Hierarchy &amp; Index</span>
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-500 font-medium">Document Type</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{document.documentType || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Record Year</dt>
                <dd className="font-mono font-semibold text-slate-900 mt-0.5">{document.recordYear || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">State / UT</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{document.state || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">District</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{document.district || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Tehsil / Taluk</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{document.tehsil || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Village / Mauza</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{document.village || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">File Size</dt>
                <dd className="font-mono text-slate-700 mt-0.5">{formatFileSize(document.fileSize || document.size)}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Operator</dt>
                <dd className="font-mono text-slate-700 mt-0.5">
                  {typeof document.uploadedBy === 'object' ? (document.uploadedBy?.name || document.uploadedBy?._id) : (document.uploadedBy || document.operatorId || 'Operator')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Extracted Land Records (Read-Only) */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Extracted Data
                </h2>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-navy-50 text-navy-800 border border-navy-200">
                Operator View Only
              </span>
            </div>

            {/* Read-Only SOP Disclaimer */}
            <div className="mb-4 p-3 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              Extracted data is read-only.
            </div>

            {extracted ? (
              <div className="space-y-4">
                {/* Land Parcel Information */}
                {extracted.parcels && Array.isArray(extracted.parcels) && extracted.parcels.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 border-b">Khasra / Parcel No.</th>
                          <th className="p-2.5 border-b">Khatauni / Khewat</th>
                          <th className="p-2.5 border-b">Area</th>
                          <th className="p-2.5 border-b">Classification</th>
                          <th className="p-2.5 border-b">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {extracted.parcels.map((parcel, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-mono font-medium text-slate-900">{parcel.khasraNo || parcel.parcelNumber || '—'}</td>
                            <td className="p-2.5 font-mono">{parcel.khatauniNo || parcel.khewatNo || '—'}</td>
                            <td className="p-2.5 font-mono">{parcel.area ? `${parcel.area} ${parcel.unit || ''}` : '—'}</td>
                            <td className="p-2.5">{parcel.landType || parcel.classification || '—'}</td>
                            <td className="p-2.5"><ConfidenceBadge confidence={parcel.confidence} size="xs" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {/* Land Owners Information */}
                {extracted.owners && Array.isArray(extracted.owners) && extracted.owners.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Recorded Land Tenure Holders / Owners
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200">
                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5 border-b">Owner Name</th>
                            <th className="p-2.5 border-b">Parentage / Spouse</th>
                            <th className="p-2.5 border-b">Share Ratio</th>
                            <th className="p-2.5 border-b">Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {extracted.owners.map((owner, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-medium text-slate-900">{owner.name || '—'}</td>
                              <td className="p-2.5">{owner.relation || owner.fatherName || '—'}</td>
                              <td className="p-2.5 font-mono">{owner.share || '—'}</td>
                              <td className="p-2.5"><ConfidenceBadge confidence={owner.confidence} size="xs" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* Raw JSON inspection for non-standard schema */}
                {!extracted.parcels && !extracted.owners && (
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-md text-xs font-mono overflow-x-auto max-h-72">
                    {JSON.stringify(extracted, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <EmptyState
                type="empty"
                title="No Extracted Land Data Yet"
                description={
                  status === 'COMPLETED'
                    ? 'No land parcel entities were identified in this document.'
                    : 'Extraction is either pending or in progress.'
                }
                actionText="View Processing Status"
                actionIcon={Cpu}
                onAction={() => navigate(`/documents/${docId}/processing`)}
                className="py-10 border-0"
              />
            )}
          </div>
        </div>

        {/* Right: File Preview & System Metadata */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 pb-2 border-b border-slate-100">
              Scanned Document File
            </h2>

            <div className="border border-slate-200 rounded-lg p-6 text-center bg-slate-50 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-800 truncate max-w-full" title={filename}>
                {filename}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {formatFileSize(document.fileSize || document.size)}
              </p>

              {fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original Scan</span>
                </a>
              ) : (
                <span className="mt-4 text-[10px] text-slate-400 bg-slate-200/60 px-2 py-1 rounded">
                  Stored securely in BhumiPatra vault
                </span>
              )}
            </div>
          </div>

          {/* Pipeline Quick Access */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 pb-2 border-b border-slate-100">
              Processing Status
            </h2>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-slate-500">Processing Stage:</span>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center justify-between text-xs mb-4">
              <span className="text-slate-500">Verification Stage:</span>
              <StatusBadge status={verificationStatus} type="verification" />
            </div>
            <Link to={`/documents/${docId}/processing`} className="w-full block">
              <Button variant="secondary" size="sm" icon={Cpu} className="w-full justify-center">
                View Processing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentDetailPage;
