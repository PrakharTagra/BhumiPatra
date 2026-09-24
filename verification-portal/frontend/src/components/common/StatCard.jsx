import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  loading = false,
}) {
  const variantStyles = {
    default: {
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      valueColor: 'text-slate-900',
    },
    navy: {
      border: 'border-navy-200',
      iconBg: 'bg-navy-50 text-navy-800',
      valueColor: 'text-navy-950',
    },
    success: {
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-700',
      valueColor: 'text-emerald-950',
    },
    warning: {
      border: 'border-amber-200',
      iconBg: 'bg-amber-50 text-amber-700',
      valueColor: 'text-amber-950',
    },
    danger: {
      border: 'border-rose-200',
      iconBg: 'bg-rose-50 text-rose-700',
      valueColor: 'text-rose-950',
    },
    info: {
      border: 'border-blue-200',
      iconBg: 'bg-blue-50 text-blue-700',
      valueColor: 'text-blue-950',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  let displayValue = '—';
  if (value !== undefined && value !== null) {
    if (typeof value === 'number') {
      displayValue = value.toLocaleString();
    } else {
      displayValue = value;
    }
  }

  return (
    <div className={`bg-white rounded-xl border ${style.border} p-5 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-20 bg-slate-200 animate-pulse rounded my-1" />
        ) : (
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${style.valueColor}`}>
            {displayValue}
          </div>
        )}
        {subtext && <p className="text-xs text-slate-500 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  );
}
