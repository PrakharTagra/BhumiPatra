import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    containerClassName = '',
    required = false,
    id,
    ...props
  },
  ref
) {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 text-sm py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            Icon ? 'pl-9 pr-3' : 'px-3'
          } ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
              : 'border-slate-300 focus:border-navy-600 focus:ring-navy-600/20'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

export default Input;
