import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorAlert({
  title = 'Failed to load land record data',
  message,
  onRetry,
  className = '',
}) {
  return (
    <div className={`rounded-xl border border-rose-200 bg-rose-50/80 p-4 sm:p-5 text-rose-900 ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold">{title}</h4>
          {message && (
            <p className="text-xs text-rose-800 mt-1 leading-relaxed break-words">
              {message}
            </p>
          )}
          {onRetry && (
            <div className="mt-3">
              <Button
                size="xs"
                variant="danger"
                icon={RefreshCw}
                onClick={onRetry}
                className="bg-rose-700 hover:bg-rose-800 text-white"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
