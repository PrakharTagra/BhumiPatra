import React from 'react';
import { Database, FileQuestion, Users, History, Activity, AlertCircle } from 'lucide-react';

export default function EmptyState({
  icon: CustomIcon,
  type = 'default',
  title,
  message,
  action,
  className = '',
}) {
  let Icon = CustomIcon;

  if (!Icon) {
    switch (type) {
      case 'documents':
        Icon = FileQuestion;
        break;
      case 'users':
        Icon = Users;
        break;
      case 'audit':
        Icon = History;
        break;
      case 'system':
        Icon = Activity;
        break;
      case 'analytics':
        Icon = AlertCircle;
        break;
      default:
        Icon = Database;
    }
  }

  const defaultTitle = type === 'analytics' ? 'Insufficient data for this visualization.' : 'No records found';
  const defaultMessage = type === 'analytics'
    ? 'There are not enough records in the system to generate this chart.'
    : 'No data is currently available in the database for the selected parameters.';

  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h4 className="text-sm font-semibold text-slate-700">{title || defaultTitle}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
        {message !== undefined ? message : defaultMessage}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
