import React from 'react';

export default function Logo({ size = 'md', collapsed = false, className = '' }) {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 'w-10 h-10', text: 'text-lg', sub: 'text-xs' },
    xl: { icon: 'w-12 h-12', text: 'text-xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Clean BhumiPatra Logo Placeholder Icon */}
      <div className={`relative flex items-center justify-center rounded-lg bg-navy-900 border border-navy-700 shadow-sm flex-shrink-0 ${currentSize.icon}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5 text-blue-400"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col leading-none select-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-navy-950 ${currentSize.text}`}>
              BhumiPatra
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              Verification
            </span>
          </div>
          <span className={`text-slate-500 font-medium tracking-normal mt-0.5 ${currentSize.sub}`}>
            Land Record Verification Portal
          </span>
        </div>
      )}
    </div>
  );
}
