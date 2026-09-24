import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  label,
  id,
  options = [],
  placeholder = 'Select an option',
  error,
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </span>
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={`
            block w-full rounded-md border text-sm transition-colors py-2 pl-3 pr-10 appearance-none bg-white
            ${error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-300 text-slate-900 focus:border-navy-600 focus:ring-1 focus:ring-navy-600'
            }
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const value = typeof opt === 'object' ? opt.value : opt;
            const labelText = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${selectId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
