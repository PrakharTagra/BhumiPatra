import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw, X } from 'lucide-react';
import Button from './Button';

export const AlertBanner = ({
  type = 'error',
  title,
  message,
  onRetry,
  onClose,
  className = '',
}) => {
  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
  };

  return (
    <div className={`p-4 rounded-lg border flex items-start gap-3 shadow-sm ${styles[type] || styles.error} ${className}`} role="alert">
      {icons[type] || icons.error}
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold leading-tight">{title}</h4>}
        <p className="text-xs sm:text-sm mt-0.5 leading-relaxed">{message}</p>
        {onRetry && (
          <div className="mt-2.5">
            <Button
              variant="secondary"
              size="xs"
              onClick={onRetry}
              icon={RefreshCw}
              className="bg-white/80 hover:bg-white text-slate-800"
            >
              Retry Connection
            </Button>
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
