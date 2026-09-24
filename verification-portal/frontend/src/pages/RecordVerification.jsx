import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import verificationApi from '../api/verificationApi';
import DocumentViewer from '../components/verification/DocumentViewer';
import FieldItem from '../components/verification/FieldItem';
import ValidationPanel from '../components/verification/ValidationPanel';
import {
  ApproveModal,
  RejectModal,
  SendBackModal,
} from '../components/verification/ActionModals';
import AuditHistoryModal from '../components/verification/AuditHistoryModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ArrowLeftCircle,
  History,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const REQUIRED_FIELDS = [
  { key: 'ownerName', label: 'Owner Name' },
  { key: 'relativeName', label: "Father's / Guardian Name" },
  { key: 'khasraNumber', label: 'Khasra Number' },
  { key: 'khataNumber', label: 'Khata Number' },
  { key: 'surveyNumber', label: 'Survey Number' },
  { key: 'plotNumber', label: 'Plot Number' },
  { key: 'area', label: 'Area' },
  { key: 'areaUnit', label: 'Unit' },
  { key: 'village', label: 'Village' },
  { key: 'tehsil', label: 'Tehsil' },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State' },
  { key: 'landClassification', label: 'Land Classification' },
  { key: 'ownershipDetails', label: 'Ownership' },
  { key: 'mutationDetails', label: 'Mutation' },
  { key: 'registrationDetails', label: 'Registration' },
];

export default function RecordVerification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();

  const [record, setRecord] = useState(null);
  const [originalRecord, setOriginalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSendBackOpen, setIsSendBackOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Audit history state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchRecordData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await verificationApi.getRecordById(id);
      const data = response?.record || response?.data || response;

      setRecord(data);
      // Keep immutable snapshot of initial AI extracted state
      setOriginalRecord((prev) => prev || data);

      // Attempt to load audit history for this record
      try {
        setHistoryLoading(true);
        const histRes = await verificationApi.getVerificationHistory(id);
        const histList = histRes?.history || histRes?.data || (Array.isArray(histRes) ? histRes : []);
        setHistory(histList);
      } catch (histErr) {
        console.warn('Could not fetch verification history:', histErr);
      } finally {
        setHistoryLoading(false);
      }
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve land record details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecordData();
  }, [fetchRecordData]);

  // Handle Field Correction by Officer
  // "The officer can correct extracted values. Every correction must be sent to the backend."
  const handleSaveCorrection = async (fieldKey, newValue, reason) => {
    try {
      const previousValue = record[fieldKey];

      // Send to backend (frontend never directly modifies MongoDB)
      await verificationApi.updateRecord(id, {
        field: fieldKey,
        value: newValue,
        previousValue,
        reason,
      });

      // Update local state
      setRecord((prev) => ({
        ...prev,
        [fieldKey]: newValue,
        modifiedFields: {
          ...(prev.modifiedFields || {}),
          [fieldKey]: true,
        },
      }));

      // Append to local audit history
      setHistory((prev) => [
        {
          field: REQUIRED_FIELDS.find((f) => f.key === fieldKey)?.label || fieldKey,
          previousValue,
          newValue,
          officerName: 'You (Verification Officer)',
          reason,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      showSuccess(`Field "${REQUIRED_FIELDS.find((f) => f.key === fieldKey)?.label || fieldKey}" updated.`);
    } catch (err) {
      showError(err.customMessage || 'Failed to submit field correction to backend.');
    }
  };

  // Actions handlers
  const handleApprove = async (remarks) => {
    setActionLoading(true);
    try {
      await verificationApi.approveRecord(id, { remarks });
      showSuccess(`Record ${record?.documentNumber || id} approved successfully.`);
      setIsApproveOpen(false);
      navigate('/queue');
    } catch (err) {
      showError(err.customMessage || 'Failed to approve record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    setActionLoading(true);
    try {
      await verificationApi.rejectRecord(id, { reason });
      showWarning(`Record ${record?.documentNumber || id} has been rejected.`);
      setIsRejectOpen(false);
      navigate('/queue');
    } catch (err) {
      showError(err.customMessage || 'Failed to reject record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBack = async (reason) => {
    setActionLoading(true);
    try {
      await verificationApi.sendBackRecord(id, { reason });
      showWarning(`Record ${record?.documentNumber || id} sent back to operator.`);
      setIsSendBackOpen(false);
      navigate('/queue');
    } catch (err) {
      showError(err.customMessage || 'Failed to send back record.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading scanned instrument & extracted fields..." />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-10">
        <ErrorAlert
          title="Unable to load land record"
          message={error || 'Record not found in the database.'}
          onRetry={fetchRecordData}
        />
        <div className="text-center">
          <Link to="/queue">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const reviewStatus = record.reviewStatus || record.verificationStatus || 'PENDING';
  const overallConfidence = record.confidence ?? record.confidenceScore;

  return (
    <div className="space-y-4">
      {/* Top Navigation & Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/queue">
            <Button variant="secondary" size="xs" icon={ArrowLeft} className="p-2">
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-navy-950 font-mono">
                {record.documentNumber || `RECORD-${id}`}
              </h1>
              <Badge status={reviewStatus} size="sm" />
              {overallConfidence !== undefined && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                  Overall: {Number(overallConfidence).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {record.district ? `${record.district} &bull; ${record.tehsil || 'Tehsil'} &bull; ${record.village || 'Village'}` : 'Land Parcel Identification'}
            </p>
          </div>
        </div>

        {/* Primary Officer Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={History}
            onClick={() => setIsHistoryOpen(true)}
            title="Inspect Audit Trail"
          >
            Audit History ({history.length})
          </Button>

          <Button
            variant="warning"
            size="sm"
            icon={ArrowLeftCircle}
            onClick={() => setIsSendBackOpen(true)}
          >
            Send Back
          </Button>

          <Button
            variant="danger"
            size="sm"
            icon={XCircle}
            onClick={() => setIsRejectOpen(true)}
          >
            Reject Record
          </Button>

          <Button
            variant="success"
            size="sm"
            icon={CheckCircle2}
            onClick={() => setIsApproveOpen(true)}
          >
            Approve Record
          </Button>
        </div>
      </div>

      {/* Validation Panel (Required, Format, Duplicate, Cross-Field, Database) */}
      <ValidationPanel record={record} validations={record.validations} />

      {/* Main Two-Panel Verification Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: Original Document Viewer */}
        <div className="lg:col-span-6 xl:col-span-7 h-[780px]">
          <DocumentViewer
            documentUrl={record.documentUrl || record.fileUrl}
            documentType={record.documentType || 'Scanned Land Record'}
            totalPages={record.totalPages || 1}
          />
        </div>

        {/* RIGHT PANEL: Extracted Information & Verification */}
        <div className="lg:col-span-6 xl:col-span-5 h-[780px] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
                Extracted Record
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Click edit icon to correct
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {REQUIRED_FIELDS.map(({ key, label }) => {
              const currentVal = record[key];
              const originalVal = originalRecord ? originalRecord[key] : currentVal;
              const conf = record.confidenceScores?.[key] ?? record[`${key}Confidence`] ?? (overallConfidence || null);
              const valState = record.validationStates?.[key] || (currentVal ? 'PASS' : 'WARNING');
              const isModified = Boolean(record.modifiedFields?.[key] || (originalVal !== undefined && originalVal !== currentVal));

              return (
                <FieldItem
                  key={key}
                  fieldKey={key}
                  label={label}
                  value={currentVal}
                  originalValue={originalVal}
                  confidence={conf}
                  validationState={valState}
                  isModified={isModified}
                  onSaveCorrection={handleSaveCorrection}
                />
              );
            })}
          </div>

          {/* Bottom Summary Bar */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Modified fields: <strong className="text-slate-800">{Object.keys(record.modifiedFields || {}).length}</strong>
            </span>
            <span>All modifications are recorded in the audit log</span>
          </div>
        </div>
      </div>

      {/* Confirmation & Action Modals */}
      <ApproveModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleApprove}
        loading={actionLoading}
        recordId={record.documentNumber || id}
      />

      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
        loading={actionLoading}
        recordId={record.documentNumber || id}
      />

      <SendBackModal
        isOpen={isSendBackOpen}
        onClose={() => setIsSendBackOpen(false)}
        onConfirm={handleSendBack}
        loading={actionLoading}
        recordId={record.documentNumber || id}
      />

      <AuditHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        loading={historyLoading}
        recordId={record.documentNumber || id}
      />
    </div>
  );
}
