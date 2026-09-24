import React from 'react';
import logoTransparent from '../../assets/branding/bhumipatra-logo-transparent.png';
import iconMark from '../../assets/branding/bhumipatra-icon.png';

/**
 * Official BhumiPatra Logo Component for Administration Portal
 */
export default function Logo({
  size = 'md',
  collapsed = false,
  variant = 'horizontal', // 'horizontal' | 'full' | 'icon'
  className = '',
  portalSubtitle = 'Land Records Governance Portal',
  theme = 'light',
}) {
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const fullLogoSizes = {
    xs: 'h-8 max-w-[120px]',
    sm: 'h-10 max-w-[150px]',
    md: 'h-12 max-w-[180px]',
    lg: 'h-16 max-w-[240px]',
    xl: 'h-24 sm:h-28 max-w-[320px]',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  // If collapsed or explicit icon variant, render the compact icon mark
  if (collapsed || variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={iconMark}
          alt="BhumiPatra Icon"
          className={`${iconSizes[size] || iconSizes.md} object-contain transition-transform duration-200 hover:scale-105`}
        />
      </div>
    );
  }

  // Full brand logo (for login pages, prominent hero banners, or expanded sidebar)
  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
        <img
          src={logoTransparent}
          alt="BhumiPatra - AI-Powered Land Record Digitization & Validation System"
          className={`${fullLogoSizes[size] || fullLogoSizes.md} w-auto object-contain transition-all duration-200`}
        />
      </div>
    );
  }

  const isDark = theme === 'dark';

  // Horizontal lockup: [BhumiPatra Icon] BhumiPatra + Subtitle/Badge
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={iconMark}
        alt="BhumiPatra"
        className={`${iconSizes[size] || iconSizes.md} shrink-0 object-contain`}
      />
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight font-sans ${isDark ? 'text-white' : 'text-navy-950'} ${textSizes[size] || textSizes.md}`}>
            Bhumi<span className="text-emerald-500">Patra</span>
          </span>
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-navy-100 text-navy-800 border border-navy-200">
            Admin
          </span>
        </div>
        <span className={`text-[10px] font-medium tracking-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {portalSubtitle}
        </span>
      </div>
    </div>
  );
}
