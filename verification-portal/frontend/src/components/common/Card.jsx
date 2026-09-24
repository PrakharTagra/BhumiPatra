import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  actions,
  className = '',
  bodyClassName = 'p-5',
  headerClassName = 'px-5 py-3.5 border-b border-slate-200/80',
  footer,
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-sm sm:text-base font-semibold text-navy-950">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">{footer}</div>}
    </div>
  );
}
