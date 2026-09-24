import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 8 }) => {
  return (
    <div className="w-full animate-pulse">
      <div className="border-b border-slate-200 bg-slate-50 p-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-slate-100 rounded"
                style={{ width: `${Math.max(40, (c % 3 + 1) * 28)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  );
};

export default TableSkeleton;
