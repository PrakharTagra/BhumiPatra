import React from 'react';
import {
  Check,
  Loader2,
  AlertCircle,
  Clock,
  UploadCloud,
  Layers,
  FileSearch,
  Cpu,
  ShieldCheck,
  Activity,
  Award
} from 'lucide-react';
import { PIPELINE_STEPS } from '../../utils/constants';

/**
 * Determine the active step index based on the API status string
 */
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
}) => {
  const normStatus = String(status).toUpperCase();
  const isFailed = normStatus === 'FAILED' || normStatus === 'ERROR';
  const isCompleted = normStatus === 'COMPLETED' || normStatus === 'PROCESSED';

  // Determine active index either by currentStep name or overall status
  const activeIndex = currentStep
    ? PIPELINE_STEPS.findIndex((s) => s.id === currentStep.toUpperCase())
    : getActiveStepIndex(normStatus);

  const stepIcons = [
    UploadCloud,
    Layers,
    FileSearch,
    Cpu,
    ShieldCheck,
    Activity,
    Award
  ];

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
            Processing Status
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Processing Completed
            </span>
          )}
          {isFailed && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Processing Failed
            </span>
          )}
          {!isCompleted && !isFailed && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
            </span>
          )}
        </div>
      </div>

      {/* Horizontal / Wrapped Step Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {PIPELINE_STEPS.map((step, idx) => {
          const StepIcon = stepIcons[idx] || Cpu;
          const isPast = isCompleted || idx < activeIndex;
          const isCurrent = !isCompleted && idx === activeIndex;
          const isFailedStep = isFailed && isCurrent;

          let stateColor = 'border-slate-200 bg-slate-50 text-slate-400';
          let iconBg = 'bg-slate-200 text-slate-500';
          let statusLabel = 'Pending';

          if (isFailedStep) {
            stateColor = 'border-rose-300 bg-rose-50/50 text-rose-900';
            iconBg = 'bg-rose-600 text-white';
            statusLabel = 'Failed';
          } else if (isPast) {
            stateColor = 'border-emerald-200 bg-emerald-50/40 text-emerald-900';
            iconBg = 'bg-emerald-600 text-white';
            statusLabel = 'Completed';
          } else if (isCurrent) {
            stateColor = 'border-sky-300 bg-sky-50/50 text-sky-950 ring-1 ring-sky-400';
            iconBg = 'bg-sky-600 text-white animate-pulse';
            statusLabel = 'In Progress';
          }

          // Optional detail like duration or timestamp from stepDetails
          const detail = stepDetails[step.id.toLowerCase()] || stepDetails[step.id];

          return (
            <div
              key={step.id}
              className={`flex flex-col p-3 rounded-lg border transition-all ${stateColor}`}
            >
              {/* Step Top: Number & Icon */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold tracking-wider opacity-75">
                  0{idx + 1}
                </span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                  {isFailedStep ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : isPast ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>

              {/* Title & Status */}
              <div className="mt-1">
                <div className="text-xs font-bold leading-tight line-clamp-1">
                  {step.label}
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">
                  {statusLabel}
                </div>
              </div>

              {/* Step Description */}
              <p className="text-[11px] leading-tight text-slate-500 mt-2 line-clamp-2">
                {step.description}
              </p>

              {/* Detail snippet if present */}
              {detail && (
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] font-mono text-slate-500">
                  {detail.duration ? `Duration: ${detail.duration}` : detail.timestamp || detail.message || ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Banner if Processing Failed */}
      {isFailed && error && (
        <div className="mt-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Processing Failed:</span> {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineTracker;
