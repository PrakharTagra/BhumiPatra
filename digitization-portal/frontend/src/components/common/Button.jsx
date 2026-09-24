import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none text-sm';

  const variants = {
    primary: 'bg-navy-800 hover:bg-navy-900 text-white focus-visible:ring-navy-700 shadow-sm border border-navy-900',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus-visible:ring-slate-400 shadow-sm',
    accent: 'bg-sky-700 hover:bg-sky-800 text-white focus-visible:ring-sky-600 shadow-sm',
    outline: 'border border-navy-700 text-navy-800 hover:bg-navy-50 focus-visible:ring-navy-600',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500 shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-500 shadow-sm',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
