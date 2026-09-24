import React from 'react';
import { formatConfidence, getConfidenceTier } from '../../utils/formatters';

export const ConfidenceBadge = ({ confidence, size = 'sm' }) => {
  const formatted = formatConfidence(confidence);
  if (formatted === '—') {
    return <span className="text-xs text-slate-400 font-mono">—</span>;
  }

  const tier = getConfidenceTier(confidence);

  const tierStyles = {
    HIGH: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
    LOW: 'bg-rose-50 text-rose-800 border-rose-200',
    UNKNOWN: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border ${tierStyles[tier] || tierStyles.UNKNOWN} ${sizes[size] || sizes.sm}`}
      title={`AI Confidence Score: ${formatted}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tier === 'HIGH' ? 'bg-emerald-500' : tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'}`} />
      {formatted}
    </span>
  );
};

export default ConfidenceBadge;
