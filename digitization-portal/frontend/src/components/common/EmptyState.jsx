import React from 'react';
import { Inbox, FileX, Search, AlertCircle } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: CustomIcon,
  type = 'default',
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
  actionIcon,
  className = '',
}) => {
  const icons = {
    default: Inbox,
    documents: Inbox,
    search: Search,
    error: AlertCircle,
    empty: FileX,
  };

  const IconComponent = CustomIcon || icons[type] || Inbox;

  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-slate-300 bg-white ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5">
        <IconComponent className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-5">
        {description}
      </p>
      {actionText && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
