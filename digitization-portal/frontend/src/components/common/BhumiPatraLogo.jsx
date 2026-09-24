import React from 'react';

/**
 * BhumiPatra Brand Logo Component
 * A clean, distinct logo for the AI Land Record Digitization Portal
 * (Does NOT copy or use any government seals or emblems)
 */
export const BhumiPatraLogo = ({ className = '', size = 'md', collapsed = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Stylized Geometric Cadastral Grid & Digital Document */}
      <div className={`relative shrink-0 flex items-center justify-center rounded-lg bg-navy-900 text-white shadow-sm ring-1 ring-navy-800 ${iconSizes[size] || iconSizes.md}`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 text-sky-400"
          aria-hidden="true"
        >
          {/* Cadastral Land Parcel Grid lines */}
          <path
            d="M6 8C6 6.89543 6.89543 6 8 6H24C25.1046 6 26 6.89543 26 8V24C26 25.1046 25.1046 26 24 26H8C6.89543 26 6 25.1046 6 24V8Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="text-sky-300"
          />
          {/* Internal Land Boundaries / Map Segments */}
          <path
            d="M6 16H26M18 6V26M18 16L26 24M6 16L18 8"
            stroke="#93c5fd"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* AI Node / Golden Validation Pin */}
          <circle cx="18" cy="16" r="2.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
          <circle cx="22" cy="11" r="1.5" fill="#38bdf8" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-navy-950 font-sans ${titleSizes[size] || titleSizes.md}`}>
              BHUMI<span className="text-navy-600">PATRA</span>
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 -mt-1">
            Digitization Portal
          </span>
        </div>
      )}
    </div>
  );
};

export default BhumiPatraLogo;
