import React from 'react';
import logoTransparent from '../../assets/branding/bhumipatra-logo-transparent.png';
import iconMark from '../../assets/branding/bhumipatra-icon.png';

/**
 * Official BhumiPatra Logo Component
 * Uses official brand assets without distortion or stretching.
 */
export const BhumiPatraLogo = ({
  className = '',
  size = 'md',
  collapsed = false,
  variant = 'horizontal', // 'horizontal' | 'full' | 'icon'
  portalSubtitle = 'Digitization Portal',
  theme = 'light', // 'light' | 'dark'
}) => {
  // Size mapping for compact icon mark
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  // Size mapping for full logo image
  const fullLogoSizes = {
    xs: 'h-8 max-w-[120px]',
    sm: 'h-10 max-w-[150px]',
    md: 'h-12 max-w-[180px]',
    lg: 'h-16 max-w-[240px]',
    xl: 'h-24 sm:h-28 max-w-[320px]',
  };

  const titleSizes = {
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
      <div className="flex flex-col leading-tight">
        <span className={`font-bold tracking-tight font-sans ${isDark ? 'text-white' : 'text-navy-950'} ${titleSizes[size] || titleSizes.md}`}>
          Bhumi<span className="text-emerald-500">Patra</span>
        </span>
        {portalSubtitle && (
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {portalSubtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default BhumiPatraLogo;
