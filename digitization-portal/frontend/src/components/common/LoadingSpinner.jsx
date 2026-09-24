import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Loading...', size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-3 ${className}`}>
      <Loader2 className={`animate-spin text-navy-800 ${sizeMap[size] || sizeMap.md}`} />
      {label && <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
