import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  icon: Icon
}) => {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-navy-50 text-navy-800 border-navy-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] font-medium leading-none',
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border tracking-wide uppercase select-none ${variants[variant] || variants.neutral} ${sizes[size] || sizes.sm} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
};

export default Badge;
