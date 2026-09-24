import React from 'react';

export const Input = React.forwardRef(({
  label,
  id,
  error,
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  icon: Icon,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </span>
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`
            block w-full rounded-md border text-sm transition-colors py-2 px-3
            ${Icon ? 'pl-9' : 'pl-3'}
            ${error
              ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-navy-600 focus:ring-1 focus:ring-navy-600'
            }
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
