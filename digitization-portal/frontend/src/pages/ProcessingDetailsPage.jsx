import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import documentsApi from '../api/documents';
import { useToast } from '../context/ToastContext';
import PipelineTracker from '../components/documents/PipelineTracker';
import Breadcrumbs from '../components/common/Breadcrumbs';
import StatusBadge from '../components/common/StatusBadge';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import Button from '../components/common/Button';
import AlertBanner from '../components/common/AlertBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import {
  RotateCw,
  Play,
  Pause,
  ArrowRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  Terminal
} from 'lucide-react';

export const ProcessingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  const [documentData, setDocumentData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const pollIntervalRef = useRef(null);

  // Fetch status directly from API (never simulated)
  const fetchStatus = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // First try status endpoint: GET /api/documents/:id/status
      let liveStatus = null;
      try {
        liveStatus = await documentsApi.getDocumentStatus(id);
      } catch (statusErr) {
        // If /status endpoint is not independently implemented, fall back to /documents/:id
        console.warn('Dedicated status endpoint failed, falling back to document details:', statusErr.message);
      }

      // Fetch base document details: GET /api/documents/:id
      const doc = await documentsApi.getDocumentById(id);
      const parsedDoc = doc?.document || doc?.data || doc;
      setDocumentData(parsedDoc);

      const parsedStatus = liveStatus?.data || liveStatus || parsedDoc;
      setStatusData(parsedStatus);
      setLastUpdated(new Date());
      setError(null);

      // Check if finished or failed to automatically stop polling
      const currentStatus = String(parsedStatus?.status || parsedDoc?.status || '').toUpperCase();
      const isTerminal = ['COMPLETED', 'PROCESSED', 'FAILED', 'ERROR', 'VERIFIED'].includes(currentStatus);
      if (isTerminal) {
        setIsPolling(false);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError(err.message || 'Unable to retrieve processing status from API.');
      setIsPolling(false);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    fetchStatus(true);
  }, [fetchStatus]);

  // Real Polling lifecycle (only runs while isPolling is true)
  useEffect(() => {
    if (isPolling) {
      pollIntervalRef.current = setInterval(() => {
        fetchStatus(false);
      }, 4000); // Poll every 4 seconds
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, fetchStatus]);

  // Trigger or re-trigger processing via API: POST /api/documents/:id/process
  const handleTriggerProcess = async () => {
    try {
      setIsRetrying(true);
      await documentsApi.triggerProcess(id);
      success('AI Processing job initiated for document.', 'Processing Triggered');
      setIsPolling(true);
      await fetchStatus(false);
    } catch (err) {
      toastError(err.message || 'Failed to re-trigger processing on the backend.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading && !documentData) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Documents', to: '/documents' }, { label: 'Processing Monitor' }]} />
        <LoadingSpinner label="Fetching Live Pipeline Status..." size="lg" className="py-20" />
      </div>
    );
  }

  const currentStatus = statusData?.status || documentData?.status || 'PENDING';
  const currentStep = statusData?.step || statusData?.currentStep || documentData?.currentStep;
  const confidence = statusData?.confidenceScore ?? documentData?.confidenceScore;
  const failureReason = statusData?.error || statusData?.failureReason || documentData?.error;
  const stepDetails = statusData?.steps || statusData?.stepDetails || documentData?.pipelineSteps || {};
  const isCompleted = ['COMPLETED', 'PROCESSED', 'VERIFIED'].includes(String(currentStatus).toUpperCase());
  const isFailed = ['FAILED', 'ERROR'].includes(String(currentStatus).toUpperCase());

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Documents', to: '/documents' },
          { label: `Document #${id.substring(0, 8)}`, to: `/documents/${id}` },
          { label: 'Processing Pipeline' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Live AI Processing Monitor
            </h1>
            <StatusBadge status={currentStatus} />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tracking execution across the 7 autonomous AI stages for document ID: <span className="font-mono font-semibold text-slate-700">{id}</span>
          </p>
        </div>

        {/* Polling & Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Polling Toggle */}
          {!isCompleted && !isFailed && (
            <Button
              variant="secondary"
              size="sm"
              icon={isPolling ? Pause : Play}
              onClick={() => {
                const nextState = !isPolling;
                setIsPolling(nextState);
                if (nextState) info('Live status updates resumed.', 'Polling Active');
                else info('Live status updates paused.', 'Polling Paused');
              }}
            >
              {isPolling ? 'Pause Polling' : 'Resume Polling'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchStatus(false)}
            title="Perform immediate API status query"
          >
            Refresh Now
          </Button>

          {isFailed && (
            <Button
              variant="primary"
              size="sm"
              icon={RotateCw}
              isLoading={isRetrying}
              onClick={handleTriggerProcess}
            >
              Restart AI Pipeline
            </Button>
          )}

          {isCompleted && (
            <Link to={`/documents/${id}`}>
              <Button variant="primary" size="sm" icon={FileText}>
                View Extracted Details
              </Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <AlertBanner
          type="error"
          title="Status Query Failure"
          message={error}
          onRetry={() => fetchStatus(false)}
        />
      )}

      {/* Live Polling Status Indicator Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isPolling ? 'bg-sky-500 animate-ping' : isCompleted ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-slate-400'}`} />
          <span className="font-semibold text-slate-700">
            {isPolling ? 'Live Status Polling Active (every 4s)' : isCompleted ? 'Processing Concluded' : isFailed ? 'Processing Halted' : 'Polling Suspended'}
          </span>
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          Last checked: {lastUpdated ? formatDate(lastUpdated) : 'Just now'}
        </div>
      </div>

      {/* AI Pipeline 7-Stage Tracker */}
      <PipelineTracker
        status={currentStatus}
        currentStep={currentStep}
        error={failureReason}
        stepDetails={stepDetails}
      />

      {/* Document Administrative Context Card */}
      {documentData && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Document Identification &amp; Location</span>
            <Link to={`/documents/${id}`} className="text-navy-700 hover:text-navy-950 font-semibold normal-case text-xs flex items-center gap-1">
              <span>Inspect Full Record</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <p className="text-slate-500">Document Type</p>
              <p className="font-semibold text-slate-900 mt-0.5 truncate" title={documentData.documentType}>
                {documentData.documentType || '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">State</p>
              <p className="font-semibold text-slate-900 mt-0.5">{documentData.state || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">District</p>
              <p className="font-semibold text-slate-900 mt-0.5">{documentData.district || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Tehsil</p>
              <p className="font-semibold text-slate-900 mt-0.5">{documentData.tehsil || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Village</p>
              <p className="font-semibold text-slate-900 mt-0.5">{documentData.village || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Record Year</p>
              <p className="font-mono font-semibold text-slate-900 mt-0.5">{documentData.recordYear || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Diagnostics / Pipeline Logs Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Autonomous Pipeline Event Log
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Source: BhumiPatra Pipeline Worker
          </span>
        </div>

        {/* Display real logs/steps returned by the API */}
        {statusData?.logs && Array.isArray(statusData.logs) && statusData.logs.length > 0 ? (
          <div className="bg-slate-900 text-slate-200 rounded-md p-4 font-mono text-xs space-y-1.5 max-h-64 overflow-y-auto">
            {statusData.logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0">[{formatDate(log.timestamp || new Date())}]</span>
                <span className={log.level === 'error' ? 'text-rose-400' : log.level === 'warn' ? 'text-amber-300' : 'text-slate-200'}>
                  {typeof log === 'string' ? log : log.message || JSON.stringify(log)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <p className="font-medium text-slate-700">No additional diagnostic logs returned by the API worker for this document.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Current stage: <strong className="font-mono text-navy-800">{currentStep || currentStatus}</strong>. All transitions are autonomously synchronized.
            </p>
          </div>
        )}
      </div>

      {/* Completion Next Steps Callout */}
      {isCompleted && (
        <div className="p-5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Land Record Digitization Completed Successfully
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                OCR and tabular extraction finished with overall confidence of <strong className="font-mono">{confidence !== undefined ? `${confidence}%` : 'N/A'}</strong>.
              </p>
            </div>
          </div>
          <Link to={`/documents/${id}`}>
            <Button variant="success" size="sm" icon={ArrowRight} iconPosition="right">
              Inspect Extracted Land Record
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProcessingDetailsPage;
