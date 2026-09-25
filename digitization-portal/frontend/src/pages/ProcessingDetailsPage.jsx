import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import documentsApi from '../api/documents';
import { useToast } from '../context/ToastContext';
import PipelineTracker from '../components/documents/PipelineTracker';
import Breadcrumbs from '../components/common/Breadcrumbs';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  RotateCw,
  FileText,
  RefreshCw,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export function ProcessingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [documentData, setDocumentData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const pollIntervalRef = useRef(null);

  // Fetch status directly from API
  const fetchStatus = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      let liveStatus = null;
      try {
        liveStatus = await documentsApi.getDocumentStatus(id);
      } catch (statusErr) {
        // Fallback to getDocumentById if needed
      }

      const doc = await documentsApi.getDocumentById(id);
      const parsedDoc = doc?.document || doc?.data?.document || doc?.data || doc;
      setDocumentData(parsedDoc);

      const parsedStatus = liveStatus?.data || liveStatus || parsedDoc;
      setStatusData(parsedStatus);
      setError(null);

      const currentStatus = String(parsedStatus?.status || parsedDoc?.status || '').toUpperCase();
      const isTerminal = ['COMPLETED', 'PROCESSED', 'FAILED', 'ERROR', 'VERIFIED'].includes(currentStatus);
      if (isTerminal && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError(err.message || 'Unable to retrieve processing status.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStatus(true);
  }, [fetchStatus]);

  // Polling while active
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchStatus(false);
    }, 1500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchStatus]);

  // Trigger re-processing
  const handleTriggerProcess = async () => {
    try {
      setIsRetrying(true);
      await documentsApi.triggerProcess(id);
      success('Document processing initiated.');
      await fetchStatus(false);
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => {
          fetchStatus(false);
        }, 1500);
      }
    } catch (err) {
      toastError(err.message || 'Failed to re-trigger document processing.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading && !documentData) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Documents', to: '/documents' }, { label: 'Processing Status' }]} />
        <LoadingSpinner label="Loading document status..." size="lg" className="py-20" />
      </div>
    );
  }

  const currentStatus = statusData?.status || documentData?.processingStatus || documentData?.status || 'PENDING';
  const currentStep = statusData?.currentStep || statusData?.step || documentData?.currentStep;
  const failureReason = statusData?.error || statusData?.failureReason || documentData?.failureReason;
  const stepDetails = statusData?.steps || {};
  const isCompleted = ['COMPLETED', 'PROCESSED', 'VERIFIED'].includes(String(currentStatus).toUpperCase());
  const isFailed = ['FAILED', 'ERROR'].includes(String(currentStatus).toUpperCase());
  const docId = documentData?.documentId || id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Documents', to: '/documents' },
          { label: `Document ${docId.substring(0, 16)}`, to: `/documents/${id}` },
          { label: 'Processing Status' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Document Processing
            </h1>
            <StatusBadge status={currentStatus} />
          </div>
          <p className="text-sm text-slate-600 font-mono mt-1">
            {docId}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchStatus(false)}
          >
            Refresh
          </Button>

          {isFailed && (
            <Button
              variant="primary"
              size="sm"
              icon={RotateCw}
              isLoading={isRetrying}
              onClick={handleTriggerProcess}
            >
              Try Again
            </Button>
          )}

          {isCompleted && (
            <Link to={`/documents/${id}`}>
              <Button variant="primary" size="sm" icon={FileText}>
                View Record
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main 7-Stage Process Tracker */}
      <PipelineTracker
        status={currentStatus}
        currentStep={currentStep}
        error={failureReason}
        stepDetails={stepDetails}
        documentId={docId}
        onViewRecord={() => navigate(`/documents/${id}`)}
        onRetry={handleTriggerProcess}
      />

      {/* Document Information */}
      {documentData && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Document Information</span>
            <Link to={`/documents/${id}`} className="text-navy-700 hover:text-navy-900 font-semibold normal-case text-xs">
              Inspect Document
            </Link>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Document Type</p>
              <p className="font-semibold text-slate-900 mt-1 truncate" title={documentData.documentType}>
                {documentData.documentType || '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">State</p>
              <p className="font-semibold text-slate-900 mt-1">{documentData.state || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">District</p>
              <p className="font-semibold text-slate-900 mt-1">{documentData.district || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Tehsil</p>
              <p className="font-semibold text-slate-900 mt-1">{documentData.tehsil || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Village</p>
              <p className="font-semibold text-slate-900 mt-1">{documentData.village || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Record Year</p>
              <p className="font-semibold text-slate-900 mt-1">{documentData.recordYear || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Administrative Failure Notice */}
      {isFailed && (
        <div className="p-5 rounded-lg bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Document processing could not be completed.
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                {failureReason ? `Reason: ${failureReason}` : 'An issue occurred during document extraction. Please try submitting again.'}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={RotateCw}
            isLoading={isRetrying}
            onClick={handleTriggerProcess}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Completion Banner */}
      {isCompleted && (
        <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Processing Completed
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              The land record has been structured and is ready for administrative review.
            </p>
          </div>
          <Link to={`/documents/${id}`}>
            <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
              View Record
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default ProcessingDetailsPage;
