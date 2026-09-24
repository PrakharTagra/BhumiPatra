import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  size = 'md',
  message,
  className = '',
  fullPage = false,
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center p-6 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-navy-800`} />
      {message && <p className="text-xs font-medium text-slate-600 mt-3">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
