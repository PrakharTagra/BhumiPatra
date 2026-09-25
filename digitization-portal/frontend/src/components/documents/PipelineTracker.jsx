import React from 'react';
import { Check, Loader2, AlertCircle, Circle } from 'lucide-react';
import { PIPELINE_STEPS } from '../../utils/constants';

function getActiveStepIndex(status) {
  if (!status) return 0;
  const s = String(status).toUpperCase();

  if (s === 'COMPLETED' || s === 'PROCESSED' || s === 'VERIFIED') return 6;
  if (s.includes('CONFIDENCE')) return 5;
  if (s.includes('VALIDAT')) return 4;
  if (s.includes('EXTRACT')) return 3;
  if (s.includes('OCR')) return 2;
  if (s.includes('PREPROCESS')) return 1;
  if (s.includes('UPLOAD') || s.includes('PENDING') || s.includes('QUEUED')) return 0;
  return 0;
}

export const PipelineTracker = ({
  status = 'PENDING',
  currentStep = null,
  error = null,
  stepDetails = {},
  className = '',
  documentId = '',
  onViewRecord = null,
  onRetry = null,
}) => {
  const normStatus = String(status).toUpperCase();
  const isFailed = normStatus === 'FAILED' || normStatus === 'ERROR';
  const isCompleted = normStatus === 'COMPLETED' || normStatus === 'PROCESSED' || normStatus === 'VERIFIED';

  const activeIndex = currentStep
    ? PIPELINE_STEPS.findIndex((s) => s.id === currentStep.toUpperCase())
    : getActiveStepIndex(normStatus);

  const currentStepObj = PIPELINE_STEPS[isCompleted ? 6 : activeIndex] || PIPELINE_STEPS[0];

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-slate-200 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Document Processing
          </h2>
          {documentId && (
            <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">
              {documentId}
            </p>
          )}
        </div>
        <div>
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Processing Completed
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Processing Failed
            </span>
          )}
          {!isCompleted && !isFailed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
              Processing
            </span>
          )}
        </div>
      </div>

      {/* 7-Stage Process List */}
      <div className="space-y-3">
        {PIPELINE_STEPS.map((step, idx) => {
          const isPast = isCompleted || idx < activeIndex;
          const isCurrent = !isCompleted && !isFailed && idx === activeIndex;
          const isFailedStep = isFailed && idx === activeIndex;

          let icon = null;
          let labelClass = 'text-slate-500';
          let statusBadge = (
            <span className="text-xs text-slate-400 font-medium">Pending</span>
          );

          if (isFailedStep) {
            icon = (
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">
                ✕
              </span>
            );
            labelClass = 'text-rose-900 font-bold';
            statusBadge = (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Failed
              </span>
            );
          } else if (isPast) {
            icon = (
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            );
            labelClass = 'text-slate-800 font-medium';
            statusBadge = (
              <span className="text-xs font-medium text-emerald-700">Completed</span>
            );
          } else if (isCurrent) {
            icon = (
              <span className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </span>
            );
            labelClass = 'text-navy-950 font-bold';
            statusBadge = (
              <span className="text-xs font-semibold text-navy-800 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                In Progress
              </span>
            );
          } else {
            icon = (
              <span className="w-6 h-6 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-xs shrink-0 bg-white">
                ○
              </span>
            );
          }

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                isCurrent
                  ? 'bg-slate-50 border border-slate-300'
                  : 'border border-transparent hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <span className={`text-sm ${labelClass}`}>
                    {step.label}
                  </span>
                </div>
              </div>
              <div>{statusBadge}</div>
            </div>
          );
        })}
      </div>

      {/* Active Stage Indicator */}
      <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
            Current stage
          </span>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            {!isCompleted && !isFailed && (
              <span className="w-2 h-2 rounded-full bg-navy-700 animate-pulse" />
            )}
            {isCompleted ? 'Processing Completed' : isFailed ? 'Processing Halted' : currentStepObj.label}
          </div>
        </div>

        {/* Action Button */}
        {isCompleted && onViewRecord && (
          <button
            type="button"
            onClick={onViewRecord}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded bg-navy-800 text-white hover:bg-navy-900 transition-colors shadow-xs"
          >
            View Record
          </button>
        )}

        {isFailed && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded bg-navy-800 text-white hover:bg-navy-900 transition-colors shadow-xs"
          >
            Try Again
          </button>
        )}
      </div>

      {/* Clean Administrative Error Notice */}
      {isFailed && (
        <div className="mt-4 p-4 rounded-md bg-rose-50 border border-rose-200">
          <p className="text-sm font-semibold text-rose-900">
            Document processing could not be completed.
          </p>
          {error && (
            <p className="text-xs text-rose-700 mt-1">
              Reason: {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PipelineTracker;
