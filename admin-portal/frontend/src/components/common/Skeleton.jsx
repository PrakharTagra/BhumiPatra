import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200/80 rounded ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={`head-${i}`} className="h-4 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`row-${r}`} className="flex gap-4 py-2 border-b border-slate-100 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={`cell-${r}-${c}`}
              className="h-3.5 bg-slate-100 rounded flex-1"
              style={{ width: `${Math.max(40, (c + 1) * 15)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
