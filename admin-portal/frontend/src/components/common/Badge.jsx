import React from 'react';

export default function Badge({
  children,
  variant,
  status,
  size = 'md',
  className = '',
}) {
  // Normalize string to match variants
  const val = (status || children || '').toString().toUpperCase().replace(/\s+/g, '_');

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant) {
    switch (variant) {
      case 'success':
        badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        break;
      case 'warning':
        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
      case 'danger':
        badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
        break;
      case 'info':
        badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
        break;
      case 'navy':
        badgeStyle = 'bg-navy-50 text-navy-800 border-navy-200';
        break;
      default:
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else {
    // Determine style based on status/role string
    switch (val) {
      case 'VERIFIED':
      case 'ACTIVE':
      case 'SUCCESS':
      case 'COMPLETED':
        badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        break;
      case 'PENDING':
      case 'PENDING_VERIFICATION':
      case 'PENDING_PROCESSING':
      case 'IN_PROGRESS':
      case 'PROCESSING':
        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
      case 'REJECTED':
      case 'FAILED':
      case 'INACTIVE':
      case 'SUSPENDED':
      case 'ERROR':
        badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
        break;
      case 'ADMIN':
        badgeStyle = 'bg-navy-100 text-navy-900 border-navy-300 font-semibold';
        break;
      case 'VERIFICATION_OFFICER':
        badgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200';
        break;
      case 'DIGITIZATION_OPERATOR':
        badgeStyle = 'bg-teal-50 text-teal-800 border-teal-200';
        break;
      case 'PROCESSED':
        badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
        break;
      default:
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  const sizeClasses = {
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
