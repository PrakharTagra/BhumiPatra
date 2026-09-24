import React, { useState } from 'react';
import { Edit2, Check, X, AlertTriangle, History, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';

export default function FieldItem({
  fieldKey,
  label,
  value,
  originalValue,
  confidence,
  validationState = 'PASS', // 'PASS' | 'WARNING' | 'FAILED'
  isModified = false,
  onSaveCorrection,
  loading = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value || '');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const confNumber = confidence !== undefined && confidence !== null ? Number(confidence) : null;
  const isLowConfidence = confNumber !== null && confNumber < 75;

  const handleStartEdit = () => {
    setDraftValue(value || '');
    setReason('');
    setReasonError('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setReason('');
    setReasonError('');
  };

  const handleSave = () => {
    // If value changed, require a reason
    if (draftValue !== value && !reason.trim()) {
      setReasonError('Please provide an official justification for this correction.');
      return;
    }

    onSaveCorrection(fieldKey, draftValue, reason.trim());
    setIsEditing(false);
  };

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        isLowConfidence
          ? 'bg-amber-50/40 border-amber-300 shadow-sm'
          : isModified
          ? 'bg-blue-50/40 border-blue-300 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {label}
            </span>

            {/* Low-confidence warning highlight */}
            {isLowConfidence && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Review Recommended
              </span>
            )}

            {isModified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200">
                Corrected
              </span>
            )}
          </div>
        </div>

        {/* Confidence & Validation Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {confNumber !== null && (
            <span
              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                confNumber >= 85
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : confNumber >= 70
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
              }`}
            >
              {confNumber.toFixed(0)}% confidence
            </span>
          )}

          <Badge status={validationState} size="sm" />

          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="p-1 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded transition-colors ml-1"
              title="Correct Extracted Value"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Value Display / Edit Form */}
      <div className="mt-2">
        {!isEditing ? (
          <div>
            <div className="text-sm font-semibold text-slate-900 break-words">
              {value || <span className="text-slate-400 italic">Not detected / Empty</span>}
            </div>

            {/* Before vs After correction display */}
            {isModified && originalValue !== undefined && originalValue !== value && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/80 px-2 py-1 rounded border border-slate-200">
                <span className="font-medium text-slate-600">Original AI Value:</span>
                <span className="line-through text-slate-500">{originalValue || '—'}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-blue-700">{value}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 mt-2 pt-2 border-t border-slate-200">
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">
                Corrected Value
              </label>
              <input
                type="text"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-navy-500 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-navy-600"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-500 block mb-1">
                Reason for Correction <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Scanned ink smudge, clear on high resolution"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError('');
                }}
                className={`w-full text-xs px-2.5 py-1.5 rounded-lg border bg-white ${
                  reasonError ? 'border-rose-400 text-rose-900' : 'border-slate-300 text-slate-800'
                } focus:outline-none focus:ring-1 focus:ring-navy-600`}
              />
              {reasonError && (
                <p className="text-[11px] text-rose-600 mt-0.5 font-medium">{reasonError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-3 py-1 text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Correction</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
