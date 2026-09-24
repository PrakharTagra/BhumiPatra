import React from 'react';

export default function Badge({
  children,
  variant,
  status,
  size = 'md',
  className = '',
}) {
  const val = (status || children || '').toString().toUpperCase().replace(/\s+/g, '_');

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant) {
    switch (variant) {
      case 'pass':
      case 'success':
        badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        break;
      case 'warning':
        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
      case 'failed':
      case 'danger':
        badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
        break;
      case 'info':
      case 'navy':
        badgeStyle = 'bg-navy-50 text-navy-800 border-navy-200';
        break;
      default:
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else {
    switch (val) {
      // Validation Panel States
      case 'PASS':
      case 'PASSED':
      case 'VALID':
      case 'APPROVED':
      case 'VERIFIED':
        badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
        break;
      case 'WARNING':
      case 'CAUTION':
      case 'LOW_CONFIDENCE':
      case 'PENDING':
      case 'UNDER_REVIEW':
        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
        break;
      case 'FAILED':
      case 'FAIL':
      case 'INVALID':
      case 'REJECTED':
      case 'CRITICAL':
        badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
        break;
      case 'SENT_BACK':
      case 'RETURNED':
        badgeStyle = 'bg-purple-50 text-purple-800 border-purple-200 font-semibold';
        break;
      case 'VERIFICATION_OFFICER':
        badgeStyle = 'bg-navy-100 text-navy-900 border-navy-300 font-semibold';
        break;
      default:
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.2',
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${badgeStyle} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {children || status}
    </span>
  );
}
