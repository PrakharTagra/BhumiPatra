import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  isLoading = false,
  onClick,
}) => {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-navy-50 text-navy-800',
    processing: 'bg-sky-50 text-sky-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
  };

  const borderVariants = {
    default: 'border-slate-200 hover:border-slate-300',
    primary: 'border-slate-200 border-l-4 border-l-navy-800 hover:border-slate-300',
    processing: 'border-slate-200 border-l-4 border-l-sky-600 hover:border-slate-300',
    success: 'border-slate-200 border-l-4 border-l-emerald-600 hover:border-slate-300',
    warning: 'border-slate-200 border-l-4 border-l-amber-500 hover:border-slate-300',
    danger: 'border-slate-200 border-l-4 border-l-rose-500 hover:border-slate-300',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border p-4 sm:p-5 shadow-sm transition-all duration-150 ${borderVariants[variant] || borderVariants.default} ${onClick ? 'cursor-pointer hover:shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-20 bg-slate-200 rounded animate-pulse mt-2" />
          ) : (
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1 font-sans">
              {value !== undefined && value !== null ? value : '0'}
            </div>
          )}
          {subtext && (
            <p className="text-xs text-slate-500 mt-1">
              {subtext}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${iconVariants[variant] || iconVariants.default}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
