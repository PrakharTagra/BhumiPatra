import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { CheckCircle2, XCircle, ArrowLeftCircle, AlertTriangle } from 'lucide-react';

export function ApproveModal({ isOpen, onClose, onConfirm, loading, recordId }) {
  const [remarks, setRemarks] = useState('');

  const handleConfirm = () => {
    onConfirm(remarks.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!loading ? onClose : undefined}
      title="Approve Land Record"
      subtitle={`Statutory Officer Endorsement &bull; Record ID: ${recordId}`}
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            loading={loading}
            icon={CheckCircle2}
            onClick={handleConfirm}
          >
            Confirm & Approve Record
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Confirmation Required</h4>
            <p className="leading-relaxed">
              By confirming approval, you certify as a <strong>Verification Officer</strong> that the AI-extracted fields, parcel identifiers, and spatial boundaries match the original deed instrument.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
            Officer Verification Remarks (Optional)
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. All title fields verified against high-resolution survey scan. Parcel approved for state digital ledger."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>
      </div>
    </Modal>
  );
}

export function RejectModal({ isOpen, onClose, onConfirm, loading, recordId }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('A comprehensive justification is mandatory to reject a land record.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!loading ? onClose : undefined}
      title="Reject Land Record"
      subtitle={`Flagged Rejection &bull; Record ID: ${recordId}`}
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={loading}
            icon={XCircle}
            onClick={handleConfirm}
          >
            Confirm Rejection
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Formal Discrepancy Notice</h4>
            <p className="mt-1 leading-relaxed">
              Rejection marks this document as non-compliant or fraudulent. An official reason is strictly required for legal auditing.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
            Mandatory Reason for Rejection <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Specify reason: Illegible scan, conflicting khasra ownership in village registry, forged seal, area mismatch, etc."
            className={`w-full text-xs p-3 rounded-lg border ${
              error ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-rose-600'
            } focus:outline-none focus:ring-2 focus:ring-rose-500/20`}
            required
          />
          {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}

export function SendBackModal({ isOpen, onClose, onConfirm, loading, recordId }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Instructions for the Digitization Operator are mandatory to send back a record.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!loading ? onClose : undefined}
      title="Send Back to Digitization Operator"
      subtitle={`Rescan / Re-extraction Request &bull; Record ID: ${recordId}`}
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="warning"
            size="sm"
            loading={loading}
            icon={ArrowLeftCircle}
            onClick={handleConfirm}
          >
            Send Back to Queue
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Correction & Rescan Request</h4>
            <p className="mt-1 leading-relaxed">
              This record will be reassigned to the digitization queue for operator review, document re-scanning, or optical character enhancement.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
            Instructions / Reason for Send-Back <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Please rescan page 2 with higher contrast (300 DPI); survey boundary ink is truncated on bottom edge."
            className={`w-full text-xs p-3 rounded-lg border ${
              error ? 'border-amber-400 focus:border-amber-600' : 'border-slate-300 focus:border-amber-600'
            } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
            required
          />
          {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}
