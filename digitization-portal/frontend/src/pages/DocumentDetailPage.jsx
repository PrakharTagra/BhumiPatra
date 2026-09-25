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
import { formatDate, formatFileSize } from '../utils/formatters';
import {
  FileText,
  RotateCw,
  ArrowLeft,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Download,
  AlertCircle,
  Building,
  FileCheck2,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function resolveFileUrl(fileUrl) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const clean = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${API_BASE_URL}${clean}`;
}

export function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [document, setDocument] = useState(null);
  const [landRecord, setLandRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentsApi.getDocumentById(id);
      const doc = data?.document || data?.data?.document || data?.data || data;
      const rec = data?.landRecord || data?.data?.landRecord || null;
      setDocument(doc);
      setLandRecord(rec);
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
      success('Processing initiated.');
      navigate(`/documents/${id}/processing`);
    } catch (err) {
      toastError(err.message || 'Failed to re-trigger document processing.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Documents', to: '/documents' }, { label: 'Inspect Document' }]} />
        <LoadingSpinner label="Loading document and extracted record..." size="lg" className="py-20" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Documents', to: '/documents' }, { label: 'Inspect Document' }]} />
        <AlertBanner
          type="error"
          title="Document Retrieval Failed"
          message={error || 'The requested document record could not be found.'}
          onRetry={fetchDocument}
        />
        <div className="flex justify-start">
          <Link to="/documents">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to Documents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const docId = document.documentId || document._id || id;
  const filename = document.originalName || document.filename || 'Scanned Document';
  const status = document.processingStatus || document.status || 'PENDING';
  const verificationStatus = document.verificationStatus || landRecord?.verificationStatus || 'PENDING';
  const overallConfidence = document.overallConfidence ?? landRecord?.overallConfidence ?? null;
  const resolvedUrl = resolveFileUrl(document.fileUrl);
  const isPdf = document.mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf') || resolvedUrl.toLowerCase().endsWith('.pdf');

  // Extract fields from Python metadata or LandRecord
  const pyExtracted = document.metadata?.extractedFields || (document.metadata?.get && document.metadata.get('extractedFields')) || {};
  const landInfo = landRecord?.landInformation || {};
  const loc = landRecord?.location || {};
  const ownerObj = (landRecord?.owner && landRecord.owner.length > 0) ? landRecord.owner[0] : null;
  const mutationObj = landRecord?.mutation || {};
  const registrationObj = landRecord?.registration || {};

  const getFieldValue = (fieldKey, fallbackVal) => {
    const py = pyExtracted[fieldKey];
    if (py && py.value !== undefined && py.value !== null && py.value !== '') {
      return {
        value: py.value,
        confidence: py.confidence != null ? Math.round(py.confidence * 100) : null,
        requiresVerification: Boolean(py.requiresVerification),
      };
    }
    if (fallbackVal !== undefined && fallbackVal !== null && fallbackVal !== '' && fallbackVal !== 'Not detected' && fallbackVal !== '—') {
      return {
        value: fallbackVal,
        confidence: null,
        requiresVerification: false,
      };
    }
    return {
      value: null,
      confidence: null,
      requiresVerification: false,
    };
  };

  // Structured Record field groupings
  const landRecordFields = [
    { label: 'Owner Name', ...getFieldValue('owner_name', ownerObj?.name) },
    { label: 'Khata Number', ...getFieldValue('khata_number', landInfo.khatauniNo) },
    { label: 'Khasra Number', ...getFieldValue('khasra_number', landInfo.khasraNo) },
    { label: 'Survey Number', ...getFieldValue('survey_number', landInfo.khewatNo) },
    { label: 'Area', ...getFieldValue('area', landInfo.area != null ? String(landInfo.area) : null) },
    { label: 'Unit', ...getFieldValue('area_unit', landInfo.areaUnit) },
    { label: 'Land Classification', ...getFieldValue('land_classification', landInfo.landClassification) },
  ];

  const locationFields = [
    { label: 'State', ...getFieldValue('state', loc.state || document.state) },
    { label: 'District', ...getFieldValue('district', loc.district || document.district) },
    { label: 'Tehsil', ...getFieldValue('tehsil', loc.tehsil || document.tehsil) },
    { label: 'Village', ...getFieldValue('village', loc.village || document.village) },
  ];

  const mutationFields = [
    { label: 'Mutation Number', ...getFieldValue('mutation_number', mutationObj.mutationNo) },
    { label: 'Mutation Date', ...getFieldValue('mutation_date', mutationObj.remarks) },
  ];

  const registrationFields = [
    { label: 'Registration Number', ...getFieldValue('registration_number', registrationObj.registrationNo) },
    { label: 'Registration Date', ...getFieldValue('registration_date', registrationObj.remarks) },
  ];

  const renderFieldRow = (field) => {
    const isPresent = field.value !== null && field.value !== undefined && field.value !== '';
    return (
      <div key={field.label} className="py-2.5 px-3 flex items-center justify-between border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
        <div className="min-w-0 pr-3">
          <span className="text-xs font-medium text-slate-500 block">
            {field.label}
          </span>
          <span className={`text-sm font-semibold block mt-0.5 truncate ${isPresent ? 'text-slate-900' : 'text-slate-400 italic'}`}>
            {isPresent ? String(field.value) : 'Not detected'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {field.requiresVerification && (
            <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Requires verification
            </span>
          )}
          {field.confidence != null && (
            <span className="text-xs text-slate-500 font-mono">
              {field.confidence}%
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Documents', to: '/documents' },
          { label: 'Inspect Document' },
        ]}
      />

      {/* 2. Document Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900" title={filename}>
                {filename}
              </h1>
              <StatusBadge status={status} />
              <StatusBadge status={verificationStatus} type="verification" />
            </div>
            <p className="text-xs sm:text-sm font-mono text-slate-500 mt-1">
              Document ID: <strong className="text-slate-700">{docId}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to={`/documents/${id}/processing`}>
              <Button variant="secondary" size="sm" icon={RefreshCw}>
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
      </div>

      {/* 3. Main Inspection Workstation: Side-by-Side (52% Original Document + 48% Extracted Record) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT PANEL: Original Scanned Document Viewer */}
        <div className="w-full lg:w-[52%] bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col shadow-xs">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Original Scanned Document
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Source Document
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                title="Fit to Width / Reset Zoom"
                aria-label="Fit to Width"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {resolvedUrl && (
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Open in new window"
                  aria-label="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="h-[750px] w-full bg-slate-100 overflow-auto relative flex items-center justify-center p-2">
            {resolvedUrl ? (
              isPdf ? (
                <object
                  data={`${resolvedUrl}#toolbar=1&navpanes=0`}
                  type="application/pdf"
                  className="w-full h-full border-0 rounded bg-white"
                  title="Original Document PDF"
                >
                  <iframe
                    src={`${resolvedUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0 rounded bg-white"
                    title="Original Document PDF Embed"
                  >
                    <div className="p-8 text-center text-sm text-slate-600">
                      <p>Your browser could not preview the PDF file inline.</p>
                      <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-navy-800 text-white font-medium"
                      >
                        <Download className="w-4 h-4" /> Open Document
                      </a>
                    </div>
                  </iframe>
                </object>
              ) : (
                <div
                  className="w-full h-full overflow-auto flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out',
                  }}
                >
                  <img
                    src={resolvedUrl}
                    alt="Original Land Record Scan"
                    className="max-w-full max-h-full object-contain rounded shadow-sm"
                  />
                </div>
              )
            ) : (
              <div className="text-center p-8 text-slate-500">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Scanned document preview unavailable</p>
                <p className="text-xs text-slate-400 mt-1">The source file may not be uploaded to the server repository.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Extracted Land Record Data (~48%) */}
        <div className="w-full lg:w-[48%] bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col shadow-xs">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Extracted Land Record Data
              </h2>
            </div>
            {overallConfidence != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">Confidence:</span>
                <ConfidenceBadge confidence={overallConfidence} size="sm" />
              </div>
            )}
          </div>

          <div className="h-[750px] overflow-y-auto divide-y divide-slate-200 p-2 space-y-4">
            {/* Section 1: Landholders / Ownership Details */}
            <div className="p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-2 flex items-center justify-between">
                <span>Landholder / Ownership Details ({landRecord?.landholders?.length || (ownerObj?.name ? 1 : 0)})</span>
              </h3>
              {landRecord?.landholders && landRecord.landholders.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                      <tr>
                        <th className="px-2.5 py-1.5 w-10">Sr.</th>
                        <th className="px-2.5 py-1.5">Landholder</th>
                        <th className="px-2.5 py-1.5">Father / Guardian</th>
                        <th className="px-2.5 py-1.5">Tenure</th>
                        <th className="px-2.5 py-1.5 w-14">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {landRecord.landholders.map((lh, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-2.5 py-1.5 font-mono text-slate-500">{lh.srNo || idx + 1}</td>
                          <td className="px-2.5 py-1.5 font-medium text-slate-900">{lh.name || '—'}</td>
                          <td className="px-2.5 py-1.5 text-slate-700">{lh.fatherGuardianName || '—'}</td>
                          <td className="px-2.5 py-1.5 text-slate-600">{lh.ownershipType || 'Bhumidhar'}</td>
                          <td className="px-2.5 py-1.5 font-mono text-slate-700">{lh.share || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100">
                  {renderFieldRow({ label: 'Owner Name', ...getFieldValue('owner_name', ownerObj?.name) })}
                </div>
              )}
            </div>

            {/* Section 2: Land Parcels / Plot Details (All Parcels) */}
            <div className="p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-2 flex items-center justify-between">
                <span>Plot / Khasra Details ({landRecord?.landParcels?.length || (landInfo.khasraNo ? 1 : 0)})</span>
              </h3>
              {landRecord?.landParcels && landRecord.landParcels.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                      <tr>
                        <th className="px-2.5 py-1.5 w-10">Sr.</th>
                        <th className="px-2.5 py-1.5">Khasra</th>
                        <th className="px-2.5 py-1.5">Khata</th>
                        <th className="px-2.5 py-1.5">Area</th>
                        <th className="px-2.5 py-1.5">Classification</th>
                        <th className="px-2.5 py-1.5">Land Use</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {landRecord.landParcels.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-2.5 py-1.5 font-mono text-slate-500">{p.srNo || idx + 1}</td>
                          <td className="px-2.5 py-1.5 font-mono font-medium text-slate-900">{p.khasraNumber}</td>
                          <td className="px-2.5 py-1.5 font-mono text-slate-700">{p.khataNumber || '—'}</td>
                          <td className="px-2.5 py-1.5 font-mono text-slate-700">
                            {p.area != null ? `${p.area} ${p.areaUnit || 'Hectare'}` : '—'}
                          </td>
                          <td className="px-2.5 py-1.5 text-slate-700">{p.classification || '—'}</td>
                          <td className="px-2.5 py-1.5 text-slate-700">{p.landUse || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100">
                  {landRecordFields.map(renderFieldRow)}
                </div>
              )}
            </div>

            {/* Section 3: Revenue Jurisdiction */}
            <div className="p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-2">
                Revenue Jurisdiction
              </h3>
              <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100">
                {locationFields.map(renderFieldRow)}
              </div>
            </div>

            {/* Section 4: Mutation & Registration */}
            <div className="p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-2">
                Mutation &amp; Registration
              </h3>
              <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100">
                {mutationFields.map(renderFieldRow)}
                {registrationFields.map(renderFieldRow)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Administrative Hierarchy & Index Metadata Box */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Building className="w-4 h-4 text-navy-700" />
          <span>Administrative Hierarchy &amp; Ingestion Record</span>
        </h2>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
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
    </div>
  );
}

export default DocumentDetailPage;
